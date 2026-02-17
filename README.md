# gaming-cafe-leipzig

## Ziel
Diese Website soll komplett über **GitHub + Vercel** laufen (ohne lokale Installation).

---

## Schritt-für-Schritt (einfach)

### 1) Projekt zu GitHub pushen
- Öffne dein GitHub-Repo.
- Lade alle Dateien hoch (inkl. Ordner `api/`).

Wichtig: Die API-Dateien müssen im Repo sein:
- `api/state.js`
- `api/vote.js`
- `api/suggest.js`
- `api/reset.js`

---

### 2) Projekt bei Vercel importieren
- Gehe auf [vercel.com](https://vercel.com)
- **New Project** klicken
- Dein GitHub-Repo auswählen
- **Deploy** klicken

Du musst hier kein Build-Command setzen. Vercel erkennt `index.html` + `api/*` automatisch.

---

### 3) Datenbank/KV in Vercel anlegen (wichtig)
Damit Votes und Vorschläge von Handy und PC gleich sind, brauchst du zentralen Speicher:

- In Vercel: **Storage** → **Create Database** → **KV**
- KV mit deinem Projekt verbinden

Danach setzt Vercel automatisch diese Umgebungsvariablen:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Ohne KV funktionieren die API-Routen nicht dauerhaft.

---

### 4) Neu deployen
- Nach dem KV-Verbinden: **Redeploy** ausführen.

---

### 5) Testen
- Öffne die Vercel-URL auf dem Handy, vote/sende Vorschlag.
- Öffne dieselbe URL auf dem PC im Admin-Bereich.
- Jetzt sollten Votes/Vorschläge sichtbar sein, ohne JSON-Fehler.

---

## Häufiger Fehler

### `Unexpected token 'T', "The page c"... is not valid JSON`
Das bedeutet fast immer:
- Frontend ruft `/api/...` auf,
- aber es kommt HTML statt JSON zurück (z. B. falsches Deployment oder keine funktionierende API/KV-Konfiguration).

Bitte dann prüfen:
1. Sind die `api/*.js` Dateien im GitHub-Repo?
2. Ist KV in Vercel verbunden?
3. Wurde nach KV-Verbindung neu deployed?

---

## Hinweis
`server.js` ist für lokalen Betrieb. Für deinen Wunschfall (**nur GitHub + Vercel**) sind die `api/*.js`-Dateien entscheidend.
