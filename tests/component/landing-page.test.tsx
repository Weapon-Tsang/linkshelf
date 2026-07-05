import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingPage } from "@/features/landing/landing-page";

afterEach(() => cleanup());

describe("LandingPage", () => {
  it("routes every primary CTA to creator Google login", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Stop Killing Your Conversions with Trashy Text Links!",
      }),
    ).toBeVisible();

    const links = screen.getAllByRole("link", {
      name: /start your shelf|get started|claim your visual shelf/i,
    });

    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(
      links.every(
        (link) => link.getAttribute("href") === "/login?returnTo=%2Fstudio%2Fdashboard",
      ),
    ).toBe(true);

    expect(screen.getByRole("link", { name: "Start Your Shelf" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fstudio%2Fdashboard",
    );
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "#features");
    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fstudio%2Fdashboard",
    );
    expect(screen.getAllByRole("link", { name: "Get Started" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Claim Your Visual Shelf Now" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fstudio%2Fdashboard",
    );
  });

  it("uses the Stitch nav offset for the landing canvas", () => {
    render(<LandingPage />);

    expect(document.querySelector("main")).toHaveClass("pt-24");
  });

  it("uses Stitch nav motion affordances", () => {
    render(<LandingPage />);

    const nav = document.querySelector("nav");
    const featuresLink = screen.getByRole("link", { name: "Features" });
    const pricingLink = screen.getByRole("link", { name: "Pricing" });
    const getStartedLink = screen.getAllByRole("link", { name: "Get Started" })[0];

    expect(nav).toHaveClass("w-full", "transition-all", "duration-300");
    expect(featuresLink).toHaveClass("duration-300", "active:scale-95");
    expect(pricingLink).toHaveClass("duration-300", "active:scale-95", "hover:opacity-80");
    expect(getStartedLink).toHaveClass("active:scale-95");
  });

  it("uses the Stitch filled dataset brand mark", () => {
    render(<LandingPage />);

    const brandIcon = document.querySelector<HTMLElement>(
      'nav [aria-label="LinkShelf"] .material-symbols-outlined',
    );

    expect(brandIcon).toHaveClass("text-[32px]");
    expect(brandIcon).toHaveStyle({ fontVariationSettings: '"FILL" 1' });
  });

  it("uses Stitch hero CTA motion affordances", () => {
    render(<LandingPage />);

    const primaryCta = screen.getByRole("link", { name: "Start Your Shelf" });
    const demoCta = screen.getByRole("link", { name: "View Demo" });
    const landingCss = readFileSync("src/app/globals.css", "utf8");

    expect(primaryCta).toHaveClass(
      "magnetic-inner",
      "shadow-[0_0_15px_rgba(0,191,174,0.5)]",
      "hover:shadow-[0_0_25px_rgba(0,191,174,0.7)]",
      "duration-300",
    );
    expect(primaryCta.parentElement).toHaveAttribute("id", "cta-magnetic");
    expect(primaryCta.parentElement).toHaveClass("magnetic-wrap");
    expect(primaryCta.parentElement?.parentElement).toHaveClass(
      "justify-center",
      "lg:justify-start",
    );
    expect(demoCta).toHaveClass("transition-all", "duration-300");
    expect(landingCss).toContain("transition: transform 100ms ease-out;");
  });

  it("renders the creator carousel from localized Stitch assets", () => {
    render(<LandingPage />);

    const carouselImages = Array.from(
      document.querySelectorAll<HTMLImageElement>(".landing-carousel-item img"),
    );

    expect(carouselImages).toHaveLength(12);
    expect(carouselImages.map((image) => image.getAttribute("src"))).toEqual([
      "/stitch/assets/f0e863ee5aae279a26d40eaa6630755cd4ef31e601802406b31b7b842dd143f4.png",
      "/stitch/assets/75f8f60659d03df0502cc2b3265f0890524b6b561b57e1b35f4450b9590224ea.png",
      "/stitch/assets/fdeee525d80c5bca83a50ed48c30522a63314171d49527b921c6505188d3e62e.png",
      "/stitch/assets/9d6f53a22bd32efb78b22c09833e237b05ed512c36381eef31ca0a298a539fb6.png",
      "/stitch/assets/75f8f60659d03df0502cc2b3265f0890524b6b561b57e1b35f4450b9590224ea.png",
      "/stitch/assets/fdeee525d80c5bca83a50ed48c30522a63314171d49527b921c6505188d3e62e.png",
      "/stitch/assets/f0e863ee5aae279a26d40eaa6630755cd4ef31e601802406b31b7b842dd143f4.png",
      "/stitch/assets/75f8f60659d03df0502cc2b3265f0890524b6b561b57e1b35f4450b9590224ea.png",
      "/stitch/assets/fdeee525d80c5bca83a50ed48c30522a63314171d49527b921c6505188d3e62e.png",
      "/stitch/assets/9d6f53a22bd32efb78b22c09833e237b05ed512c36381eef31ca0a298a539fb6.png",
      "/stitch/assets/75f8f60659d03df0502cc2b3265f0890524b6b561b57e1b35f4450b9590224ea.png",
      "/stitch/assets/fdeee525d80c5bca83a50ed48c30522a63314171d49527b921c6505188d3e62e.png",
    ]);
  });

  it("uses the Stitch creator carousel chrome treatment", () => {
    render(<LandingPage />);

    const carousel = screen.getByRole("region", { name: "Creator examples carousel" });
    const fadeEdges = carousel.querySelectorAll(":scope > div.pointer-events-none");
    const firstItem = carousel.querySelector("figure");

    expect(carousel).toHaveClass("relative", "py-8");
    expect(fadeEdges).toHaveLength(2);
    expect(fadeEdges[0]).toHaveClass(
      "w-32",
      "bg-gradient-to-r",
      "from-[var(--surface)]",
      "pointer-events-none",
    );
    expect(fadeEdges[1]).toHaveClass(
      "w-32",
      "bg-gradient-to-l",
      "from-[var(--surface)]",
      "pointer-events-none",
    );
    expect(fadeEdges[0]).not.toHaveClass("from-white");
    expect(fadeEdges[1]).not.toHaveClass("from-white");
    expect(firstItem).toHaveClass("relative", "group", "cursor-pointer", "border");
    expect(firstItem).not.toHaveClass("bg-white", "shadow-sm");
  });

  it("uses the Stitch creator carousel motion timing", () => {
    const landingCss = readFileSync("src/app/globals.css", "utf8");

    expect(landingCss).toContain("animation: landing-scroll 30s linear infinite;");
    expect(landingCss).toContain("transition: transform 500ms cubic-bezier(0.25, 1, 0.5, 1);");
  });

  it("uses the Stitch creator carousel item box treatment", () => {
    const landingCss = readFileSync("src/app/globals.css", "utf8");

    expect(landingCss).toContain("display: inline-block;");
    expect(landingCss).toContain("margin: 0;");
    expect(landingCss).toContain("padding: 0;");
    expect(landingCss).toContain("z-index: 10;");
  });

  it("matches the Stitch footer copyright copy", () => {
    render(<LandingPage />);

    expect(
      screen.getAllByText("© 2024 LinkShelf Inc. All rights reserved.")[0],
    ).toBeVisible();
  });

  it("uses the Stitch footer spacing treatment", () => {
    render(<LandingPage />);

    const footer = screen.getAllByRole("contentinfo")[0];
    const footerInner = footer.firstElementChild;
    const privacyLink = screen.getAllByRole("link", { name: "Privacy Policy" })[0];
    const linkGroup = privacyLink.parentElement;

    expect(footer).toHaveClass("w-full", "transition-all", "ease-in-out");
    expect(footerInner).toHaveClass("gap-6");
    expect(linkGroup).toHaveClass("gap-6");
    expect(privacyLink).toHaveClass("duration-200");
  });

  it("uses the Stitch hero height proportion", () => {
    render(<LandingPage />);

    const heading = screen.getAllByRole("heading", {
      name: "Stop Killing Your Conversions with Trashy Text Links!",
    })[0];

    expect(heading.closest("section")).toHaveClass("min-h-[921px]");
  });

  it("uses the Stitch hero copy column spacing", () => {
    render(<LandingPage />);

    const eyebrow = screen.getByText("The new standard for creators").parentElement;
    const heading = screen.getAllByRole("heading", {
      name: "Stop Killing Your Conversions with Trashy Text Links!",
    })[0];
    const copyColumn = heading.parentElement;

    expect(copyColumn).toHaveClass("pt-12", "lg:pt-0");
    expect(eyebrow).toHaveClass("w-fit", "mx-auto", "lg:mx-0");
  });

  it("uses the Stitch label-sm typography for the hero eyebrow", () => {
    render(<LandingPage />);

    const eyebrowLabel = screen.getByText("The new standard for creators");

    expect(eyebrowLabel).toHaveClass("text-xs", "leading-4", "font-semibold");
  });

  it("uses the Stitch hero headline reveal hook", () => {
    render(<LandingPage />);

    const heading = screen.getAllByRole("heading", {
      name: "Stop Killing Your Conversions with Trashy Text Links!",
    })[0];

    expect(heading).toHaveAttribute("id", "hero-headline");
    expect(heading).toHaveClass("reveal-text");
  });

  it("uses the Stitch hero headline-xl typography", () => {
    render(<LandingPage />);

    const heading = screen.getAllByRole("heading", {
      name: "Stop Killing Your Conversions with Trashy Text Links!",
    })[0];

    expect(heading).toHaveClass(
      "text-[32px]",
      "leading-[38px]",
      "tracking-normal",
      "md:text-[40px]",
      "md:leading-[48px]",
      "md:tracking-[-0.02em]",
    );
    expect(heading).not.toHaveClass("text-4xl", "md:text-6xl", "tracking-[-0.03em]");
  });

  it("uses the Stitch hero headline reveal timing", () => {
    const landingCss = readFileSync("src/app/globals.css", "utf8");

    expect(landingCss).toContain(".reveal-text span");
    expect(landingCss).toContain("transform: translateY(20px);");
    expect(landingCss).toContain("animation: reveal 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;");
    expect(landingCss).toContain("@keyframes reveal");
  });

  it("uses the Stitch hero visual frame height", () => {
    render(<LandingPage />);

    const visualFrame = document.querySelector("canvas")?.parentElement;

    expect(visualFrame).toHaveClass("h-[500px]", "lg:h-[600px]");
  });

  it("uses the Stitch Lumina Aurora shader coefficients", () => {
    const heroVisual = readFileSync("src/features/landing/hero-visual.tsx", "utf8");

    expect(heroVisual).toContain("sin(uv.x * 2.0 + u_time * 0.4)");
    expect(heroVisual).toContain("cos(uv.y * 1.5 - u_time * 0.2)");
    expect(heroVisual).toContain("sin(uv.y * 3.0 + u_time * 0.15) * 0.5");
    expect(heroVisual).toContain("clamp(wave * 0.4 + 0.3, 0.0, 1.0)");
    expect(heroVisual).toContain(
      "clamp(uv.x * 0.5 + uv.y * 0.5 - 0.7, 0.0, 1.0) * 0.2",
    );
  });

  it("uses Stitch surface backgrounds for the feature and carousel bands", () => {
    render(<LandingPage />);

    const featuresHeading = screen.getAllByRole("heading", { name: "Pure Layout Bliss" })[0];
    const carouselHeading = screen.getByRole("heading", { name: "Built for Top Creators" });

    expect(featuresHeading.closest("section")).toHaveClass(
      "bg-[var(--surface)]",
      "relative",
      "z-10",
    );
    expect(carouselHeading.closest("section")).toHaveClass("bg-[var(--surface)]");
  });

  it("uses the Stitch headline-lg typography for Landing section headings", () => {
    render(<LandingPage />);

    const featuresHeading = screen.getAllByRole("heading", { name: "Pure Layout Bliss" })[0];
    const supportingHeading = screen.getByRole("heading", {
      name: "Turn Clicks into Affiliate Revenue.",
    });
    const carouselHeading = screen.getByRole("heading", { name: "Built for Top Creators" });

    [featuresHeading, supportingHeading, carouselHeading].forEach((heading) => {
      expect(heading).toHaveClass("text-[32px]", "leading-10", "tracking-[-0.01em]");
      expect(heading).not.toHaveClass("text-4xl", "tracking-[-0.02em]");
    });
  });

  it("uses the Stitch body-md typography for the feature section intro", () => {
    render(<LandingPage />);

    const featureIntro = screen.getByText(
      /Everything you need to build the perfect showcase, powered by intelligent automation\./,
    );

    expect(featureIntro).toHaveClass("text-base", "leading-6");
    expect(featureIntro).not.toHaveClass("leading-7");
  });

  it("uses the Stitch body-lg typography for Landing large body copy", () => {
    render(<LandingPage />);

    const heroBody = screen.getByText(
      /Turn dead URLs into stunning, high-converting visual showcases in seconds\./,
    );
    const supportingBody = screen.getByText(
      /Stop leaving money on the table\. With interactive image hotspots/,
    );
    const finalBody = screen.getByText(
      /Turn your link-in-bio into a 24\/7 automated monetization engine/,
    );

    [heroBody, supportingBody, finalBody].forEach((copy) => {
      expect(copy).toHaveClass("text-lg", "leading-7");
      expect(copy).not.toHaveClass("leading-8");
    });
  });

  it("uses the Stitch hero body copy width alignment", () => {
    render(<LandingPage />);

    const heroBody = screen.getByText(
      /Turn dead URLs into stunning, high-converting visual showcases in seconds\./,
    );

    expect(heroBody).toHaveClass("max-w-2xl", "mx-auto", "lg:mx-0");
  });

  it("uses Stitch mobile visual-first ordering for alternating feature rows", () => {
    render(<LandingPage />);

    const firstFeatureHeading = screen.getAllByRole("heading", {
      name: "Turn Clicks into Affiliate Revenue.",
    })[0];
    const firstFeatureVisual = screen.getAllByRole("img", {
      name: /dashboard interface/,
    })[0].parentElement?.parentElement;

    expect(firstFeatureHeading.parentElement).toHaveClass("order-2", "md:order-1");
    expect(firstFeatureVisual).toHaveClass("order-1", "md:order-2");

    const secondFeatureHeading = screen.getAllByRole("heading", {
      name: "Stop Wasting Time on Multiple Platforms.",
    })[0];
    const secondFeatureVisual = screen.getAllByRole("img", {
      name: /multi-device mockup/,
    })[0].parentElement?.parentElement;

    expect(secondFeatureHeading.parentElement).toHaveClass("order-2", "md:order-2");
    expect(secondFeatureVisual).toHaveClass("order-1", "md:order-1");
  });

  it("uses Stitch parallax reveal hooks for supporting feature rows", () => {
    render(<LandingPage />);

    const firstFeatureHeading = screen.getAllByRole("heading", {
      name: "Turn Clicks into Affiliate Revenue.",
    })[0];
    const featureRows = firstFeatureHeading
      .closest("section")
      ?.querySelectorAll("article");

    expect(featureRows).toHaveLength(4);
    featureRows?.forEach((row) => {
      expect(row).toHaveClass("parallax-section", "is-visible");
    });
  });

  it("uses the Stitch supporting feature band clipping treatment", () => {
    render(<LandingPage />);

    const firstFeatureHeading = screen.getAllByRole("heading", {
      name: "Turn Clicks into Affiliate Revenue.",
    })[0];

    expect(firstFeatureHeading.closest("section")).toHaveClass("relative", "overflow-hidden");
  });

  it("renders supporting feature visuals from localized Stitch assets", () => {
    render(<LandingPage />);

    expect(
      screen
        .getAllByRole("img", {
          name: /dashboard interface/,
        })[0]
        .getAttribute("src"),
    ).toBe("/stitch/assets/db53b977d85f8549e0fdc6f78ffa9fffcb6b6e303329a74433c60f1b391f82fb.png");
    expect(
      screen
        .getAllByRole("img", {
          name: /multi-device mockup/,
        })[0]
      .getAttribute("src"),
    ).toBe("/stitch/assets/ccc6e1799827b3e409fdf140b7c4599c5321f763a9010472c85abfd8a295f088.png");
  });

  it("uses the Stitch supporting feature image alt copy", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("img", {
        name: "A clean, modern dashboard interface showing interactive image hotspots on a premium camera setup.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: "A sleek multi-device mockup showing a unified dashboard syncing a single product link across screens.",
      }),
    ).toBeVisible();
  });

  it("uses the Stitch supporting feature image overlay treatment", () => {
    render(<LandingPage />);

    const featureImage = screen.getAllByRole("img", {
      name: /dashboard interface/,
    })[0];
    const visualFrame = featureImage.parentElement;
    const overlay = visualFrame?.querySelector("div");

    expect(visualFrame).toHaveClass("group");
    expect(overlay).toHaveClass("opacity-20", "group-hover:opacity-40", "transition-opacity");
    expect(overlay).not.toHaveClass("group-hover:opacity-60");
  });

  it("uses the Stitch value-card density treatment", () => {
    render(<LandingPage />);

    const cardHeading = screen.getAllByRole("heading", {
      name: "Instant AI Collection",
    })[0];
    const card = cardHeading.closest("article");
    const iconWrap = card?.querySelector(".material-symbols-outlined")?.parentElement;
    const body = screen.getAllByText(/Stop manual pasting/)[0];

    expect(card).toHaveClass(
      "group",
      "cursor-pointer",
      "relative",
      "overflow-hidden",
      "p-6",
    );
    expect(card).not.toHaveClass("min-h-[240px]");
    expect(iconWrap).toHaveClass("group-hover:scale-110", "transition-transform", "duration-300");
    expect(iconWrap?.querySelector(".material-symbols-outlined")).toHaveClass("text-[28px]");
    expect(body).toHaveClass("flex-grow");
  });

  it("uses the Stitch value-card title typography", () => {
    render(<LandingPage />);

    const cardHeading = screen.getAllByRole("heading", {
      name: "Instant AI Collection",
    })[0];

    expect(cardHeading).toHaveClass("text-[20px]");
    expect(cardHeading).not.toHaveClass("text-xl");
  });

  it("uses the Stitch value-card hover motion timing", () => {
    const landingCss = readFileSync("src/app/globals.css", "utf8");

    expect(landingCss).toContain("transition: all 300ms ease;");
    expect(landingCss).toContain("box-shadow: 0 0 20px rgba(100, 246, 227, 0.4);");
  });

  it("uses the Stitch final CTA motion affordance", () => {
    render(<LandingPage />);

    const finalCta = screen.getAllByRole("link", {
      name: "Claim Your Visual Shelf Now",
    })[0];
    const label = finalCta.querySelector("span");
    const arrow = finalCta.querySelector(".material-symbols-outlined");

    expect(finalCta).toHaveClass("group", "relative", "overflow-hidden");
    expect(finalCta).toHaveClass("ripple-btn");
    expect(finalCta).toHaveClass(
      "shadow-[0_0_20px_rgba(0,229,255,0.6)]",
      "hover:shadow-[0_0_40px_rgba(0,229,255,1)]",
    );
    expect(label).toHaveClass("relative", "z-10");
    expect(arrow).toHaveClass("transition-transform", "group-hover:translate-x-1");
  });

  it("uses the Stitch final CTA sizing treatment", () => {
    render(<LandingPage />);

    const finalCta = screen.getAllByRole("link", {
      name: "Claim Your Visual Shelf Now",
    })[0];

    expect(finalCta).toHaveClass("mt-4", "px-10", "py-5", "text-lg");
  });

  it("uses the Stitch headline-xl typography for the final CTA heading", () => {
    render(<LandingPage />);

    const finalHeading = screen.getByRole("heading", {
      name: "Are you still wasting your hard-earned traffic?",
    });

    expect(finalHeading).toHaveClass(
      "text-[40px]",
      "leading-[48px]",
      "tracking-[-0.02em]",
    );
    expect(finalHeading).not.toHaveClass("md:text-5xl", "tracking-[-0.03em]");
  });

  it("does not add a non-Stitch separator line above the final CTA", () => {
    render(<LandingPage />);

    const finalHeading = screen.getByRole("heading", {
      name: "Are you still wasting your hard-earned traffic?",
    });
    const finalSection = finalHeading.closest("section");

    expect(finalSection?.querySelector(".h-px")).toBeNull();
  });
});
