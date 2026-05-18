import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import LoginTemplate from "@modules/account/templates/login-template"
import AstrologyExperience from "@modules/astrology/components/astrology-experience"
import MotionReveal from "@modules/common/components/motion-reveal"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const title =
    "Shreem Astrology | Shubh Muhurth, Vedic Prashna Kundli & Consultations"
  const description =
    "Check city-based Shubh Muhurth, day and night Choghadiya, Hindi calendar tithi and masa context, Vedic Prashna Kundli, and astrology consultations with Sanjay Kumar Pandey."

  return {
    title,
    description,
    keywords: [
      "Shreem Astrology",
      "Shubh Muhurth today",
      "Prashna Kundli",
      "Vedic astrology consultation",
      "Choghadiya",
      "Sanjay Kumar Pandey astrologer",
    ],
    alternates: {
      canonical: `/${countryCode}/shreem-astrology`,
    },
    openGraph: {
      title,
      description,
      url: `/${countryCode}/shreem-astrology`,
      images: ["/logo.jpeg"],
    },
  }
}

export default async function ShreemAstrologyPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const baseUrl = getBaseURL()
  const pageUrl = `${baseUrl}/${countryCode}/shreem-astrology`
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Shreem Astrology",
        url: pageUrl,
        provider: {
          "@type": "Organization",
          name: "Shreem Cow Products",
          url: baseUrl,
          logo: `${baseUrl}/logo.jpeg`,
        },
        areaServed: "India",
        serviceType:
          "Daily Shubh Muhurth, Vedic Prashna Kundli, and paid astrology consultation",
        description:
          "City-based sunrise and sunset Choghadiya, Hindi calendar tithi and masa context, Vedic Prashna Kundli chart details, and consultation booking with Sanjay Kumar Pandey.",
        offers: [
          {
            "@type": "Offer",
            name: "15 minute astrology call",
            price: "499",
            priceCurrency: "INR",
          },
          {
            "@type": "Offer",
            name: "30 minute astrology call with stone recommendation and pooja",
            price: "999",
            priceCurrency: "INR",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How does Shreem Astrology calculate Shubh Muhurth?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The page uses the selected city and date to calculate local sunrise and sunset, then divides daytime and nighttime into Choghadiya slots. It also shows Hindi calendar tithi, paksha, masa, nakshatra, yoga, and karana context for the selected date.",
            },
          },
          {
            "@type": "Question",
            name: "What chart details are included in Prashna Kundli?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Prashna chart includes sidereal Lagna, Moon nakshatra and pada, tithi, paksha, yoga, karana, graha positions, Rahu and Ketu, retrograde status, and whole-sign houses.",
            },
          },
          {
            "@type": "Question",
            name: "Can I book a personal astrology consultation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Shreem offers paid consultations with Sanjay Kumar Pandey through the storefront checkout for a 15 minute call or a detailed 30 minute call with stone recommendation and pooja direction.",
            },
          },
        ],
      },
    ],
  }

  if (!customer) {
    return (
      <div className="content-container py-5 pb-14 small:py-10 small:pb-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <MotionReveal>
          <section className="brand-surface mb-6 px-5 py-8 small:px-10 small:py-11">
            <p className="brand-pill mb-5 w-fit">Jyotish desk</p>
            <h1 className="brand-page-title max-w-[16ch]">
              Sign in for muhurth, kundli, and chart notes.
            </h1>
            <p className="brand-page-copy mt-5 max-w-[52rem]">
              Muhurth, Hindu calendar, Prashna Kundli, birth Kundli generation,
              chart history, and PDF-ready reports are available after sign in.
            </p>
          </section>
        </MotionReveal>

        <MotionReveal delayMs={70}>
          <section className="brand-card px-4 py-4 small:px-8 small:py-8">
            <LoginTemplate />
          </section>
        </MotionReveal>
      </div>
    )
  }

  return (
    <div className="content-container py-5 pb-14 small:py-10 small:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="brand-surface mb-6 px-5 py-8 small:px-10 small:py-11">
        <p className="brand-pill mb-5 w-fit">Jyotish desk</p>
        <h1 className="brand-page-title max-w-[17ch]">
          Muhurth windows, Prashna charts, and guided calls.
        </h1>
        <p className="brand-page-copy mt-5 max-w-[52rem]">
          A clean astrology desk for daily Choghadiya windows, Hindi calendar
          tithi and masa context, Vedic Prashna Kundli chart details, and paid consultation
          booking with Sanjay Kumar Pandey.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="brand-pill px-3 py-1.5">City-based sunrise</span>
          <span className="brand-pill px-3 py-1.5">Vedic Prashna chart</span>
          <span className="brand-pill px-3 py-1.5">PhonePe checkout ready</span>
        </div>
      </section>

      <AstrologyExperience
        customerEmail={customer.email}
        customerName={`${customer.first_name || ""} ${
          customer.last_name || ""
        }`.trim()}
      />
    </div>
  )
}
