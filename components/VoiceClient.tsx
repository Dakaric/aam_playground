"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
} from "livekit-client";

type Props = {
  url: string;
  token: string;
};

export default function VoiceClient({ url, token }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      room?.disconnect();
    };
  }, [room]);

  const handleTrackSubscribed = useCallback(
    (track: RemoteTrack, _pub: RemoteTrackPublication, _participant: RemoteParticipant) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      element.style.display = "none";
      audioContainerRef.current?.appendChild(element);
    },
    []
  );

  const handleTrackUnsubscribed = useCallback((track: RemoteTrack) => {
    track.detach();
  }, []);

  const join = useCallback(async () => {
    if (connecting || connected) return;
    setConnecting(true);
    try {
      const r = new Room({ adaptiveStream: true, dynacast: true });
      r.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      r.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      r.on(RoomEvent.Disconnected, () => setConnected(false));

      await r.connect(url, token);
      await r.localParticipant.setMicrophoneEnabled(true);
      setRoom(r);
      setConnected(true);
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  }, [connecting, connected, handleTrackSubscribed, handleTrackUnsubscribed, token, url]);

  const leave = useCallback(async () => {
    await room?.disconnect();
    setConnected(false);
    setRoom(null);
  }, [room]);

  const toggleMic = useCallback(async () => {
    if (!room) return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, [micEnabled, room]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={join}
          disabled={connecting || connected}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {connecting ? "Verbinden…" : connected ? "Verbunden" : "Verbinden"}
        </button>
        <button
          onClick={leave}
          disabled={!connected}
          className="px-3 py-2 rounded bg-gray-200 disabled:opacity-50"
        >
          Verlassen
        </button>
        <button
          onClick={toggleMic}
          disabled={!connected}
          className="px-3 py-2 rounded bg-gray-200 disabled:opacity-50"
        >
          {micEnabled ? "Mic aus" : "Mic an"}
        </button>
      </div>
      <div ref={audioContainerRef} />
    </div>
  );
}


