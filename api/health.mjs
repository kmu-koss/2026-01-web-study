import { hasSupabaseConfig, sendJson, sendOptions } from "../lib/supabase.mjs";

export function OPTIONS() {
  return sendOptions();
}

export function GET() {
  return sendJson({
    ok: true,
    supabase: hasSupabaseConfig(),
    message: "하츄핑 Vercel API가 실행 중입니다.",
  });
}
