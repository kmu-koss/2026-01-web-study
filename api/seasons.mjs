import { getSeasons, sendJson, sendOptions } from "../lib/supabase.mjs";

export function OPTIONS() {
  return sendOptions();
}

export async function GET() {
  return sendJson(await getSeasons());
}
