import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import { extractMetadata } from "@/features/shelves/metadata-adapter";
import {
  publishShelfFromEditor,
  saveShelfDraft,
  type ShelfEditorInput,
} from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { ShelfEditor } from "@/features/studio/shelf-editor";
import { STITCH_ASSET_SOURCES } from "@/lib/db/seed";

const STITCH_CREATE_FLAT_LAY_URL = "/stitch/assets/create-shelf-flat-lay.png";
const STITCH_CREATE_SHELF_URL_PREFIX = "linkshelf.page/liam/";

const CREATE_SHELF_DEMO: ShelfEditorInput = {
  title: "Photography Kit",
  slug: "photography-kit",
  description: "My go-to gear for professional shoots and travel vlogs.",
  category: "Tech Pro",
  theme: "tech",
  sourceContentUrl: "https://www.youtube.com/watch?v=linkshelf-photo",
  coverUrl: STITCH_CREATE_FLAT_LAY_URL,
  products: [
    {
      destinationUrl: "https://www.amazon.com/dp/B09JZT6YK5",
      title: "Sony A7IV Mirrorless Camera",
      description: "A versatile full-frame hybrid camera with reliable autofocus.",
      merchant: "Amazon",
      price: 2498,
      imageUrl: STITCH_ASSET_SOURCES.productSonyA7iv,
      hotspotX: 55,
      hotspotY: 38,
    },
    {
      destinationUrl: "https://www.amazon.com/dp/B0B1TQZ99S",
      title: "Sony FE 24-70mm f/2.8 GM II",
      description: "A fast standard zoom for portraits, travel, and events.",
      merchant: "Amazon",
      price: 2298,
      imageUrl: STITCH_ASSET_SOURCES.productSonyLens,
      hotspotX: 25,
      hotspotY: 20,
    },
    {
      destinationUrl: "https://www.amazon.com/dp/B086YB2Y2F",
      title: "Peak Design Carbon Tripod",
      description: "A compact carbon travel tripod with a fast setup.",
      merchant: "Amazon",
      price: 649.95,
      imageUrl: STITCH_ASSET_SOURCES.productPeakTripod,
      hotspotX: 75,
      hotspotY: 60,
    },
  ],
};

async function getStudioContext(returnTo: string) {
  const session = await resolveServerAuthSession(await headers(), returnTo);
  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (session.user.role !== "CREATOR") {
    redirect("/forbidden");
  }
  const database = getSharedPublicShelvesDatabase();
  return { database, session };
}

function parsePayload(formData: FormData): ShelfEditorInput {
  const raw = String(formData.get("payload") ?? "{}");
  try {
    const parsed = JSON.parse(raw) as ShelfEditorInput;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function extractProductMetadata(productUrl: string) {
  "use server";

  return extractMetadata(productUrl);
}

async function submitShelf(formData: FormData) {
  "use server";

  const { database, session } = await getStudioContext("/studio/create");
  const input = parsePayload(formData);
  const intent = formData.get("intent");
  const result =
    intent === "publish"
      ? publishShelfFromEditor(database, input, session)
      : saveShelfDraft(database, input, session);

  if (result.ok) {
    redirect(`/studio/shelves/${result.shelfId}/edit`);
  }
  redirect("/studio/create?error=validation");
}

export default function StudioCreateShelfPage() {
  return (
    <ShelfEditor
      action={submitShelf}
      initialValue={CREATE_SHELF_DEMO}
      itemDensity="compact"
      onExtractMetadata={extractProductMetadata}
      shelfUrlPrefix={STITCH_CREATE_SHELF_URL_PREFIX}
      showCoverField={false}
      themePlacement="preview"
    />
  );
}
