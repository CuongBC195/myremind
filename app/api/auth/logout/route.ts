import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear cookie properly by setting it with expired date and same options as when it was set
    const host = request.headers.get("host") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    
    // Delete cookie with same options as when it was set
    response.cookies.set("auth-token", "", {
      httpOnly: false,
      secure: !isLocalhost,
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      expires: new Date(0), // Set to past date
      path: "/",
    });
    
    // Also try delete method
    response.cookies.delete("auth-token");
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi đăng xuất" },
      { status: 500 }
    );
  }
}

