import worker from "@/legacy/original-worker.mjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return worker.fetch(request);
}
