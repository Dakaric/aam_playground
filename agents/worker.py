import os
from livekit import agents
from livekit.agents import Agent, AgentSession, WorkerOptions, cli, JobContext
from livekit.plugins import silero
from livekit.plugins import openai as openai_plugins


AGENT_INSTRUCTIONS = os.getenv(
    "AGENT_INSTRUCTIONS",
    "Du bist ein hilfreicher deutschsprachiger Voice‑Assistent. Antworte kurz und freundlich.",
)

USE_REALTIME = os.getenv("AGENT_USE_REALTIME", "true").lower() == "true"

OPENAI_VOICE = os.getenv("OPENAI_VOICE", "alloy")
OPENAI_REALTIME_MODEL = os.getenv("OPENAI_REALTIME_MODEL", "gpt-4o-realtime-preview")

# Fallback (nicht-Realtime): getrennte Modelle
OPENAI_STT_MODEL = os.getenv("AGENT_STT_MODEL", "openai/whisper-1")
OPENAI_LLM_MODEL = os.getenv("AGENT_LLM_MODEL", "openai/gpt-4o-mini")
OPENAI_TTS_MODEL = os.getenv("AGENT_TTS_MODEL", "openai/tts-1")


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    agent = Agent(
        instructions=AGENT_INSTRUCTIONS,
    )

    if USE_REALTIME:
        session = AgentSession(
            vad=silero.VAD.load(),
            llm=openai_plugins.realtime.RealtimeModel(
                model=OPENAI_REALTIME_MODEL,
                voice=OPENAI_VOICE,
            ),
        )
    else:
        session = AgentSession(
            vad=silero.VAD.load(),
            stt=openai_plugins.STT(model=OPENAI_STT_MODEL),
            llm=openai_plugins.LLM(model=OPENAI_LLM_MODEL),
            tts=openai_plugins.TTS(model=OPENAI_TTS_MODEL, voice=OPENAI_VOICE),
        )

    await session.start(agent=agent, room=ctx.room)
    await session.generate_reply(instructions="Begrüße den Nutzer und biete Hilfe an.")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))



