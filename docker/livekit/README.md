# LiveKit Stack

In diesem Ordner liegen alle Ressourcen für den selbstgehosteten LiveKit‑Stack,
der gemeinsam mit den übrigen Diensten via `docker compose` gestartet wird.

## Verzeichnisstruktur

| Datei | Zweck |
| --- | --- |
| `livekit.config.example.yaml` | Kommentierte Referenz der wichtigsten Felder. Dient nur zur Orientierung und wird **nicht** geladen. |
| `livekit.yaml` | Effektive Konfiguration, wird automatisch aus den `.env`‑Variablen generiert und ist deshalb git‑ignoriert. |

## Generierung der `livekit.yaml`

1. Führe `make setup` (oder `make setup-prod`) aus.
2. Das Setup fragt, ob `LIVEKIT_ENABLED` aktiviert werden soll.
3. Sobald `LIVEKIT_ENABLED=true` ist, ruft das Makefile automatisch
   `scripts/setup-livekit-config.cjs` auf.
4. Das Skript liest `.env`, prüft Pflichtwerte (`LIVEKIT_API_KEY`,
   `LIVEKIT_API_SECRET` etc.) und schreibt `docker/livekit/livekit.yaml`.

Die Konfiguration umfasst u. a.:

- `port`, `rtc.tcp_port`, `rtc.udp_port`
- Redis-Anbindung (`redis.address`, optional Benutzer/Passwort)
- API-Key/Secret (`keys`)
- Optional Webhooks (`webhook`) und Prometheus-Port
- Optional TURN-Block (`turn.enabled`, Domain, Ports, Credentials)

## Compose-Profile

- Im `docker-compose.yml` existiert das Profil `livekit` mit den Services
  `livekit-redis` und `livekit`.
- Das Makefile hängt dieses Profil automatisch an `dev`/`prod` an, wenn
  `LIVEKIT_ENABLED=true` gesetzt ist.
- Manuelles Starten nur des Voice-Stacks:

```bash
docker compose --profile livekit up -d
```

## Häufige Umgebungsvariablen

- `LIVEKIT_WS_URL` – interne WS-Adresse (z. B. `ws://livekit:7880`).
- `NEXT_PUBLIC_LIVEKIT_WS_URL` – öffentliche URL für Browser/Clients.
- `LIVEKIT_PORT`, `LIVEKIT_RTC_TCP_PORT`, `LIVEKIT_RTC_UDP_PORT` – Ports, die im
  Compose-File freigegeben werden.
- `LIVEKIT_REDIS_*` – Host, Port und optionale Credentials für Redis.
- `LIVEKIT_TURN_*` – aktiviert TURN/TLS, falls ein externer Relay benötigt wird.

> **Hinweis:** Passe die Ports bei Bedarf in der `.env` an. Jede Änderung erfordert
> ein erneutes `node scripts/setup-livekit-config.cjs`, welches automatisch von
> `make setup`, `make setup-dev` oder `make setup-prod` ausgeführt wird.

## Troubleshooting

- `livekit.yaml` existiert nicht → `LIVEKIT_ENABLED` steht vermutlich auf `false`.
- Ports kollidieren → Werte in `.env` anpassen und das Setup-Skript erneut ausführen.
- Redis Auth aktiviert → `LIVEKIT_REDIS_USERNAME`/`LIVEKIT_REDIS_PASSWORD` setzen.