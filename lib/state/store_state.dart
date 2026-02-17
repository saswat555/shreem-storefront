import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../domain/product_rules.dart';
import '../medusa_api.dart';

enum CheckoutPaymentMethod { upiPendingReview, phonePe }

class StoreState extends ChangeNotifier {
  final MedusaApi api;
  StoreState(this.api);

  String? regionId;
  String? cartId;
  Map<String, dynamic>? cart;
  Map<String, dynamic>? latestOrder;
  final List<String> orderNotifications = [];

  List<Map<String, dynamic>> products = [];
  Map<String, dynamic>? customer;
  String? authToken;

  String deliveryCity = AppConfig.rewaCity;
  String deliveryState = AppConfig.rewaState;
  String deliveryPincode = '';
  String deliveryAddressLine1 = 'Shreem Dairy Customer';
  String deliveryPhone = '';
  String customerEmail = '';

  bool loading = false;
  String? error;
  Timer? _pollTimer;

  bool get isRewaDelivery =>
      deliveryCity.trim().toLowerCase() == AppConfig.rewaCity.toLowerCase() &&
      deliveryState.trim().toLowerCase() == AppConfig.rewaState.toLowerCase();

  bool get isLoggedIn => authToken != null && authToken!.isNotEmpty;

  List<Map<String, dynamic>> get rewaExclusiveProducts =>
      products.where(isGeoLockedProduct).toList();

  List<Map<String, dynamic>> get panIndiaProducts => products
      .where((p) => !isGeoLockedProduct(p) || isPanIndiaProduct(p))
      .toList();

  int get cartItemCount {
    final items = cart?['items'];
    if (items is List) {
      return items.fold<int>(
        0,
        (s, e) => s + ((e['quantity'] as num?)?.toInt() ?? 0),
      );
    }
    return 0;
  }

  int get cartTotal => (cart?['total'] as num?)?.toInt() ?? 0;

  Future<void> init() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      authToken = prefs.getString('auth_token');
      api.authToken = authToken;
      deliveryCity = prefs.getString('delivery_city') ?? AppConfig.rewaCity;
      deliveryState = prefs.getString('delivery_state') ?? AppConfig.rewaState;
      deliveryPincode = prefs.getString('delivery_pincode') ?? '';
      deliveryAddressLine1 =
          prefs.getString('delivery_address_1') ?? deliveryAddressLine1;
      deliveryPhone = prefs.getString('delivery_phone') ?? '';
      customerEmail = prefs.getString('customer_email') ?? '';

      await _ensureRegion();
      await _restoreOrCreateCart(prefs);
      await loadProducts();
      if (isLoggedIn) {
        await loadCustomer();
      }
      startOrderPolling();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> loginWithEmail({
    required String email,
    required String password,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final response = await api.loginCustomer(email: email, password: password);
      final token = (response['token'] ?? response['access_token'] ?? '').toString();
      if (token.isEmpty) throw Exception('No auth token returned by Medusa.');
      await _setAuthToken(token);
      customerEmail = email;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('customer_email', customerEmail);
      await loadCustomer();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> registerAndLogin({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      await api.registerCustomer(
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      );
      await loginWithEmail(email: email, password: password);
    } catch (e) {
      error = e.toString();
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loginWithGoogle() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final google = GoogleSignIn(scopes: ['email', 'profile']);
      final account = await google.signIn();
      if (account == null) {
        throw Exception('Google sign-in cancelled.');
      }
      final auth = await account.authentication;
      final idToken = auth.idToken;
      if (idToken == null || idToken.isEmpty) {
        throw Exception('No Google ID token available.');
      }

      final response = await api.authenticateGoogleCustomer(idToken);
      final token = (response['token'] ?? response['access_token'] ?? '').toString();
      if (token.isEmpty) {
        throw Exception('Google auth succeeded but Medusa token is missing.');
      }
      await _setAuthToken(token);
      customerEmail = account.email;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('customer_email', customerEmail);
      await loadCustomer();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _setAuthToken(String token) async {
    authToken = token;
    api.authToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> loadCustomer() async {
    try {
      final data = await api.getCustomerMe();
      final value = data['customer'] ?? data;
      if (value is Map) customer = Map<String, dynamic>.from(value);
    } catch (_) {}
    notifyListeners();
  }

  Future<void> logout() async {
    authToken = null;
    api.authToken = null;
    customer = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    notifyListeners();
  }

  Future<void> _ensureRegion() async {
    final regions = await api.getRegions();
    if (regions.isNotEmpty) regionId = regions.first['id']?.toString();
  }

  Future<void> _restoreOrCreateCart(SharedPreferences prefs) async {
    if (regionId == null) return;

    final savedCartId = prefs.getString('cart_id');
    if (savedCartId != null && savedCartId.isNotEmpty) {
      cartId = savedCartId;
      try {
        cart = await api.getCart(cartId!);
        return;
      } catch (_) {
        await prefs.remove('cart_id');
      }
    }

    cart = await api.createCart(regionId: regionId!);
    cartId = cart!['id']?.toString();
    if (cartId != null) await prefs.setString('cart_id', cartId!);
  }

  Future<void> updateDeliveryLocation({
    required String city,
    required String state,
    required String pincode,
    required String addressLine1,
    required String phone,
    required String email,
  }) async {
    deliveryCity = city.trim();
    deliveryState = state.trim();
    deliveryPincode = pincode.trim();
    deliveryAddressLine1 = addressLine1.trim();
    deliveryPhone = phone.trim();
    customerEmail = email.trim();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('delivery_city', deliveryCity);
    await prefs.setString('delivery_state', deliveryState);
    await prefs.setString('delivery_pincode', deliveryPincode);
    await prefs.setString('delivery_address_1', deliveryAddressLine1);
    await prefs.setString('delivery_phone', deliveryPhone);
    await prefs.setString('customer_email', customerEmail);
    notifyListeners();
  }

  Future<void> loadProducts() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      products = await api.getProducts(regionId: regionId);
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> addVariant(
    String variantId, {
    required Map<String, dynamic> product,
    int qty = 1,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      if (isGeoLockedProduct(product) && !isRewaDelivery) {
        throw Exception('This item is available only in ${geoLockLabel()}.');
      }
      await _ensureCartExists();
      cart = await api.addToCart(
        cartId: cartId!,
        variantId: variantId,
        quantity: qty,
      );
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _ensureCartExists() async {
    if (cartId != null) return;
    if (regionId == null) await _ensureRegion();
    if (regionId == null) throw Exception('No region found in Medusa');

    final prefs = await SharedPreferences.getInstance();
    cart = await api.createCart(regionId: regionId!);
    cartId = cart!['id']?.toString();
    if (cartId != null) await prefs.setString('cart_id', cartId!);
  }

  Future<void> updateQty(String lineItemId, int qty) async {
    if (cartId == null) return;
    loading = true;
    error = null;
    notifyListeners();

    try {
      cart = await api.updateLineItem(
        cartId: cartId!,
        lineItemId: lineItemId,
        quantity: qty,
      );
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> removeItem(String lineItemId) async {
    if (cartId == null) return;
    loading = true;
    error = null;
    notifyListeners();

    try {
      cart = await api.removeLineItem(cartId: cartId!, lineItemId: lineItemId);
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _syncCheckoutDetails() async {
    if (cartId == null) throw Exception('Cart not ready');

    final address = {
      'first_name': customer?['first_name'] ?? 'Shreem',
      'last_name': customer?['last_name'] ?? 'Customer',
      'address_1': deliveryAddressLine1,
      'city': deliveryCity,
      'province': deliveryState,
      'postal_code': deliveryPincode,
      'country_code': 'in',
      'phone': deliveryPhone,
    };

    cart = await api.updateCart(cartId!, {
      'email': customerEmail,
      'shipping_address': address,
      'billing_address': address,
      'metadata': {
        'delivery_city': deliveryCity,
        'delivery_state': deliveryState,
      },
    });
  }

  Future<void> _ensureShippingMethod() async {
    if (cartId == null) return;
    final methods = (cart?['shipping_methods'] as List?) ?? const [];
    if (methods.isNotEmpty) return;

    final options = await api.getShippingOptions(cartId!);
    if (options.isEmpty) {
      throw Exception('No shipping options are available for this cart in Medusa.');
    }
    final optionId = options.first['id']?.toString();
    if (optionId == null || optionId.isEmpty) {
      throw Exception('Invalid shipping option returned by Medusa.');
    }
    cart = await api.addShippingMethod(cartId: cartId!, optionId: optionId);
  }

  Future<void> placeOrder({
    required CheckoutPaymentMethod method,
    String? upiTransactionRef,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      if (cartItemCount == 0) throw Exception('Cart is empty');
      if (customerEmail.isEmpty || deliveryPhone.isEmpty || deliveryAddressLine1.isEmpty) {
        throw Exception('Please complete delivery details before placing order.');
      }

      await _syncCheckoutDetails();
      await _ensureShippingMethod();
      await api.createPaymentSessions(cartId!);

      if (method == CheckoutPaymentMethod.upiPendingReview) {
        cart = await api.selectPaymentSession(
          cartId: cartId!,
          providerId: AppConfig.upiPendingProviderId,
          data: {
            'upi_id': AppConfig.upiId,
            'upi_transaction_ref': upiTransactionRef ?? '',
            'payment_review_state': 'pending_review',
          },
        );

        cart = await api.updateCart(cartId!, {
          'metadata': {
            'payment_method': 'upi_pending_review',
            'payment_status': 'pending_review',
            'upi_id': AppConfig.upiId,
            'upi_transaction_ref': upiTransactionRef ?? '',
          },
        });
      } else {
        cart = await api.selectPaymentSession(
          cartId: cartId!,
          providerId: AppConfig.phonepeProviderId,
          data: {'integration': 'phonepe'},
        );
      }

      final completed = await api.completeCart(cartId!);
      latestOrder = _extractOrder(completed);

      _appendNotification('Order placed successfully.');
      if (method == CheckoutPaymentMethod.upiPendingReview) {
        _appendNotification('Payment is pending review by admin.');
      } else {
        _appendNotification('PhonePe payment initiated, awaiting confirmation.');
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cart_id');
      await _restoreOrCreateCart(prefs);
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Map<String, dynamic> _extractOrder(Map<String, dynamic> completed) {
    final order = completed['order'];
    if (order is Map) return Map<String, dynamic>.from(order);

    final type = completed['type'];
    if (type == 'order' && completed['data'] is Map) {
      return Map<String, dynamic>.from(completed['data'] as Map);
    }
    return {'id': 'pending', 'status': 'pending'};
  }

  void _appendNotification(String text) {
    final now = DateTime.now().toIso8601String();
    orderNotifications.insert(0, '$text • $now');
  }

  Future<void> refreshLatestOrderStatus() async {
    final orderId = latestOrder?['id']?.toString();
    if (orderId == null || orderId.isEmpty) return;

    try {
      final order = await api.getOrderStatus(orderId);
      final previous = latestOrder?['status']?.toString();
      latestOrder = order;
      final latest = order['status']?.toString();
      if (latest != null && latest != previous) {
        _appendNotification('Order moved to $latest');
        if (latest == 'awaiting_packing') {
          _appendNotification('Payment approved. Order is awaiting packing.');
        }
      }
    } catch (_) {}

    notifyListeners();
  }

  void startOrderPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 45), (_) async {
      if (latestOrder == null) return;
      await refreshLatestOrderStatus();
    });
  }
}
