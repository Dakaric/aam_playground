import { requireAdminToken } from "@/lib/auth";
import { createAccessToken } from "@/lib/livekit";

export async function POST(request: Request) {
  try {
    requireAdminToken(request);
  } catch (err) {
    return err as Response;
  }

  const json = await request.json().catch(() => ({} as any));
  const identity = (json.identity as string) || `user-${crypto.randomUUID()}`;
  const room = (json.room as string) || undefined;

  try {
    const { token, url, room: resolvedRoom } = await createAccessToken({ identity, room });
    return Response.json({ token, url, room: resolvedRoom });
  } catch (e: any) {
    return new Response(e?.message || "Failed to create token", { status: 500 });
  }
}


