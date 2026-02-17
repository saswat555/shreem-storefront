import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../domain/product_rules.dart';
import '../../state/store_state.dart';
import 'cart_page.dart';

class StorePage extends StatelessWidget {
  const StorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StoreState>();

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: state.loadProducts,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
            children: [
              _PremiumHero(state: state),
              const SizedBox(height: 12),
              _LocationCard(state: state),
              const SizedBox(height: 12),
              _Section(
                title: 'Fresh in Rewa',
                subtitle: 'Milk, paneer and curd are geo-locked to ${state.deliveryCity}, ${state.deliveryState}',
                products: state.rewaExclusiveProducts,
                enabled: state.isRewaDelivery,
              ),
              const SizedBox(height: 16),
              _Section(
                title: 'Pan India',
                subtitle: 'A2 ghee and shelf stable dairy products',
                products: state.panIndiaProducts,
                enabled: true,
              ),
              if (state.error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text('Error: ${state.error}', style: const TextStyle(color: Colors.red)),
                ),
            ],
          ),
        ),
        SafeArea(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _BottomCartBar(
                count: state.cartItemCount,
                total: state.cartTotal,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CartPage())),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PremiumHero extends StatelessWidget {
  final StoreState state;
  const _PremiumHero({required this.state});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(colors: [Colors.green.shade600, Colors.green.shade300]),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children:[ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.asset(AppConfig.logoAssetPath, width:44, height:44, fit: BoxFit.cover, errorBuilder: (_,__,___)=>const Icon(Icons.eco,color: Colors.white))), const SizedBox(width:10), const Expanded(child: Text('Shreem Premium Dairy', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18))),]),
          const SizedBox(height: 6),
          Text(
            state.isRewaDelivery
                ? 'Same-day slots active in Rewa for milk, paneer and curd.'
                : 'Geo-lock active outside Rewa for fresh milk, paneer and curd. A2 ghee ships pan India.',
            style: const TextStyle(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  final StoreState state;
  const _LocationCard({required this.state});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.location_on_outlined),
        title: Text('${state.deliveryCity}, ${state.deliveryState}'),
        subtitle: Text(state.deliveryAddressLine1),
        trailing: TextButton(
          onPressed: () => _showLocationSheet(context),
          child: const Text('Edit'),
        ),
      ),
    );
  }

  Future<void> _showLocationSheet(BuildContext context) async {
    final cityCtrl = TextEditingController(text: state.deliveryCity);
    final stCtrl = TextEditingController(text: state.deliveryState);
    final pinCtrl = TextEditingController(text: state.deliveryPincode);
    final addrCtrl = TextEditingController(text: state.deliveryAddressLine1);
    final phoneCtrl = TextEditingController(text: state.deliveryPhone);
    final emailCtrl = TextEditingController(text: state.customerEmail);

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: addrCtrl, decoration: const InputDecoration(labelText: 'Address line')),
              TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City')),
              TextField(controller: stCtrl, decoration: const InputDecoration(labelText: 'State')),
              TextField(controller: pinCtrl, decoration: const InputDecoration(labelText: 'Pincode')),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
              TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    await state.updateDeliveryLocation(
                      city: cityCtrl.text,
                      state: stCtrl.text,
                      pincode: pinCtrl.text,
                      addressLine1: addrCtrl.text,
                      phone: phoneCtrl.text,
                      email: emailCtrl.text,
                    );
                    if (context.mounted) Navigator.pop(context);
                  },
                  child: const Text('Save location'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Map<String, dynamic>> products;
  final bool enabled;

  const _Section({required this.title, required this.subtitle, required this.products, required this.enabled});

  @override
  Widget build(BuildContext context) {
    final state = context.read<StoreState>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 8),
        if (products.isEmpty)
          const Text('No products returned from Medusa yet.')
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: products.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.72,
            ),
            itemBuilder: (_, i) {
              final product = products[i];
              final locked = isGeoLockedProduct(product) && !enabled;
              return _ProductCard(
                product: product,
                onAdd: () {
                  final variantId = _firstVariantId(product);
                  if (variantId == null) return;
                  state.addVariant(variantId, product: product);
                },
                isLocked: locked,
              );
            },
          ),
      ],
    );
  }

  String? _firstVariantId(Map<String, dynamic> p) {
    final variants = p['variants'];
    if (variants is List && variants.isNotEmpty) {
      final first = variants.first;
      if (first is Map && first['id'] != null) return first['id'].toString();
    }
    return null;
  }
}

class _ProductCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback onAdd;
  final bool isLocked;

  const _ProductCard({required this.product, required this.onAdd, required this.isLocked});

  @override
  Widget build(BuildContext context) {
    final title = (product['title'] ?? 'Untitled').toString();
    final img = _resolveProductImageUrl(product);
    final price = _resolvePrice(product);

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).dividerColor)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(width: double.infinity, child: img == null ? const Icon(Icons.image) : Image.network(img, fit: BoxFit.cover)),
            ),
          ),
          const SizedBox(height: 8),
          Text(title, maxLines: 2, overflow: TextOverflow.ellipsis),
          Text(price, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: isLocked ? null : onAdd,
              icon: Icon(isLocked ? Icons.lock_outline : Icons.add_shopping_cart),
              label: Text(isLocked ? 'Rewa only' : 'Add'),
            ),
          ),
        ],
      ),
    );
  }
}

String _resolvePrice(Map<String, dynamic> product) {
  final variants = (product['variants'] as List? ?? const []);
  if (variants.isEmpty) return 'Price on request';
  final variant = variants.first;
  if (variant is! Map) return 'Price on request';

  final calculated = variant['calculated_price'];
  if (calculated is Map && calculated['calculated_amount'] != null) {
    final amount = (calculated['calculated_amount'] as num).toDouble() / 100;
    return NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2).format(amount);
  }
  return 'Price on request';
}

String? _resolveProductImageUrl(Map<String, dynamic> product) {
  final thumb = product['thumbnail'];
  if (thumb is String && thumb.isNotEmpty) return _resolveUrl(thumb);
  final images = product['images'];
  if (images is List && images.isNotEmpty && images.first is Map && (images.first as Map)['url'] != null) {
    return _resolveUrl((images.first as Map)['url'].toString());
  }
  return null;
}

String _resolveUrl(String url) => url.startsWith('/') ? '${AppConfig.medusaBaseUrl}$url' : url;

class _BottomCartBar extends StatelessWidget {
  final int count;
  final int total;
  final VoidCallback onTap;

  const _BottomCartBar({required this.count, required this.total, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 6,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(24)),
          child: Text(
            'Cart $count items • ${NumberFormat.currency(locale: 'en_IN', symbol: '₹').format(total / 100)}',
            style: TextStyle(color: Theme.of(context).colorScheme.onPrimary, fontWeight: FontWeight.w700),
          ),
        ),
      ),
    );
  }
}
