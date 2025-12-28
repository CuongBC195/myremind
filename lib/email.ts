// Email service for sending notifications
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
const createTransporter = () => {
  // Use environment variables for email configuration
  // Support for Gmail, SendGrid, or custom SMTP
  const emailService = process.env.EMAIL_SERVICE || "gmail";
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || emailUser;

  if (!emailUser || !emailPassword) {
    console.warn("Email credentials not configured. Email notifications will be disabled.");
    return null;
  }

  // Gmail configuration
  if (emailService === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword, // Use App Password for Gmail
      },
    });
  }

  // Custom SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.error("Email transporter not available. Check EMAIL_USER and EMAIL_PASSWORD environment variables.");
      return false;
    }

    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@myremind.app";

    await transporter.sendMail({
      from: `"MyRemind" <${emailFrom}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    });

    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Helper function to format insurance reminder email
export function formatInsuranceReminderEmail(
  userName: string,
  insurances: Array<{
    customer_name: string;
    insurance_code?: string;
    expiry_date: string;
    daysUntilExpiry: number;
  }>
): { subject: string; html: string } {
  const hasExpired = insurances.some((i) => i.daysUntilExpiry <= 0);
  const isSingle = insurances.length === 1;

  let subject: string;
  if (isSingle) {
    const insurance = insurances[0];
    if (insurance.daysUntilExpiry <= 0) {
      subject = `⚠️ Bảo hiểm đã hết hạn - ${insurance.customer_name}`;
    } else if (insurance.daysUntilExpiry === 1) {
      subject = `⚠️ Bảo hiểm hết hạn ngày mai - ${insurance.customer_name}`;
    } else {
      subject = `📅 Bảo hiểm hết hạn trong ${insurance.daysUntilExpiry} ngày - ${insurance.customer_name}`;
    }
  } else {
    subject = `📋 Bạn có ${insurances.length} bảo hiểm sắp hết hạn`;
  }

  const appUrl = process.env.APP_URL || "https://myremind.vercel.app";
  const expiredCount = insurances.filter((i) => i.daysUntilExpiry <= 0).length;
  const expiringCount = insurances.length - expiredCount;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .insurance-item { background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #000; border-radius: 4px; }
        .expired { border-left-color: #dc2626; }
        .expiring { border-left-color: #f59e0b; }
        .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MyRemind - Nhắc nhở Bảo hiểm</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${userName}</strong>,</p>
          
          ${hasExpired ? `<p style="color: #dc2626; font-weight: bold;">⚠️ Bạn có ${expiredCount} bảo hiểm đã hết hạn cần được gia hạn ngay!</p>` : ""}
          ${expiringCount > 0 ? `<p>📅 Bạn có ${expiringCount} bảo hiểm sắp đến hạn:</p>` : ""}
          
          <div style="margin: 20px 0;">
            ${insurances
              .map(
                (insurance) => `
              <div class="insurance-item ${insurance.daysUntilExpiry <= 0 ? "expired" : "expiring"}">
                <h3 style="margin: 0 0 10px 0;">${insurance.customer_name}</h3>
                ${insurance.insurance_code ? `<p style="margin: 5px 0; color: #666;">Mã số: <strong>${insurance.insurance_code}</strong></p>` : ""}
                <p style="margin: 5px 0;">
                  ${insurance.daysUntilExpiry <= 0 
                    ? `<span style="color: #dc2626; font-weight: bold;">Đã hết hạn ${Math.abs(insurance.daysUntilExpiry)} ngày</span>` 
                    : insurance.daysUntilExpiry === 1
                    ? `<span style="color: #f59e0b; font-weight: bold;">Hết hạn ngày mai</span>`
                    : `<span style="color: #f59e0b;">Hết hạn trong ${insurance.daysUntilExpiry} ngày</span>`
                  }
                </p>
                <p style="margin: 5px 0; color: #666;">Ngày hết hạn: <strong>${new Date(insurance.expiry_date).toLocaleDateString("vi-VN")}</strong></p>
              </div>
            `
              )
              .join("")}
          </div>
          
          <a href="${appUrl}" class="button">Xem chi tiết và gia hạn</a>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống MyRemind.</p>
            <p>Nếu bạn không muốn nhận email này, vui lòng cập nhật cài đặt trong tài khoản của bạn.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}
