import '../config.dart';

const _geoLockedKeywords = ['milk', 'paneer', 'curd', 'dahi'];
const _panIndiaKeywords = ['ghee', 'a2-ghee', 'bilona'];

bool isGeoLockedProduct(Map<String, dynamic> product) {
  final haystack = _searchText(product);
  if (_panIndiaKeywords.any(haystack.contains)) return false;
  return _geoLockedKeywords.any(haystack.contains);
}

bool isPanIndiaProduct(Map<String, dynamic> product) {
  final haystack = _searchText(product);
  return _panIndiaKeywords.any(haystack.contains);
}

String geoLockLabel() => '${AppConfig.rewaCity}, ${AppConfig.rewaState}';

String _searchText(Map<String, dynamic> product) {
  final fields = [
    product['title'],
    product['subtitle'],
    product['handle'],
    product['description'],
  ].whereType<String>().map((e) => e.toLowerCase());

  final tags = (product['tags'] as List? ?? const [])
      .whereType<Map>()
      .map((e) => (e['value'] ?? '').toString().toLowerCase());

  return [...fields, ...tags].join(' ');
}
