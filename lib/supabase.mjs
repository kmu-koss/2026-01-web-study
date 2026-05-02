import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fallbackSeasonsFile = path.resolve(__dirname, "..", "backend", "data", "seasons.json");
const seasonColumns = [
  "id",
  "sort_order",
  "label",
  "title",
  "short_label",
  "theme",
  "tool",
  "mood",
  "point",
  "image",
  "description",
  "quote",
].join(",");

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

function normalizeSeason(row) {
  return {
    id: row.id,
    label: row.label,
    title: row.title,
    shortLabel: row.short_label || row.shortLabel,
    theme: row.theme,
    tool: row.tool,
    mood: row.mood,
    point: row.point,
    image: row.image,
    description: row.description,
    quote: row.quote,
  };
}

function readFallbackSeasons() {
  const json = fs.readFileSync(fallbackSeasonsFile, "utf8");
  return JSON.parse(json);
}

function validateMessageInput(input) {
  const nickname = String(input.nickname || "").trim();
  const message = String(input.message || "").trim();
  const seasonId = input.seasonId ? String(input.seasonId).trim() : null;

  if (nickname.length < 1 || nickname.length > 20) {
    return { ok: false, message: "닉네임은 1~20자로 입력해 주세요." };
  }

  if (message.length < 1 || message.length > 160) {
    return { ok: false, message: "메시지는 1~160자로 입력해 주세요." };
  }

  return {
    ok: true,
    value: {
      nickname,
      message,
      season_id: seasonId || null,
    },
  };
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseConfig());
}

export async function supabaseRequest(pathname, options = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("SUPABASE_URL과 SUPABASE_PUBLISHABLE_KEY 또는 SUPABASE_ANON_KEY가 필요합니다.");
  }

  const authorizationHeader = config.key.startsWith("eyJ") ? { Authorization: `Bearer ${config.key}` } : {};
  const response = await fetch(`${config.url}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: config.key,
      ...authorizationHeader,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase 요청 실패: ${response.status} ${detail}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getSeasons() {
  if (!hasSupabaseConfig()) {
    return readFallbackSeasons();
  }

  const rows = await supabaseRequest(`hachuping_seasons?select=${seasonColumns}&order=sort_order.asc`);
  return rows.map(normalizeSeason);
}

export async function getSeason(seasonId) {
  if (!hasSupabaseConfig()) {
    return readFallbackSeasons().find((entry) => entry.id === seasonId) || null;
  }

  const rows = await supabaseRequest(
    `hachuping_seasons?select=${seasonColumns}&id=eq.${encodeURIComponent(seasonId)}&limit=1`
  );
  return rows[0] ? normalizeSeason(rows[0]) : null;
}

export async function getRandomSeason() {
  const seasons = await getSeasons();
  const randomIndex = Math.floor(Math.random() * seasons.length);
  return seasons[randomIndex];
}

export async function getMessages() {
  if (!hasSupabaseConfig()) {
    return [];
  }

  return supabaseRequest(
    "hachuping_messages?select=id,nickname,message,season_id,created_at&order=created_at.desc&limit=8"
  );
}

export async function createMessage(input) {
  const validated = validateMessageInput(input);

  if (!validated.ok) {
    return {
      ok: false,
      status: 400,
      body: { message: validated.message },
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      status: 503,
      body: { message: "Supabase 환경 변수를 설정해야 메시지를 저장할 수 있습니다." },
    };
  }

  const rows = await supabaseRequest("hachuping_messages?select=id,nickname,message,season_id,created_at", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(validated.value),
  });

  return {
    ok: true,
    status: 201,
    body: rows[0],
  };
}

export function sendJson(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export function sendOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
