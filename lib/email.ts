const EMAIL_TO = process.env.EMAIL_TO || "cuong1952k3@gmail.com";

export interface Insurance {
  id: string;
  customer_name: string;
  phone_number: string;
  insurance_type: "xe_may" | "y_te" | "o_to" | "khac";
  expiry_date: string;
  status: boolean;
  created_at: string;
}

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  xe_may: "Bảo hiểm xe máy",
  y_te: "Bảo hiểm y tế",
  o_to: "Bảo hiểm ô tô",
  khac: "Bảo hiểm khác",
};

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatExpiryMessage(insurance: Insurance): string {
  const daysLeft = getDaysUntilExpiry(insurance.expiry_date);
  let daysText = "";
  
  if (daysLeft === 0) {
    daysText = "Hết hạn hôm nay";
  } else if (daysLeft === 1) {
    daysText = "Hết hạn ngày mai";
  } else {
    daysText = `Hết hạn sau ${daysLeft} ngày`;
  }
  
  return `${insurance.customer_name} - ${insurance.phone_number} - ${INSURANCE_TYPE_LABELS[insurance.insurance_type]} (${daysText})`;
}

export async function sendEmailNotification(
  insurances: Insurance[], 
  appUrl: string = "https://your-app-url.vercel.app",
  userEmail?: string,
  userName?: string
) {
  if (insurances.length === 0) {
    return;
  }

  const toEmail = userEmail || EMAIL_TO;
  const emailSubject = "🔔 NHẮC HẸN BẢO HIỂM HÔM NAY";
  
  let emailBody = `<h2>Xin chào ${userName || "Quý khách"},</h2>`;
  emailBody += "<h3>🔔 NHẮC HẸN BẢO HIỂM HÔM NAY:</h3><ul>";
  
  insurances.forEach((insurance) => {
    emailBody += `<li>${formatExpiryMessage(insurance)}</li>`;
  });
  
  emailBody += `</ul><p><a href="${appUrl}">📱 Link truy cập app</a></p>`;
  emailBody += `<p style="color: #666; font-size: 12px;">Email này được gửi tự động từ hệ thống MyRemind.</p>`;

  // If you have Resend or another email service, use it here
  // For now, this is a placeholder that you can integrate with your email service
  try {
    // Example with Resend (uncomment and configure if using Resend)
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: toEmail,
      subject: emailSubject,
      html: emailBody,
    });
    */
    
    console.log("Email notification prepared:", {
      to: toEmail,
      subject: emailSubject,
      body: emailBody,
    });
    
    // For now, we'll log it. You can integrate with your preferred email service
    return { success: true, message: "Email notification prepared" };
  } catch (error) {
    console.error("Failed to send email notification:", error);
    throw error;
  }
}

