/* eslint-disable @next/next/no-img-element -- Landing carousel art is localized from Stitch source imagery for visual QA. */

import stitchAssetManifest from "../../../public/stitch/asset-manifest.json";

const stitchAssets = stitchAssetManifest as Record<string, string>;

const creatorImageSources = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB2JGRNjdtUdJYE1jioJ4FEjQHunrTvQDwLqQaPfENWZKdslWlgYIllps7UMcutxVU_B0En3pchvOWSBlgcuGQCcPn279l6-yUo0KvP94vKBPNLU2nmukUsDSJkUa_DgC9Zwihv72UobkjUlRZ8DHJJEr2A3BM3ufS1XBjVDtQJn66s-Q1fEu-4PcbWWSZeTybf8Q-qdqns3kVmH5zA37Iiq4M2J_nBE3bIa6jXapWP4vDirz89V7B037FP9TMIG6_aumvuSoGOxGc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHtDEGd2Bi_i5NPvcu-eujkYfDzsjUtRHCF2hwnPB5o28TQ9Dj_yTqY9i7i-8qSpAiG05HiSMxIHXgo8rkE4gK34sbNhBzMPF86APAsbIah-4ll-T4M_vGOXPaYQlSPwDp2C3UqS-PM45TRYhctWk4AVArbCFyEhUqwvJM9xUm0ICHCWvsKdku1bojtqjCm709YMW1J7ZUuO4twfk4V8md2FLYYFrxHV5PZaRyKAQPD-7Sf2SeGmbmdNGPRENcYWbeovFfqapiTbg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD88AQBGMePK3hvU3OU2ih09jCORhIP0wxqYWNYS8oU64ojRP--MrLaR8hdUZTu0Gm-DUASJjEnow7URKpC6qYWHbeZYiTUzCEs3rSeKJ-5yL-Pe51K8olHoESAS7-DINz0Hsxn8KgI86TOXG4jnZRfidycgp0DTLbD2Ri6zAUxddw2bqCIz-GgRiTsoO0XKzZCiBp-qQiUpmFtvI3Lsxn7R5VNENJfZ1Fy0LR3RsjrTISjZQ3rrhxZqpYkX5AXy7G6ok5B-COymoM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvzI6IFS5uh-TgJxfMHqQSN6zYsRpjid9xTPMuZM4gL21TO-1JT4uKsJ_IN4vNTz2djcxsRLCrfDd52V_ZTHYqt4aTF7ko9sfTwcIHAuvj5kyO2on-W5U3CYkW4DC3_KF0ceD6mtCRuaXNxuIgDBPT132eOsfEKfxo6EsgqNCDQQU7liI7wISmf18yOQhYmYvCaB6irq78Z8RojCqQBENZgksOhsvu9xpvrfWmyV0PieqSgTe8xhtcIFqlZwtMlv1BqB7tdh2h6vE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHtDEGd2Bi_i5NPvcu-eujkYfDzsjUtRHCF2hwnPB5o28TQ9Dj_yTqY9i7i-8qSpAiG05HiSMxIHXgo8rkE4gK34sbNhBzMPF86APAsbIah-4ll-T4M_vGOXPaYQlSPwDp2C3UqS-PM45TRYhctWk4AVArbCFyEhUqwvJM9xUm0ICHCWvsKdku1bojtqjCm709YMW1J7ZUuO4twfk4V8md2FLYYFrxHV5PZaRyKAQPD-7Sf2SeGmbmdNGPRENcYWbeovFfqapiTbg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD88AQBGMePK3hvU3OU2ih09jCORhIP0wxqYWNYS8oU64ojRP--MrLaR8hdUZTu0Gm-DUASJjEnow7URKpC6qYWHbeZYiTUzCEs3rSeKJ-5yL-Pe51K8olHoESAS7-DINz0Hsxn8KgI86TOXG4jnZRfidycgp0DTLbD2Ri6zAUxddw2bqCIz-GgRiTsoO0XKzZCiBp-qQiUpmFtvI3Lsxn7R5VNENJfZ1Fy0LR3RsjrTISjZQ3rrhxZqpYkX5AXy7G6ok5B-COymoM",
] as const;

const creatorImages = creatorImageSources.map((source) => stitchAssets[source] ?? source);

export function CreatorCarousel() {
  const loop = [...creatorImages, ...creatorImages];

  return (
    <div
      aria-label="Creator examples carousel"
      className="landing-carousel relative py-8"
      role="region"
      tabIndex={0}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[var(--surface)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[var(--surface)] to-transparent" />
      <div className="landing-carousel-track">
        {loop.map((src, index) => {
          const isDuplicate = index >= creatorImages.length;
          const showcaseNumber = (index % creatorImages.length) + 1;

          return (
            <figure
              aria-hidden={isDuplicate ? true : undefined}
              className="landing-carousel-item group relative cursor-pointer border border-[#c6c6ce]/20"
              key={`${src}-${index}`}
            >
              <img
                alt={isDuplicate ? "" : `Creator LinkShelf visual showcase ${showcaseNumber}`}
                className="h-full w-full object-cover"
                loading={index < creatorImages.length ? "eager" : "lazy"}
                src={src}
              />
            </figure>
          );
        })}
      </div>
    </div>
  );
}
