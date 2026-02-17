# gaming-cafe-leipzig

## Lokal starten

```bash
node server.js
```

Danach unter `http://localhost:4173` öffnen.

## Wichtig für GitHub/Deployment

Nur das Hochladen auf GitHub reicht **nicht**, weil die Seite ein laufendes Backend (`server.js`) braucht.

Wenn nur statisches Hosting aktiv ist (z. B. reine HTML-Auslieferung), schlagen API-Calls wie `/api/state` fehl und es kommt u. a. zu Fehlern wie:

`Unexpected token 'T', "The page c"... is not valid JSON`

### Deployment-Optionen

- Nutze einen Host, der Node-Prozesse unterstützt (z. B. Render, Railway, VPS).
- Stelle sicher, dass `node server.js` als Startkommando läuft.
- Alle Geräte (Handy + PC) müssen dieselbe deployte URL verwenden, damit sie denselben Datenstand sehen.
