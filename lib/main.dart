import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'medusa_api.dart';
import 'state/store_state.dart';
import 'ui/app_shell.dart';

void main() {
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
        theme: ThemeData(useMaterial3: true),
        home: const AppShell(),
      ),
    );
  }
}
