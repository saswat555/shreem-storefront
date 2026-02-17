import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/store_state.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StoreState>();
    final items = (state.cart?['items'] as List?) ?? const [];

    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: state.error != null
          ? Center(child: Text(state.error!))
          : items.isEmpty
          ? const Center(child: Text('Cart is empty'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (_, i) {
                final it = items[i] as Map;
                final title = (it['title'] ?? 'Item').toString();
                final qty = (it['quantity'] ?? 1) as int;
                final id = it['id'].toString();

                return ListTile(
                  title: Text(title),
                  subtitle: Text('Qty: $qty'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        onPressed: qty <= 1
                            ? null
                            : () => state.updateQty(id, qty - 1),
                        icon: const Icon(Icons.remove),
                      ),
                      IconButton(
                        onPressed: () => state.updateQty(id, qty + 1),
                        icon: const Icon(Icons.add),
                      ),
                      IconButton(
                        onPressed: () => state.removeItem(id),
                        icon: const Icon(Icons.delete_outline),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
