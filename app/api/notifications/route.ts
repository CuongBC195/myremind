import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
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

      return NextResponse.json({ success: true, notifications: rows || [] });
    } catch (dbError) {
      console.error("Database error fetching notifications:", dbError);
      const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      
      // Check if table doesn't exist
      if (dbErrorMessage.includes("relation") && dbErrorMessage.includes("does not exist")) {
        console.error("Notifications table does not exist. Please run schema migration.");
        return NextResponse.json(
          { success: true, notifications: [] }, // Return empty array instead of error
          { status: 200 }
        );
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      await sql`
        UPDATE notifications
        SET read = true
        WHERE user_id = ${user.id} AND read = false
      `;
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await sql`
        UPDATE notifications
        SET read = true
        WHERE user_id = ${user.id} AND id = ANY(${notificationIds}::uuid[])
      `;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid request: specify notificationIds or markAll" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification", details: errorMessage },
      { status: 500 }
    );
  }
}

