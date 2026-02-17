const { readState, writeState, json, parseBody } = require("./_store");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = parseBody(req);
    const suggestion = typeof body.suggestion === "string" ? body.suggestion.trim() : "";
    const deviceId = body.deviceId;
    const force = body.force === true;

    if (!suggestion || !deviceId) {
      return json(res, 400, { error: "Bitte gib ein Spiel ein." });
    }

    const state = await readState();

    if (!force && state.suggestedDeviceIds[deviceId]) {
      return json(res, 409, {
        error: "Du hast auf diesem Gerät bereits einen Vorschlag abgegeben.",
        limitVersion: state.limitVersion,
      });
    }

    state.suggestions.push({ text: suggestion, createdAt: new Date().toISOString() });

    if (!force) {
      state.suggestedDeviceIds[deviceId] = true;
    }

    const next = await writeState(state);
    return json(res, 200, { ok: true, limitVersion: next.limitVersion });
  } catch (error) {
    return json(res, 500, { error: error.message || "Serverfehler" });
  }
};
