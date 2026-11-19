const DEFAULT_SUPPORTERS_URL =
  "https://script.google.com/macros/s/AKfycbx3yTSlYYPBPUlka1j0NEuWhrUrLnLjL8WBGhbxl5Zy_IMiLjwle6aasLJjSjh7uPNB/exec";

export const dynamic = "force-dynamic";

type SupporterInput = {
  viewerId?: unknown;
  name?: unknown;
  email?: unknown;
  category?: unknown;
  message?: unknown;
  consent?: unknown;
  protocol?: unknown;
};

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as SupporterInput;
    const payload = {
      type: "supporter",
      viewerId: typeof input.viewerId === "string" ? input.viewerId.trim() : "",
      name: typeof input.name === "string" ? input.name.trim().slice(0, 60) : "",
      email: typeof input.email === "string" ? input.email.trim().slice(0, 160) : "",
      category: typeof input.category === "string" ? input.category.trim().slice(0, 20) : "",
      message: typeof input.message === "string" ? input.message.trim().slice(0, 1000) : "",
      consent: input.consent === true,
      protocol: typeof input.protocol === "string" ? input.protocol.trim().slice(0, 32) : "",
    };
    if (!/^[A-Za-z0-9-]{20,64}$/.test(payload.viewerId)
      || payload.name.length < 2
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
      || payload.message.length < 10
      || !payload.consent) {
      return Response.json({ status: "invalid" }, { status: 400 });
    }
    const url = process.env.TUNE_SUPPORTERS_URL
      || process.env.TUNE_SCHEDULE_URL
      || DEFAULT_SUPPORTERS_URL;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Apps Script respondeu com HTTP ${response.status}.`);
    const result = await response.json() as { status?: string; protocol?: string };
    if (result.status !== "ok" || !result.protocol) throw new Error("Registro não confirmado.");
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Não foi possível registrar o apoiador.", error);
    return Response.json({ status: "error" }, { status: 502 });
  }
}
