import 'package:flutter/material.dart';

class BlogPage extends StatelessWidget {
  const BlogPage({super.key});

  @override
  Widget build(BuildContext context) {
    const posts = [
      (
        'A2 Milk vs A1: What your gut feels',
        'Understand protein types and why many households prefer A2 for daily use.',
      ),
      (
        'Bilona Ghee: Premium process',
        'From curd culturing to hand-churned makkhan and slow-fired ghee.',
      ),
      (
        'How fresh paneer reaches your kitchen',
        'Cold-chain + same-day prep for softness and nutrition.',
      ),
    ];

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.amber.shade50,
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Text('Shreem Journal\nFarm stories, nutrition and traditional dairy wisdom.'),
        ),
        const SizedBox(height: 10),
        ...posts.map(
          (p) => Card(
            child: ListTile(
              title: Text(p.$1),
              subtitle: Text(p.$2),
              trailing: const Icon(Icons.chevron_right),
            ),
          ),
        ),
      ],
    );
  }
}
