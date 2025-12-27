import { NextResponse } from "next/server";

// Simple placeholder icon generator
// Returns a simple PNG icon as base64

const iconSizes: Record<string, number> = {
  "192": 192,
  "512": 512,
  "180": 180,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = iconSizes[sizeParam] || 192;
  
  // Create a simple SVG icon
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#000000" rx="${size * 0.1}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">MR</text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

