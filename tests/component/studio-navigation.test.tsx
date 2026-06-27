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
    expect(screen.getByText("Creator Management")).toBeVisible();
    expect(screen.getByRole("link", { name: /create new shelf/i })).toHaveAttribute(
      "href",
      "/studio/create",
    );
    expect(screen.getByText("Alex Rivera")).toBeVisible();
    expect(screen.getByText("Pro Plan")).toBeVisible();
  });

  it("renders the create shelf workflow as a full-canvas editor without the sidebar", () => {
    currentPathname = "/studio/create";

    render(
      <StudioShell
        creator={{
          displayName: "Liam Roberts",
          handle: "liamroberts.photo",
        }}
      >
        <h1>Create Shelf</h1>
      </StudioShell>,
    );

    expect(screen.getByRole("heading", { name: "Create Shelf" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: /studio/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Creator Management")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create new shelf/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Alex Rivera")).not.toBeInTheDocument();
  });
});
