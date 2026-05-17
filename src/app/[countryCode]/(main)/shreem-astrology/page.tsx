import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import AstrologyExperience from "@modules/astrology/components/astrology-experience"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const title =
    "Shreem Astrology | Shubh Muhurth, Vedic Prashna Kundli & Consultations"
  const description =
    "Check city-based Shubh Muhurth, day and night Choghadiya, Vedic Prashna Kundli with Lagna and Panchang details, and book astrology consultations with Sanjay Kumar Pandey."

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
          "City-based sunrise and sunset Choghadiya, 30 muhurta planning windows, Vedic Prashna Kundli chart details, and consultation booking with Sanjay Kumar Pandey.",
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
              text: "The page uses the selected city and date to calculate local sunrise and sunset, then divides daytime and nighttime into Choghadiya slots. It also shows 30 muhurta planning windows from sunrise to next sunrise.",
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

  return (
    <div className="content-container py-5 pb-14 small:py-10 small:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="brand-surface mb-6 px-5 py-8 small:px-10 small:py-11">
        <p className="brand-pill mb-5 w-fit">Shreem Astrology</p>
        <h1 className="max-w-[13ch] text-[2.75rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.6rem]">
          Muhurth, Prashna, and guided calls
        </h1>
        <p className="mt-5 max-w-[52rem] text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
          A clean astrology desk for daily Choghadiya windows, 48-minute
          muhurtas, Vedic Prashna Kundli chart details, and paid consultation
          booking with Sanjay Kumar Pandey.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="brand-pill px-3 py-1.5">City-based sunrise</span>
          <span className="brand-pill px-3 py-1.5">Vedic Prashna chart</span>
          <span className="brand-pill px-3 py-1.5">PhonePe checkout ready</span>
        </div>
      </section>

      <AstrologyExperience />

      <section className="brand-surface mt-6 px-5 py-7 small:px-8 small:py-9">
        <p className="brand-kicker">How it works</p>
        <h2 className="mt-2 max-w-[17ch] text-[2.2rem] leading-[1.02] text-[var(--shreem-ink)] small:text-[3.4rem]">
          Vedic timing with clear chart context
        </h2>
        <div className="mt-5 grid gap-4 small:grid-cols-3">
          <div className="brand-card px-4 py-4">
            <h3 className="text-lg font-semibold text-[var(--shreem-ink)]">
              Shubh Muhurth
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
              Select a city and date to see local sunrise, sunset, day
              Choghadiya, night Choghadiya, and 30 muhurta planning windows.
            </p>
          </div>
          <div className="brand-card px-4 py-4">
            <h3 className="text-lg font-semibold text-[var(--shreem-ink)]">
              Prashna Kundli
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
              Ask one focused question. The system calculates Lagna, Moon
              nakshatra, tithi, yoga, karana, graha positions, and houses before
              AI interpretation.
            </p>
          </div>
          <div className="brand-card px-4 py-4">
            <h3 className="text-lg font-semibold text-[var(--shreem-ink)]">
              Human guidance
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--shreem-muted)]">
              For ritual timing, stone recommendation, pooja direction, or
              sensitive life decisions, book a paid call with Sanjay Kumar
              Pandey through checkout.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
