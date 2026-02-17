const { readState, writeState, json, parseBody } = require("./_store");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = parseBody(req);

    if (body.password !== "Nopeman11!") {
      return json(res, 401, { error: "Falsches Passwort." });
    }

    const state = await readState();
    state.votes = { yes: 0, no: 0 };
    state.suggestions = [];
    state.lastVoteTimestamp = null;
    state.votedDeviceIds = {};
    state.suggestedDeviceIds = {};
    state.limitVersion += 1;

    const next = await writeState(state);
    return json(res, 200, { ok: true, limitVersion: next.limitVersion });
  } catch (error) {
    return json(res, 500, { error: error.message || "Serverfehler" });
  }
};
