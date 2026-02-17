import 'package:flutter/material.dart';

class BlogPage extends StatelessWidget {
  const BlogPage({super.key});

  @override
  Widget build(BuildContext context) {
    final posts = const [
      {
        'title': 'Why A2 Milk is Easier to Digest',
        'excerpt': 'A simple explanation of A2 vs A1 proteins and digestion...',
      },
      {
        'title': 'Bilona Ghee: Traditional Method Explained',
        'excerpt': 'From curd to makkhan to ghee — step-by-step.',
      },
      {
        'title': 'How We Feed Our Desi Cows',
        'excerpt': 'Green fodder, clean water, and stress-free care at Shreem.',
      },
    ];

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Text('Blog (Dummy)', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...posts.map((p) {
          return Card(
            child: ListTile(
              title: Text(p['title']!),
              subtitle: Text(p['excerpt']!),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Open blog: ${p['title']} (later)')),
                );
              },
            ),
          );
        }),
        const SizedBox(height: 24),
        const Center(
          child: Text(
            'This page is placeholder.\nNext: connect to Medusa blog CMS or markdown.',
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}
