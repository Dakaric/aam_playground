import VoiceClient from "@/components/VoiceClient";
import { createAccessToken } from "@/lib/livekit";

export default async function VoicePage() {
  const identity = `user-${crypto.randomUUID()}`;
  const { token, url, room } = await createAccessToken({ identity });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Voice Agent (LiveKit)</h1>
      <p className="text-sm text-gray-600 mb-4">
        Raum: <strong>{room}</strong> · Nutzer: <strong>{identity}</strong>
      </p>
      <VoiceClient url={url} token={token} />
      <p className="text-xs text-gray-500 mt-6">
        Hinweis: Stelle sicher, dass LIVEKIT_URL, LIVEKIT_API_KEY und LIVEKIT_API_SECRET gesetzt sind.
      </p>
    </div>
  );
}


