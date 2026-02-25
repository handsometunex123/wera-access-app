// This route is now handled by next-auth. Use signIn from next-auth/react on the client.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Use next-auth for authentication. This route is deprecated." }, { status: 400 });
}
