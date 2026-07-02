import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getCreatorProfile,
  getPublicShelf,
  validatePublicShareCode,
} from "@/features/shelves/service";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

describe("public shelf queries", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
  });

  afterEach(() => {
    database.close();
  });

  it("returns Liam's creator profile published shelves, enabled channels, and featured products", () => {
    const result = getCreatorProfile(database, "liamroberts.photo");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.profile.creator).toMatchObject({
      handle: "liamroberts.photo",
      displayName: "Liam Roberts",
      bio: "Landscape & travel photographer. I curate and share the professional gear and editing tools I trust in the field.",
      category: "Photography",
    });
    expect(result.profile.creator.avatarUrl).toContain("aida/AP1WRLvvbbxp4lSh");
    expect(result.profile.shelves.map((shelf) => shelf.id)).toEqual([
      "shelf-photography",
      "shelf-travel",
    ]);
    expect(result.profile.shelves.every((shelf) => shelf.status === "PUBLISHED")).toBe(true);
    expect(result.profile.socialChannels.map((channel) => channel.type)).toEqual([
      "X",
      "WHATSAPP",
      "COPY",
    ]);
    expect(result.profile.socialChannels.map((channel) => channel.value)).toEqual([
      "https://instagram.com/liamroberts.photo",
      "https://tiktok.com/@liamroberts.photo",
      "https://youtube.com/@liamrobertsphoto",
    ]);
    expect(result.profile.featuredProducts.map((product) => product.id)).toEqual([
      "product-sony-a7iv",
      "product-sony-lens",
      "product-peak-tripod",
    ]);
    expect(
      result.profile.featuredProducts.map((product) => ({
        title: product.title,
        description: product.description,
        priceCents: product.priceCents,
        merchant: product.merchant,
      })),
    ).toEqual([
      {
        title: "Sony a7 IV Mirrorless Camera",
        description: "33MP full-frame camera with pro performance.",
        priceCents: 249_800,
        merchant: "B&H Photo",
      },
      {
        title: "Sony FE 35mm f/1.4 GM Lens",
        description: "Stunning sharpness and beautiful bokeh.",
        priceCents: 139_800,
        merchant: "B&H Photo",
      },
      {
        title: "Peak Design Travel Tripod",
        description: "Compact, lightweight, and built to travel.",
        priceCents: 34_995,
        merchant: "Peak Design",
      },
    ]);
    expect(JSON.stringify(result.profile)).not.toContain("liamcreator-20");
  });

  it("rejects draft, deleted, missing, and wrong-creator shelves", () => {
    expect(
      getPublicShelf(database, {
        creatorHandle: "liamroberts.photo",
        shelfId: "desk-setup-2024",
      }),
    ).toEqual({
      ok: false,
      reason: "SHELF_NOT_FOUND",
    });

    database
      .prepare("UPDATE shelves SET deleted_at = ? WHERE id = ?")
      .run("2026-06-21T10:00:00.000Z", "shelf-travel");

    expect(
      getPublicShelf(database, {
        creatorHandle: "liamroberts.photo",
        shelfId: "travel-essentials",
      }),
    ).toEqual({
      ok: false,
      reason: "SHELF_NOT_FOUND",
    });
    expect(
      getPublicShelf(database, {
        creatorHandle: "missing.creator",
        shelfId: "photography-kit",
      }),
    ).toEqual({
      ok: false,
      reason: "CREATOR_NOT_FOUND",
    });
  });

  it("returns public shelf products in sort order without private affiliate fields", () => {
    const result = getPublicShelf(database, {
      creatorHandle: "liamroberts.photo",
      shelfId: "photography-kit",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.shelf.id).toBe("shelf-photography");
    expect(result.shelf.description).toBe(
      "My daily driver setup for hybrid shooting. Balancing ergonomics with top-tier image quality for long studio sessions and quick location hits.",
    );
    expect(result.shelf.products.map((product) => product.id)).toEqual([
      "product-sony-a7iv",
      "product-sony-lens",
      "product-peak-tripod",
    ]);
    expect(result.shelf.products.map((product) => product.sortPosition)).toEqual([0, 1, 2]);
    expect(result.shelf.products[0]).toMatchObject({
      hotspotX: 55,
      hotspotY: 38,
    });
    expect(JSON.stringify(result.shelf)).not.toContain("affiliate");
    expect(JSON.stringify(result.shelf)).not.toContain("liamcreator-20");
  });

  it("accepts only share codes that belong to the current public shelf", () => {
    expect(
      validatePublicShareCode(database, {
        shelfId: "shelf-photography",
        shareCode: "jamie-photo",
      }),
    ).toBe("jamie-photo");
    expect(
      validatePublicShareCode(database, {
        shelfId: "shelf-travel",
        shareCode: "jamie-photo",
      }),
    ).toBeNull();
    expect(
      validatePublicShareCode(database, {
        shelfId: "shelf-photography",
        shareCode: "not-a-real-share",
      }),
    ).toBeNull();
    expect(
      validatePublicShareCode(database, {
        shelfId: "shelf-photography",
        shareCode: "   ",
      }),
    ).toBeNull();
    expect(
      validatePublicShareCode(database, {
        shelfId: "shelf-photography",
        shareCode: ["jamie-photo", "other"],
      }),
    ).toBeNull();
  });
});
