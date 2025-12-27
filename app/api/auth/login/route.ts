import { NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/db-auth";
import { generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("Login attempt for email:", email);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    console.log("Verifying user password...");
    const user = await verifyUserPassword(email, password);

    if (!user) {
      console.log("Invalid credentials for email:", email);
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    console.log("User verified, generating token...");
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Return token in response body - client will store in localStorage
    const response = NextResponse.json(
      {
        success: true,
        token: token, // Send token in response body for localStorage
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );

    // Also set cookie (non-httpOnly) for middleware compatibility
    // Client-side will use localStorage, middleware will use cookie
    const host = request.headers.get("host") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    
    response.cookies.set("auth-token", token, {
      httpOnly: false, // Allow client-side access for localStorage sync
      secure: !isLocalhost,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.log("Login successful, token generated for user:", user.email);
    console.log("Token stored in both localStorage (client) and cookie (middleware)");

    return response;
  } catch (error) {
    console.error("Login error details:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error message:", errorMessage);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    // Check if it's a database error
    if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
      return NextResponse.json(
        { success: false, error: "Database chưa được setup! Vui lòng chạy schema-auth.sql trên database." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: `Có lỗi xảy ra khi đăng nhập: ${errorMessage}` },
      { status: 500 }
    );
  }
}

