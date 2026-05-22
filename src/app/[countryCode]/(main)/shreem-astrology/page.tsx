import { Metadata } from "next"
import Image from "next/image"

import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import LoginTemplate from "@modules/account/templates/login-template"
import AstrologyExperience from "@modules/astrology/components/astrology-experience"
import MotionReveal from "@modules/common/components/motion-reveal"

const zodiacSymbols = [
  { sign: "Aries", symbol: "♈" },
  { sign: "Taurus", symbol: "♉" },
  { sign: "Gemini", symbol: "♊" },
  { sign: "Cancer", symbol: "♋" },
  { sign: "Leo", symbol: "♌" },
  { sign: "Virgo", symbol: "♍" },
  { sign: "Libra", symbol: "♎" },
  { sign: "Scorpio", symbol: "♏" },
  { sign: "Sagittarius", symbol: "♐" },
  { sign: "Capricorn", symbol: "♑" },
  { sign: "Aquarius", symbol: "♒" },
  { sign: "Pisces", symbol: "♓" },
]

const ZodiacBackdrop = () => (
  <>
    <div className="astrology-zodiac-field" aria-hidden="true">
      {zodiacSymbols.map((item) => (
        <span key={item.sign} className="astrology-zodiac-symbol">
          {item.symbol}
        </span>
      ))}
    </div>
    <div className="astrology-yantra-gate" aria-hidden="true" />
  </>
)

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
      <div className="astrology-realm relative isolate overflow-hidden">
        <ZodiacBackdrop />
        <div className="content-container relative z-10 py-5 pb-14 small:py-10 small:pb-24">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
          <MotionReveal>
            <section className="astrology-page-hero brand-surface relative mb-6 overflow-hidden px-5 py-8 small:px-10 small:py-11">
              <div className="relative z-10 flex flex-col gap-6 small:flex-row small:items-end small:justify-between">
                <div>
                  <p className="brand-pill mb-5 w-fit">Jyotish desk</p>
                  <h1 className="brand-page-title max-w-[16ch]">
                    Sign in to open your Jyotish desk.
                  </h1>
                  <p className="brand-page-copy mt-5 max-w-[52rem]">
                    Muhurth, Hindu calendar, Prashna Kundli, birth Kundli
                    generation, chart history, and PDF-ready reports are
                    available after sign in.
                  </p>
                </div>
                <div className="astrology-logo-seal">
                  <Image
                    src="/logo.jpeg"
                    alt="Shreem logo"
                    width={72}
                    height={72}
                    className="rounded-full object-cover"
                    priority
                  />
                  <span>Shreem Jyotish</span>
                </div>
              </div>
            </section>
          </MotionReveal>

          <MotionReveal delayMs={70}>
            <section className="brand-card px-4 py-4 small:px-8 small:py-8">
              <LoginTemplate />
            </section>
          </MotionReveal>
        </div>
      </div>
    )
  }

  return (
    <div className="astrology-realm relative isolate overflow-hidden">
      <ZodiacBackdrop />
      <div className="content-container relative z-10 py-5 pb-14 small:py-10 small:pb-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <section className="astrology-page-hero brand-surface relative mb-6 overflow-hidden px-5 py-8 small:px-10 small:py-11">
          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <p className="brand-pill w-fit">Jyotish desk</p>
                <div className="astrology-logo-seal astrology-logo-seal-compact">
                  <Image
                    src="/logo.jpeg"
                    alt="Shreem logo"
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                    priority
                  />
                  <span>Shreem</span>
                </div>
              </div>
              <h1 className="brand-page-title max-w-[17ch]">
                Read the sky without losing the ground.
              </h1>
              <p className="brand-page-copy mt-5 max-w-[52rem]">
                Daily Muhurth, Hindu calendar, Prashna Kundli, birth chart
                generation, and guided consultation with Sanjay Kumar Pandey in a
                clearer Vedic astrology workspace.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="brand-pill px-3 py-1.5">Navagraha view</span>
                <span className="brand-pill px-3 py-1.5">North Indian chart</span>
                <span className="brand-pill px-3 py-1.5">BPHS-informed reading</span>
              </div>
            </div>
            <div className="astrology-hero-orbit rounded-[28px] border border-[rgba(245,199,96,0.3)] bg-[rgba(10,30,48,0.74)] px-5 py-5 text-white shadow-[0_28px_70px_rgba(10,30,48,0.22)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#f5d98b]">
                Ancient computation
              </p>
              <p className="mt-3 text-sm leading-7 text-[#e8f4f3]">
                Graha movement, tithi, nakshatra, dasha, and house context are
                arranged for practical decisions, not vague fortune-telling.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[#ffe7a1]">
                <span className="rounded-full border border-white/12 bg-white/10 px-2 py-2">
                  Tithi
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-2 py-2">
                  Dasha
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-2 py-2">
                  Yoga
                </span>
              </div>
            </div>
          </div>
        </section>

        <AstrologyExperience
          customerEmail={customer.email}
          customerName={`${customer.first_name || ""} ${
            customer.last_name || ""
          }`.trim()}
        />
      </div>
    </div>
  )
}
