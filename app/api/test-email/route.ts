import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { sendEmail, formatInsuranceReminderEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Test endpoint - chỉ dùng để test email, xóa sau khi test xong
export async function GET() {
  try {
    // Get first user for testing
    const { rows: users } = await sql`
      SELECT id, email, name FROM users LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ 
        error: "No users found. Please register first." 
      }, { status: 404 });
    }

    const user = users[0];

    // Get expiring insurances for this user
    const { rows: insurances } = await sql`
      SELECT * FROM insurances
      WHERE user_id = ${user.id}
      AND status = false
      ORDER BY expiry_date ASC
      LIMIT 5
    `;

    if (insurances.length === 0) {
      return NextResponse.json({ 
        message: "No expiring insurances found. Create an insurance with expiry date = today to test.",
        user: user.email
      });
    }

    // Format insurances for email
    const insurancesWithDays = insurances.map(insurance => {
      const days = Math.ceil((new Date(insurance.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return {
        customer_name: insurance.customer_name,
        insurance_code: insurance.insurance_code,
        expiry_date: insurance.expiry_date,
        daysUntilExpiry: days,
      };
    });

    // Format and send email
    const { subject, html } = formatInsuranceReminderEmail(
      user.name || user.email,
      insurancesWithDays
    );

    const emailSent = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${user.email}`,
        insurancesCount: insurances.length,
        emailSubject: subject,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to send email. Check server logs.",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

