const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const projectRoot = path.resolve(__dirname, "..");
const staticRoot = path.resolve(projectRoot, "week1");
const fallbackDataFile = path.resolve(__dirname, "data", "seasons.json");
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

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.resolve(projectRoot, ".env.local"));
loadEnvFile(path.resolve(projectRoot, ".env"));

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

function hasSupabaseConfig() {
  return Boolean(getSupabaseConfig());
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
  const json = fs.readFileSync(fallbackDataFile, "utf8");
  return JSON.parse(json);
}

async function supabaseRequest(pathname, options = {}) {
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

async function readSeasons() {
  if (!hasSupabaseConfig()) {
    return readFallbackSeasons();
  }

  const rows = await supabaseRequest(`hachuping_seasons?select=${seasonColumns}&order=sort_order.asc`);
  return rows.map(normalizeSeason);
}

async function readSeason(seasonId) {
  if (!hasSupabaseConfig()) {
    return readFallbackSeasons().find((entry) => entry.id === seasonId) || null;
  }

  const rows = await supabaseRequest(
    `hachuping_seasons?select=${seasonColumns}&id=eq.${encodeURIComponent(seasonId)}&limit=1`
  );
  return rows[0] ? normalizeSeason(rows[0]) : null;
}

async function readMessages() {
  if (!hasSupabaseConfig()) {
    return [];
  }

  return supabaseRequest(
    "hachuping_messages?select=id,nickname,message,season_id,created_at&order=created_at.desc&limit=8"
  );
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

async function createMessage(input) {
  const validated = validateMessageInput(input);

  if (!validated.ok) {
    return {
      status: 400,
      body: { message: validated.message },
    };
  }

  if (!hasSupabaseConfig()) {
    return {
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
    status: 201,
    body: rows[0],
  };
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 10_000) {
        request.destroy();
        reject(new Error("요청 본문이 너무 큽니다."));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON 형식의 요청 본문이 필요합니다."));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(data, null, 2));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(message);
}

async function handleApi(request, response, pathname) {
  if (request.method === "OPTIONS") {
    sendText(response, 204, "");
    return;
  }

  try {
    if (pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        supabase: hasSupabaseConfig(),
        message: "하츄핑 백엔드가 실행 중입니다.",
      });
      return;
    }

    if (pathname === "/api/seasons") {
      if (request.method !== "GET") {
        sendJson(response, 405, { message: "GET 요청만 사용할 수 있습니다." });
        return;
      }

      sendJson(response, 200, await readSeasons());
      return;
    }

    if (pathname === "/api/seasons/random") {
      if (request.method !== "GET") {
        sendJson(response, 405, { message: "GET 요청만 사용할 수 있습니다." });
        return;
      }

      const seasons = await readSeasons();
      const randomIndex = Math.floor(Math.random() * seasons.length);
      sendJson(response, 200, seasons[randomIndex]);
      return;
    }

    if (pathname.startsWith("/api/seasons/")) {
      if (request.method !== "GET") {
        sendJson(response, 405, { message: "GET 요청만 사용할 수 있습니다." });
        return;
      }

      const seasonId = decodeURIComponent(pathname.replace("/api/seasons/", ""));
      const season = await readSeason(seasonId);

      if (!season) {
        sendJson(response, 404, { message: "해당 시즌을 찾을 수 없습니다." });
        return;
      }

      sendJson(response, 200, season);
      return;
    }

    if (pathname === "/api/messages") {
      if (request.method === "GET") {
        sendJson(response, 200, await readMessages());
        return;
      }

      if (request.method === "POST") {
        const body = await readRequestJson(request);
        const result = await createMessage(body);
        sendJson(response, result.status, result.body);
        return;
      }

      sendJson(response, 405, { message: "GET 또는 POST 요청만 사용할 수 있습니다." });
      return;
    }

    sendJson(response, 404, { message: "없는 API 주소입니다." });
  } catch (error) {
    sendJson(response, 500, {
      message: "서버에서 데이터를 처리하는 중 문제가 발생했습니다.",
      detail: error.message,
    });
  }
}

function handleStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(staticRoot, `.${decodeURIComponent(requestedPath)}`);
  const isInsideStaticRoot = filePath === staticRoot || filePath.startsWith(`${staticRoot}${path.sep}`);

  if (!isInsideStaticRoot) {
    sendText(response, 403, "접근할 수 없는 파일입니다.");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      sendText(response, 404, "파일을 찾을 수 없습니다.");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
    });
    response.end(file);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    handleApi(request, response, pathname);
    return;
  }

  handleStatic(response, pathname);
});

server.listen(PORT, () => {
  const source = hasSupabaseConfig() ? "Supabase" : "로컬 JSON fallback";
  console.log(`하츄핑 백엔드 실행: http://localhost:${PORT}`);
  console.log(`데이터 소스: ${source}`);
  console.log(`API 확인: http://localhost:${PORT}/api/seasons`);
});
