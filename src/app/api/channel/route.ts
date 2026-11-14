import worker from "@/legacy/original-worker.mjs";

export const dynamic = "force-dynamic";

const DEFAULT_SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycbx3yTSlYYPBPUlka1j0NEuWhrUrLnLjL8WBGhbxl5Zy_IMiLjwle6aasLJjSjh7uPNB/exec";
const REQUEST_TIMEOUT_MS = 8_000;

type ScheduleItem = {
  id?: unknown;
  title?: unknown;
  duration?: unknown;
};

type SchedulePayload = {
  status?: unknown;
  epoch?: unknown;
  items?: unknown;
};

type ChannelVideo = {
  id: string;
  title: string;
  duration: number;
};

function parseVideos(payload: SchedulePayload): ChannelVideo[] {
  if (payload.status !== "ok" || !Array.isArray(payload.items)) return [];

  return payload.items.flatMap((rawItem) => {
    const item = rawItem as ScheduleItem;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const duration = Number(item.duration);

    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !Number.isFinite(duration) || duration <= 0) {
      return [];
    }

    return [{ id, title: title || "Conteúdo TUNE", duration: Math.round(duration) }];
  });
}

async function loadSchedule(): Promise<{
  videos: ChannelVideo[];
  epoch?: number;
}> {
  const scheduleUrl = process.env.TUNE_SCHEDULE_URL || DEFAULT_SCHEDULE_URL;
  const response = await fetch(scheduleUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`A grade respondeu com HTTP ${response.status}.`);

  const payload = (await response.json()) as SchedulePayload;
  const epoch = Number(payload.epoch);

  return {
    videos: parseVideos(payload),
    epoch: Number.isFinite(epoch) && epoch > 0 ? epoch : undefined,
  };
}

export async function GET(request: Request) {
  try {
    const schedule = await loadSchedule();

    if (schedule.videos.length > 0) {
      const fallback = (await (await worker.fetch(request)).json()) as { epoch: number };

      return Response.json(
        {
          videos: schedule.videos,
          epoch: schedule.epoch ?? fallback.epoch,
          now: Date.now(),
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Tune-Schedule-Source": "google-sheets",
          },
        },
      );
    }
  } catch (error) {
    console.error("Não foi possível carregar a grade TUNE; usando a programação de contingência.", error);
  }

  const fallback = await worker.fetch(request);
  const headers = new Headers(fallback.headers);
  headers.set("X-Tune-Schedule-Source", "fallback");

  return new Response(fallback.body, {
    status: fallback.status,
    statusText: fallback.statusText,
    headers,
  });
}
