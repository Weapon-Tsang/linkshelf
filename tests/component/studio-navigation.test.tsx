import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudioShell } from "@/features/studio/studio-shell";

let currentPathname = "/studio/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

afterEach(() => {
  cleanup();
  currentPathname = "/studio/dashboard";
});

describe("StudioShell navigation", () => {
  it("renders creator workspace navigation with an active-state marker", () => {
    currentPathname = "/studio/shelves";

    render(
      <StudioShell
        creator={{
          displayName: "Liam Roberts",
          handle: "liamroberts.photo",
        }}
      >
        <p>Manage shelves</p>
      </StudioShell>,
    );

    const nav = screen.getByRole("navigation", { name: /studio/i });
    for (const [name, href] of [
      ["Dashboard", "/studio/dashboard"],
      ["Shelves", "/studio/shelves"],
      ["Analytics", "/studio/analytics"],
      ["Comments", "/studio/comments"],
      ["Settings", "/studio/settings"],
    ] as const) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
    }

    const activeLink = within(nav).getByRole("link", { name: "Shelves" });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveAttribute("data-active", "true");
    expect(screen.getByText("Manage shelves")).toBeVisible();
    expect(screen.getByText("@liamroberts.photo")).toBeVisible();
  });
});
