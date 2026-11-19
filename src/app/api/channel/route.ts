import worker from "@/legacy/original-worker.mjs";

export const dynamic = "force-dynamic";

const DEFAULT_SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycbx3yTSlYYPBPUlka1j0NEuWhrUrLnLjL8WBGhbxl5Zy_IMiLjwle6aasLJjSjh7uPNB/exec";
// A primeira leitura do Apps Script pode consultar metadados do YouTube antes
// de entrar no cache. Dê tempo para essa sincronização sem cair no fallback.
const REQUEST_TIMEOUT_MS = 30_000;

type RawItem = {
  id?: unknown;
  title?: unknown;
  duration?: unknown;
  badge?: unknown;
  rating?: unknown;
  thumbnail?: unknown;
};

type RawChannel = {
  id?: unknown;
  label?: unknown;
  name?: unknown;
  logo?: unknown;
  epoch?: unknown;
  items?: unknown;
};

type SchedulePayload = {
  status?: unknown;
  epoch?: unknown;
  items?: unknown;
  channels?: unknown;
};

type ChannelVideo = {
  id: string;
  title: string;
  duration: number;
  badge: string;
  rating: string;
  thumbnail: string;
};

type TuneChannel = {
  id: string;
  label: string;
  name: string;
  logo: string;
  epoch?: number;
  items: ChannelVideo[];
};

function parseItems(source: unknown): ChannelVideo[] {
  if (!Array.isArray(source)) return [];
  return source.flatMap((rawItem) => {
    const item = rawItem as RawItem;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const duration = Math.round(Number(item.duration));
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !Number.isFinite(duration) || duration <= 0) return [];
    return [{
      id,
      title: title || "Conteúdo TUNE",
      duration,
      badge: typeof item.badge === "string" ? item.badge.trim().toUpperCase() : "",
      rating: typeof item.rating === "string" ? item.rating.trim().toUpperCase() : "",
      thumbnail: typeof item.thumbnail === "string" ? item.thumbnail.trim() : "",
    }];
  });
}

function parseChannels(payload: SchedulePayload): TuneChannel[] {
  if (payload.status !== "ok") return [];
  if (Array.isArray(payload.channels)) {
    return payload.channels.flatMap((rawChannel) => {
      const channel = rawChannel as RawChannel;
      const id = typeof channel.id === "string" ? channel.id.trim().toLowerCase() : "";
      const items = parseItems(channel.items);
      if (!/^[a-z0-9][a-z0-9-]{1,23}$/.test(id)) return [];
      const epoch = Number(channel.epoch);
      return [{
        id,
        label: typeof channel.label === "string" ? channel.label.trim() : id.toUpperCase(),
        name: typeof channel.name === "string" ? channel.name.trim() : `TUNE ${id.toUpperCase()}`,
        logo: typeof channel.logo === "string" && /^[a-z0-9][a-z0-9-]*\.png$/.test(channel.logo.trim())
          ? channel.logo.trim()
          : `tune-${id}.png`,
        epoch: Number.isFinite(epoch) && epoch > 0 ? epoch : undefined,
        items,
      }];
    });
  }

  const items = parseItems(payload.items);
  const epoch = Number(payload.epoch);
  return items.length ? [{
    id: "play",
    label: "PLAY",
    name: "TUNE PLAY",
    logo: "tune-play.png",
    epoch: Number.isFinite(epoch) && epoch > 0 ? epoch : undefined,
    items,
  }] : [];
}

async function loadSchedule(): Promise<TuneChannel[]> {
  const scheduleUrl = process.env.TUNE_SCHEDULE_URL || DEFAULT_SCHEDULE_URL;
  const response = await fetch(scheduleUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`A grade respondeu com HTTP ${response.status}.`);
  return parseChannels((await response.json()) as SchedulePayload);
}

export async function GET(request: Request) {
  try {
    const channels = await loadSchedule();
    if (channels.length > 0) {
      const fallback = (await (await worker.fetch(request)).json()) as { epoch: number };
      const withEpoch = channels.map((channel) => ({ ...channel, epoch: channel.epoch ?? fallback.epoch }));
      return Response.json(
        {
          channels: withEpoch,
          videos: withEpoch[0].items,
          epoch: withEpoch[0].epoch,
          now: Date.now(),
        },
        { headers: { "Cache-Control": "no-store", "X-Tune-Schedule-Source": "google-sheets" } },
      );
    }
  } catch (error) {
    console.error("Não foi possível carregar as grades TUNE; usando a programação de contingência.", error);
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
