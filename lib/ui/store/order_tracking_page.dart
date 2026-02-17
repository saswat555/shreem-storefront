import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/store_state.dart';

class OrderTrackingPage extends StatelessWidget {
  const OrderTrackingPage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StoreState>();
    final order = state.latestOrder;

    return Scaffold(
      appBar: AppBar(title: const Text('Track Order')),
      body: order == null
          ? const Center(child: Text('No recent order found.'))
          : RefreshIndicator(
              onRefresh: state.refreshLatestOrderStatus,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(12),
                children: [
                  Card(
                    child: ListTile(
                      title: Text('Order #${order['display_id'] ?? order['id'] ?? '-'}'),
                      subtitle: Text('Status: ${order['status'] ?? 'pending'}'),
                      trailing: IconButton(
                        onPressed: state.refreshLatestOrderStatus,
                        icon: const Icon(Icons.refresh),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Live updates', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ...state.orderNotifications.map(
                    (note) => Card(
                      child: ListTile(
                        leading: const Icon(Icons.notifications_active_outlined),
                        title: Text(note),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
