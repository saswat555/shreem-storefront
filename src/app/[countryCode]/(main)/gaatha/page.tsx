import { Metadata } from "next"
import Image from "next/image"

import {
  shreemAlbumScenes,
  shreemCowBreeds,
  shreemMascots,
  shreemRituals,
} from "@lib/constants/shreem"
import StoryScene from "@modules/common/components/story-scene"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/layout/components/brand-logo"

export const metadata: Metadata = {
  title: "Shreem Gaatha",
  description:
    "Explore the heart of Shreem: desi cows, bilona A2 ghee, neem dhoop batti, gobar rituals, Jeevamrut, and the meaning of Gauri and Mayur.",
}

export default function GaathaPage() {
  const [bilonaGhee, neemDhoop, cowDungCakes, jeevamrut] = shreemRituals
  const galleryScenes = shreemAlbumScenes.slice(0, 3)

  return (
    <div className="content-container py-8 small:py-12">
      <section className="brand-surface overflow-hidden px-5 py-8 small:px-10 small:py-10">
        <p className="brand-pill mb-5 w-fit">Shreem Gaatha</p>
        <BrandLogo
          size="hero"
          align="center"
          className="mb-8"
          caption="The heart of Shreem: desi cows, bilona A2 ghee, neem dhoop batti, gobar rituals, and care for living soil."
        />
        <h1 className="mx-auto max-w-[14ch] text-center text-[2.8rem] leading-[0.98] text-[var(--shreem-ink)] small:text-[4.4rem]">
          The heart of Shreem
        </h1>
        <p className="mx-auto mt-6 max-w-[48rem] text-center text-base leading-7 text-[var(--shreem-muted)] small:text-lg">
          Shreem Gaatha is where our products, our cows, and our world of
          kitchen, prayer, and field come together in one gentle place.
        </p>
        <div className="mt-8 overflow-hidden rounded-[28px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(242,248,246,0.92))] p-2 shadow-[0_24px_60px_rgba(15,49,70,0.08)]">
          <div className="relative aspect-[16/8] overflow-hidden rounded-[22px]">
            <Image
              src="/shreem-scenes/hero-scene.png"
              alt="The Shreem world with Gauri, Mayur, and a village-inspired gaushala atmosphere"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section className="py-8 small:py-12">
        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="brand-card px-5 py-6 small:px-6">
            <p className="brand-kicker">Gauri and Mayur</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)]">
              The two companions who carry the Shreem world
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--shreem-muted)]">
              Every good D2C brand needs a face people remember. In Shreem,
              that memory is carried by Gauri and Mayur. Gauri brings the
              motherly warmth, nourishment, and desi-cow tenderness at the root
              of the brand. Mayur brings the peacock-feather radiance, sacred
              beauty, and festive devotion that give the world of Shreem its
              color and joy.
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--shreem-muted)]">
              Together they make Shreem feel like a living world instead of a
              faceless store, carrying the emotion of purity, prayer, and
              slower Indian village life across the website, packaging, and
              product stories.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {shreemCowBreeds.map((breed) => (
                <span key={breed} className="brand-pill px-3 py-1.5">
                  {breed}
                </span>
              ))}
            </div>
            <div className="mt-6">
              <LocalizedClientLink href="/store" className="brand-primary-button">
                Shop the collection
              </LocalizedClientLink>
            </div>
          </article>
          <div className="grid gap-4 lg:grid-cols-2">
            {shreemMascots.map((mascot) => (
              <article key={mascot.name} className="brand-card overflow-hidden">
                <div className="relative min-h-[300px] border-b border-[var(--shreem-border)] bg-[radial-gradient(circle_at_top,rgba(212,161,38,0.24),transparent_40%),linear-gradient(180deg,rgba(248,241,226,0.96),rgba(239,246,242,0.92))]">
                  <Image
                    src={mascot.imagePath}
                    alt={`${mascot.name}, one of the Shreem mascots`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-contain object-bottom p-5"
                  />
                </div>
                <div className="p-5 small:p-6">
                  <p className="brand-kicker">{mascot.role}</p>
                  <h3 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                    {mascot.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                    {mascot.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 small:py-12">
        <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
            <div className="overflow-hidden rounded-[30px] border border-[var(--shreem-border)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(248,242,230,0.92))] p-2 shadow-[0_24px_70px_rgba(15,49,70,0.1)]">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(251,242,222,0.85),rgba(255,252,246,0.95))] small:aspect-[16/11]">
                <Image
                  src="/shreem-scenes/bilona-process.png"
                  alt="Bilona ghee process with Gauri, Mayur, and the Shreem jar"
                  fill
                  sizes="(max-width: 1280px) 100vw, 760px"
                  className="object-contain p-2 small:p-4"
                />
              </div>
            </div>
            <div>
              <p className="brand-kicker">Bilona A2 ghee</p>
              <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3.2rem]">
                The Shreem ghee story begins with curd, not with hurry
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--shreem-muted)] small:text-base">
                {bilonaGhee.description} That slower route is why bilona ghee
                is remembered differently: the aroma opens gradually, the
                kitchen smells fuller, and the final jar feels closer to an
                older home method than to a factory shortcut.
              </p>
              <div className="mt-6 grid gap-3">
                {bilonaGhee.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-[22px] bg-[linear-gradient(135deg,rgba(255,251,241,0.95),rgba(241,248,245,0.86))] px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]"
                  >
                    {point}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[28px] border border-[rgba(212,161,38,0.24)] bg-[linear-gradient(135deg,rgba(255,248,233,0.95),rgba(245,239,224,0.88))] px-5 py-5 shadow-[0_18px_40px_rgba(156,105,18,0.08)]">
                <p className="brand-kicker">Signature note</p>
                <h3 className="mt-3 text-[1.9rem] leading-[1.04] text-[var(--shreem-ink)]">
                  A smoky finish that stands apart
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                  Our ghee is slowly brought to completion over gau-kasht heat,
                  which adds a softly roasted smoky note. It is this warm,
                  lived-in kitchen character that becomes one of Shreem's clearest
                  points of difference in the market.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 small:py-12">
        <div className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="brand-royal-surface px-5 py-6 text-white small:px-8 small:py-8">
            <p className="brand-kicker">For the prayer room</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-white small:text-[3.2rem]">
              Neem dhoop for evenings that feel prayerful, calm, and less synthetic
            </h2>
            <p className="mt-4 max-w-[36rem] text-sm leading-6 text-white/78">
              {neemDhoop.description} Neem has long had a place in Indian
              household practice, and neem oil has also been studied for
              mosquito-repellent action, which is why Shreem speaks of it as a
              rooted household ritual rather than a loud artificial fragrance.
            </p>
            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/12 bg-white/6 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
              <div className="relative aspect-[16/11] overflow-hidden rounded-[22px]">
                <Image
                  src="/shreem-scenes/neem-dhoop.png"
                  alt="Neem dhoop scene at twilight in the Shreem world"
                  fill
                  sizes="(max-width: 1280px) 100vw, 720px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <article className="brand-card px-5 py-5 small:px-6">
              <p className="brand-kicker">{cowDungCakes.title}</p>
              <h3 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                Sacred warmth for havan, dhooni, and ritual fire
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {cowDungCakes.description} In the Shreem world, these belong to
                the prayer room with dignity, where positive energy comes not
                from perfume or theatre but from slower ritual warmth and
                simpler materials.
              </p>
            </article>
            <article className="brand-card px-5 py-5 small:px-6">
              <p className="brand-kicker">{jeevamrut.title}</p>
              <h3 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
                Living-soil care for farmers who want a cleaner path
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {jeevamrut.description} It represents a farming rhythm that
                respects microbial life in the soil and pushes back against the
                dependence that can grow around repeated chemical-force inputs.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="py-8 small:py-12">
        <div className="flex flex-col gap-4 pb-6">
          <p className="brand-kicker">Visual album</p>
          <h2 className="text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3.3rem]">
            Moments from the Shreem world
          </h2>
          <p className="max-w-[46rem] text-sm leading-6 text-[var(--shreem-muted)]">
            A smaller album of the strongest scenes that define the brand:
            village calm, bilona nourishment, and the soft glow of evening
            prayer.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {galleryScenes.map((scene) => (
            <StoryScene
              key={scene.title}
              src={scene.imagePath}
              alt={scene.alt}
              eyebrow={scene.title}
              title={scene.title}
              description={scene.summary}
              imageFit={scene.title === "Bilona ghee ritual" ? "contain" : "cover"}
              imageWrapperClassName={
                scene.title === "Bilona ghee ritual"
                  ? "bg-[linear-gradient(180deg,rgba(251,242,222,0.85),rgba(255,252,246,0.95))]"
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="pb-16 pt-2 small:pb-24">
        <div className="flex flex-col gap-4 pb-6">
          <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
            <p className="brand-kicker">A slower, cleaner life</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.04] text-[var(--shreem-ink)] small:text-[3.2rem]">
              For families who want food, fragrance, and farming to feel less harsh
            </h2>
            <p className="mt-4 max-w-[52rem] text-sm leading-7 text-[var(--shreem-muted)]">
              Some homes come to Shreem because they want to step gently away
              from overly processed fats, sharply perfumed products, and
              urea-heavy farming habits. What they seek instead is familiar:
              cultured ghee, prayerful fragrance, sacred fire warmth, and a
              more respectful relationship with the soil.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
