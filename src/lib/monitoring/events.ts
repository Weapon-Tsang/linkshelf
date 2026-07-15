export type OperationalEventLevel = "info" | "warn" | "error";

export interface MonitoringEnvironment {
  readonly NODE_ENV?: string;
  readonly LINKSHELF_MONITORING_STDOUT?: string;
}

export type OperationalEventMetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface OperationalEventInput {
  readonly level: OperationalEventLevel;
  readonly name: string;
  readonly outcome: string;
  readonly requestId?: string;
  readonly metadata?: Readonly<Record<string, OperationalEventMetadataValue>>;
}

export interface OperationalEventSink {
  readonly info: (message: string) => void;
  readonly warn: (message: string) => void;
  readonly error: (message: string) => void;
}

export interface RecordOperationalEventOptions {
  readonly environment?: MonitoringEnvironment;
  readonly now?: () => Date;
  readonly sink?: OperationalEventSink;
}

const SECRET_METADATA_KEY = /secret|token|cookie|authorization|password|email|subject|code/i;

export function operationalEventEnabled(
  environment: MonitoringEnvironment = process.env,
): boolean {
  return (
    environment.NODE_ENV === "production" ||
    environment.LINKSHELF_MONITORING_STDOUT === "1"
  );
}

function safeMetadata(
  metadata: OperationalEventInput["metadata"],
): Record<string, Exclude<OperationalEventMetadataValue, undefined>> | undefined {
  if (!metadata) return undefined;

  const safeEntries = Object.entries(metadata).flatMap(([key, value]) => {
    if (value === undefined) return [];
    if (SECRET_METADATA_KEY.test(key)) return [[key, "[redacted]"] as const];
    return [[key, value] as const];
  });

  return safeEntries.length > 0 ? Object.fromEntries(safeEntries) : undefined;
}

export function recordOperationalEvent(
  event: OperationalEventInput,
  options: RecordOperationalEventOptions = {},
): void {
  const environment = options.environment ?? process.env;
  if (!operationalEventEnabled(environment)) return;

  const metadata = safeMetadata(event.metadata);
  const payload = {
    type: "linkshelf.operational_event",
    timestamp: (options.now ?? (() => new Date()))().toISOString(),
    level: event.level,
    name: event.name,
    outcome: event.outcome,
    ...(event.requestId ? { requestId: event.requestId } : {}),
    ...(metadata ? { metadata } : {}),
  };
  const message = JSON.stringify(payload);
  const sink = options.sink ?? console;

  if (event.level === "error") {
    sink.error(message);
    return;
  }
  if (event.level === "warn") {
    sink.warn(message);
    return;
  }
  sink.info(message);
}
