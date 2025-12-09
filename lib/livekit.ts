import { AccessToken } from "livekit-server-sdk";

const DEFAULT_ROOM = process.env.LIVEKIT_VOICE_ROOM ?? "voice-agent";
const DEFAULT_TTL_SECONDS = Number(process.env.LIVEKIT_TOKEN_TTL ?? 60 * 60);

type TokenOptions = {
  identity: string;
  roomName?: string;
  metadata?: Record<string, unknown>;
};

export async function createLiveKitToken({
  identity,
  roomName,
  metadata,
}: TokenOptions): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "LIVEKIT_API_KEY oder LIVEKIT_API_SECRET fehlen. Bitte .env prüfen."
    );
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: DEFAULT_TTL_SECONDS,
    metadata: metadata ? JSON.stringify(metadata).slice(0, 1024) : undefined,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName ?? DEFAULT_ROOM,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  return token.toJwt();
}


