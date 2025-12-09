import type { Metadata } from "next";
import VoiceClient from "./VoiceClient";

export const metadata: Metadata = {
  title: "Voice-Agent | AI Automations Kurs",
};

const DEFAULT_ROOM = process.env.LIVEKIT_VOICE_ROOM ?? "voice-agent";
const PUBLIC_WS_URL = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL ?? null;

export default function VoicePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Voice-Agent (LiveKit Demo)</h1>
        <p className="text-zinc-600 dark:text-zinc-300">
          Auf dieser Seite kannst du den LiveKit-Stack testen, Tokens über die
          Next.js API generieren und dich mit einem Raum verbinden. Die Seite
          eignet sich als Ausgangspunkt, um später einen n8n-Flow oder einen
          Agent-Workflow mit dem gleichen Raum zu verbinden.
        </p>
      </div>

      <VoiceClient
        tokenEndpoint="/api/voice/token"
        defaultRoom={DEFAULT_ROOM}
        preferredServerUrl={PUBLIC_WS_URL}
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-6 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        <h2 className="mb-3 text-base font-semibold">So verbindest du den Agenten</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Stelle sicher, dass <code>LIVEKIT_ENABLED=true</code> und dass deine
            Domain/Ports in der <code>.env</code> gesetzt sind.
          </li>
          <li>
            Starte oder aktualisiere den Stack mit <code>make env-prod</code> (oder{" "}
            <code>make dev-n8n</code>), damit Zertifikate, Redis-Passwort &amp;{" "}
            <code>livekit.yaml</code> automatisch erneuert werden.
          </li>
          <li>
            Trage denselben Raum (<code>{DEFAULT_ROOM}</code>) im n8n-/Agent-Flow
            ein, sodass der Bot und der Browser im gleichen Channel landen.
          </li>
          <li>
            Öffne diese Seite, wähle einen Anzeigenamen und klicke auf
            &quot;Verbinden&quot;. Anschließend kannst du Mikrofon-Toggle &amp;
            Control-Bar verwenden.
          </li>
        </ol>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Tipp: Für produktive Zertifikate kannst du die automatisch generierten
          Dateien unter <code>docker/livekit/certs</code> durch echte TLS-Zertifikate
          ersetzen und die Pfade in der <code>.env</code> anpassen.
        </p>
      </section>
    </div>
  );
}



