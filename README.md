# gaming-cafe-leipzig

## Ziel
Diese Website läuft über **GitHub + Vercel + Supabase** (ohne lokale Installation).

---

## Super einfache Schritt-für-Schritt Anleitung

### 1) Code in GitHub
Stelle sicher, dass diese Dateien im Repo sind:
- `index.html`
- Ordner `api/` mit:
  - `api/state.js`
  - `api/vote.js`
  - `api/suggest.js`
  - `api/reset.js`
  - `api/_store.js`

---

### 2) Vercel Projekt erstellen
1. Auf [vercel.com](https://vercel.com) gehen
2. **New Project**
3. GitHub-Repo auswählen
4. **Deploy** klicken

---

### 3) Supabase Tabelle anlegen
Da du Supabase schon hast, brauchst du dort nur eine Tabelle für den App-State.

In Supabase SQL Editor ausführen:

```sql
create table if not exists public.app_state (
  id bigint primary key,
  state jsonb not null
);
```

Optional einmal initialen Datensatz setzen:

```sql
insert into public.app_state (id, state)
values (1, '{"votes":{"yes":0,"no":0},"suggestions":[],"lastVoteTimestamp":null,"limitVersion":1,"votedDeviceIds":{},"suggestedDeviceIds":{}}')
on conflict (id) do nothing;
```

---

Wenn du **nicht** mit Service-Role-Key arbeiten willst, brauchst du RLS-Policies. Mit Service-Role-Key ist das nicht nötig.

Empfohlen für dieses Projekt (Server-Only Key in Vercel):
```sql
alter table public.app_state disable row level security;
```

---

### 4) Env Variablen in Vercel setzen
In Vercel → Project → **Settings** → **Environment Variables**:

- `SUPABASE_URL` = deine Supabase Projekt-URL (z. B. `https://xyz.supabase.co`)
  - Fallback im Code: `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` = dein Service Role Key aus Supabase
  - Fallback im Code: `SUPABASE_SECRET_KEY` oder `SUPABASE_SERVICE_KEY`

Wichtig:
- **Service Role Key nur in Vercel Env**, nie im Frontend/Code anzeigen.

---

### 5) Redeploy
Nach dem Setzen der Variablen in Vercel:
- **Redeploy** ausführen.

---

### 6) Test
1. Auf Handy die Vercel-URL öffnen und voten/Vorschlag senden.
2. Auf PC dieselbe URL öffnen, Admin-Bereich öffnen.
3. Jetzt sollten Votes und Vorschläge von Handy sichtbar sein.

---

## Wenn es nicht funktioniert

### Fehler: `Unexpected token 'T' ... is not valid JSON`
Dann kommt von `/api/...` wahrscheinlich HTML statt JSON zurück.

Bitte prüfen:
1. Ist das Projekt wirklich in Vercel deployed?
2. Sind die `api/*.js` Dateien im GitHub Repo?
3. Sind `SUPABASE_URL` (oder `NEXT_PUBLIC_SUPABASE_URL`) und `SUPABASE_SERVICE_ROLE_KEY` gesetzt?
4. Öffne direkt `https://DEINE-DOMAIN/api/state` und prüfe die JSON-Fehlermeldung (jetzt inkl. HTTP-Status + Supabase-Antwort).
5. Gibt es in Supabase die Tabelle `public.app_state`?
6. Nutzt du wirklich den Service-Role-Key in Vercel?
7. Nach Änderungen wirklich neu deployed?

---

## Hinweis
`server.js` ist nur für lokalen Betrieb. Für deinen gewünschten Weg sind `index.html` + `api/*` + Supabase relevant.
