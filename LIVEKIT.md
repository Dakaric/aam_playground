## LiveKit – Setup & Konfiguration (Voice Agent)

Diese Anleitung beschreibt, wie du LiveKit für den Voice‑Agent in diesem Repo einrichtest – entweder mit LiveKit Cloud oder lokalem LiveKit‑Server. Am Ende kannst du die Seite `http://localhost:3000/voice` öffnen, dein Mikro freigeben und einer LiveKit‑Room‑Session beitreten.

### Was wurde bereits implementiert?
- Server‑Token‑Endpoint: `app/api/voice/token/route.ts` (signiert LiveKit‑Tokens)
- Token‑Helfer: `lib/livekit.ts`
- Client: `app/voice/page.tsx` und `components/VoiceClient.tsx` (verbindet sich in einen Raum und veröffentlicht das Mikro)

Du musst nur noch deine LiveKit‑Zugangsdaten setzen und ggf. einen lokalen LiveKit‑Server starten (falls du nicht LiveKit Cloud verwendest).

---

## 1) Zugänge (API Key, API Secret, URL) beschaffen

Du hast zwei Optionen.

### Option A: LiveKit Cloud (empfohlen für schnellen Start)
1. Erstelle einen Account in der LiveKit Cloud: [LiveKit Cloud Console](https://cloud.livekit.io)
2. Lege ein Projekt an.
3. Hole dir für das Projekt:
   - den WebSocket‑Endpoint (Server‑URL; beginnt mit `wss://`),
   - einen API Key und ein API Secret (unter „Keys“ oder „API Keys“).

Diese drei Werte trägst du in die `.env` ein (siehe Abschnitt 2).

### Option B: Lokaler LiveKit‑Server (Self‑Hosted)
Wenn du lokal bleiben willst, kannst du LiveKit selbst hosten. Typische Wege:
- Binary installieren (siehe „Self‑Host“ / „Server Installation“ in der LiveKit Doku)
- oder Docker verwenden und den Server auf Port `7880` bereitstellen

Wichtig: Du brauchst einen API Key und ein API Secret, mit dem der Server die vom Backend signierten Tokens verifizieren kann. Bei Self‑Hosted definierst du diese Werte in der Server‑Konfiguration und verwendest exakt dieselben Werte auch in diesem Projekt (siehe Abschnitt 2). Setze die Server‑URL auf `ws://localhost:7880`.

Nützliche Doku‑Einstiege:
- LiveKit Cloud – Projekte & Keys: [Docs – Cloud](https://docs.livekit.io/cloud/)
- LiveKit Self‑Hosted – Installation & Konfiguration: [Docs – Self‑Host](https://docs.livekit.io/home/self-host/)
- Authentifizierung & Token: [Docs – Authentication](https://docs.livekit.io/home/get-started/authentication/)

---

## 2) .env Variablen setzen

Öffne `.env` (oder kopiere `env.example`). Relevante Variablen:

```env
LIVEKIT_URL=ws://localhost:7880   # oder wss://<dein-cloud-endpoint>
LIVEKIT_API_KEY=                   # Cloud: aus Console; Self‑Hosted: wie im Server konfiguriert
LIVEKIT_API_SECRET=                # Cloud: aus Console; Self‑Hosted: wie im Server konfiguriert
LIVEKIT_DEFAULT_ROOM=voice-agent   # optional; Standard‑Raumname

# Für lokale Tests ohne Admin‑Header
# AUTH_DISABLED=true
```

Hinweise:
- Für LiveKit Cloud MUSS `LIVEKIT_URL` mit `wss://` beginnen.
- Für lokalen Server kann `LIVEKIT_URL` auf `ws://localhost:7880` bleiben – vorausgesetzt, dein LiveKit‑Server läuft dort.
- Wenn du den Admin‑Header vermeiden willst, setze für lokale Entwicklung `AUTH_DISABLED=true` (nicht auf dem Server!).

---

## 3) Starten und testen

1. Abhängigkeiten installieren:

```bash
npm install
```

2. LiveKit‑Server:
   - Per Docker Compose ist jetzt ein `livekit` Service enthalten (läuft im `--dev` Modus). Beim folgenden Compose‑Start wird er automatisch mitgestartet und auf `ws://localhost:7880` bereitgestellt.
   - Alternativ (ohne Compose): LiveKit‑Server manuell starten und auf `ws://localhost:7880` hören lassen.

3. App + LiveKit + Agent starten (Docker‑Stack):

```bash
npm run dev
# oder per Docker:
docker compose up -d --build
```

4. Öffne die Voice‑Seite:

```
http://localhost:3000/voice
```

5. Erwarte: Browser fragt nach Mikrofon‑Freigabe, Status „Verbinden“, dann „Verbunden“. Dein Mikro wird veröffentlicht; Remote‑Audio wird automatisch angehängt (unsichtbares `<audio>` Element).

### Token‑Endpoint manuell testen

Der Token‑Endpoint ist per Admin‑Header geschützt, außer `AUTH_DISABLED=true`:

```bash
curl -sS -X POST \
  -H 'X-Admin-Token: <ADMIN_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"identity":"user-cli"}' \
  http://localhost:3000/api/voice/token
```

Antwort (Beispiel):

```json
{ "token": "<jwt>", "url": "ws://localhost:7880", "room": "voice-agent" }
```

---

## 4) Häufige Fragen / Troubleshooting

- „Kann die LiveKit URL so bleiben?“ – Ja, wenn du einen lokalen LiveKit‑Server auf Port `7880` laufen hast. Für LiveKit Cloud musst du die `wss://…`‑URL aus der Cloud Console eintragen.
- Browser‑Rechte: Für Mikrofon braucht der Browser HTTPS oder `http://localhost`. Lokale Entwicklung auf `localhost` ist okay.
- Mixed‑Content: Wenn deine Seite per HTTPS läuft, muss LiveKit per `wss://` erreichbar sein.
- 401 beim `/api/voice/token`: Entweder `X-Admin-Token` mitsenden oder `AUTH_DISABLED=true` in `.env` (nur lokal!).
- Kein Audio zu hören: Prüfe Lautstärke, Output‑Device im OS und Browser‑Autoplay‑Policies. Unsere Implementation hängt ein verborgenes `<audio>` Element an.

---

## 5) Nächste Schritte: „sprechender“ Agent

In diesem Repo ist ein Agent‑Worker bereits vorbereitet (`agents/worker.py`) und wird über Docker als Service `agent` mitgestartet. Standardmäßig nutzt er OpenAI Realtime (LLM+STT+TTS in einem). Du kannst das Verhalten in `.env` steuern:

```env
# OpenAI Schlüssel
OPENAI_API_KEY=...

# true = OpenAI Realtime (eine API für LLM+TTS+STT)
AGENT_USE_REALTIME=true
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
OPENAI_VOICE=alloy

# false = getrennte Modelle (alle OpenAI)
AGENT_USE_REALTIME=false
AGENT_STT_MODEL=openai/whisper-1
AGENT_LLM_MODEL=openai/gpt-4o-mini
AGENT_TTS_MODEL=openai/tts-1

# Optional: System‑Prompt für den Agent
AGENT_INSTRUCTIONS=Du bist ein hilfreicher deutschsprachiger Voice‑Assistent. Antworte kurz und freundlich.
```

Der Worker verbindet sich in denselben LiveKit‑Raum und spricht dort zurück. Stelle sicher, dass `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` und `OPENAI_API_KEY` gesetzt sind. 


