import { NextResponse } from "next/server";
import { createLiveKitToken } from "@/lib/livekit";

const DEFAULT_ROOM = process.env.LIVEKIT_VOICE_ROOM ?? "voice-agent";
const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
const IDENTITY_REGEX = /^[a-zA-Z0-9_\-]{3,64}$/;
const ROOM_REGEX = /^[a-zA-Z0-9_\-]{1,128}$/;

type TokenRequest = {
  identity?: string;
  roomName?: string;
  metadata?: Record<string, unknown>;
};

function randomIdentity() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `gast-${crypto.randomUUID().slice(0, 8)}`;
  }
  const random = Math.random().toString(16).slice(2, 10);
  return `gast-${random}`;
}

function sanitizeIdentity(value?: string) {
  if (!value) {
    return randomIdentity();
  }
  const trimmed = value.trim();
  if (IDENTITY_REGEX.test(trimmed)) {
    return trimmed;
  }
  return trimmed
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .slice(0, 64)
    .padEnd(4, "x");
}

function sanitizeRoom(value?: string) {
  if (!value) {
    return DEFAULT_ROOM;
  }
  const trimmed = value.trim();
  if (ROOM_REGEX.test(trimmed)) {
    return trimmed;
  }
  return DEFAULT_ROOM;
}

export async function POST(request: Request) {
  let payload: TokenRequest = {};
  try {
    payload = (await request.json()) as TokenRequest;
  } catch {
    // ignore invalid body – we fall back to defaults
  }

  try {
    const identity = sanitizeIdentity(payload.identity);
    const roomName = sanitizeRoom(payload.roomName);
    const token = await createLiveKitToken({
      identity,
      roomName,
      metadata:
        payload.metadata && typeof payload.metadata === "object"
          ? payload.metadata
          : undefined,
    });

    return NextResponse.json({
      token,
      room: roomName,
      serverUrl: DEFAULT_WS_URL,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler beim Token";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
      }
    );
  }
}


