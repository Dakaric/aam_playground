import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import type { ReadableStreamDefaultReader } from "node:stream/web";
import { AccessToken } from "livekit-server-sdk";
import {
  AudioFrame,
  AudioSource,
  AudioStream,
  Room,
  RoomEvent,
  RemoteAudioTrack,
  TrackKind,
  LocalAudioTrack,
  TrackPublishOptions,
  combineAudioFrames,
} from "@livekit/rtc-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
}

const config = {
  livekitUrl: process.env.VOICE_WORKER_LIVEKIT_URL ?? process.env.LIVEKIT_WS_URL ?? "ws://127.0.0.1:7880",
  roomName: process.env.LIVEKIT_VOICE_ROOM ?? "voice-agent",
  identity: process.env.VOICE_WORKER_IDENTITY ?? "voice-bot",
  apiKey: requireEnv("LIVEKIT_API_KEY"),
  apiSecret: requireEnv("LIVEKIT_API_SECRET"),
  openAiKey: requireEnv("OPENAI_API_KEY"),
  sttModel: process.env.VOICE_WORKER_STT_MODEL ?? "gpt-4o-mini-transcribe",
  ttsModel: process.env.VOICE_WORKER_TTS_MODEL ?? "gpt-4o-mini-tts",
  ttsVoice: process.env.VOICE_WORKER_TTS_VOICE ?? "alloy",
  language: process.env.VOICE_WORKER_LANGUAGE ?? "de",
  n8nWebhook: requireEnv("VOICE_WORKER_N8N_WEBHOOK_URL"),
  n8nToken: process.env.VOICE_WORKER_N8N_TOKEN,
  chunkSeconds: Number(process.env.VOICE_WORKER_CHUNK_SECONDS ?? "3"),
  minConfidence: Number(process.env.VOICE_WORKER_MIN_CONFIDENCE ?? "0.5"),
  ttsSampleRate: Number(process.env.VOICE_WORKER_TTS_SAMPLE_RATE ?? "24000"),
};

const openai = new OpenAI({ apiKey: config.openAiKey });

const pendingSessions = new Map<string, ParticipantSession>();

function createWorkerToken(identity: string) {
  const token = new AccessToken(config.apiKey, config.apiSecret, { identity });
  token.ttl = 60 * 60;
  token.addGrant({
    roomJoin: true,
    room: config.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return token.toJwt();
}

class ParticipantSession {
  private participantId: string;
  private track: RemoteAudioTrack;
  private reader: ReadableStreamDefaultReader<AudioFrame>;
  private chunks: AudioFrame[] = [];
  private samplesCollected = 0;
  private isActive = true;
  private processing: Promise<void> = Promise.resolve();

  constructor(track: RemoteAudioTrack, participantId: string) {
    this.track = track;
    this.participantId = participantId;
    const audioStream = new AudioStream(track, {
      sampleRate: 16000,
      numChannels: 1,
      frameSizeMs: 20,
    });
    this.reader = audioStream.getReader();
    void this.consume();
  }

  stop() {
    this.isActive = false;
    void this.reader.cancel();
  }

  private async consume() {
    try {
      while (this.isActive) {
        const { value, done } = await this.reader.read();
        if (done || !value) {
          break;
        }
        this.chunks.push(value);
        this.samplesCollected += value.samplesPerChannel;
        if (this.samplesCollected >= 16000 * config.chunkSeconds) {
          const chunkFrames = this.chunks;
          this.chunks = [];
          this.samplesCollected = 0;
          this.processing = this.processing.then(() => processAudioChunk(chunkFrames, this.participantId));
        }
      }
    } catch (err) {
      console.error(`Audio stream error for ${this.participantId}`, err);
    }
  }
}

async function processAudioChunk(frames: AudioFrame[], participantId: string) {
  if (!frames.length) return;
  const combined = combineAudioFrames(frames);
  const wav = audioFrameToWav(combined);
  const transcript = await transcribeAudio(wav);
  if (!transcript) {
    return;
  }
  const reply = await sendToN8n(transcript, participantId);
  if (!reply) {
    return;
  }
  const speechBuffer = await synthesizeSpeech(reply);
  if (!speechBuffer) {
    return;
  }
  await playAudio(speechBuffer);
}

async function transcribeAudio(buffer: Buffer) {
  try {
    const file = await toFile(buffer, "chunk.wav", { type: "audio/wav" });
    const response = await openai.audio.transcriptions.create({
      model: config.sttModel,
      file,
      language: config.language,
    });
    const text = (response.text ?? response.text ?? "").trim();
    return text.length ? text : null;
  } catch (err) {
    console.error("Transcription failed", err);
    return null;
  }
}

async function sendToN8n(text: string, participantId: string) {
  try {
    const res = await fetch(config.n8nWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.n8nToken ? { Authorization: `Bearer ${config.n8nToken}` } : {}),
      },
      body: JSON.stringify({
        participant: participantId,
        room: config.roomName,
        message: text,
      }),
    });
    if (!res.ok) {
      console.error("n8n webhook failed", await res.text());
      return null;
    }
    const data = (await res.json().catch(() => ({}))) as { reply?: string; text?: string };
    const reply = (data.reply ?? data.text ?? "").trim();
    return reply.length ? reply : null;
  } catch (err) {
    console.error("n8n webhook error", err);
    return null;
  }
}

async function synthesizeSpeech(text: string) {
  try {
  const response = await openai.audio.speech.create({
    model: config.ttsModel,
    voice: config.ttsVoice,
    input: text,
    response_format: "wav",
  });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("TTS failed", err);
    return null;
  }
}

const playbackSource = new AudioSource(config.ttsSampleRate, 1, 40);
let playbackTrack: LocalAudioTrack | undefined;

async function playAudio(wav: Buffer) {
  if (!playbackTrack) {
    return;
  }
  const frames = wavToFrames(wav, config.ttsSampleRate, 1, 20);
  for (const frame of frames) {
    await playbackSource.captureFrame(frame);
  }
}

function audioFrameToWav(frame: AudioFrame) {
  const header = Buffer.alloc(44);
  const dataLength = frame.data.length * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // audio format
  header.writeUInt16LE(frame.channels, 22);
  header.writeUInt32LE(frame.sampleRate, 24);
  header.writeUInt32LE(frame.sampleRate * frame.channels * 2, 28);
  header.writeUInt16LE(frame.channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  const pcm = Buffer.from(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);
  return Buffer.concat([header, pcm]);
}

function wavToFrames(buffer: Buffer, targetSampleRate: number, targetChannels: number, frameMs: number) {
  const { sampleRate, channels, pcm } = parseWav(buffer);
  if (sampleRate !== targetSampleRate || channels !== targetChannels) {
    throw new Error(`TTS returned unexpected format. Expected ${targetSampleRate} Hz mono audio.`);
  }
  const samplesPerFrame = Math.floor((sampleRate * frameMs) / 1000);
  const frames: AudioFrame[] = [];
  for (let offset = 0; offset < pcm.length; offset += samplesPerFrame * channels) {
    const slice = pcm.subarray(offset, Math.min(pcm.length, offset + samplesPerFrame * channels));
    const frame = AudioFrame.create(sampleRate, channels, Math.ceil(slice.length / channels));
    frame.data.set(slice);
    frames.push(frame);
  }
  return frames;
}

function parseWav(buffer: Buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Invalid WAV file");
  }
  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataStart = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "fmt ") {
      const format = buffer.readUInt16LE(offset + 8);
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      bitsPerSample = buffer.readUInt16LE(offset + 22);
      if (format !== 1 || bitsPerSample !== 16) {
        throw new Error("Only PCM16 WAV is supported");
      }
    } else if (chunkId === "data") {
      dataStart = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }
  if (!dataStart || !sampleRate || !channels) {
    throw new Error("Invalid WAV file headers");
  }
  const pcm = new Int16Array(
    buffer.buffer,
    buffer.byteOffset + dataStart,
    dataSize / 2,
  );
  return { sampleRate, channels, pcm };
}

async function main() {
  const room = new Room();

  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind !== TrackKind.KIND_AUDIO || participant.identity === config.identity) {
      return;
    }
    console.log(`Subscribed to audio from ${participant.identity}`);
    const session = new ParticipantSession(track as RemoteAudioTrack, participant.identity);
    pendingSessions.set(publication.sid!, session);
  });

  room.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
    const session = pendingSessions.get(publication.sid!);
    if (session) {
      session.stop();
      pendingSessions.delete(publication.sid!);
    }
  });

  const token = await createWorkerToken(config.identity);
  await room.connect(config.livekitUrl, token, { autoSubscribe: true, dynacast: false });
  console.log(`Voice worker connected to ${config.livekitUrl} as ${config.identity}`);

  playbackTrack = LocalAudioTrack.createAudioTrack("assistant-audio", playbackSource);
  await room.localParticipant?.publishTrack(playbackTrack, new TrackPublishOptions({}));

  const cleanup = async () => {
    pendingSessions.forEach((session) => session.stop());
    playbackTrack?.close(true);
    await room.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("Voice worker failed", err);
  process.exit(1);
});
