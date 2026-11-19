import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Menggunakan request parameter secara otomatis memaksa route menjadi dinamis
  const url = request.url;

  if (process.env.ENABLE_DEBUG_ROUTES !== "true") {
    return NextResponse.json({ error: "Endpoint dinonaktifkan." }, { status: 403 });
  }

  // Sengaja memicu error untuk pengujian Sentry
  throw new Error(`Sentry test error from /api/debug-sentry (URL: ${url})`);
}
