import { sql } from "@vercel/postgres";

export interface Insurance {
  id: string;
  customer_name: string;
  phone_number: string;
  insurance_type: "y_te"; // Only health insurance now
  expiry_date: string;
  status: boolean;
  priority?: "normal" | "high";
  reminder_frequency?: "on_due" | "3_days" | "1_week" | "2_weeks" | "1_month";
  notes?: string;
  date_of_birth?: string;
  phone_number_new?: string;
  cccd?: string;
  insurance_code?: string;
  address?: string;
  payment_amount?: number;
  user_id: string | null;
  created_at: string;
}

export async function getInsurances(filter?: {
  type?: string;
  expiringSoon?: boolean;
  userId?: string;
}) {
  let query;
  const userId = filter?.userId;
  
  if (filter?.expiringSoon) {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
    
    if (userId) {
      if (filter?.type && filter.type !== "all") {
        query = sql`
          SELECT * FROM insurances
          WHERE expiry_date BETWEEN ${todayStr} AND ${sevenDaysStr}
          AND status = false
          AND insurance_type = ${filter.type}
          AND user_id = ${userId}
          ORDER BY expiry_date ASC
        `;
      } else {
        query = sql`
          SELECT * FROM insurances
          WHERE expiry_date BETWEEN ${todayStr} AND ${sevenDaysStr}
          AND status = false
          AND user_id = ${userId}
          ORDER BY expiry_date ASC
        `;
      }
    } else {
      if (filter?.type && filter.type !== "all") {
        query = sql`
          SELECT * FROM insurances
          WHERE expiry_date BETWEEN ${todayStr} AND ${sevenDaysStr}
          AND status = false
          AND insurance_type = ${filter.type}
          ORDER BY expiry_date ASC
        `;
      } else {
        query = sql`
          SELECT * FROM insurances
          WHERE expiry_date BETWEEN ${todayStr} AND ${sevenDaysStr}
          AND status = false
          ORDER BY expiry_date ASC
        `;
      }
    }
  } else if (userId) {
    if (filter?.type && filter.type !== "all") {
      query = sql`
        SELECT * FROM insurances
        WHERE insurance_type = ${filter.type}
        AND user_id = ${userId}
        ORDER BY expiry_date ASC
      `;
    } else {
      query = sql`
        SELECT * FROM insurances
        WHERE user_id = ${userId}
        ORDER BY expiry_date ASC
      `;
    }
  } else if (filter?.type && filter.type !== "all") {
    query = sql`
      SELECT * FROM insurances
      WHERE insurance_type = ${filter.type}
      ORDER BY expiry_date ASC
    `;
  } else {
    query = sql`
      SELECT * FROM insurances
      ORDER BY expiry_date ASC
    `;
  }

  const { rows } = await query;
  return rows as Insurance[];
}

export async function createInsurance(data: {
  customer_name: string;
  phone_number: string;
  insurance_type: "y_te";
  expiry_date: string;
  priority?: "normal" | "high";
  reminder_frequency?: "on_due" | "3_days" | "1_week" | "2_weeks" | "1_month";
  notes?: string;
  date_of_birth?: string;
  phone_number_new?: string;
  cccd?: string;
  insurance_code?: string;
  address?: string;
  payment_amount?: string | number;
  user_id?: string;
}) {
  const { rows } = await sql`
    INSERT INTO insurances (
      customer_name, phone_number, insurance_type, expiry_date, 
      priority, reminder_frequency, notes, 
      date_of_birth, phone_number_new, cccd, insurance_code, address, payment_amount,
      user_id
    )
    VALUES (
      ${data.customer_name}, 
      ${data.phone_number}, 
      ${data.insurance_type}, 
      ${data.expiry_date}, 
      ${data.priority || "normal"}, 
      ${data.reminder_frequency || "1_week"}, 
      ${data.notes || null},
      ${data.date_of_birth || null},
      ${data.phone_number_new || null},
      ${data.cccd || null},
      ${data.insurance_code || null},
      ${data.address || null},
      ${data.payment_amount ? parseFloat(String(data.payment_amount)) : null},
      ${data.user_id || null}
    )
    RETURNING *
  `;
  return rows[0] as Insurance;
}

export async function updateInsurance(
  id: string,
  data: {
    customer_name?: string;
    phone_number?: string;
    insurance_type?: "xe_may" | "y_te" | "o_to" | "khac";
    expiry_date?: string;
    status?: boolean;
  }
) {
  // Get current record first
  const { rows: currentRows } = await sql`SELECT * FROM insurances WHERE id = ${id}`;
  if (currentRows.length === 0) {
    throw new Error("Insurance not found");
  }
  
  const current = currentRows[0] as Insurance;
  
  // Use current values if not provided
  const customer_name = data.customer_name ?? current.customer_name;
  const phone_number = data.phone_number ?? current.phone_number;
  const insurance_type = data.insurance_type ?? current.insurance_type;
  const expiry_date = data.expiry_date ?? current.expiry_date;
  const status = data.status ?? current.status;
  
  // Update with all values
  const { rows } = await sql`
    UPDATE insurances
    SET customer_name = ${customer_name},
        phone_number = ${phone_number},
        insurance_type = ${insurance_type},
        expiry_date = ${expiry_date},
        status = ${status}
    WHERE id = ${id}
    RETURNING *
  `;
  
  return rows[0] as Insurance;
}

export async function deleteInsurance(id: string) {
  await sql`DELETE FROM insurances WHERE id = ${id}`;
}

export async function getExpiringInsurances(days: number = 7, userId?: string) {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + days);
  
  if (userId) {
    const { rows } = await sql`
      SELECT * FROM insurances
      WHERE expiry_date BETWEEN ${today.toISOString().split('T')[0]} AND ${targetDate.toISOString().split('T')[0]}
      AND status = false
      AND user_id = ${userId}
      ORDER BY expiry_date ASC
    `;
    return rows as Insurance[];
  } else {
    const { rows } = await sql`
      SELECT * FROM insurances
      WHERE expiry_date BETWEEN ${today.toISOString().split('T')[0]} AND ${targetDate.toISOString().split('T')[0]}
      AND status = false
      ORDER BY expiry_date ASC
    `;
    return rows as Insurance[];
  }
}

