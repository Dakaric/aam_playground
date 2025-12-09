"use client";

import { useCallback, useMemo, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useConnectionState,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import "@livekit/components-styles/prefabs/index.css";

type VoiceClientProps = {
  tokenEndpoint: string;
  defaultRoom: string;
  preferredServerUrl?: string | null;
};

type TokenResponse = {
  token: string;
  room: string;
  serverUrl?: string | null;
};

const CONNECTION_LABELS: Record<ConnectionState, string> = {
  [ConnectionState.Disconnected]: "Getrennt",
  [ConnectionState.Connecting]: "Verbinde …",
  [ConnectionState.Connected]: "Verbunden",
  [ConnectionState.Reconnecting]: "Verbindung wird wiederhergestellt …",
  [ConnectionState.SignalReconnecting]: "Signal wird erneut aufgebaut …",
};

function ConnectionBadge() {
  const state = useConnectionState();
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      <span
        className={`h-2 w-2 rounded-full ${
          state === ConnectionState.Connected
            ? "bg-emerald-500"
            : state === ConnectionState.Connecting ||
                state === ConnectionState.Reconnecting ||
                state === ConnectionState.SignalReconnecting
              ? "bg-amber-500"
              : "bg-zinc-400"
        }`}
      />
      {CONNECTION_LABELS[state] ?? state}
    </span>
  );
}

export default function VoiceClient({
  tokenEndpoint,
  defaultRoom,
  preferredServerUrl,
}: VoiceClientProps) {
  const [identity, setIdentity] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `web-${crypto.randomUUID().slice(0, 8)}`
      : `web-${Math.random().toString(16).slice(2, 10)}`
  );
  const [roomName, setRoomName] = useState(defaultRoom);
  const [status, setStatus] = useState<
    "idle" | "requesting" | "connected" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);

  const serverUrl = useMemo(
    () => tokenData?.serverUrl || preferredServerUrl || null,
    [tokenData, preferredServerUrl]
  );

  const handleConnect = useCallback(async () => {
    setStatus("requesting");
    setError(null);

    try {
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identity,
          roomName,
          metadata: {
            source: "web-app",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Token konnte nicht erstellt werden.");
      }

      const payload = (await response.json()) as TokenResponse;
      setTokenData(payload);
      setStatus("connected");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Unbekannter Fehler während der Verbindung."
      );
    }
  }, [identity, roomName, tokenEndpoint]);

  const handleDisconnect = useCallback(() => {
    setTokenData(null);
    setStatus("idle");
  }, []);

  return (
    <div className="space-y-6">
      {!tokenData && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Anzeigename
              </label>
              <input
                type="text"
                value={identity}
                maxLength={64}
                onChange={(event) => setIdentity(event.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Raumname
              </label>
              <input
                type="text"
                value={roomName}
                maxLength={128}
                onChange={(event) => setRoomName(event.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Der Raum muss mit dem Agent-Fluss in n8n/LiveKit übereinstimmen.
              </p>
            </div>
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleConnect}
              disabled={status === "requesting"}
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "requesting" ? "Verbinde …" : "Mit Voice-Agent verbinden"}
            </button>
          </div>
        </div>
      )}

      {tokenData && serverUrl && (
        <LiveKitRoom
          token={tokenData.token}
          serverUrl={serverUrl}
          connect
          options={{
            audioCaptureDefaults: {
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: true,
            },
          }}
          className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                Raum{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {tokenData.room}
                </span>
              </p>
              <p className="text-sm text-zinc-500">
                Angemeldet als{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {identity}
                </span>
              </p>
            </div>
            <ConnectionBadge />
          </div>

          <RoomAudioRenderer />
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <p className="mb-2 font-medium">Audio-Steuerung</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Aktiviere dein Mikrofon nach dem Beitritt. Video und Screen-Sharing
              sind standardmäßig deaktiviert.
            </p>
          </div>
          <ControlBar
            controls={{
              camera: false,
              microphone: true,
              screenShare: false,
              chat: false,
              leave: false,
            }}
            variation="minimal"
          />
          <button
            type="button"
            onClick={handleDisconnect}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Verbindung trennen
          </button>
        </LiveKitRoom>
      )}

      {tokenData && !serverUrl && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
          Kein <code>NEXT_PUBLIC_LIVEKIT_WS_URL</code> gesetzt. Bitte trage die öffentliche LiveKit-URL
          in der <code>.env</code> ein.
        </p>
      )}
    </div>
  );
}


