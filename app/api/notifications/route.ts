import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows } = await sql`
      SELECT 
        n.id,
        n.user_id,
        n.insurance_id,
        n.title,
        n.message,
        n.type,
        n.read,
        n.created_at
      FROM notifications n
      WHERE n.user_id = ${user.id}
      ORDER BY n.created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, read } = await request.json();

    if (notificationId) {
      // Mark single notification as read
      await sql`
        UPDATE notifications
        SET read = ${read !== undefined ? read : true}
        WHERE id = ${notificationId} AND user_id = ${user.id}
      `;
    } else {
      // Mark all notifications as read
      await sql`
        UPDATE notifications
        SET read = true
        WHERE user_id = ${user.id} AND read = false
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

