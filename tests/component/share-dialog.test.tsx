import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FanAuthDialog } from "@/features/engagement/fan-auth-dialog";
import { SaveButton } from "@/features/engagement/save-button";
import { ShareDialog, ShareToEarnButton } from "@/features/engagement/share-dialog";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ShareDialog", () => {
  it("renders only enabled creator channels", () => {
    render(
      <ShareDialog
        channels={[
          { type: "X", enabled: true },
          { type: "WHATSAPP", enabled: false },
        ]}
        onClose={() => undefined}
        open
        shelfId="shelf-photo"
        shortUrl="https://link.sh/s/demo"
      />,
    );

    expect(screen.getByRole("button", { name: "Share on X" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Share on WhatsApp" })).toBeNull();
    expect(screen.getByText("80% fan / 20% creator")).toBeVisible();
  });

  it("copies the unique link and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });

    render(
      <ShareDialog
        channels={[{ type: "COPY", enabled: true }]}
        onClose={() => undefined}
        open
        shelfId="shelf-photo"
        shortUrl="https://link.sh/s/demo"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Copy Link" }));

    expect(writeText).toHaveBeenCalledWith("https://link.sh/s/demo");
    expect(screen.getByText("Link copied")).toBeVisible();
  });

  it("notifies the selected enabled share channel", async () => {
    const onChannelSelect = vi.fn();

    render(
      <ShareDialog
        channels={[{ type: "X", enabled: true }]}
        onChannelSelect={onChannelSelect}
        onClose={() => undefined}
        open
        shelfId="shelf-photo"
        shortUrl="https://link.sh/s/demo"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Share on X" }));

    expect(onChannelSelect).toHaveBeenCalledWith("X");
  });
});

describe("FanAuthDialog", () => {
  it("offers Google-only fan authentication with a resumable return URL", () => {
    render(
      <FanAuthDialog
        onClose={() => undefined}
        open
        pendingAction="share"
        returnTo="/liamroberts.photo/photography-kit"
      />,
    );

    const form = screen.getByRole("button", { name: "Continue with Google" }).closest("form");

    expect(screen.getByRole("dialog", { name: "Fan Authentication" })).toBeVisible();
    expect(form).toHaveAttribute("action", "/api/auth/google");
    expect(form?.querySelector('input[name="role"]')).toHaveValue("fan");
    expect(form?.querySelector('input[name="returnTo"]')).toHaveValue(
      "/liamroberts.photo/photography-kit?resume=share",
    );
    expect(screen.queryByText(/github|continue with x/i)).not.toBeInTheDocument();
  });

  it("renders the overlay outside the trigger container so page overflow cannot clip it", () => {
    const { container } = render(
      <div className="overflow-hidden">
        <FanAuthDialog
          onClose={() => undefined}
          open
          pendingAction="share"
          returnTo="/liamroberts.photo/photography-kit"
        />
      </div>,
    );

    const dialog = screen.getByRole("dialog", { name: "Fan Authentication" });

    expect(container.contains(dialog)).toBe(false);
    expect(document.body).toContainElement(dialog);
  });
});

describe("ShareToEarnButton", () => {
  it("opens fan auth with a share resume action", async () => {
    render(
      <ShareToEarnButton returnTo="/liamroberts.photo/photography-kit">
        Share to earn
      </ShareToEarnButton>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Share to earn" }));

    expect(screen.getByRole("dialog", { name: "Fan Authentication" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue with Google" }).closest("form")?.querySelector(
      'input[name="returnTo"]',
    )).toHaveValue("/liamroberts.photo/photography-kit?resume=share");
  });
});

describe("SaveButton", () => {
  it("opens and closes fan auth for anonymous saves without leaving the pending action visible", async () => {
    render(
      <SaveButton
        isSaved={false}
        returnTo="/liamroberts.photo/photography-kit"
        targetId="shelf-photography"
        targetType="SHELF"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save shelf" }));
    expect(screen.getByRole("dialog", { name: "Fan Authentication" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue with Google" }).closest("form")?.querySelector(
      'input[name="returnTo"]',
    )).toHaveValue("/liamroberts.photo/photography-kit?resume=save");

    await userEvent.click(screen.getByRole("button", { name: "Close fan authentication" }));
    expect(screen.queryByRole("dialog", { name: "Fan Authentication" })).not.toBeInTheDocument();
  });
});
