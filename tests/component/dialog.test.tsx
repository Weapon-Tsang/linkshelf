import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

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
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
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
});
