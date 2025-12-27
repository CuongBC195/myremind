import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db-auth";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validated = registerSchema.parse(body);
    const { name, email, password } = validated;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email này đã được sử dụng" },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);

    return NextResponse.json({
      success: true,
      message: "Đăng ký thành công",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a duplicate email error
    if (errorMessage.includes("duplicate key") && errorMessage.includes("users_email_key")) {
      return NextResponse.json(
        { success: false, error: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác." },
        { status: 400 }
      );
    }
    
    // Check if it's a database error
    if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
      return NextResponse.json(
        { success: false, error: "Database chưa được setup! Vui lòng chạy schema-auth.sql trên database." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: `Có lỗi xảy ra khi đăng ký: ${errorMessage}` },
      { status: 500 }
    );
  }
}

