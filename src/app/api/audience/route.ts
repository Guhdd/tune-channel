export const dynamic = "force-dynamic";

const DEFAULT_AUDIENCE_URL =
  "https://script.google.com/macros/s/AKfycbx3yTSlYYPBPUlka1j0NEuWhrUrLnLjL8WBGhbxl5Zy_IMiLjwle6aasLJjSjh7uPNB/exec";
const REQUEST_TIMEOUT_MS = 30_000;

type AudienceEvent = {
  viewerId?: unknown;
  event?: unknown;
};

export async function POST(request: Request) {
  let event: AudienceEvent;
  try {
    event = (await request.json()) as AudienceEvent;
  } catch {
    return Response.json({ status: "invalid" }, { status: 400 });
  }

  const viewerId = typeof event.viewerId === "string" ? event.viewerId.trim() : "";
  const audienceEvent = ["visit", "watch", "sound"].includes(String(event.event))
    ? String(event.event)
    : "";

  if (!/^[A-Za-z0-9-]{20,64}$/.test(viewerId) || !audienceEvent) {
    return Response.json({ status: "invalid" }, { status: 400 });
  }

  try {
    const audienceUrl = process.env.TUNE_AUDIENCE_URL || process.env.TUNE_SCHEDULE_URL || DEFAULT_AUDIENCE_URL;
    const response = await fetch(audienceUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ viewerId, event: audienceEvent }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`Audience endpoint returned HTTP ${response.status}`);
    const result = (await response.json()) as { status?: unknown };
    if (result.status !== "ok") throw new Error("Audience endpoint rejected the event");
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Não foi possível registrar a audiência TUNE.", error);
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
