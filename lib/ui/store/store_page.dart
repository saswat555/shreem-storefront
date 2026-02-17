import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/store_state.dart';
import 'cart_page.dart';
import '../../config.dart';

class StorePage extends StatefulWidget {
  const StorePage({super.key});

  @override
  State<StorePage> createState() => _StorePageState();
}

class _StorePageState extends State<StorePage> {
  final PageController _pageController = PageController();
  int _pageIndex = 0;

  // Keep the current banner UI (later we can make it backend-driven)
  final List<_HeroBanner> banners = const [
    _HeroBanner(
      title: 'A2 Milk • Fresh Daily',
      subtitle: 'Pure desi cow milk from Shreem Dairy',
      cta: 'Shop Now',
    ),
    _HeroBanner(
      title: 'Bilona A2 Ghee',
      subtitle: 'Traditional churning + slow heating',
      cta: 'Explore Ghee',
    ),
    _HeroBanner(
      title: 'Malai Paneer',
      subtitle: 'Soft, fresh, farm-made',
      cta: 'Order Paneer',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StoreState>();

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: () => state.loadProducts(),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(
              12,
              12,
              12,
              90,
            ), // leave space for bottom cart button
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Store', style: Theme.of(context).textTheme.titleMedium),
                  TextButton.icon(
                    onPressed: state.loadProducts,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Refresh'),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // HERO: will be backend-driven below
              _HeroSliderFromProducts(
                products: state.products,
                pageController: _pageController,
                pageIndex: _pageIndex,
                onPageChanged: (i) => setState(() => _pageIndex = i),
              ),

              const SizedBox(height: 14),

              if (state.error != null)
                Text(
                  'Error: ${state.error}',
                  style: const TextStyle(color: Colors.red),
                ),

              if (state.loading) ...[
                const SizedBox(height: 8),
                const LinearProgressIndicator(),
              ],

              const SizedBox(height: 12),
              Text('Products', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),

              if (!state.loading && state.products.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: Text('No products found.')),
                )
              else
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.products.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                  itemBuilder: (context, index) {
                    final p = state.products[index];
                    return _ProductCard(
                      product: p,
                      onAdd: () {
                        final variantId = _firstVariantId(p);
                        if (variantId == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'No variant found for this product',
                              ),
                            ),
                          );
                          return;
                        }
                        state.addVariant(variantId);
                      },
                    );
                  },
                ),
            ],
          ),
        ),

        // Bottom-center cart button
        SafeArea(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _BottomCartBar(
                count: state.cartCount(),
                onTap: () => Navigator.of(
                  context,
                ).push(MaterialPageRoute(builder: (_) => const CartPage())),
              ),
            ),
          ),
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

class _CartButton extends StatelessWidget {
  final int count;
  final VoidCallback onTap;

  const _CartButton({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        IconButton(
          onPressed: onTap,
          icon: const Icon(Icons.shopping_cart_outlined),
        ),
        if (count > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onPrimary,
                  fontSize: 11,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _HeroBanner {
  final String title;
  final String subtitle;
  final String cta;
  const _HeroBanner({
    required this.title,
    required this.subtitle,
    required this.cta,
  });
}

class _HeroSlider extends StatelessWidget {
  final PageController controller;
  final List<_HeroBanner> banners;
  final int pageIndex;
  final ValueChanged<int> onPageChanged;

  const _HeroSlider({
    required this.controller,
    required this.banners,
    required this.pageIndex,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 160,
          child: PageView.builder(
            controller: controller,
            itemCount: banners.length,
            onPageChanged: onPageChanged,
            itemBuilder: (context, i) {
              final b = banners[i];
              return Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(right: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      b.title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      b.subtitle,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const Spacer(),
                    Align(
                      alignment: Alignment.bottomRight,
                      child: FilledButton(onPressed: () {}, child: Text(b.cta)),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            banners.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              height: 8,
              width: pageIndex == i ? 18 : 8,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: pageIndex == i
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).dividerColor,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback onAdd;

  const _ProductCard({required this.product, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    final title = (product['title'] ?? 'Untitled').toString();
    final subtitle = (product['subtitle'] ?? '').toString();

    String? imageUrl;
    final images = product['images'];
    if (images is List && images.isNotEmpty) {
      final first = images.first;
      if (first is Map && first['url'] != null) {
        imageUrl = first['url'].toString();
      }
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity,
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: imageUrl == null
                    ? const Center(
                        child: Icon(Icons.image_not_supported_outlined),
                      )
                    : Image.network(imageUrl, fit: BoxFit.cover),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(title, maxLines: 2, overflow: TextOverflow.ellipsis),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add_shopping_cart),
              label: const Text('Add'),
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomCartBar extends StatelessWidget {
  final int count;
  final VoidCallback onTap;

  const _BottomCartBar({required this.count, required this.onTap});

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
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: Theme.of(context).colorScheme.primary,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.shopping_cart_outlined,
                color: Theme.of(context).colorScheme.onPrimary,
              ),
              const SizedBox(width: 10),
              Text(
                'Cart',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Theme.of(
                    context,
                  ).colorScheme.onPrimary.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroSliderFromProducts extends StatelessWidget {
  final List<Map<String, dynamic>> products;
  final PageController pageController;
  final int pageIndex;
  final ValueChanged<int> onPageChanged;

  const _HeroSliderFromProducts({
    required this.products,
    required this.pageController,
    required this.pageIndex,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    final slides = products.take(3).toList();

    if (slides.isEmpty) {
      // fallback placeholder
      return _HeroSlider(
        controller: pageController,
        banners: const [
          _HeroBanner(
            title: 'A2 Milk • Fresh Daily',
            subtitle: 'Pure desi cow milk',
            cta: 'Shop Now',
          ),
          _HeroBanner(
            title: 'Bilona A2 Ghee',
            subtitle: 'Traditional method',
            cta: 'Explore',
          ),
          _HeroBanner(
            title: 'Malai Paneer',
            subtitle: 'Soft & fresh',
            cta: 'Order',
          ),
        ],
        pageIndex: pageIndex,
        onPageChanged: onPageChanged,
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 160,
          child: PageView.builder(
            controller: pageController,
            itemCount: slides.length,
            onPageChanged: onPageChanged,
            itemBuilder: (context, i) {
              final p = slides[i];
              final title = (p['title'] ?? '').toString();
              final subtitle = (p['subtitle'] ?? '').toString();
              final img = _resolveProductImageUrl(p);

              return Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(right: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: Theme.of(context).textTheme.titleMedium,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            subtitle.isEmpty ? 'Featured product' : subtitle,
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Spacer(),
                          Align(
                            alignment: Alignment.bottomLeft,
                            child: FilledButton(
                              onPressed: () {},
                              child: const Text('View'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: 92,
                        height: 120,
                        color: Theme.of(
                          context,
                        ).colorScheme.surfaceContainerHighest,
                        child: img == null
                            ? const Center(child: Icon(Icons.image))
                            : Image.network(
                                img,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const Center(
                                  child: Icon(Icons.broken_image_outlined),
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            slides.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              height: 8,
              width: pageIndex == i ? 18 : 8,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: pageIndex == i
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).dividerColor,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

String? _resolveProductImageUrl(Map<String, dynamic> product) {
  // Prefer thumbnail in Medusa
  final thumb = product['thumbnail'];
  if (thumb is String && thumb.isNotEmpty) return _resolveUrl(thumb);

  final images = product['images'];
  if (images is List && images.isNotEmpty) {
    final first = images.first;
    if (first is Map && first['url'] != null) {
      return _resolveUrl(first['url'].toString());
    }
  }
  return null;
}

String _resolveUrl(String url) {
  // If Medusa returns relative /uploads/..., make it absolute
  if (url.startsWith('/')) return '${AppConfig.medusaBaseUrl}$url';
  return url;
}
