/* eslint-disable @next/next/no-img-element -- Landing feature art renders localized Stitch source imagery for visual QA. */

import { PublicNav } from "@/components/brand/public-nav";
import { SiteFooter } from "@/components/brand/site-footer";
import { cn } from "@/lib/cn";
import stitchAssetManifest from "../../../public/stitch/asset-manifest.json";
import { CreatorCarousel } from "./creator-carousel";
import { HeroVisual } from "./hero-visual";

const CREATOR_LOGIN_HREF = "/login?returnTo=%2Fstudio%2Fdashboard";
const stitchAssets = stitchAssetManifest as Record<string, string>;

const valueCards = [
  {
    icon: "auto_awesome",
    title: "Instant AI Collection",
    body: "Stop manual pasting. Input any product link, and our AI instantly pulls high-res imagery, live pricing, and luxury details to auto-build cards.",
    tone: "text-[#006a60] bg-[#64f6e3]/20",
  },
  {
    icon: "dashboard_customize",
    title: "Pure Layout Bliss",
    body: "Arrange into thematic visual shelves by Desk Setup, Camera Gear, or OOTD. Perfectly satisfies your inner aesthetic perfectionist.",
    tone: "text-[#131a33] bg-[#dbe1ff]",
  },
  {
    icon: "devices",
    title: "Seamless Omnichannel",
    body: "One tap to distribute. Perfectly optimized for mobile, tablet, and desktop to guarantee an uncompromised user experience everywhere.",
    tone: "text-[#1b192e] bg-[#e5dffd]",
  },
  {
    icon: "payments",
    title: "Monetize Effortlessly",
    body: "Turn every single touchpoint into hard cash. Seamlessly integrate your affiliate tracking for pure, automated revenue on every click.",
    tone: "text-[#93000a] bg-[#ffdad6]/60",
  },
] as const;

const featureRows = [
  {
    title: "Turn Clicks into Affiliate Revenue.",
    body: "Stop leaving money on the table. With interactive image hotspots mapping directly to your gear list, fans buy instantly—driving trust and skyrocketing click-through rates by 300%.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuABGg01-XzRTsmO7SRwczbmp6Rdcr26_X573iFrqDtLIrNb3K14EzEzTYi_14tbg7iLnlRJOUROEStVXIvHiaQiInTb17nBxjdKlhjr613Y42-T1Tiqkemb4h46KFCQiIYwKCfYMz3KSbSl2lYfACujpD6pq7wSifYemRNFZqkX7GhO3IZVvU7WgZ1LXkJ-mqU_VuM8tJfdi1EuBKHeCjQT3z8uZR_FA3X3uMp1YKMRpNCCceVF8fjh06EFMt2cHWM4Jd81ro0hp-8",
    alt: "A clean, modern dashboard interface showing interactive image hotspots on a premium camera setup.",
    reverse: false,
  },
  {
    title: "Stop Wasting Time on Multiple Platforms.",
    body: "Stop wasting your life updating dead links. Edit a product link in your unified dashboard, and it instantly syncs across YouTube, Instagram, X, and TikTok.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCIMtL43netm0sCMDy6JJ5gPtNKO8INV4CS5DOMEeRSf6m1-Blrn2Z3T615TW4tQNDE3sg92fQelutkeGdGXa6jilvdB9aGLs1bXGT4392q7483zO1vjQzbyBliObqX_El3Jhs2npN52Rp213BN9Xn7Xj7ybtlkFa_RRtCPI_R3TfHurgURihGRfRfhK-8QYnuepRFR0hcem_Hx3_BFNrCniEiR0xRqyc2AD0WJ6MA75LyED3D1Cpbvss4_CkBLMXcE2rMzSEV-DaA",
    alt: "A sleek multi-device mockup showing a unified dashboard syncing a single product link across screens.",
    reverse: true,
  },
  {
    title: "Never Compromise Your Aesthetics.",
    body: "Your brand deserves better than a generic list. Customize colors, layouts, and typography to perfectly match your visual identity and keep your audience immersed.",
    icon: "palette",
    reverse: false,
  },
  {
    title: "Let Your Fans Do the Marketing.",
    body: "Enable easy sharing and watch your shelves go viral. Built-in social sharing tools make it effortless for your audience to spread the word about their favorite gear.",
    icon: "campaign",
    reverse: true,
  },
] as const;

function PrimaryCta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <a
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#00bfae] to-[#006a60] px-8 py-4 text-sm font-bold text-white shadow-[0_0_15px_rgba(0,191,174,0.5)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,191,174,0.7)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#00bfae]",
        className,
      )}
      href={CREATOR_LOGIN_HREF}
    >
      {children}
    </a>
  );
}

function FeatureVisual({ row }: { row: (typeof featureRows)[number] }) {
  return (
    <div className="group relative h-80 w-full overflow-hidden rounded-2xl bg-[#eae7ea] shadow-lg">
      {"image" in row ? (
        <>
          <div className="absolute inset-0 z-10 bg-gradient-to-tr from-[#64f6e3]/10 to-[#dbe1ff]/20 opacity-20 transition-opacity group-hover:opacity-40" />
          <img
            alt={row.alt}
            className="h-full w-full object-cover"
            loading="lazy"
            src={stitchAssets[row.image] ?? row.image}
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-6xl text-[var(--muted)]"
          >
            {row.icon}
          </span>
        </div>
      )}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--surface)] text-[var(--ink)]">
      <PublicNav />

      <main className="pt-24">
        <section
          className="relative flex min-h-[921px] items-center overflow-hidden"
          id="explore"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--surface)]/95" />
          <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center gap-12 px-5 py-20 md:px-10 lg:flex-row">
            <div className="flex w-full flex-col items-center gap-4 pt-12 text-center lg:w-1/2 lg:items-start lg:pt-0 lg:text-left">
              <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-[#c6c6ce]/50 bg-[#f6f3f5] px-3 py-1 lg:mx-0">
                <span aria-hidden="true" className="material-symbols-outlined text-sm text-[#006a60]">
                  rocket_launch
                </span>
                <span className="text-xs font-semibold leading-4 text-[var(--muted)]">
                  The new standard for creators
                </span>
              </div>

              <h1
                aria-label="Stop Killing Your Conversions with Trashy Text Links!"
                className="reveal-text max-w-3xl text-[32px] font-bold leading-[38px] tracking-normal text-[#131a33] md:text-[40px] md:leading-[48px] md:tracking-[-0.02em]"
                id="hero-headline"
              >
                {["Stop", "Killing", "Your", "Conversions", "with"].map((word, index) => (
                  <span
                    className="landing-reveal-word mr-3"
                    key={word}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {word}{" "}
                  </span>
                ))}
                <span className="text-[#006a60]">
                  {["Trashy", "Text", "Links!"].map((word, index) => (
                    <span
                      className="landing-reveal-word mr-3"
                      key={word}
                      style={{ animationDelay: `${(index + 5) * 80}ms` }}
                    >
                      {word}
                      {index < 2 ? " " : ""}
                    </span>
                  ))}
                </span>
              </h1>

              <p className="mx-auto max-w-2xl text-lg leading-7 text-[var(--muted)] lg:mx-0">
                Turn dead URLs into stunning, high-converting visual showcases in seconds.
                Build a premium aesthetic space tailored for your gear and your audience.
              </p>

              <div className="mt-4 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row lg:items-start lg:justify-start">
                <div className="magnetic-wrap w-full sm:w-auto" id="cta-magnetic">
                  <PrimaryCta className="magnetic-inner w-full sm:w-auto">
                    Start Your Shelf
                  </PrimaryCta>
                </div>
                <a
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#131a33] px-8 py-4 text-sm font-bold text-[#131a33] transition-all duration-300 hover:bg-[#131a33] hover:text-white sm:w-auto"
                  href="#features"
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    play_circle
                  </span>
                  View Demo
                </a>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <HeroVisual />
            </div>
          </div>
        </section>

        <section className="relative z-10 bg-[var(--surface)] py-24" id="features">
          <div className="mx-auto max-w-[1280px] px-5 md:px-10">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#131a33]">
                Pure Layout Bliss
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-6 text-[var(--muted)]">
                Everything you need to build the perfect showcase, powered by intelligent
                automation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {valueCards.map((card) => (
                <article
                  className="landing-glass-card landing-glow-card group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl p-6"
                  key={card.title}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${card.tone}`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
                      {card.icon}
                    </span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-[#131a33]">{card.title}</h3>
                  <p className="flex-grow text-sm leading-6 text-[var(--muted)]">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[var(--surface)] py-24">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-32 px-5 md:px-10">
            {featureRows.map((row) => (
              <article
                className="parallax-section is-visible group flex flex-col items-center gap-12 lg:gap-24 md:flex-row"
                key={row.title}
              >
                <div
                  className={`order-2 flex w-full flex-col gap-6 md:w-1/2 ${
                    row.reverse ? "md:order-2" : "md:order-1"
                  }`}
                >
                  <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#131a33]">
                    {row.title}
                  </h2>
                  <p className="text-lg leading-7 text-[var(--muted)]">{row.body}</p>
                </div>
                <div
                  className={`order-1 w-full md:w-1/2 ${
                    row.reverse ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <FeatureVisual row={row} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden bg-[var(--surface)] py-24">
          <div className="mx-auto mb-12 max-w-[1280px] px-5 text-center md:px-10">
            <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#131a33]">
              Built for Top Creators
            </h2>
          </div>
          <CreatorCarousel />
        </section>

        <section
          className="relative overflow-hidden bg-gradient-to-b from-[#0b132b] to-black py-32 text-white"
          id="pricing"
        >
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 text-center">
            <h2 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em]">
              Are you still wasting your hard-earned traffic?
            </h2>
            <p className="text-lg leading-7 text-gray-300">
              Turn your link-in-bio into a 24/7 automated monetization engine in just 60
              seconds.
            </p>
            <PrimaryCta className="ripple-btn mt-4 rounded-full bg-none bg-[#00e5ff] px-10 py-5 text-lg text-[#0b132b] shadow-[0_0_20px_rgba(0,229,255,0.6)] hover:bg-[#b3fbff] hover:shadow-[0_0_40px_rgba(0,229,255,1)]">
              <span className="relative z-10 flex items-center gap-2">
                Claim Your Visual Shelf Now
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined transition-transform group-hover:translate-x-1"
                >
                  arrow_forward
                </span>
              </span>
            </PrimaryCta>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
