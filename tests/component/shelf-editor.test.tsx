import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudioCreateShelfPage from "@/app/studio/create/page";
import { ShelfEditor } from "@/features/studio/shelf-editor";

afterEach(() => cleanup());

const STITCH_CREATE_FLAT_LAY_URL = "/stitch/assets/create-shelf-flat-lay.png";
const STITCH_CREATE_SHELF_URL_PREFIX = "linkshelf.page/liam/";

describe("ShelfEditor", () => {
  it("opens the create page with Stitch-like photography demo content", () => {
    const { container } = render(<StudioCreateShelfPage />);

    const shelfTitle = screen.getByRole("textbox", { name: "Shelf title" });
    const category = screen.getByRole("textbox", { name: "Category" });
    const shelfUrl = screen.getByRole("textbox", { name: "Shelf URL" });
    const description = screen.getByRole("textbox", { name: "Description" });
    const originalContentUrl = screen.getByRole("textbox", {
      name: "Original Content URL",
    });

    expect(shelfTitle).toHaveValue("Photography Kit");
    expect(shelfUrl).toHaveValue("photography-kit");
    expect(category).toHaveValue("Tech Pro");
    expect(screen.getByText(STITCH_CREATE_SHELF_URL_PREFIX)).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy shelf URL" })).toBeVisible();
    const payload = JSON.parse(
      container.querySelector<HTMLInputElement>('input[name="payload"]')?.value ?? "{}",
    ) as { readonly slug?: string };
    expect(payload.slug).toBe("photography-kit");
    expect(shelfTitle.compareDocumentPosition(category)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(category.compareDocumentPosition(shelfUrl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(shelfUrl.compareDocumentPosition(description)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(description.compareDocumentPosition(originalContentUrl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const shelfDetails = screen.getByRole("region", { name: "Shelf Details" });
    expect(
      within(shelfDetails).queryByRole("combobox", { name: "Theme" }),
    ).not.toBeInTheDocument();
    expect(description).toHaveValue("My go-to gear for professional shoots and travel vlogs.");
    expect(
      screen.queryByRole("textbox", { name: "Cover image URL" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("workbench-cover")).toHaveClass("aspect-square");
    expect(screen.getByTestId("workbench-cover")).toHaveAttribute(
      "src",
      STITCH_CREATE_FLAT_LAY_URL,
    );
    expect(screen.getByText("Detected Items (3)")).toBeVisible();
    const productCards = screen.getAllByRole("group", { name: /product/i });
    expect(productCards).toHaveLength(3);
    expect(productCards.every((card) => card.getAttribute("data-density") === "compact")).toBe(
      true,
    );
    expect(
      within(productCards[0]).getByRole("textbox", { name: "ITEM NAME" }),
    ).toHaveValue("Sony A7IV Mirrorless Camera");
    expect(within(productCards[0]).queryByText(/Product 1/)).not.toBeInTheDocument();
    expect(within(productCards[0]).getByLabelText("Drag product handle")).toBeVisible();
    expect(within(productCards[0]).getByRole("button", { name: "Remove product" })).toBeVisible();
    expect(within(productCards[0]).queryByRole("button", { name: "Move product up" })).toBeNull();
    expect(
      within(productCards[0]).queryByRole("button", { name: "Move product down" }),
    ).toBeNull();
    expect(
      within(productCards[0])
        .getByRole("textbox", { name: "ITEM NAME" })
        .compareDocumentPosition(
          within(productCards[0]).getByRole("textbox", { name: "Product URL" }),
        ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(productCards[0]).queryByRole("button", { name: "Fetch metadata" })).toBeNull();
    expect(within(productCards[0]).queryByRole("textbox", { name: "Merchant" })).toBeNull();
    expect(within(productCards[0]).queryByRole("spinbutton", { name: "Price" })).toBeNull();
    expect(within(productCards[0]).getByText("Amazon")).toBeVisible();
    expect(within(productCards[0]).getByText("$2,498.00")).toBeVisible();
    expect(within(productCards[0]).queryByLabelText("Image URL")).not.toBeInTheDocument();
    expect(
      within(productCards[0]).queryByLabelText("Product description"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Sony A7IV Mirrorless Camera").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sony FE 24-70mm f/2.8 GM II").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Peak Design Carbon Tripod").length).toBeGreaterThan(0);
    const shelfPreview = screen.getByRole("region", { name: "Shelf Preview" });
    expect(within(shelfPreview).getByRole("combobox", { name: "Theme" })).toHaveValue(
      "tech",
    );
  });

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
    expect(screen.getByRole("textbox", { name: "Shelf URL" })).toHaveValue(
      "photography-kit",
    );
    expect(screen.getByRole("combobox", { name: "Theme" })).toHaveValue("tech");
    expect(screen.getByRole("button", { name: "Mobile preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("heading", { name: "AI Link Workbench" })).toBeVisible();
    expect(screen.getByText("Auto-Detect Active")).toBeVisible();
    expect(screen.getByText("Detected Items (1)")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Shelf Preview" })).toBeVisible();
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
