import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShelfEditor } from "@/features/studio/shelf-editor";

afterEach(() => cleanup());

describe("ShelfEditor", () => {
  it("renders shelf fields, editable metadata, and preview controls", () => {
    render(
      <ShelfEditor
        initialValue={{
          title: "Photography Kit",
          slug: "photography-kit",
          description: "My go-to gear.",
          category: "Photography",
          theme: "tech",
          coverUrl: "https://images.linkshelf.local/cover.jpg",
          sourceContentUrl: "https://youtu.be/demo",
          products: [
            {
              id: "product-camera",
              destinationUrl: "https://www.amazon.com/dp/B0CAMERA",
              title: "Sony A7IV Mirrorless Camera",
              description: "Hybrid camera",
              merchant: "Amazon",
              price: 2498,
              imageUrl: "https://images.linkshelf.local/camera.jpg",
              hotspotX: 55,
              hotspotY: 38,
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Shelf title" })).toHaveValue(
      "Photography Kit",
    );
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue("photography-kit");
    expect(screen.getByRole("combobox", { name: "Theme" })).toHaveValue("tech");
    expect(screen.getByRole("button", { name: "Mobile preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByText("Sony A7IV Mirrorless Camera")[0]).toBeVisible();
  });

  it("adds, removes, reorders, and fills product metadata deterministically", async () => {
    const user = userEvent.setup();
    const extract = vi.fn(async () => ({
      title: "Sony FE 24-70mm f/2.8 GM II",
      description: "Fast standard zoom",
      merchant: "Amazon",
      price: 2298,
      imageUrl: "https://images.linkshelf.local/lens.jpg",
    }));

    render(<ShelfEditor onExtractMetadata={extract} />);

    await user.type(screen.getByRole("textbox", { name: "Shelf title" }), "Camera Bag");
    await user.click(screen.getByRole("button", { name: "Add product" }));

    const products = screen.getAllByRole("group", { name: /product/i });
    expect(products).toHaveLength(2);

    await user.type(
      within(products[1]).getByRole("textbox", { name: "Product URL" }),
      "https://www.amazon.com/dp/B0LENS",
    );
    await user.click(within(products[1]).getByRole("button", { name: "Fetch metadata" }));

    expect(extract).toHaveBeenCalledWith("https://www.amazon.com/dp/B0LENS");
    expect(
      within(products[1]).getByRole("textbox", { name: "Product title" }),
    ).toHaveValue("Sony FE 24-70mm f/2.8 GM II");
    expect(within(products[1]).getByRole("spinbutton", { name: "Price" })).toHaveValue(2298);

    await user.click(within(products[1]).getByRole("button", { name: "Move product up" }));
    expect(screen.getAllByRole("group", { name: /product/i })[0]).toHaveTextContent(
      "Sony FE 24-70mm f/2.8 GM II",
    );

    await user.click(
      within(screen.getAllByRole("group", { name: /product/i })[1]).getByRole("button", {
        name: "Remove product",
      }),
    );
    expect(screen.getAllByRole("group", { name: /product/i })).toHaveLength(1);
  });
});
