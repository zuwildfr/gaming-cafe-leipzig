const DEFAULT_STATE = {
  votes: { yes: 0, no: 0 },
  suggestions: [],
  lastVoteTimestamp: null,
  limitVersion: 1,
  votedDeviceIds: {},
  suggestedDeviceIds: {},
  updatedAt: new Date().toISOString(),
};

function getKvConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "KV ist nicht konfiguriert. Bitte in Vercel ein KV anlegen und Env-Variablen setzen.",
    );
  }

  return { url: url.replace(/\/$/, ""), token };
}

async function kvGet(key) {
  const { url, token } = getKvConfig();
  const response = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("KV-GET fehlgeschlagen.");
  }

  const data = await response.json();
  return data?.result ?? null;
}

async function kvSet(key, value) {
  const { url, token } = getKvConfig();
  const encoded = encodeURIComponent(JSON.stringify(value));
  const response = await fetch(`${url}/set/${encodeURIComponent(key)}/${encoded}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("KV-SET fehlgeschlagen.");
  }
}

async function readState() {
  const state = await kvGet("gaming-cafe-state");
  if (!state || typeof state !== "object") {
    await kvSet("gaming-cafe-state", DEFAULT_STATE);
    return { ...DEFAULT_STATE };
  }

  return {
    ...DEFAULT_STATE,
    ...state,
    votes: {
      yes: Number(state?.votes?.yes || 0),
      no: Number(state?.votes?.no || 0),
    },
    suggestions: Array.isArray(state?.suggestions) ? state.suggestions : [],
    votedDeviceIds:
      state?.votedDeviceIds && typeof state.votedDeviceIds === "object"
        ? state.votedDeviceIds
        : {},
    suggestedDeviceIds:
      state?.suggestedDeviceIds && typeof state.suggestedDeviceIds === "object"
        ? state.suggestedDeviceIds
        : {},
  };
}

async function writeState(state) {
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
  };

  await kvSet("gaming-cafe-state", next);
  return next;
}

function json(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function parseBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

module.exports = {
  readState,
  writeState,
  json,
  parseBody,
};
