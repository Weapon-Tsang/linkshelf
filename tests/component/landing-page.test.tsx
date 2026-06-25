import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "@/features/landing/landing-page";

describe("LandingPage", () => {
  it("routes every primary CTA to creator Google login", () => {
    render(<LandingPage />);

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
    expect(screen.getAllByRole("link", { name: "Get Started" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Claim Your Visual Shelf Now" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fstudio%2Fdashboard",
    );
  });
});
