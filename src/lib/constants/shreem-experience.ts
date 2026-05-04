export type ShreemJournalPost = {
  slug: string
  title: string
  description: string
  excerpt: string
  image: string
  imageAlt: string
  category: string
  readTime: string
  publishedAt: string
  sections: {
    heading: string
    body: string[]
  }[]
}

export const shreemSupportFaqs = [
  {
    question: "How do I get help with an order I placed on Shreem?",
    answer:
      "The fastest path is through your Shreem account, where you can review past orders, saved addresses, and order details in one place. If you placed an order without signing in, you can still use the order transfer flow to connect it to your account later.",
  },
  {
    question: "Can I update my address and profile details after creating an account?",
    answer:
      "Yes. Your Shreem account already uses Medusa's customer flows for profile details, phone number, address book, and order lookup, so you can manage the important basics without needing to start over each time.",
  },
  {
    question: "What should I do if I need help choosing between products?",
    answer:
      "Use Bilona Ghee for the kitchen, Neem Dhoop Batti for evening prayer and calmer home fragrance, Cow Dung Cakes for havan and dhooni rituals, and Jeevamrut for natural-farming routines focused on living soil.",
  },
  {
    question: "Why does Shreem speak about a slower, input-conscious life?",
    answer:
      "Because the brand is rooted in naturally grazing desi cows, cultured bilona methods, home rituals, and soil care that respects biological life. The aim is clear product purpose, not loud promises.",
  },
]

export const shreemJournalPosts: ShreemJournalPost[] = [
  {
    slug: "bilona-a2-ghee-made-slowly",
    title: "Why bilona A2 ghee feels different when it is made slowly",
    description:
      "A Shreem Journal note on cultured curd, hand-churned makkhan, and the warm smoky finish that gives bilona A2 ghee its signature character.",
    excerpt:
      "Bilona ghee begins with curd, not with haste. That slower journey shapes the aroma, the feel of the kitchen, and the depth that people remember.",
    image: "/shreem-scenes/bilona-process.png",
    imageAlt: "Bilona A2 ghee process illustration with Gauri and Mayur",
    category: "Kitchen Wisdom",
    readTime: "5 min read",
    publishedAt: "2026-04-12",
    sections: [
      {
        heading: "The bilona route starts with curd",
        body: [
          "Traditional bilona ghee follows a curd-first route. Milk is first cultured into curd, curd is hand-churned into makkhan, and only then is the butter slowly heated into ghee. That journey matters because process is not just technique; it shapes what the final ghee feels like in the kitchen.",
          "In the Shreem world, bilona is part of a larger belief that food should feel rooted, patient, and close to the older intelligence of the home.",
        ],
      },
      {
        heading: "Why the aroma opens differently",
        body: [
          "Research comparing ghee-making methods has noted that method can influence flavour and aroma profile. That lines up with what many homes already know by instinct: a slower ghee does not smell flat.",
          "When bilona ghee is made carefully, it carries a fuller, rounder kitchen memory. The fragrance lingers with warmth rather than feeling sharp or one-dimensional.",
        ],
      },
      {
        heading: "The Shreem smoky finish",
        body: [
          "Our ghee is slowly brought to completion over gau-kasht heat. That last stage gives Shreem a softly roasted smoky note that becomes a real point of difference.",
          "It is not smoke for drama. It is a warm finishing character that makes the jar feel closer to a lived kitchen than to a generic market shelf.",
        ],
      },
    ],
  },
  {
    slug: "neem-dhoop-for-evening-rituals",
    title: "Why neem dhoop belongs in the soft light of evening rituals",
    description:
      "A Shreem Journal piece on neem dhoop, devotional fragrance, and why calmer evening rituals matter in a family home.",
    excerpt:
      "Neem dhoop is not meant to overpower a room. It belongs to the prayer hour, when fragrance should support calm, devotion, and a gentler atmosphere.",
    image: "/shreem-scenes/neem-dhoop.png",
    imageAlt: "Neem dhoop evening ritual illustration in the Shreem world",
    category: "Home Rituals",
    readTime: "4 min read",
    publishedAt: "2026-04-12",
    sections: [
      {
        heading: "A household ritual, not a loud room perfume",
        body: [
          "Shreem neem dhoop batti is designed for the prayer corner, the evening diya, and the calm that comes when fragrance stays devotional rather than noisy.",
          "The goal is not to fill the home with a sharp synthetic smell. The goal is to let a ritual space feel calmer, warmer, and more rooted.",
        ],
      },
      {
        heading: "Why neem still matters",
        body: [
          "Neem has held a place in Indian household practice for generations. Neem oil has also been studied for mosquito-repellent action, which is why it remains meaningful in evening-life conversations around the home.",
          "That does not make dhoop a medical promise. It simply explains why neem still feels appropriate, practical, and familiar in real households.",
        ],
      },
      {
        heading: "A calmer atmosphere for prayer",
        body: [
          "When the day slows down, fragrance should help the room settle. Neem dhoop fits that mood well because it feels devotional, traditional, and less synthetic.",
          "That is the role it plays at Shreem: not a trend product, but a prayerful part of evening living.",
        ],
      },
    ],
  },
  {
    slug: "living-soil-and-input-conscious-farm-rhythm",
    title: "Living soil, Jeevamrut, and an input-conscious farm rhythm",
    description:
      "A Shreem Journal article on Jeevamrut, living-soil thinking, and why many farmers are drawn to more natural farming inputs.",
    excerpt:
      "Jeevamrut belongs to a farming idea that respects soil as living. It shifts attention from force and dependency toward biological health and patience.",
    image: "/shreem-scenes/hero-scene.png",
    imageAlt: "Village-inspired Shreem farm and gaushala illustration",
    category: "Farm Life",
    readTime: "5 min read",
    publishedAt: "2026-04-12",
    sections: [
      {
        heading: "Why living soil matters",
        body: [
          "Natural-farming conversations often begin with one simple idea: soil is not dead matter. It is active, biological, and deeply responsive to the way it is treated.",
          "That is why Shreem places Jeevamrut in a wider farm philosophy rather than presenting it as a shortcut product.",
        ],
      },
      {
        heading: "Jeevamrut in the natural-farming tradition",
        body: [
          "Research has described Jeevamrut as a microbial bioformulation used in Indian natural farming, and studies have reported rich microbial diversity and soil-health relevance in Jeevamrut-based systems.",
          "For many growers, that makes it meaningful not only as an input, but as part of a broader return to soil care and farmer dignity.",
        ],
      },
      {
        heading: "Why input-conscious language matters",
        body: [
          "Shreem speaks of an input-conscious farm rhythm because soil care works best when farmers observe, adjust, and avoid treating every problem as a shortcut-input problem.",
          "The alternative is not romanticism. It is patience, observation, and a steadier relationship with the field.",
        ],
      },
    ],
  },
]

export const shreemSupportHighlights = [
  {
    title: "Order support",
    description:
      "Use your Shreem account to review orders, track details, and keep your purchase history in one place.",
  },
  {
    title: "Profile and address book",
    description:
      "Maintain your delivery information, billing details, and customer profile through the existing Medusa customer flows.",
  },
  {
    title: "Guided product help",
    description:
      "Understand which products belong in the kitchen, prayer room, or farm before you place your next order.",
  },
]
