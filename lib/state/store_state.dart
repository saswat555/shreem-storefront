import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../medusa_api.dart';

class StoreState extends ChangeNotifier {
  final MedusaApi api;
  StoreState(this.api);

  String? regionId;
  String? cartId;
  Map<String, dynamic>? cart;

  List<Map<String, dynamic>> products = [];

  bool loading = false;
  String? error;
  Future<void> init() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      // 1) Try regions (needed for cart + pricing), but don't block product list if it fails
      try {
        final regions = await api.getRegions();
        if (regions.isNotEmpty) {
          regionId = regions.first['id']?.toString();
        }
      } catch (_) {
        // keep regionId null; products can still load without it
      }

      // 2) Prepare cart only if we have regionId
      final prefs = await SharedPreferences.getInstance();
      final savedCartId = prefs.getString('cart_id');

      if (regionId != null) {
        if (savedCartId != null && savedCartId.isNotEmpty) {
          cartId = savedCartId;
          cart = await api.getCart(cartId!);
        } else {
          cart = await api.createCart(regionId: regionId!);
          cartId = cart!['id']?.toString();
          await prefs.setString('cart_id', cartId!);
        }
      }

      // 3) Always load products
      await loadProducts();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
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

  Future<void> addVariant(String variantId, {int qty = 1}) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      // If cart isn't ready because region didn't load earlier, try now.
      if (regionId == null) {
        final regions = await api.getRegions();
        if (regions.isEmpty)
          throw Exception('No regions found. Create region in Medusa admin.');
        regionId = regions.first['id']?.toString();
      }

      if (cartId == null) {
        cart = await api.createCart(regionId: regionId!);
        cartId = cart!['id']?.toString();
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('cart_id', cartId!);
      }

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

  int cartCount() {
    final items = cart?['items'];
    if (items is List) return items.length;
    return 0;
  }
}
