export class OriginError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "OriginError";
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) throw new OriginError();
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new OriginError();
  }
  if (originHost !== host) throw new OriginError();
}

export function clientIpFromHeaders(headerList: { get(name: string): string | null }): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  return "local";
}
