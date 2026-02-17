import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import 'medusa_api.dart';
import 'state/store_state.dart';
import 'ui/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // Optional in CI/dev. Values can still be passed with --dart-define.
  }

  runApp(const ShreemApp());
}

class ShreemApp extends StatelessWidget {
  const ShreemApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = MedusaApi();

    return ChangeNotifierProvider(
      create: (_) => StoreState(api)..init(),
      child: MaterialApp(
        title: 'Shreem Dairy',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorSchemeSeed: const Color(0xFFB86B00),
          scaffoldBackgroundColor: const Color(0xFFFFFAF3),
          cardTheme: const CardThemeData(
            elevation: 0,
            margin: EdgeInsets.zero,
          ),
        ),
        home: const AppShell(),
      ),
    );
  }
}
