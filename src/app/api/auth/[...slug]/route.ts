import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// On Cloudflare Pages, NEXT_PUBLIC_* vars are inlined at build time in client bundles
// but may not be available in edge route handlers.
// We use a server-side env var API_URL (set in Cloudflare Pages env settings),
// with NEXT_PUBLIC_API_URL as fallback (works when inlined at build time),
// and a hardcoded production URL as final fallback.
const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.brandbless.ru";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const endpoint = slug.join("/");

  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[api/auth/${endpoint}] error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const endpoint = slug.join("/");
  const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

  try {
    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[api/auth/${endpoint}] error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const endpoint = slug.join("/");
  const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[api/auth/${endpoint}] error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const endpoint = slug.join("/");
  const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[api/auth/${endpoint}] error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}
