## AI Automations Kurs – Projektgrundgerüst

Dieses Repository ist das Startprojekt für den Kurs. Es enthält eine Next.js‑App (App Router), Postgres/Prisma, sowie n8n und pgAdmin via Docker Compose.

### Voraussetzungen
- Docker Desktop (Windows/Mac) oder Docker Engine (Linux)
- Git und eine Shell (PowerShell/WSL/Bash)
- Optional: Node.js 20 LTS (nur für lokalen Dev ohne Docker)

### Schnellstart (lokal mit Docker)
1. Datei `env.example` kopieren und als `.env` speichern, Werte anpassen.
2. Container bauen und starten:
   ```bash
   docker compose up -d --build
   ```
3. Öffne `http://localhost:3000`.
4. Health‑Check: `http://localhost:3000/api/health` (erwartet `{ status: "ok" }`).
5. Admin‑Ping (mit Header):
   ```bash
   curl -H "X-Admin-Token: <dein-token>" http://localhost:3000/api/admin/ping
   ```

### Services (Docker Compose)
- `web` – Next.js App (Port 3000)
- `db` – Postgres 16 (internes Netzwerk)
- `n8n` – n8n Automation (nur Loopback: `127.0.0.1:5678`)
- `pgadmin` – pgAdmin (nur Loopback: `127.0.0.1:5050`)
- `mailpit` – Fake SMTP + Mail‑UI für lokale Tests (`http://localhost:8025`)
- `livekit` – LiveKit Server (nur Loopback: `127.0.0.1:7880`)

### Hetzner‑Server (Ubuntu) – Deployment
1. System aktualisieren und Docker installieren.
2. Firewall öffnen: nur 22 (SSH) und 3000 (Web) erlauben.
3. Repo klonen, `env.example` nach `.env` kopieren und Werte setzen (`ADMIN_TOKEN` stark wählen!).
4. Starten:
   ```bash
   docker compose up -d --build
   ```
5. Test:
   ```bash
   curl http://SERVER:3000/api/health
   ```
6. Zugriff auf n8n/pgAdmin per SSH‑Tunnel:
   ```bash
   ssh -L 5678:localhost:5678 user@SERVER
   ssh -L 5050:localhost:5050 user@SERVER
   ```
   Dann lokal öffnen: `http://localhost:5678` (n8n), `http://localhost:5050` (pgAdmin)
   Mail‑UI: `http://localhost:8025`

### Environment Variablen (siehe `env.example`)
- `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `DATABASE_URL`
- `ADMIN_TOKEN`, `AUTH_DISABLED` (für lokale Übungen `true` setzen, Server `false`)
- `NEXT_PUBLIC_SITE_URL`
- `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`
- `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`
- n8n E‑Mail: `N8N_EMAIL_MODE`, `N8N_SMTP_HOST`, `N8N_SMTP_PORT`, `N8N_SMTP_SSL`, `N8N_SMTP_USER`, `N8N_SMTP_PASS`, `N8N_SMTP_SENDER`
- n8n Links: `N8N_PROTOCOL`, `N8N_HOST`, optional `N8N_WEBHOOK_URL`
- LiveKit: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, optional `LIVEKIT_DEFAULT_ROOM`

### Prisma & Datenbank
- Erste Migration erzeugen (einmalig):
  ```bash
  docker compose exec web npx prisma migrate dev --name init
  ```
- In Produktion laufen Migrationen beim Start automatisch (`prisma migrate deploy`).
- Lokal (ohne Docker):
  ```bash
  npm i
  npx prisma generate
  npm run dev
  ```

### Sicherheit
- `.env` niemals committen. Starke Passwörter/Tokens verwenden.
- Auf dem Server `AUTH_DISABLED=false` setzen.

### Wichtige Hinweise (Plattform/Quoting)
- Windows PowerShell: Header‑Quotes bei curl ggf. mit doppelten Anführungszeichen:
  ```powershell
  curl -H "X-Admin-Token: <dein-token>" http://localhost:3000/api/admin/ping
  ```
- zsh/macOS: Tokens mit Sonderzeichen (!) in einfache Quotes setzen:
  ```bash
  curl -H 'X-Admin-Token: <dein-token>' http://localhost:3000/api/admin/ping
  ```
- Datenbank‑Werte müssen zueinander passen:
  `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` in `.env` müssen mit `DATABASE_URL` übereinstimmen.
  Wenn du Benutzer/DB‑Namen änderst, passe beides an.

### n8n E‑Mail Versand
- Lokal: E‑Mails landen in Mailpit (`http://localhost:8025`).
- Produktion: Trage SMTP‑Provider (Port 587/STARTTLS) in `.env` ein und setze `N8N_PROTOCOL=https` sowie `N8N_HOST=<deine-domain>`. Viele Hoster blocken ausgehenden Port 25.

### Nächste Schritte im Kurs
- n8n Webhook an `/api/webhooks/n8n` anbinden (Header `X-Admin-Token`).
- Blog‑Modelle erweitern und Admin‑Form ergänzen.
- Reverse‑Proxy/HTTPS (Caddy/Traefik) und Domain.
