import 'package:flutter/material.dart';

import '../config.dart';
import 'account/account_page.dart';
import 'blog/blog_page.dart';
import 'store/order_tracking_page.dart';
import 'store/store_page.dart';

enum AppSection { store, orders, blog, account }

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  AppSection _section = AppSection.store;

  @override
  Widget build(BuildContext context) {
    final body = switch (_section) {
      AppSection.store => const StorePage(),
      AppSection.orders => const OrderTrackingPage(),
      AppSection.blog => const BlogPage(),
      AppSection.account => const AccountPage(),
    };

    final title = switch (_section) {
      AppSection.store => 'Shreem Dairy',
      AppSection.orders => 'Order Tracking',
      AppSection.blog => 'Learn',
      AppSection.account => 'Account',
    };

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                AppConfig.logoAssetPath,
                width: 36,
                height: 36,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(Icons.eco_outlined),
              ),
            ),
            const SizedBox(width: 10),
            Text(title),
          ],
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 430),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: KeyedSubtree(key: ValueKey(_section), child: body),
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _section.index,
        onDestinationSelected: (index) {
          setState(() => _section = AppSection.values[index]);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront),
            label: 'Store',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu_book_outlined),
            selectedIcon: Icon(Icons.menu_book),
            label: 'Learn',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}
