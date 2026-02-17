const DEFAULT_STATE = {
  votes: { yes: 0, no: 0 },
  suggestions: [],
  lastVoteTimestamp: null,
  limitVersion: 1,
  votedDeviceIds: {},
  suggestedDeviceIds: {},
  updatedAt: new Date().toISOString(),
};

function firstDefined(...values) {
  return values.find((value) => typeof value === "string" && value.trim() !== "");
}

function getSupabaseConfig() {
  const url = firstDefined(
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  const serviceRoleKey = firstDefined(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_KEY,
  );

  const missing = [];
  if (!url) {
    missing.push("SUPABASE_URL (oder NEXT_PUBLIC_SUPABASE_URL)");
  }
  if (!serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Supabase ist nicht konfiguriert. Fehlend: ${missing.join(", ")}. In Vercel setzen und neu deployen.`,
    );
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

function supabaseHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

async function readStateFromSupabase() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/app_state?id=eq.1&select=state`,
    { headers: supabaseHeaders(serviceRoleKey) },
  );

  if (!response.ok) {
    throw new Error(
      "Supabase-Read fehlgeschlagen. Prüfe Tabelle app_state, API-Zugriff und Env-Variablen.",
    );
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return rows[0]?.state ?? null;
}

async function upsertStateToSupabase(state) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/app_state`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(serviceRoleKey),
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([{ id: 1, state }]),
  });

  if (!response.ok) {
    throw new Error(
      "Supabase-Write fehlgeschlagen. Prüfe Tabelle app_state und Schreibrechte.",
    );
  }
}

function normalizeState(state) {
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

async function readState() {
  const state = await readStateFromSupabase();
  if (!state || typeof state !== "object") {
    await upsertStateToSupabase(DEFAULT_STATE);
    return { ...DEFAULT_STATE };
  }

  return normalizeState(state);
}

async function writeState(state) {
  const next = {
    ...normalizeState(state),
    updatedAt: new Date().toISOString(),
  };

  await upsertStateToSupabase(next);
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
