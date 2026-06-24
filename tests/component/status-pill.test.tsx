import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusPill } from "@/components/ui/status-pill";

describe("StatusPill", () => {
  it("renders the visible label for every supported status", () => {
    render(
      <>
        <StatusPill status="published" />
        <StatusPill status="draft" />
        <StatusPill status="pending" />
        <StatusPill status="approved" />
        <StatusPill status="rejected" />
        <StatusPill status="active" />
      </>,
    );

    for (const label of ["Published", "Draft", "Pending", "Approved", "Rejected", "Active"]) {
      expect(screen.getByText(label)).toBeVisible();
    }
  });
});
