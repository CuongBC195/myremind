import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    // Clear cookie (client will clear localStorage)
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

