export type PolicySection = {
  heading: string
  body: string[]
}

export type PolicyPage = {
  title: string
  eyebrow: string
  summary: string
  lastUpdated: string
  sections: PolicySection[]
}

const supportEmail = "brajsavitrikrishisansthan@gmail.com"
const brandName = "Shreem Cow Products"
const siteUrl = "https://www.shreemfarms.in"

export const policyPages = {
  terms: {
    title: "Terms and Conditions",
    eyebrow: "Customer terms",
    summary:
      "These terms explain how orders, payments, product use, accounts, and support work on Shreem Cow Products.",
    lastUpdated: "20 May 2026",
    sections: [
      {
        heading: "Who we are",
        body: [
          `${brandName} sells cow-based essentials such as bilona ghee, neem dhoop, cow-dung cakes, Jeevamrut, and related digital or AI-assisted services through ${siteUrl}.`,
          `For order, payment, delivery, return, or account support, contact ${supportEmail}.`,
        ],
      },
      {
        heading: "Using this website",
        body: [
          "You agree to provide accurate account, delivery, billing, and contact information. You are responsible for maintaining access to your email and account credentials.",
          "Product descriptions, images, prices, offers, availability, and delivery estimates may change without prior notice. We try to keep all information accurate, but minor differences in packaging, appearance, or natural products may occur.",
        ],
      },
      {
        heading: "Orders and payments",
        body: [
          "Orders are accepted only after payment is authorized or captured by the payment provider and the order is created in our system.",
          "If a payment is deducted but the order is not confirmed, contact support with your email, phone number, transaction reference, amount, and screenshot. We will verify it with the payment provider.",
          "We may cancel or hold an order if payment verification fails, inventory is unavailable, delivery is not serviceable, customer details are incomplete, or the order appears fraudulent or abusive.",
        ],
      },
      {
        heading: "Product use",
        body: [
          "Food and ritual products should be used as described on the product page and packaging. Allergy, medical, religious, astrological, farming, or spiritual decisions remain the customer's responsibility.",
          "AI-assisted guidance on the website is informational and not a substitute for qualified medical, legal, financial, veterinary, agricultural, or professional advice.",
        ],
      },
      {
        heading: "Shipping, returns, and refunds",
        body: [
          "Shipping is handled according to our Shipping Policy, including Shiprocket serviceability, courier assignment, estimated timelines, and delivery charges.",
          "Returns and refunds are governed by the Return Policy and Refund Policy published on this website.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "To the fullest extent permitted by law, our liability is limited to the amount paid for the affected order or service.",
          "We are not responsible for delays or failures caused by courier disruptions, wrong addresses, customer unavailability, payment gateway issues, force majeure, natural events, platform outages, or third-party service interruptions.",
        ],
      },
      {
        heading: "Changes to terms",
        body: [
          "We may update these terms when our business, payment, shipping, legal, or technology process changes. The latest version on the website applies to new orders and usage.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    eyebrow: "Payments and refunds",
    summary:
      "This policy explains when refunds are approved, how they are processed, and what information we need from you.",
    lastUpdated: "20 May 2026",
    sections: [
      {
        heading: "When refunds apply",
        body: [
          "A refund may be approved when an order is cancelled before dispatch, payment is captured but order creation fails, an item is unavailable after payment, delivery is not serviceable after confirmation, or a return is approved under our Return Policy.",
          "For damaged, leaking, wrong, or missing items, you must contact support within 48 hours of delivery with order ID, photos or video of the package and product, invoice, and delivery label.",
        ],
      },
      {
        heading: "Non-refundable cases",
        body: [
          "Refunds are not normally approved for opened food items, used consumables, products damaged after delivery, incorrect address provided by the customer, failed delivery due to customer unavailability, change of mind after dispatch, or claims reported after the inspection window.",
          "Digital services, AI credits, premium memberships, consultations, and downloadable or consumed services are non-refundable once consumed, except where required by law or when a duplicate payment is verified.",
        ],
      },
      {
        heading: "Refund method and timeline",
        body: [
          "Approved refunds are issued to the original payment method used at checkout unless another lawful method is required.",
          "After approval, refund initiation usually takes 3-7 business days. The final credit timeline depends on your bank, card network, UPI provider, wallet, or payment gateway.",
        ],
      },
      {
        heading: "How to request a refund",
        body: [
          `Email ${supportEmail} with your order ID, registered email or phone number, payment reference if relevant, reason for refund, and supporting photos or screenshots.`,
          "We may ask for additional verification before approval. Refund decisions are made after checking order status, courier records, payment records, and product condition where applicable.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Data and privacy",
    summary:
      "This policy explains what customer data we collect, why we use it, and how we protect it.",
    lastUpdated: "20 May 2026",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "We collect information you provide during account creation, checkout, support, AI usage, or profile updates, including name, email, phone number, billing address, shipping address, order details, payment status, and support messages.",
          "For AI features, we may store your prompts, answers, selected tool, token usage, estimated cost, and metadata needed to provide support, safety limits, wallet credits, and admin review.",
        ],
      },
      {
        heading: "How we use information",
        body: [
          "We use your data to process orders, calculate shipping, provide customer support, manage accounts, verify email, prevent fraud, improve products, operate AI features, maintain wallet credits, and comply with legal or tax obligations.",
          "Saved delivery pincode is used to show serviceability and Shiprocket delivery estimates on product and checkout pages.",
        ],
      },
      {
        heading: "Payments and shipping partners",
        body: [
          "Payment details are processed by our payment gateway and banking partners. We do not store full card, UPI, wallet, or banking credentials on the storefront.",
          "Delivery information required to ship an order may be shared with Shiprocket and courier partners for pickup, tracking, delivery, returns, and proof of delivery.",
        ],
      },
      {
        heading: "Cookies and local storage",
        body: [
          "We use cookies and local storage for cart continuity, account sessions, country selection, delivery pincode fallback, checkout progress, and site security.",
          "If you clear browser data, local preferences may reset, but account-level data remains available when you sign in.",
        ],
      },
      {
        heading: "Data retention and deletion",
        body: [
          "Order, invoice, payment, tax, support, and AI usage records may be retained as long as needed for business, legal, safety, audit, and dispute-resolution purposes.",
          `For access, correction, or deletion requests, contact ${supportEmail}. Some records may need to be retained where required by law or legitimate business need.`,
        ],
      },
      {
        heading: "Security",
        body: [
          "We use access controls, authenticated sessions, and trusted service providers to protect customer data. No internet-based system is perfectly secure, so customers should keep account passwords and email access safe.",
        ],
      },
    ],
  },
  return: {
    title: "Return Policy",
    eyebrow: "Returns and replacements",
    summary:
      "This policy explains what can be returned, what cannot be returned, and how to raise a return request.",
    lastUpdated: "20 May 2026",
    sections: [
      {
        heading: "Return window",
        body: [
          "For eligible products, return or replacement requests must be raised within 48 hours of delivery.",
          "Because many Shreem products are food, consumable, or ritual-use items, return eligibility depends on product condition, seal status, hygiene, and the reason for return.",
        ],
      },
      {
        heading: "Eligible return cases",
        body: [
          "Returns or replacements may be approved for wrong item delivered, item missing from package, product damaged in transit, leakage, expired item, or quality issue verified from photos/video and order records.",
          "The product, packaging, invoice, and delivery label should be preserved until the issue is resolved.",
        ],
      },
      {
        heading: "Non-returnable cases",
        body: [
          "Opened food products, used consumables, burnt dhoop or gobar products, used farm inputs, items damaged after delivery, and products without proof of purchase are not normally returnable.",
          "Change of mind, fragrance preference, taste preference, wrong address, customer unavailability, or delayed reporting after 48 hours may not qualify for return.",
        ],
      },
      {
        heading: "Return pickup and inspection",
        body: [
          "When a return is approved, pickup may be arranged through Shiprocket or another courier partner where serviceable.",
          "Refund or replacement is processed after inspection. If the returned item does not match the approved claim, the request may be rejected.",
        ],
      },
      {
        heading: "How to request a return",
        body: [
          `Email ${supportEmail} with order ID, registered email or phone, issue details, clear photos/video, invoice, and package label within 48 hours of delivery.`,
        ],
      },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    eyebrow: "Delivery through Shiprocket",
    summary:
      "This policy explains how Shreem uses Shiprocket and courier partners to calculate delivery, ship orders, and handle delivery exceptions.",
    lastUpdated: "20 May 2026",
    sections: [
      {
        heading: "Shipping partner",
        body: [
          "We use Shiprocket to check pincode serviceability, calculate shipping rates, allocate courier partners, generate labels, arrange pickup, and provide tracking for most orders.",
          "Courier selection may depend on delivery pincode, product weight, pickup pincode, serviceability, estimated delivery time, and Shiprocket/courier availability.",
        ],
      },
      {
        heading: "Serviceability and shipping charges",
        body: [
          "Delivery availability and shipping cost are calculated using the delivery pincode and product/cart weight. The final shipping charge is shown before payment.",
          "If a pincode is not serviceable, you may need to use another delivery address. Serviceability can change due to courier network conditions.",
        ],
      },
      {
        heading: "Dispatch and delivery timeline",
        body: [
          "Orders are usually prepared for dispatch within 1-3 business days after payment confirmation, unless the product page or support team states otherwise.",
          "Estimated delivery time is shown from Shiprocket/courier data where available. Delivery may be delayed by weather, strikes, holidays, incorrect address, customer unavailability, remote areas, courier disruptions, or force majeure.",
          "The order will be delivered within a maximum period of 15-20 days.",
        ],
      },
      {
        heading: "Address and contact accuracy",
        body: [
          "Customers must provide complete address, pincode, landmark where needed, and reachable phone number. Wrong or incomplete delivery details may cause delay, failed delivery, return-to-origin, or extra charges.",
          "If you need to change the address after ordering, contact support immediately. Address changes are not guaranteed after dispatch.",
        ],
      },
      {
        heading: "Tracking and failed delivery",
        body: [
          "Tracking details are shared when available. Courier partners may attempt delivery according to their network policy.",
          "If delivery fails due to customer unavailability, refusal, wrong address, or unreachable phone, the parcel may return to origin. Additional shipping charges may apply for reshipping.",
        ],
      },
      {
        heading: "Damaged package",
        body: [
          "If the parcel appears damaged, leaking, or tampered with, record photos/video before opening and contact support within 48 hours of delivery.",
        ],
      },
    ],
  },
} satisfies Record<string, PolicyPage>
