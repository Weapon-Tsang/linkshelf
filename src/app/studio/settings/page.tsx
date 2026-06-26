import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
import {
  deleteCreatorAccount,
  getStudioSettings,
  saveCreatorProfile,
  saveCreatorTrackingId,
  setShareChannelEnabled,
} from "@/features/engagement/comment-actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import type { SocialChannelType } from "@/features/shelves/types";
import { SettingsView } from "@/features/studio/settings-view";

const SOCIAL_CHANNELS = new Set<SocialChannelType>([
  "X",
  "WHATSAPP",
  "FACEBOOK",
  "EMAIL",
  "COPY",
]);

async function getStudioSession(returnTo: string) {
  const database = getSharedPublicShelvesDatabase();
  const session = getAuthSession(database, { headers: await headers() });
  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (session.user.role !== "CREATOR") {
    redirect("/forbidden");
  }
  return { database, session };
}

function stringField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

async function saveProfileAction(formData: FormData) {
  "use server";

  const { database, session } = await getStudioSession("/studio/settings");
  saveCreatorProfile(
    database,
    {
      displayName: stringField(formData, "displayName"),
      bio: stringField(formData, "bio"),
      category: stringField(formData, "category"),
    },
    session,
  );
  revalidatePath("/studio/settings");
}

async function saveTrackingAction(formData: FormData) {
  "use server";

  const { database, session } = await getStudioSession("/studio/settings");
  saveCreatorTrackingId(
    database,
    {
      affiliateTag: stringField(formData, "affiliateTag"),
    },
    session,
  );
  revalidatePath("/studio/settings");
}

async function toggleChannelAction(formData: FormData) {
  "use server";

  const type = stringField(formData, "type");
  if (!SOCIAL_CHANNELS.has(type as SocialChannelType)) {
    return;
  }
  const { database, session } = await getStudioSession("/studio/settings");
  setShareChannelEnabled(
    database,
    {
      type: type as SocialChannelType,
      enabled: stringField(formData, "enabled") === "true",
    },
    session,
  );
  revalidatePath("/studio/settings");
}

async function deleteAccountAction() {
  "use server";

  const { database, session } = await getStudioSession("/studio/settings");
  deleteCreatorAccount(database, { confirmation: "DELETE" }, session);
  revalidatePath("/");
  redirect("/login?returnTo=/");
}

export default async function StudioSettingsPage() {
  const { database, session } = await getStudioSession("/studio/settings");
  const settings = getStudioSettings(database, session);

  if (!settings.ok) {
    redirect("/forbidden");
  }

  return (
    <SettingsView
      channels={settings.channels}
      creator={settings.creator}
      deleteAccountAction={deleteAccountAction}
      saveProfileAction={saveProfileAction}
      saveTrackingAction={saveTrackingAction}
      toggleChannelAction={toggleChannelAction}
    />
  );
}
