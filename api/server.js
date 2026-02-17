
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 4173);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      votes: { yes: 0, no: 0 },
      suggestions: [],
      lastVoteTimestamp: null,
      limitVersion: 1,
      votedDeviceIds: {},
      suggestedDeviceIds: {},
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeStore(store) {
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function sendJson(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, decodeURIComponent(reqPath.split('?')[0]));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': contentType(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  if (url === '/api/state' && method === 'GET') {
    const store = readStore();
    return sendJson(res, 200, {
      votes: store.votes,
      suggestions: store.suggestions,
      lastVoteTimestamp: store.lastVoteTimestamp,
      limitVersion: store.limitVersion,
      updatedAt: store.updatedAt,
    });
  }

  if (url === '/api/vote' && method === 'POST') {
    const body = await readJsonBody(req);
    const type = body.type;
    const deviceId = body.deviceId;
    const force = body.force === true;

    if (!['yes', 'no'].includes(type) || !deviceId) {
      return sendJson(res, 400, { error: 'Ungültige Anfrage.' });
    }

    const store = readStore();
    if (!force && store.votedDeviceIds[deviceId]) {
      return sendJson(res, 409, { error: 'Du hast auf diesem Gerät bereits abgestimmt.', limitVersion: store.limitVersion });
    }

    store.votes[type] += 1;
    store.lastVoteTimestamp = new Date().toISOString();
    if (!force) store.votedDeviceIds[deviceId] = true;
    writeStore(store);

    return sendJson(res, 200, { ok: true, limitVersion: store.limitVersion });
  }

  if (url === '/api/suggest' && method === 'POST') {
    const body = await readJsonBody(req);
    const suggestion = typeof body.suggestion === 'string' ? body.suggestion.trim() : '';
    const deviceId = body.deviceId;
    const force = body.force === true;

    if (!suggestion || !deviceId) {
      return sendJson(res, 400, { error: 'Bitte gib ein Spiel ein.' });
    }

    const store = readStore();
    if (!force && store.suggestedDeviceIds[deviceId]) {
      return sendJson(res, 409, { error: 'Du hast auf diesem Gerät bereits einen Vorschlag abgegeben.', limitVersion: store.limitVersion });
    }

    store.suggestions.push({ text: suggestion, createdAt: new Date().toISOString() });
    if (!force) store.suggestedDeviceIds[deviceId] = true;
    writeStore(store);

    return sendJson(res, 200, { ok: true, limitVersion: store.limitVersion });
  }

  if (url === '/api/reset' && method === 'POST') {
    const body = await readJsonBody(req);
    if (body.password !== 'Nopeman11!') {
      return sendJson(res, 401, { error: 'Falsches Passwort.' });
    }

    const store = readStore();
    store.votes = { yes: 0, no: 0 };
    store.suggestions = [];
    store.lastVoteTimestamp = null;
    store.votedDeviceIds = {};
    store.suggestedDeviceIds = {};
    store.limitVersion += 1;
    writeStore(store);

    return sendJson(res, 200, { ok: true, limitVersion: store.limitVersion });
  }

  return serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Server läuft auf http://${HOST}:${PORT}`);
});
