import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUser, getUserByEmail } from "@/lib/db-auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const profileSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
});

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = profileSchema.parse(body);
    const { name, email } = validated;

    // Check if email is already used by another user
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Email này đã được sử dụng" },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(currentUser.id, { name, email });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi cập nhật" },
      { status: 500 }
    );
  }
}

