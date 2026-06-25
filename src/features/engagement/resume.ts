import type { DatabaseSync } from "node:sqlite";
import type { AuthSession } from "@/features/auth/adapter";
import { consumeResumeEntryCookie } from "@/features/auth/session";
import type { SocialChannelType } from "@/features/shelves/types";
import { createShare, toggleSave, type CreateShareOptions, type ToggleSaveOptions } from "./actions";

type ResumeParam = string | readonly string[] | null | undefined;
type ChannelParam = string | readonly string[] | null | undefined;

export type ResumeEngagementResult =
  | {
      readonly completed: true;
      readonly kind: "save";
    }
  | {
      readonly completed: true;
      readonly kind: "share";
      readonly shareCode: string;
    }
  | {
      readonly completed: false;
      readonly kind: "none";
    };

interface ResumeEntryOptions {
  readonly secret?: string;
  readonly now?: () => Date;
}

type ResumeShelfOptions = CreateShareOptions & ToggleSaveOptions & ResumeEntryOptions;
type ResumeCreatorOptions = ToggleSaveOptions & ResumeEntryOptions;

function singleValue(value: ResumeParam): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function normalizeResume(value: ResumeParam): "save" | "share" | null {
  const resume = singleValue(value);
  return resume === "save" || resume === "share" ? resume : null;
}

function normalizeChannel(value: ChannelParam): SocialChannelType {
  const channel = singleValue(value);
  if (
    channel === "X" ||
    channel === "WHATSAPP" ||
    channel === "FACEBOOK" ||
    channel === "EMAIL" ||
    channel === "COPY"
  ) {
    return channel;
  }
  return "COPY";
}

function resumeEntryNow(options: ResumeEntryOptions): number {
  return (options.now ?? (() => new Date()))().getTime();
}

function hasValidResumeEntry(
  token: unknown,
  returnTo: unknown,
  options: ResumeEntryOptions,
): boolean {
  return (
    consumeResumeEntryCookie(token, returnTo, {
      secret: options.secret,
      now: resumeEntryNow(options),
    }) !== null
  );
}

export function resumeShelfEngagement(
  database: DatabaseSync,
  input: {
    readonly resume: ResumeParam;
    readonly channel?: ChannelParam;
    readonly shelfId: string;
    readonly session: AuthSession | null;
    readonly resumeEntryToken: string | null;
    readonly returnTo: string;
  },
  options: ResumeShelfOptions = {},
): ResumeEngagementResult {
  const resume = normalizeResume(input.resume);
  if (
    !resume ||
    !input.session ||
    !hasValidResumeEntry(input.resumeEntryToken, input.returnTo, options)
  ) {
    return { completed: false, kind: "none" };
  }

  if (resume === "save") {
    const result = toggleSave(
      database,
      {
        targetType: "SHELF",
        targetId: input.shelfId,
        saved: true,
      },
      input.session,
      options,
    );
    return result.ok ? { completed: true, kind: "save" } : { completed: false, kind: "none" };
  }

  const result = createShare(
    database,
    {
      shelfId: input.shelfId,
      channel: normalizeChannel(input.channel),
    },
    input.session,
    options,
  );

  return result.ok
    ? { completed: true, kind: "share", shareCode: result.share.shortCode }
    : { completed: false, kind: "none" };
}

export function resumeCreatorEngagement(
  database: DatabaseSync,
  input: {
    readonly resume: ResumeParam;
    readonly creatorId: string;
    readonly session: AuthSession | null;
    readonly resumeEntryToken: string | null;
    readonly returnTo: string;
  },
  options: ResumeCreatorOptions = {},
): ResumeEngagementResult {
  const resume = normalizeResume(input.resume);
  if (
    resume !== "save" ||
    !input.session ||
    !hasValidResumeEntry(input.resumeEntryToken, input.returnTo, options)
  ) {
    return { completed: false, kind: "none" };
  }

  const result = toggleSave(
    database,
    {
      targetType: "CREATOR",
      targetId: input.creatorId,
      saved: true,
    },
    input.session,
    options,
  );

  return result.ok ? { completed: true, kind: "save" } : { completed: false, kind: "none" };
}
