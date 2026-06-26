import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AuthSession } from "@/features/auth/adapter";
import {
  getShelfEditorData,
  publishShelfFromEditor,
  saveShelfDraft,
} from "@/features/shelves/actions";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

const NOW = new Date("2026-06-24T14:00:00.000Z");

const creatorSession: AuthSession = {
  user: {
    id: "user-creator",
    googleSubject: "google-creator",
    email: "creator@linkshelf.local",
    displayName: "Liam Roberts",
    role: "CREATOR",
    avatarUrl: null,
  },
  issuedAt: NOW.getTime(),
  expiresAt: NOW.getTime() + 60_000,
};

describe("shelf editor actions", () => {
  let database: DatabaseSync;
  let idCounter: number;

  beforeEach(() => {
    idCounter = 0;
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
  });

  afterEach(() => {
    database.close();
  });

  function createId(prefix: "shelf" | "product") {
    idCounter += 1;
    return `${prefix}-new-${idCounter}`;
  }

  it("saves drafts while retaining incomplete product links outside publish validation", () => {
    const result = saveShelfDraft(
      database,
      {
        title: "Camera Bag Draft",
        slug: "",
        description: "Ideas before the full kit is ready.",
        category: "Photography",
        theme: "tech",
        coverUrl: "",
        products: [
          {
            destinationUrl: "https://www.amazon.com/dp/B0CAMERA",
          },
        ],
      },
      creatorSession,
      { createId, now: () => NOW },
    );

    expect(result).toEqual({
      ok: true,
      shelfId: "shelf-new-1",
      status: "DRAFT",
    });
    expect(
      getShelfEditorData(database, "shelf-new-1", creatorSession),
    ).toMatchObject({
      ok: true,
      shelf: {
        title: "Camera Bag Draft",
        slug: "camera-bag-draft",
        status: "DRAFT",
        products: [],
      },
    });
  });

  it("requires publish-ready fields and persists valid product order", () => {
    expect(
      publishShelfFromEditor(
        database,
        {
          title: " ",
          slug: "bad",
          description: "Missing title, cover, and products",
          category: "Photography",
          theme: "tech",
          coverUrl: "",
          products: [],
        },
        creatorSession,
      ),
    ).toMatchObject({
      ok: false,
      reason: "VALIDATION_ERROR",
      errors: {
        title: expect.any(String),
        coverUrl: expect.any(String),
        products: expect.any(String),
      },
    });

    const published = publishShelfFromEditor(
      database,
      {
        title: "Camera Bag",
        slug: "camera-bag",
        description: "A complete shooting kit.",
        category: "Photography",
        theme: "tech",
        coverUrl: "https://images.linkshelf.local/cover.jpg",
        products: [
          {
            destinationUrl: "https://www.amazon.com/dp/B0LENS",
            title: "Sony FE 24-70mm f/2.8 GM II",
            description: "Fast standard zoom",
            merchant: "Amazon",
            price: 2298,
            imageUrl: "https://images.linkshelf.local/lens.jpg",
          },
          {
            destinationUrl: "https://www.amazon.com/dp/B0CAMERA",
            title: "Sony A7IV Mirrorless Camera",
            description: "Hybrid camera",
            merchant: "Amazon",
            price: 2498,
            imageUrl: "https://images.linkshelf.local/camera.jpg",
          },
        ],
      },
      creatorSession,
      { createId, now: () => NOW },
    );

    expect(published).toEqual({
      ok: true,
      shelfId: "shelf-new-1",
      status: "PUBLISHED",
    });
    expect(
      getShelfEditorData(database, "shelf-new-1", creatorSession),
    ).toMatchObject({
      ok: true,
      shelf: {
        status: "PUBLISHED",
        products: [
          { title: "Sony FE 24-70mm f/2.8 GM II", sortPosition: 0 },
          { title: "Sony A7IV Mirrorless Camera", sortPosition: 1 },
        ],
      },
    });
  });

  it("updates existing products with click history without deleting restricted rows", () => {
    const existing = getShelfEditorData(database, "shelf-photography", creatorSession);
    expect(existing.ok).toBe(true);
    if (!existing.ok) return;

    expect(() =>
      saveShelfDraft(
        database,
        {
          shelfId: existing.shelf.id,
          title: "Photography Kit Updated",
          slug: existing.shelf.slug,
          description: existing.shelf.description,
          category: existing.shelf.category,
          theme: existing.shelf.theme,
          coverUrl: existing.shelf.coverUrl,
          products: existing.shelf.products.map((product) => ({
            ...product,
            description: `${product.description} Updated.`,
          })),
        },
        creatorSession,
        { now: () => NOW },
      ),
    ).not.toThrow();

    expect(
      getShelfEditorData(database, "shelf-photography", creatorSession),
    ).toMatchObject({
      ok: true,
      shelf: {
        title: "Photography Kit Updated",
        products: [
          { id: "product-sony-a7iv", sortPosition: 0 },
          { id: "product-sony-lens", sortPosition: 1 },
          { id: "product-peak-tripod", sortPosition: 2 },
        ],
      },
    });
  });

  it("rejects publish-ready products that cannot use the affiliate redirect", () => {
    expect(
      publishShelfFromEditor(
        database,
        {
          title: "Broken Merchant",
          slug: "broken-merchant",
          description: "This should not publish.",
          category: "Photography",
          theme: "tech",
          coverUrl: "https://images.linkshelf.local/cover.jpg",
          products: [
            {
              destinationUrl: "https://example.com/product",
              title: "Unsupported product",
              description: "Looks complete but cannot be rewritten.",
              merchant: "Example",
              price: 99,
              imageUrl: "https://images.linkshelf.local/example.jpg",
            },
          ],
        },
        creatorSession,
      ),
    ).toMatchObject({
      ok: false,
      reason: "VALIDATION_ERROR",
      errors: {
        products: expect.any(String),
      },
    });
  });
});
