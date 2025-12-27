import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 }
      );
    }

    // Store subscription in database
    // Create push_subscriptions table if it doesn't exist (without unique on endpoint)
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, endpoint)
      )
    `.catch(() => {
      // Table might already exist, ignore error
    });

    // Insert or update subscription
    try {
      await sql`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (${user.id}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
        ON CONFLICT (user_id, endpoint) 
        DO UPDATE SET 
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          created_at = CURRENT_TIMESTAMP
      `;
      
      console.log(`Successfully saved push subscription for user ${user.id}`);
      return NextResponse.json({ success: true });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      
      // If table doesn't exist, try to create it first
      if (dbError.message?.includes("does not exist") || dbError.code === "42P01") {
        try {
          await sql`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              endpoint TEXT NOT NULL,
              p256dh TEXT NOT NULL,
              auth TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_id, endpoint)
            )
          `;
          
          // Retry insert
          await sql`
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (${user.id}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
          `;
          
          return NextResponse.json({ success: true });
        } catch (retryError) {
          console.error("Retry error:", retryError);
          return NextResponse.json(
            { error: "Failed to create subscription table. Please run schema-notifications.sql" },
            { status: 500 }
          );
        }
      }
      
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error subscribing to push:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to subscribe: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (endpoint) {
      await sql`
        DELETE FROM push_subscriptions
        WHERE user_id = ${user.id} AND endpoint = ${endpoint}
      `;
    } else {
      // Delete all subscriptions for user
      await sql`
        DELETE FROM push_subscriptions
        WHERE user_id = ${user.id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

