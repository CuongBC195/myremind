import { sql } from "@vercel/postgres";
import webpush from "web-push";

// Configure web-push (you'll need to set these in environment variables)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@myremind.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  data?: any
) {
  try {
    // Get all push subscriptions for this user
    const { rows } = await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ${userId}
    `;

    if (rows.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Send push notification to each subscription
    for (const sub of rows) {
      try {
        const subscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(subscription, JSON.stringify({
          title,
          message,
          ...data,
        }));

        sent++;
      } catch (error: any) {
        console.error(`Failed to send push to ${sub.endpoint}:`, error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`
            DELETE FROM push_subscriptions
            WHERE endpoint = ${sub.endpoint}
          `;
        }
        
        failed++;
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    throw error;
  }
}

