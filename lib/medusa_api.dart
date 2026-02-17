import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config.dart';

class MedusaApi {
  final String baseUrl;
  MedusaApi({this.baseUrl = AppConfig.medusaBaseUrl});

  Map<String, String> _headers({bool json = true}) => {
    'x-publishable-api-key': AppConfig.publishableKey,
    if (json) 'Content-Type': 'application/json',
  };

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Future<Map<String, dynamic>> _get(String path) async {
    final res = await http.get(_uri(path), headers: _headers(json: false));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('GET $path failed: ${res.statusCode} ${res.body}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> body,
  ) async {
    final res = await http.post(
      _uri(path),
      headers: _headers(),
      body: jsonEncode(body),
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

  // ---------- Regions ----------
  Future<List<Map<String, dynamic>>> getRegions() async {
    final data = await _get('/store/regions');
    final list = (data['regions'] as List? ?? const [])
        .cast<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
    return list;
  }

  // ---------- Products ----------
  Future<List<Map<String, dynamic>>> getProducts({String? regionId}) async {
    final q = regionId == null ? '' : '?region_id=$regionId';
    final data = await _get('/store/products$q');
    final list = (data['products'] as List? ?? const [])
        .cast<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
    return list;
  }

  // ---------- Cart ----------
  Future<Map<String, dynamic>> createCart({required String regionId}) async {
    final data = await _post('/store/carts', {'region_id': regionId});
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> getCart(String cartId) async {
    final data = await _get('/store/carts/$cartId');
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> addToCart({
    required String cartId,
    required String variantId,
    int quantity = 1,
  }) async {
    final data = await _post('/store/carts/$cartId/line-items', {
      'variant_id': variantId,
      'quantity': quantity,
    });
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> updateLineItem({
    required String cartId,
    required String lineItemId,
    required int quantity,
  }) async {
    final data = await _post('/store/carts/$cartId/line-items/$lineItemId', {
      'quantity': quantity,
    });
    return Map<String, dynamic>.from(data['cart'] as Map);
  }

  Future<Map<String, dynamic>> removeLineItem({
    required String cartId,
    required String lineItemId,
  }) async {
    final data = await _delete('/store/carts/$cartId/line-items/$lineItemId');
    return Map<String, dynamic>.from(data['cart'] as Map);
  }
}
