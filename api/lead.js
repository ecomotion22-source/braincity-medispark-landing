const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL ||
  "https://script.google.com/macros/s/AKfycbzr27Hq9l6sl2NT02HaokDldE5cK6k1UHmm8pIjZ9fwHN-xrXwFGtJFNomaiRmGe5w/exec";

function sendJson(response, statusCode, data) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
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

module.exports = async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, {
      ok: false,
      error: "method_not_allowed",
    });
    return;
  }

  try {
    const lead = sanitizeLead(request.body || {}, request.headers["x-forwarded-for"] || "");
    const googleSync = await forwardLeadToGoogleScript(lead);

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
};
