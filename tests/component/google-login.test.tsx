import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import AdminSecretPage from "@/app/admin-secret/page";
import ForbiddenPage from "@/app/forbidden/page";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

async function renderSurface(surface: "creator" | "admin") {
  const page =
    surface === "creator"
      ? await LoginPage({ searchParams: Promise.resolve({}) })
      : await AdminSecretPage({ searchParams: Promise.resolve({}) });
  return render(page);
}

describe("Google-only login surfaces", () => {
  it.each(["creator", "admin"] as const)(
    "renders exactly one Google action and no legacy credentials for %s",
    async (surface) => {
      const view = await renderSurface(surface);

      expect(
        within(view.container).getAllByRole("button", {
          name: /continue with google/i,
        }),
      ).toHaveLength(1);
      expect(within(view.container).queryAllByRole("textbox")).toHaveLength(0);
      expect(
        within(view.container).queryByText(
          /password|email address|github|two-factor|2fa/i,
        ),
      ).not.toBeInTheDocument();
      expect(
        within(view.container).queryByRole("button", { name: /github|x|2fa/i }),
      ).not.toBeInTheDocument();
    },
  );

  it("posts only the creator role from ordinary login", async () => {
    await renderSurface("creator");
    const form = screen.getByRole("button", {
      name: /continue with google/i,
    }).closest("form");

    expect(form).toHaveAttribute("action", "/api/auth/google");
    expect(form?.querySelector('input[name="role"]')).toHaveValue("creator");
    expect(form?.querySelector('input[name="entry"]')).toBeNull();
  });

  it("posts a signed admin entry marker from the secret route", async () => {
    await renderSurface("admin");
    const form = screen.getByRole("button", {
      name: /continue with google/i,
    }).closest("form");

    expect(form?.querySelector('input[name="role"]')).toHaveValue("admin");
    expect(
      (form?.querySelector('input[name="entry"]') as HTMLInputElement | null)
        ?.value,
    ).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
    expect(screen.getByText(/authorized administrators only/i)).toBeVisible();
  });

  it("renders in production without local or Google credentials", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("AUTH_GOOGLE_ID", "");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "");

    await expect(renderSurface("admin")).resolves.toBeDefined();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  });

  it("offers neutral recovery links from the forbidden page", () => {
    render(<ForbiddenPage />);
    expect(screen.getByRole("heading", { name: /access denied/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /creator login/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
