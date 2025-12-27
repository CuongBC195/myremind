// Ignore Chrome DevTools 404 error
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({}, { status: 200 });
}

