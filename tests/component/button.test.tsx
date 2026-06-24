import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("supports each visual variant and forwards its ref", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button ref={ref} variant="danger">Delete</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Secondary" })).toHaveAttribute("data-variant", "secondary");
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveAttribute("data-variant", "ghost");
    expect(ref.current).toBe(screen.getByRole("button", { name: "Delete" }));
    expect(ref.current).toHaveAttribute("data-variant", "danger");
    expect(ref.current).toHaveClass("focus-visible:outline-[var(--teal-700)]");
  });
});
