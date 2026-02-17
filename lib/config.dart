import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String _env(String key) {
    final runtime = dotenv.maybeGet(key);
    if (runtime != null && runtime.isNotEmpty) return runtime;
    return const String.fromEnvironment(key, defaultValue: '');
  }

  static String get medusaBaseUrl {
    final value = _env('MEDUSA_BASE_URL');
    return value.isNotEmpty ? value : 'http://localhost:9000';
  }

  static String get publishableKey => _env('MEDUSA_PUBLISHABLE_KEY');

  static String? get salesChannelId {
    final value = _env('MEDUSA_SALES_CHANNEL_ID');
    return value.isEmpty ? null : value;
  }

  static String get currencyCode {
    final value = _env('STOREFRONT_CURRENCY_CODE');
    return value.isNotEmpty ? value : 'inr';
  }

  static String get rewaCity {
    final value = _env('GEOLOCK_CITY');
    return value.isNotEmpty ? value : 'Rewa';
  }

  static String get rewaState {
    final value = _env('GEOLOCK_STATE');
    return value.isNotEmpty ? value : 'Madhya Pradesh';
  }

  static String get upiId {
    final value = _env('PAYMENT_UPI_ID');
    return value.isNotEmpty ? value : 'payments@shreemdairy';
  }

  static String get upiPendingProviderId {
    final value = _env('UPI_PENDING_PROVIDER_ID');
    return value.isNotEmpty ? value : 'pp_upi_pending';
  }

  static String get phonepeProviderId {
    final value = _env('PHONEPE_PROVIDER_ID');
    return value.isNotEmpty ? value : 'pp_phonepe';
  }

  static String get orderStatusPath {
    final value = _env('ORDER_STATUS_PATH');
    return value.isNotEmpty ? value : '/store/orders';
  }

  static String get logoAssetPath {
    final value = _env('APP_LOGO_ASSET');
    return value.isNotEmpty ? value : 'assets/branding/shreem_logo.png';
  }

  static String get customerLoginPath {
    final value = _env('CUSTOMER_LOGIN_PATH');
    return value.isNotEmpty ? value : '/auth/customer/emailpass';
  }

  static String get customerRegisterPath {
    final value = _env('CUSTOMER_REGISTER_PATH');
    return value.isNotEmpty ? value : '/store/customers';
  }

  static String get customerMePath {
    final value = _env('CUSTOMER_ME_PATH');
    return value.isNotEmpty ? value : '/store/customers/me';
  }

  static String get customerGoogleAuthPath {
    final value = _env('CUSTOMER_GOOGLE_AUTH_PATH');
    return value.isNotEmpty ? value : '/auth/customer/google';
  }
}
