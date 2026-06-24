import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Dialog } from "@/components/ui/dialog";

function DialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Share shelf">
        <button type="button">Copy link</button>
        <button type="button">Share now</button>
        <button hidden type="button">Hidden action</button>
        <button tabIndex={-1} type="button">Programmatic action</button>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      new DOMRect(0, 0, 100, 40),
    ] as unknown as DOMRectList);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("autofocuses, traps focus, closes on Escape, and restores opener focus", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const opener = screen.getByRole("button", { name: "Open dialog" });
    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Share shelf" });
    const close = screen.getByRole("button", { name: "Close dialog" });
    const firstAction = screen.getByRole("button", { name: "Copy link" });
    const lastAction = screen.getByRole("button", { name: "Share now" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(close).toHaveFocus();

    lastAction.focus();
    await user.tab();
    expect(close).toHaveFocus();

    close.focus();
    await user.tab({ shift: true });
    expect(lastAction).toHaveFocus();

    firstAction.focus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("uses a high-contrast focus outline on the close button", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveClass(
      "focus-visible:outline-[var(--teal-700)]",
    );
  });
});
