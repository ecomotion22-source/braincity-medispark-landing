const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
const IS_VERCEL = Boolean(process.env.VERCEL);
const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL ||
  "https://script.google.com/macros/s/AKfycbzr27Hq9l6sl2NT02HaokDldE5cK6k1UHmm8pIjZ9fwHN-xrXwFGtJFNomaiRmGe5w/exec";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

if (!IS_VERCEL) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

function sanitizeLead(payload, remoteAddress) {
  const lead = {
    name: String(payload.name || "").trim(),
    phone: String(payload.phone || "").trim(),
    interestType: String(payload.interestType || "").trim(),
    consultingType: String(payload.consultingType || "").trim(),
    message: String(payload.message || "").trim(),
    privacy: Boolean(payload.privacy),
    createdAt: String(payload.createdAt || new Date().toISOString()),
    leadSource: String(payload.leadSource || "landing-page").trim(),
    triggerCall: Boolean(payload.triggerCall),
    remoteAddress,
  };

  if (String(payload.website || "").trim()) {
    throw new Error("honeypot_detected");
  }

  if (!lead.name || lead.name.length > 30) {
    throw new Error("invalid_name");
  }

  if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(lead.phone)) {
    throw new Error("invalid_phone");
  }

  if (!lead.interestType) {
    throw new Error("invalid_interest_type");
  }

  if (!lead.consultingType) {
    throw new Error("invalid_consulting_type");
  }

  if (!lead.privacy) {
    throw new Error("privacy_required");
  }

  if (lead.message.length > 500) {
    throw new Error("message_too_long");
  }

  return lead;
}

async function forwardLeadToGoogleScript(lead) {
  if (!GOOGLE_SCRIPT_URL) {
    return { forwarded: false, reason: "missing_webhook_url" };
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`google_script_http_${response.status}:${bodyText}`);
  }

  return {
    forwarded: true,
    responseText: bodyText,
  };
}

function persistLead(storedLead) {
  if (IS_VERCEL) {
    return;
  }

  fs.appendFileSync(LEADS_FILE, `${JSON.stringify(storedLead)}\n`, "utf8");
}

function serveStaticFile(filePath, response) {
  const safePath = path.normalize(filePath);
  if (!safePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(safePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const extension = path.extname(safePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600",
    });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/lead") {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", async () => {
      try {
        const body = Buffer.concat(chunks).toString("utf8");
        const payload = JSON.parse(body || "{}");
        const lead = sanitizeLead(payload, request.socket.remoteAddress || "");
        let googleSync = { forwarded: false };

        try {
          googleSync = await forwardLeadToGoogleScript(lead);
        } catch (googleError) {
          googleSync = {
            forwarded: false,
            error: googleError.message || "google_script_failed",
          };
        }

        const storedLead = {
          ...lead,
          googleSync,
        };

        persistLead(storedLead);

        sendJson(response, 200, {
          ok: true,
          googleSync,
        });
      } catch (error) {
        sendJson(response, 400, {
          ok: false,
          error: error.message || "invalid_request",
        });
      }
    });

    request.on("error", () => {
      sendJson(response, 500, { ok: false, error: "request_error" });
    });

    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      runtime: IS_VERCEL ? "vercel-node" : "local-node",
      leadsFile: IS_VERCEL ? null : LEADS_FILE,
    });
    return;
  }

  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  serveStaticFile(path.join(ROOT, decodeURIComponent(pathname)), response);
});

server.listen(PORT, () => {
  console.log(`Landing page server is running at http://127.0.0.1:${PORT}`);
});
