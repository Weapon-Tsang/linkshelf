import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site-config";

describe("siteConfig", () => {
  it("defines the LinkShelf product identity", () => {
    expect(siteConfig).toEqual({
      name: "LinkShelf",
      description: "Visual affiliate shelves for creators and fans.",
      defaultPlatformTag: "linkshelf-platform-20",
    });
  });
});
