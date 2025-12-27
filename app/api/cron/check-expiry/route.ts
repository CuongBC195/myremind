import { NextResponse } from "next/server";
import { getExpiringInsurances } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";
import { sql } from "@vercel/postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel Cron Jobs are automatically authenticated
  // Optional: Verify the cron secret header if set
  if (process.env.CRON_SECRET) {
    const cronSecret = request.headers.get("x-vercel-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const appUrl = process.env.APP_URL || "https://your-app-url.vercel.app";
    
    // Get all users
    const { rows: users } = await sql`
      SELECT id, email, name FROM users
    `;

    let totalNotifications = 0;

    // For each user, get their expiring insurances based on reminder_frequency
    for (const user of users) {
      try {
        // Get all insurances for this user that are not renewed
        const { rows: allInsurances } = await sql`
          SELECT * FROM insurances
          WHERE user_id = ${user.id}
          AND status = false
          ORDER BY expiry_date ASC
        `;

        // Filter insurances based on their reminder_frequency
        const allExpiring: typeof allInsurances = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const insurance of allInsurances) {
          const expiryDate = new Date(insurance.expiry_date);
          expiryDate.setHours(0, 0, 0, 0);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          const reminderFrequency = insurance.reminder_frequency || "1_week";
          let shouldNotify = false;

          switch (reminderFrequency) {
            case "on_due":
              // Notify on the expiry date (0 days)
              shouldNotify = daysUntilExpiry === 0;
              break;
            case "3_days":
              // Notify 3 days before
              shouldNotify = daysUntilExpiry === 3;
              break;
            case "1_week":
              // Notify 7 days before
              shouldNotify = daysUntilExpiry === 7;
              break;
            case "2_weeks":
              // Notify 14 days before
              shouldNotify = daysUntilExpiry === 14;
              break;
            case "1_month":
              // Notify 30 days before
              shouldNotify = daysUntilExpiry === 30;
              break;
            default:
              // Default to 7 days
              shouldNotify = daysUntilExpiry === 7;
          }

          // Also notify if already expired
          if (daysUntilExpiry < 0) {
            shouldNotify = true;
          }

          if (shouldNotify) {
            allExpiring.push(insurance);
          }
        }

        if (allExpiring.length > 0) {
          // Create in-app notifications for this user
          try {
            for (const insurance of allExpiring) {
              const daysUntilExpiry = Math.ceil(
                (new Date(insurance.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              
              const title = daysUntilExpiry <= 0 
                ? "Bảo hiểm đã hết hạn" 
                : daysUntilExpiry === 1 
                ? "Bảo hiểm hết hạn ngày mai" 
                : `Bảo hiểm hết hạn trong ${daysUntilExpiry} ngày`;
              
              const message = `Bảo hiểm của ${insurance.customer_name}${insurance.insurance_code ? ` (Mã: ${insurance.insurance_code})` : ''} ${daysUntilExpiry <= 0 ? 'đã hết hạn' : `sẽ hết hạn vào ${new Date(insurance.expiry_date).toLocaleDateString('vi-VN')}`}`;
              
              await sql`
                INSERT INTO notifications (user_id, insurance_id, title, message, type, read)
                VALUES (${user.id}, ${insurance.id}, ${title}, ${message}, ${daysUntilExpiry <= 0 ? 'warning' : 'reminder'}, false)
              `;
            }
            
            totalNotifications += allExpiring.length;
            console.log(`Created ${allExpiring.length} notifications for user ${user.email}`);
            
            // Send push notifications
            try {
              const hasExpired = allExpiring.some(i => {
                const days = Math.ceil((new Date(i.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return days <= 0;
              });
              
              const summaryTitle = allExpiring.length === 1
                ? (() => {
                    const insurance = allExpiring[0];
                    const days = Math.ceil((new Date(insurance.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return days <= 0 
                      ? "Bảo hiểm đã hết hạn" 
                      : days === 1 
                      ? "Bảo hiểm hết hạn ngày mai" 
                      : `Bảo hiểm hết hạn trong ${days} ngày`;
                  })()
                : `Bạn có ${allExpiring.length} bảo hiểm sắp hết hạn`;
              
              const summaryMessage = allExpiring.length === 1
                ? (() => {
                    const insurance = allExpiring[0];
                    const days = Math.ceil((new Date(insurance.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return `Bảo hiểm của ${insurance.customer_name}${insurance.insurance_code ? ` (Mã: ${insurance.insurance_code})` : ''} ${days <= 0 ? 'đã hết hạn' : `sẽ hết hạn vào ${new Date(insurance.expiry_date).toLocaleDateString('vi-VN')}`}`;
                  })()
                : `Có ${allExpiring.length} bảo hiểm cần được gia hạn. Nhấn để xem chi tiết.`;
              
              await sendPushNotification(
                user.id,
                summaryTitle,
                summaryMessage,
                {
                  type: hasExpired ? 'warning' : 'reminder',
                  insuranceIds: allExpiring.map(i => i.id),
                }
              );
            } catch (pushError) {
              console.error(`Failed to send push notification to ${user.email}:`, pushError);
            }
          } catch (error) {
            console.error(`Failed to create notifications for ${user.email}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked and sent notifications for ${totalNotifications} expiring insurances`,
      count: totalNotifications,
      usersProcessed: users.length,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

