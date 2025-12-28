import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { sendEmail, formatInsuranceReminderEmail } from "@/lib/email";

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

        // Filter insurances: Nhắc mỗi ngày từ ngày bắt đầu nhắc đến ngày hết hạn
        // Chỉ nhắc khi status = false (chưa gia hạn)
        const allExpiring: typeof allInsurances = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const insurance of allInsurances) {
          // Chỉ xử lý nếu chưa gia hạn
          if (insurance.status === true) {
            continue; // Đã gia hạn, bỏ qua
          }

          const expiryDate = new Date(insurance.expiry_date);
          expiryDate.setHours(0, 0, 0, 0);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          const reminderFrequency = insurance.reminder_frequency || "1_week";
          
          // Tính số ngày trước khi hết hạn để bắt đầu nhắc
          let daysBeforeExpiry = 0;
          switch (reminderFrequency) {
            case "on_due":
              daysBeforeExpiry = 0; // Bắt đầu nhắc vào ngày hết hạn
              break;
            case "3_days":
              daysBeforeExpiry = 3;
              break;
            case "1_week":
              daysBeforeExpiry = 7;
              break;
            case "2_weeks":
              daysBeforeExpiry = 14;
              break;
            case "1_month":
              daysBeforeExpiry = 30;
              break;
            default:
              daysBeforeExpiry = 7;
          }

          // Tính ngày bắt đầu nhắc
          const reminderStartDate = new Date(expiryDate);
          reminderStartDate.setDate(expiryDate.getDate() - daysBeforeExpiry);
          reminderStartDate.setHours(0, 0, 0, 0);

          // Tính ngày kết thúc nhắc (ngày hết hạn + 1 ngày)
          const reminderEndDate = new Date(expiryDate);
          reminderEndDate.setDate(expiryDate.getDate() + 1); // +1 ngày sau khi hết hạn
          reminderEndDate.setHours(0, 0, 0, 0);

          // Kiểm tra xem có trong khoảng thời gian nhắc không
          const isInReminderPeriod = today >= reminderStartDate && today <= reminderEndDate;
          
          if (!isInReminderPeriod) {
            continue; // Không trong khoảng thời gian nhắc
          }

          // Logic nhắc thông minh: Tránh spam
          // - Nếu còn > 7 ngày: Nhắc cách 3 ngày (ngày 1, 4, 7, 10, 13...)
          // - Nếu còn ≤ 7 ngày: Nhắc mỗi ngày
          // - Ngày hết hạn và sau hết hạn: Nhắc mỗi ngày
          let shouldNotify = false;
          
          if (daysUntilExpiry > 7) {
            // Còn nhiều ngày: Nhắc cách 3 ngày
            // Tính số ngày từ ngày bắt đầu nhắc đến hôm nay
            const daysFromStart = Math.ceil((today.getTime() - reminderStartDate.getTime()) / (1000 * 60 * 60 * 24));
            // Nhắc vào ngày 0, 3, 6, 9, 12... (cách 3 ngày)
            shouldNotify = daysFromStart % 3 === 0;
          } else if (daysUntilExpiry >= 0) {
            // Còn ≤ 7 ngày: Nhắc mỗi ngày
            shouldNotify = true;
          } else {
            // Đã quá hạn: Nhắc mỗi ngày (chỉ đến ngày hết hạn + 1)
            shouldNotify = true;
          }

          if (shouldNotify) {
            allExpiring.push(insurance);
          }
        }

        if (allExpiring.length > 0) {
          // Create in-app notifications for this user
          try {
            const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            const actuallyNotified: typeof allExpiring = []; // Track which insurances were actually notified
            
            for (const insurance of allExpiring) {
              // Check if already notified today for this insurance (avoid duplicate)
              const { rows: existingNotifications } = await sql`
                SELECT id FROM notifications
                WHERE user_id = ${user.id}
                AND insurance_id = ${insurance.id}
                AND DATE(created_at) = ${todayStr}
                LIMIT 1
              `;
              
              // Skip if already notified today
              if (existingNotifications.length > 0) {
                console.log(`Skipping ${insurance.customer_name} - already notified today`);
                continue;
              }
              
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
              
              actuallyNotified.push(insurance); // Track this insurance was notified
            }
            
            totalNotifications += actuallyNotified.length;
            console.log(`Created ${actuallyNotified.length} in-app notifications for user ${user.email}`);
            
            // Send email notification (only for insurances that were actually notified today)
            try {
              if (actuallyNotified.length > 0) {
                const insurancesWithDays = actuallyNotified.map(insurance => {
                
                  const days = Math.ceil((new Date(insurance.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return {
                    customer_name: insurance.customer_name,
                    insurance_code: insurance.insurance_code,
                    expiry_date: insurance.expiry_date,
                    daysUntilExpiry: days,
                  };
                });
                
                const { subject, html } = formatInsuranceReminderEmail(user.name || user.email, insurancesWithDays);
                
                const emailSent = await sendEmail({
                  to: user.email,
                  subject,
                  html,
                });
                
                if (emailSent) {
                  console.log(`Email notification sent successfully to ${user.email} for ${actuallyNotified.length} insurances`);
                } else {
                  console.error(`Failed to send email notification to ${user.email}`);
                }
              }
            } catch (emailError) {
              console.error(`Error sending email to ${user.email}:`, emailError);
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

