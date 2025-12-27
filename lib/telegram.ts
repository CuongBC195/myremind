const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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

export async function sendTelegramNotification(insurances: Insurance[], appUrl: string = "https://your-app-url.vercel.app") {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram credentials not configured");
    return;
  }

  if (insurances.length === 0) {
    return;
  }

  let message = "🔔 NHẮC HẸN HÔM NAY:\n\n";
  
  insurances.forEach((insurance) => {
    message += formatExpiryMessage(insurance) + "\n";
  });
  
  message += `\n📱 Link truy cập app: ${appUrl}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Telegram API error:", error);
      throw new Error(`Telegram API error: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    throw error;
  }
}

