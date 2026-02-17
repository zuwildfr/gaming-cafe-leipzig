const { readState, writeState, json, parseBody } = require("./_store");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = parseBody(req);
    const type = body.type;
    const deviceId = body.deviceId;
    const force = body.force === true;

    if (!["yes", "no"].includes(type) || !deviceId) {
      return json(res, 400, { error: "Ungültige Anfrage." });
    }

    const state = await readState();

    if (!force && state.votedDeviceIds[deviceId]) {
      return json(res, 409, {
        error: "Du hast auf diesem Gerät bereits abgestimmt.",
        limitVersion: state.limitVersion,
      });
    }

    state.votes[type] += 1;
    state.lastVoteTimestamp = new Date().toISOString();

    if (!force) {
      state.votedDeviceIds[deviceId] = true;
    }

    const next = await writeState(state);
    return json(res, 200, { ok: true, limitVersion: next.limitVersion });
  } catch (error) {
    return json(res, 500, { error: error.message || "Serverfehler" });
  }
};
