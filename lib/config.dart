class AppConfig {
  // Use localhost for Flutter Web
  static const String medusaBaseUrl = 'http://localhost:9000';

  // Put your publishable key here for now (local dev).
  // Later we’ll move it to a safer runtime config / remote config.
  static const String publishableKey =
      'pk_c777a2b90a0b0c21983634384cb7206de0b70fd396b43ba32da7219fabfa28ec';
  static const String? salesChannelId = null;

  // Used only for display formatting; Medusa pricing is returned by region
  static const String currencyCode = 'inr';
}
