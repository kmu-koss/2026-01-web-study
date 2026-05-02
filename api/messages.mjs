import { createMessage, getMessages, sendJson, sendOptions } from "../lib/supabase.mjs";

export function OPTIONS() {
  return sendOptions();
}

export async function GET() {
  return sendJson(await getMessages());
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return sendJson({ message: "JSON 형식의 요청 본문이 필요합니다." }, 400);
  }

  const result = await createMessage(body);
  return sendJson(result.body, result.status);
}
