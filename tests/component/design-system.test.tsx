import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";

describe("design system", () => {
  it("renders the brand and an accessible primary action", () => {
    render(<><BrandMark /><Button>Start Your Shelf</Button></>);
    expect(screen.getByText("LinkShelf")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Your Shelf" })).toHaveAttribute("data-variant", "primary");
  });
});
