"use server";

import { revalidatePath } from "next/cache";
import {
  getInsurances,
  createInsurance,
  updateInsurance,
  deleteInsurance,
  type Insurance,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { sql } from "@vercel/postgres";

const insuranceSchema = z.object({
  customer_name: z.string().min(1, "Tên khách hàng không được để trống"),
  phone_number: z.string().optional().default(""),
  insurance_type: z.enum(["y_te"]).default("y_te"), // Only health insurance
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  priority: z.enum(["normal", "high"]).default("normal"),
  reminder_frequency: z.enum(["on_due", "3_days", "1_week", "2_weeks", "1_month"]).default("1_week"),
  notes: z.string().optional().nullable().transform(val => val && val.trim() ? val.trim() : undefined),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().transform(val => val || undefined),
  phone_number_new: z.string().optional().nullable().transform(val => val && val.trim() ? val.trim() : undefined),
  cccd: z.string().optional().nullable().transform(val => val && val.trim() ? val.trim() : undefined),
  insurance_code: z.string().optional().nullable().transform(val => val && val.trim() ? val.trim() : undefined),
  address: z.string().optional().nullable().transform(val => val && val.trim() ? val.trim() : undefined),
  payment_amount: z.string().optional().transform(val => {
    if (!val || !val.trim()) return undefined;
    const num = parseFloat(val.replace(/,/g, ""));
    if (isNaN(num) || num < 0) {
      throw new z.ZodError([{
        code: "custom",
        path: ["payment_amount"],
        message: "Số tiền nộp không hợp lệ"
      }]);
    }
    return num;
  }),
});

export async function getInsurancesAction(filter?: {
  type?: string;
  expiringSoon?: boolean;
}) {
  try {
    const user = await getCurrentUser();
    const insurances = await getInsurances({
      ...filter,
      userId: user?.id,
    });
    return { success: true, data: insurances };
  } catch (error) {
    console.error("Error fetching insurances:", error);
    return { success: false, error: "Không thể tải danh sách bảo hiểm" };
  }
}

export async function createInsuranceAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Bạn cần đăng nhập để thực hiện thao tác này" };
    }

    const priority = formData.get("priority") as string | null;
    const reminderFrequency = formData.get("reminder_frequency") as string | null;
    const notes = formData.get("notes") as string | null;
    const phoneNumber = formData.get("phone_number") as string | null;
    const dateOfBirth = formData.get("date_of_birth") as string | null;
    const phoneNumberNew = formData.get("phone_number_new") as string | null;
    const cccd = formData.get("cccd") as string | null;
    const insuranceCode = formData.get("insurance_code") as string | null;
    const address = formData.get("address") as string | null;
    const paymentAmount = formData.get("payment_amount") as string | null;
    
    const data = {
      customer_name: formData.get("customer_name") as string,
      phone_number: phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : "",
      insurance_type: "y_te" as const, // Always health insurance
      expiry_date: formData.get("expiry_date") as string,
      priority: (priority === "high" ? "high" : "normal") as "normal" | "high",
      reminder_frequency: (reminderFrequency && ["on_due", "3_days", "1_week", "2_weeks", "1_month"].includes(reminderFrequency) 
        ? reminderFrequency 
        : "1_week") as "on_due" | "3_days" | "1_week" | "2_weeks" | "1_month",
      notes: notes && notes.trim() ? notes.trim() : undefined,
      date_of_birth: dateOfBirth && dateOfBirth.trim() ? dateOfBirth.trim() : undefined,
      phone_number_new: phoneNumberNew && phoneNumberNew.trim() ? phoneNumberNew.trim() : undefined,
      cccd: cccd && cccd.trim() ? cccd.trim() : undefined,
      insurance_code: insuranceCode && insuranceCode.trim() ? insuranceCode.trim() : undefined,
      address: address && address.trim() ? address.trim() : undefined,
      payment_amount: paymentAmount && paymentAmount.trim() ? paymentAmount.trim() : undefined,
      user_id: user.id,
    };

    const validated = insuranceSchema.parse(data);
    
    // Use transaction with advisory lock to prevent race conditions
    // This works for both local and serverless environments
    try {
      // Generate a unique lock key based on user_id and form data
      const lockKey = `insurance_${user.id}_${validated.customer_name}_${validated.expiry_date}_${validated.insurance_type}`;
      const lockHash = await sql`
        SELECT hashtext(${lockKey})::bigint as hash
      `;
      const lockValue = lockHash.rows[0]?.hash || BigInt(0);
      
      // Acquire advisory lock (blocks other requests with same key)
      await sql`
        SELECT pg_advisory_xact_lock(${lockValue})
      `;
      
      // Now check for duplicate within last 30 seconds (longer window)
      const { rows: existing } = await sql`
        SELECT id FROM insurances
        WHERE user_id = ${user.id}
        AND customer_name = ${validated.customer_name}
        AND expiry_date = ${validated.expiry_date}
        AND insurance_type = ${validated.insurance_type}
        AND created_at > NOW() - INTERVAL '30 seconds'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      if (existing && existing.length > 0 && existing[0]?.id) {
        // Duplicate detected, return existing instead of creating new
        const { rows: existingInsurance } = await sql`
          SELECT * FROM insurances WHERE id = ${existing[0].id}
        `;
        if (existingInsurance && existingInsurance.length > 0) {
          revalidatePath("/");
          console.log(`[DUPLICATE PREVENTED] Returning existing insurance ${existing[0].id} instead of creating new`);
          return { success: true, data: existingInsurance[0] as Insurance };
        }
      }
      
      // No duplicate found, proceed with creation
      const insurance = await createInsurance({ ...validated, user_id: user.id });
      revalidatePath("/");
      console.log(`[INSURANCE CREATED] New insurance ${insurance.id} created for user ${user.id}`);
      return { success: true, data: insurance };
    } catch (dbError) {
      console.error("Error in createInsuranceAction:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      
      // If insert failed, check if it's because another request created it (race condition)
      // This handles the case where 2 requests both pass the duplicate check
      // but one inserts first, causing the second to potentially fail or create duplicate
      try {
        // Check again for the record (maybe it was just created by another request)
        const { rows: existing } = await sql`
          SELECT * FROM insurances
          WHERE user_id = ${user.id}
          AND customer_name = ${validated.customer_name}
          AND expiry_date = ${validated.expiry_date}
          AND insurance_type = ${validated.insurance_type}
          AND created_at > NOW() - INTERVAL '15 seconds'
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        if (existing && existing.length > 0) {
          // Found existing record (likely created by concurrent request)
          revalidatePath("/");
          console.log(`[RACE CONDITION HANDLED] Returning existing insurance ${existing[0].id} created by concurrent request`);
          return { success: true, data: existing[0] as Insurance };
        }
      } catch (findError) {
        console.error("Error finding existing insurance after insert failure:", findError);
      }
      
      // If it's a duplicate key error from unique constraint, handle it
      if (errorMessage.includes("duplicate key") || errorMessage.includes("unique constraint")) {
        // Try one more time to find existing
        try {
          const { rows: existing } = await sql`
            SELECT * FROM insurances
            WHERE user_id = ${user.id}
            AND customer_name = ${validated.customer_name}
            AND expiry_date = ${validated.expiry_date}
            AND insurance_type = ${validated.insurance_type}
            ORDER BY created_at DESC
            LIMIT 1
          `;
          if (existing && existing.length > 0) {
            revalidatePath("/");
            return { success: true, data: existing[0] as Insurance };
          }
        } catch (findError) {
          console.error("Error finding existing insurance:", findError);
        }
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Error creating insurance:", error);
    
    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
      return { 
        success: false, 
        error: "Database chưa được setup! Vui lòng chạy schema.sql trên Neon database." 
      };
    }
    if (errorMessage.includes("type") && errorMessage.includes("does not exist")) {
      return { 
        success: false, 
        error: "Enum type chưa được tạo! Vui lòng chạy schema.sql trên Neon database." 
      };
    }
    
    return { 
      success: false, 
      error: `Không thể tạo bảo hiểm mới: ${errorMessage}` 
    };
  }
}

export async function updateInsuranceAction(
  id: string,
  formData: FormData
) {
  try {
    const data: any = {};
    
    // Only include fields that have valid values (not empty strings)
    const customer_name = formData.get("customer_name") as string;
    if (customer_name && customer_name.trim().length > 0) {
      data.customer_name = customer_name.trim();
    }
    
    const phone_number = formData.get("phone_number") as string;
    if (phone_number && phone_number.trim().length > 0) {
      data.phone_number = phone_number.trim();
    }
    
    const insurance_type = formData.get("insurance_type") as string;
    if (insurance_type && ["xe_may", "y_te", "o_to", "khac"].includes(insurance_type)) {
      data.insurance_type = insurance_type as "xe_may" | "y_te" | "o_to" | "khac";
    }
    
    const expiry_date = formData.get("expiry_date") as string;
    if (expiry_date && expiry_date.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) {
      data.expiry_date = expiry_date;
    }
    
    if (formData.has("status")) {
      data.status = formData.get("status") === "true";
    }

    const reminderFrequency = formData.get("reminder_frequency") as string | null;
    if (reminderFrequency && ["on_due", "3_days", "1_week", "2_weeks", "1_month"].includes(reminderFrequency)) {
      data.reminder_frequency = reminderFrequency as "on_due" | "3_days" | "1_week" | "2_weeks" | "1_month";
    }

    const priority = formData.get("priority") as string | null;
    if (priority && ["normal", "high"].includes(priority)) {
      data.priority = priority as "normal" | "high";
    }

    // Validate required fields if they are being updated
    if (data.customer_name !== undefined && data.customer_name.length === 0) {
      return { success: false, error: "Tên khách hàng không được để trống" };
    }
    if (data.phone_number !== undefined && data.phone_number.length < 10) {
      return { success: false, error: "Số điện thoại không hợp lệ" };
    }
    if (data.expiry_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.expiry_date)) {
      return { success: false, error: "Ngày không hợp lệ" };
    }

    const insurance = await updateInsurance(id, data);
    revalidatePath("/");
    revalidatePath(`/edit/${id}`);
    return { success: true, data: insurance };
  } catch (error) {
    console.error("Error updating insurance:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      error: `Không thể cập nhật bảo hiểm: ${errorMessage}` 
    };
  }
}

export async function deleteInsuranceAction(id: string) {
  try {
    await deleteInsurance(id);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting insurance:", error);
    return { success: false, error: "Không thể xóa bảo hiểm" };
  }
}

export async function toggleStatusAction(id: string, currentStatus: boolean) {
  try {
    const insurance = await updateInsurance(id, { status: !currentStatus });
    revalidatePath("/");
    return { success: true, data: insurance };
  } catch (error) {
    console.error("Error toggling status:", error);
    return { success: false, error: "Không thể cập nhật trạng thái" };
  }
}

export async function acknowledgeReminderAction(id: string, pauseReminder: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Bạn cần đăng nhập để thực hiện thao tác này" };
    }

    const now = new Date().toISOString();
    const insurance = await updateInsurance(id, {
      acknowledged_at: now,
      reminder_paused: pauseReminder,
    });
    
    revalidatePath("/");
    return { success: true, data: insurance };
  } catch (error) {
    console.error("Error acknowledging reminder:", error);
    return { success: false, error: "Không thể cập nhật trạng thái nhắc nhở" };
  }
}

export async function getInsuranceAction(id: string) {
  try {
    const user = await getCurrentUser();
    const insurances = await getInsurances({
      userId: user?.id,
    });
    const insurance = insurances.find((i) => i.id === id);
    if (!insurance) {
      return { success: false, error: "Không tìm thấy bảo hiểm" };
    }
    // Check if user owns this insurance
    if (user && insurance.user_id !== user.id) {
      return { success: false, error: "Bạn không có quyền xem bảo hiểm này" };
    }
    return { success: true, data: insurance };
  } catch (error) {
    console.error("Error fetching insurance:", error);
    return { success: false, error: "Không thể tải thông tin bảo hiểm" };
  }
}

