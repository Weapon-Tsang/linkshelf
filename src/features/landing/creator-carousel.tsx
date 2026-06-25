/* eslint-disable @next/next/no-img-element -- Stitch assets are external until network-localization is available. */

const creatorImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB2JGRNjdtUdJYE1jioJ4FEjQHunrTvQDwLqQaPfENWZKdslWlgYIllps7UMcutxVU_B0En3pchvOWSBlgcuGQCcPn279l6-yUo0KvP94vKBPNLU2nmukUsDSJkUa_DgC9Zwihv72UobkjUlRZ8DHJJEr2A3BM3ufS1XBjVDtQJn66s-Q1fEu-4PcbWWSZeTybf8Q-qdqns3kVmH5zA37Iiq4M2J_nBE3bIa6jXapWP4vDirz89V7B037FP9TMIG6_aumvuSoGOxGc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHtDEGd2Bi_i5NPvcu-eujkYfDzsjUtRHCF2hwnPB5o28TQ9Dj_yTqY9i7i-8qSpAiG05HiSMxIHXgo8rkE4gK34sbNhBzMPF86APAsbIah-4ll-T4M_vGOXPaYQlSPwDp2C3UqS-PM45TRYhctWk4AVArbCFyEhUqwvJM9xUm0ICHCWvsKdku1bojtqjCm709YMW1J7ZUuO4twfk4V8md2FLYYFrxHV5PZaRyKAQPD-7Sf2SeGmbmdNGPRENcYWbeovFfqapiTbg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD88AQBGMePK3hvU3OU2ih09jCORhIP0wxqYWNYS8oU64ojRP--MrLaR8hdUZTu0Gm-DUASJjEnow7URKpC6qYWHbeZYiTUzCEs3rSeKJ-5yL-Pe51K8olHoESAS7-DINz0Hsxn8KgI86TOXG4jnZRfidycgp0DTLbD2Ri6zAUxddw2bqCIz-GgRiTsoO0XKzZCiBp-qQiUpmFtvI3Lsxn7R5VNENJfZ1Fy0LR3RsjrTISjZQ3rrhxZqpYkX5AXy7G6ok5B-COymoM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvzI6IFS5uh-TgJxfMHqQSN6zYsRpjid9xTPMuZM4gL21TO-1JT4uKsJ_IN4vNTz2djcxsRLCrfDd52V_ZTHYqt4aTF7ko9sfTwcIHAuvj5kyO2on-W5U3CYkW4DC3_KF0ceD6mtCRuaXNxuIgDBPT132eOsfEKfxo6EsgqNCDQQU7liI7wISmf18yOQhYmYvCaB6irq78Z8RojCqQBENZgksOhsvu9xpvrfWmyV0PieqSgTe8xhtcIFqlZwtMlv1BqB7tdh2h6vE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHtDEGd2Bi_i5NPvcu-eujkYfDzsjUtRHCF2hwnPB5o28TQ9Dj_yTqY9i7i-8qSpAiG05HiSMxIHXgo8rkE4gK34sbNhBzMPF86APAsbIah-4ll-T4M_vGOXPaYQlSPwDp2C3UqS-PM45TRYhctWk4AVArbCFyEhUqwvJM9xUm0ICHCWvsKdku1bojtqjCm709YMW1J7ZUuO4twfk4V8md2FLYYFrxHV5PZaRyKAQPD-7Sf2SeGmbmdNGPRENcYWbeovFfqapiTbg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD88AQBGMePK3hvU3OU2ih09jCORhIP0wxqYWNYS8oU64ojRP--MrLaR8hdUZTu0Gm-DUASJjEnow7URKpC6qYWHbeZYiTUzCEs3rSeKJ-5yL-Pe51K8olHoESAS7-DINz0Hsxn8KgI86TOXG4jnZRfidycgp0DTLbD2Ri6zAUxddw2bqCIz-GgRiTsoO0XKzZCiBp-qQiUpmFtvI3Lsxn7R5VNENJfZ1Fy0LR3RsjrTISjZQ3rrhxZqpYkX5AXy7G6ok5B-COymoM",
] as const;

export function CreatorCarousel() {
  const loop = [...creatorImages, ...creatorImages];

  return (
    <div
      aria-label="Creator examples"
      className="landing-carousel relative py-8"
      tabIndex={0}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent md:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent md:w-32" />
      <div className="landing-carousel-track">
        {loop.map((src, index) => (
          <figure
            className="landing-carousel-item border border-[#c6c6ce]/20 bg-white shadow-sm"
            key={`${src}-${index}`}
          >
            <img
              alt={`Creator LinkShelf visual showcase ${(index % creatorImages.length) + 1}`}
              className="h-full w-full object-cover"
              loading={index < creatorImages.length ? "eager" : "lazy"}
              src={src}
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
