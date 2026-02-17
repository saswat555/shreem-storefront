import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../state/store_state.dart';
import 'order_tracking_page.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StoreState>();
    final items = (state.cart?['items'] as List?) ?? const [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cart & Checkout'),
        actions: [
          if (state.latestOrder != null)
            IconButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const OrderTrackingPage()),
              ),
              icon: const Icon(Icons.local_shipping_outlined),
            ),
        ],
      ),
      body: state.error != null
          ? Center(child: Text(state.error!))
          : items.isEmpty
          ? const Center(child: Text('Your cart is empty'))
          : Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      ...items.map((it) => _CartLineTile(item: it as Map)).toList(),
                      const SizedBox(height: 12),
                      _SummaryCard(total: state.cartTotal),
                      const SizedBox(height: 12),
                      _PaymentCard(state: state),
                    ],
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: state.loading ? null : () => _showCheckoutSheet(context, state),
                        icon: const Icon(Icons.lock_outline),
                        label: Text('Checkout • ${_money(state.cartTotal)}'),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Future<void> _showCheckoutSheet(BuildContext context, StoreState state) async {
    final nameCtrl = TextEditingController(text: state.deliveryAddressLine1);
    final cityCtrl = TextEditingController(text: state.deliveryCity);
    final stCtrl = TextEditingController(text: state.deliveryState);
    final pinCtrl = TextEditingController(text: state.deliveryPincode);
    final phoneCtrl = TextEditingController(text: state.deliveryPhone);
    final emailCtrl = TextEditingController(text: state.customerEmail);
    final upiRefCtrl = TextEditingController();
    var method = CheckoutPaymentMethod.upiPendingReview;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (_, setSheetState) => Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Secure Checkout', style: Theme.of(context).textTheme.titleMedium),
                  TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Address line')),
                  TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City')),
                  TextField(controller: stCtrl, decoration: const InputDecoration(labelText: 'State')),
                  TextField(controller: pinCtrl, decoration: const InputDecoration(labelText: 'Pincode')),
                  TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
                  TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
                  const SizedBox(height: 10),
                  RadioListTile<CheckoutPaymentMethod>(
                    value: CheckoutPaymentMethod.upiPendingReview,
                    groupValue: method,
                    onChanged: (v) => setSheetState(() => method = v!),
                    title: const Text('UPI (Pending Admin Review)'),
                    subtitle: Text('Pay manually to ${AppConfig.upiId}'),
                  ),
                  if (method == CheckoutPaymentMethod.upiPendingReview)
                    TextField(controller: upiRefCtrl, decoration: const InputDecoration(labelText: 'UPI Transaction Ref (optional)')),
                  RadioListTile<CheckoutPaymentMethod>(
                    value: CheckoutPaymentMethod.phonePe,
                    groupValue: method,
                    onChanged: (v) => setSheetState(() => method = v!),
                    title: const Text('PhonePe'),
                    subtitle: const Text('Use configured Medusa payment provider session'),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        await state.updateDeliveryLocation(
                          city: cityCtrl.text,
                          state: stCtrl.text,
                          pincode: pinCtrl.text,
                          addressLine1: nameCtrl.text,
                          phone: phoneCtrl.text,
                          email: emailCtrl.text,
                        );
                        await state.placeOrder(method: method, upiTransactionRef: upiRefCtrl.text.trim());
                        if (ctx.mounted) Navigator.pop(ctx);
                      },
                      child: const Text('Place order'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _CartLineTile extends StatelessWidget {
  final Map item;
  const _CartLineTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final state = context.read<StoreState>();
    final title = (item['title'] ?? 'Item').toString();
    final qty = (item['quantity'] as num?)?.toInt() ?? 1;
    final id = item['id'].toString();
    final subtotal = (item['subtotal'] as num?)?.toInt() ?? 0;

    return Card(
      child: ListTile(
        title: Text(title),
        subtitle: Text('${_money(subtotal)} • Qty $qty'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(onPressed: qty <= 1 ? null : () => state.updateQty(id, qty - 1), icon: const Icon(Icons.remove_circle_outline)),
            IconButton(onPressed: () => state.updateQty(id, qty + 1), icon: const Icon(Icons.add_circle_outline)),
            IconButton(onPressed: () => state.removeItem(id), icon: const Icon(Icons.delete_outline)),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final int total;
  const _SummaryCard({required this.total});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Total', style: TextStyle(fontWeight: FontWeight.w600)),
            Text(_money(total), style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  final StoreState state;
  const _PaymentCard({required this.state});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Payment options', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              title: const Text('UPI (Pending Review)'),
              subtitle: Text('Pay to ${AppConfig.upiId} and submit transaction reference.'),
              trailing: OutlinedButton(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: AppConfig.upiId));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('UPI ID copied')));
                  }
                },
                child: const Text('Copy UPI ID'),
              ),
            ),
            const ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              title: Text('PhonePe'),
              subtitle: Text('Processed via Medusa payment session provider.'),
            ),
          ],
        ),
      ),
    );
  }
}

String _money(int amountInPaise) {
  final amount = amountInPaise / 100;
  return NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2).format(amount);
}
