import 'dart:convert';
import 'package:http/http.dart' as http;

import 'config.dart';

class MedusaApi {
  final String baseUrl;
  String? authToken;

  MedusaApi({this.baseUrl = AppConfig.medusaBaseUrl, this.authToken});

  Map<String, String> _headers({bool json = true, bool withAuth = true}) => {
    'x-publishable-api-key': AppConfig.publishableKey,
    if (withAuth && authToken != null && authToken!.isNotEmpty)
      'Authorization': 'Bearer $authToken',
    if (json) 'Content-Type': 'application/json',
  };

  Uri _uri(String path, [Map<String, String>? query]) {
    final base = Uri.parse('$baseUrl$path');
    if (query == null || query.isEmpty) return base;
    return base.replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> _get(
    String path, {
    Map<String, String>? query,
    bool withAuth = true,
  }) async {
    final res = await http.get(
      _uri(path, query),
      headers: _headers(json: false, withAuth: withAuth),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('GET $path failed: ${res.statusCode} ${res.body}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> _post(
    String path, [
    Map<String, dynamic>? body,
    bool withAuth = true,
  ]) async {
    final res = await http.post(
      _uri(path),
      headers: _headers(withAuth: withAuth),
      body: jsonEncode(body ?? const {}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('POST $path failed: ${res.statusCode} ${res.body}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> _delete(String path) async {
    final res = await http.delete(_uri(path), headers: _headers(json: false));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('DELETE $path failed: ${res.statusCode} ${res.body}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> loginCustomer({
    required String email,
    required String password,
  }) async {
    return _post(
      AppConfig.customerLoginPath,
      {'email': email, 'password': password},
      false,
    );
  }

  Future<Map<String, dynamic>> registerCustomer({
    required String email,
    required String firstName,
    required String lastName,
    required String phone,
  }) async {
    return _post(
      AppConfig.customerRegisterPath,
      {
        'email': email,
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
      },
      false,
    );
  }

  Future<Map<String, dynamic>> authenticateGoogleCustomer(String idToken) async {
    return _post(
      AppConfig.customerGoogleAuthPath,
      {'id_token': idToken},
      false,
    );
  }

  Future<Map<String, dynamic>> getCustomerMe() async {
    return _get(AppConfig.customerMePath);
  }

  Future<List<Map<String, dynamic>>> getRegions() async {
    final data = await _get('/store/regions', withAuth: false);
    return (data['regions'] as List? ?? const [])
        .cast<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Future<List<Map<String, dynamic>>> getProducts({String? regionId}) async {
    final query = <String, String>{
      'limit': '100',
      'fields':
          '*variants.calculated_price,+variants.inventory_quantity,+tags,+images,+metadata',
    };
    if (regionId != null) query['region_id'] = regionId;
    if (AppConfig.salesChannelId != null) {
      query['sales_channel_id'] = AppConfig.salesChannelId!;
    }

    final data = await _get('/store/products', query: query, withAuth: false);
    return (data['products'] as List? ?? const [])
        .cast<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Future<Map<String, dynamic>> createCart({required String regionId}) async {
    final data = await _post('/store/carts', {'region_id': regionId}, false);
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> getCart(String cartId) async {
    final data = await _get('/store/carts/$cartId', withAuth: false);
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> updateCart(
    String cartId,
    Map<String, dynamic> payload,
  ) async {
    final data = await _post('/store/carts/$cartId', payload, false);
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<List<Map<String, dynamic>>> getShippingOptions(String cartId) async {
    final data = await _get(
      '/store/shipping-options',
      query: {'cart_id': cartId},
      withAuth: false,
    );
    return (data['shipping_options'] as List? ?? const [])
        .cast<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Future<Map<String, dynamic>> addShippingMethod({
    required String cartId,
    required String optionId,
  }) async {
    final data = await _post('/store/carts/$cartId/shipping-methods', {
      'option_id': optionId,
    }, false);
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> createPaymentSessions(String cartId) async {
    final data = await _post('/store/carts/$cartId/payment-sessions', null, false);
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> selectPaymentSession({
    required String cartId,
    required String providerId,
    Map<String, dynamic>? data,
  }) async {
    final payload = <String, dynamic>{
      'provider_id': providerId,
      if (data != null) 'data': data,
    };
    final res = await _post('/store/carts/$cartId/payment-session', payload, false);
    return Map<String, dynamic>.from(res['cart'] as Map);
  }

  Future<Map<String, dynamic>> addToCart({
    required String cartId,
    required String variantId,
    int quantity = 1,
  }) async {
    final data = await _post('/store/carts/$cartId/line-items', {
      'variant_id': variantId,
      'quantity': quantity,
    }, false);
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> updateLineItem({
    required String cartId,
    required String lineItemId,
    required int quantity,
  }) async {
    final data = await _post('/store/carts/$cartId/line-items/$lineItemId', {
      'quantity': quantity,
    }, false);
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> removeLineItem({
    required String cartId,
    required String lineItemId,
  }) async {
    final data = await _delete('/store/carts/$cartId/line-items/$lineItemId');
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> completeCart(String cartId) async {
    return _post('/store/carts/$cartId/complete', null, false);
  }

  Future<Map<String, dynamic>> getOrderStatus(String orderId) async {
    final data = await _get('${AppConfig.orderStatusPath}/$orderId', withAuth: false);
    if (data['order'] != null) {
      return Map<String, dynamic>.from(data['order'] as Map);
    }
    return data;
  }
}
