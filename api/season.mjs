import { getSeason, sendJson, sendOptions } from "../lib/supabase.mjs";

export function OPTIONS() {
  return sendOptions();
}

export async function GET(request) {
  const url = new URL(request.url);
  const seasonId = url.searchParams.get("id");
  const season = await getSeason(seasonId);

  if (!season) {
    return sendJson({ message: "해당 시즌을 찾을 수 없습니다." }, 404);
  }

  return sendJson(season);
}
