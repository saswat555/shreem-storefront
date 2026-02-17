import 'package:flutter/material.dart';
import 'store/store_page.dart';
import 'blog/blog_page.dart';

enum AppSection { store, blog }

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  AppSection _section = AppSection.store;

  String get _title =>
      _section == AppSection.store ? 'Shreem Dairy' : 'Shreem Blog';

  @override
  Widget build(BuildContext context) {
    final body = _section == AppSection.store
        ? const StorePage()
        : const BlogPage();

    // Mobile-first web layout: constrain width so web looks like mobile view
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              const ListTile(
                title: Text('Shreem Dairy'),
                subtitle: Text('Farm fresh products'),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.storefront),
                title: const Text('Store'),
                selected: _section == AppSection.store,
                onTap: () {
                  setState(() => _section = AppSection.store);
                  Navigator.of(context).pop();
                },
              ),
              ListTile(
                leading: const Icon(Icons.article_outlined),
                title: const Text('Blog'),
                selected: _section == AppSection.blog,
                onTap: () {
                  setState(() => _section = AppSection.blog);
                  Navigator.of(context).pop();
                },
              ),
              const Spacer(),
              const Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  '© Shreem Farm Products',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 430),
          child: body,
        ),
      ),
    );
  }
}
