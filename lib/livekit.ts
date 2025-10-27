import { AccessToken } from "livekit-server-sdk";

type LiveKitConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
  defaultRoom?: string;
};

export function getLiveKitConfig(): LiveKitConfig {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const defaultRoom = process.env.LIVEKIT_DEFAULT_ROOM;

  if (!url || !apiKey || !apiSecret) {
    throw new Error("Missing LIVEKIT_URL, LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
  }

  return { url, apiKey, apiSecret, defaultRoom };
}

export async function createAccessToken(params: {
  identity: string;
  room?: string;
  publish?: boolean;
  subscribe?: boolean;
}): Promise<{ token: string; url: string; room: string }> {
  const { url, apiKey, apiSecret, defaultRoom } = getLiveKitConfig();
  const room = params.room || defaultRoom || "voice-agent";
  const publish = params.publish ?? true;
  const subscribe = params.subscribe ?? true;

  const at = new AccessToken(apiKey, apiSecret, { identity: params.identity });
  at.addGrant({ roomJoin: true, room, canPublish: publish, canSubscribe: subscribe });
  const token = await at.toJwt();
  return { token, url, room };
}


