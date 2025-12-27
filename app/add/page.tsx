"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInsuranceAction } from "@/app/actions";
import Layout from "@/components/Layout";
import { User, Calendar, Save, ChevronRight, Search, Clock, AlertCircle, CreditCard, MapPin, DollarSign, Phone } from "lucide-react";
import Link from "next/link";
import { numberToVietnameseCurrency } from "@/lib/currency-utils";

export default function AddInsurancePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createInsuranceAction(formData);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Có lỗi xảy ra");
    }

    setIsSubmitting(false);
  }

  return (
    <Layout>
      <div className="w-full max-w-[1000px] mx-auto p-4 md:p-8 lg:p-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Nhắc nhở
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">Thêm mới</span>
          </div>
          <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">
            Thêm nhắc nhở mới
          </h1>
          <p className="text-slate-500 text-base font-normal max-w-2xl mt-2">
            Tạo nhắc nhở gia hạn hợp đồng cho khách hàng để không bỏ lỡ thời điểm quan trọng. Hệ thống sẽ tự động gửi thông báo theo cấu hình.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Thông tin hợp đồng */}
            <div className="p-6 md:p-8 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-slate-800" />
                Thông tin hợp đồng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="customer_name"
                      required
                      className="w-full rounded-lg border-slate-300 bg-white px-4 py-3 pr-10 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      placeholder="Nhập tên khách hàng..."
                      type="text"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Search className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Ngày tháng năm sinh
                  </label>
                  <div className="relative">
                    <input
                      name="date_of_birth"
                      className="w-full rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      type="date"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                      name="phone_number_new"
                      className="w-full rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      placeholder="0901234567"
                      type="tel"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    CCCD/CMND
                  </label>
                  <div className="relative">
                    <input
                      name="cccd"
                      className="w-full rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      placeholder="001234567890"
                      type="text"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Mã số bảo hiểm
                  </label>
                  <div className="relative">
                    <input
                      name="insurance_code"
                      className="w-full rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      placeholder="Mã số bảo hiểm y tế"
                      type="text"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Tiền nộp (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      name="payment_amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      placeholder="1000000"
                      type="number"
                      min="0"
                      step="1000"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  {paymentAmount && parseFloat(paymentAmount) > 0 && (
                    <p className="text-sm text-slate-600 font-medium mt-1">
                      {numberToVietnameseCurrency(paymentAmount)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <textarea
                      name="address"
                      className="w-full min-h-[80px] rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-y transition-all"
                      placeholder="Nhập địa chỉ..."
                      rows={3}
                    />
                  </div>
                </div>
                <input type="hidden" name="insurance_type" value="y_te" />
              </div>
            </div>

            {/* Thời gian & Ghi chú */}
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-800" />
                Thời gian & Ghi chú
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Ngày hết hạn hợp đồng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex w-full items-center">
                    <input
                      name="expiry_date"
                      required
                      className="w-full rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all pr-10"
                      type="date"
                    />
                    <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Mức độ ưu tiên
                  </label>
                  <div className="flex gap-2">
                    <label className="cursor-pointer flex-1">
                      <input
                        defaultChecked
                        className="peer sr-only"
                        name="priority"
                        type="radio"
                        value="normal"
                      />
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-slate-100 peer-checked:text-slate-900 transition-all">
                        <span>Bình thường</span>
                      </div>
                    </label>
                    <label className="cursor-pointer flex-1">
                      <input
                        className="peer sr-only"
                        name="priority"
                        type="radio"
                        value="high"
                      />
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all">
                        <AlertCircle className="h-4 w-4" />
                        <span>Cao</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Tần suất nhắc nhở
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <label className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      name="reminder_frequency"
                      type="radio"
                      value="on_due"
                    />
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-white p-4 text-center hover:bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all h-full">
                      <span className="text-sm font-bold">Đến hạn</span>
                      <span className="text-xs opacity-80 mt-1">Vào ngày hết hạn</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      name="reminder_frequency"
                      type="radio"
                      value="3_days"
                    />
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-white p-4 text-center hover:bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all h-full">
                      <span className="text-sm font-bold">3 ngày</span>
                      <span className="text-xs opacity-80 mt-1">Trước ngày hết hạn</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      defaultChecked
                      className="peer sr-only"
                      name="reminder_frequency"
                      type="radio"
                      value="1_week"
                    />
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-white p-4 text-center hover:bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all h-full">
                      <span className="text-sm font-bold">1 tuần</span>
                      <span className="text-xs opacity-80 mt-1">Trước ngày hết hạn</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      name="reminder_frequency"
                      type="radio"
                      value="2_weeks"
                    />
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-white p-4 text-center hover:bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all h-full">
                      <span className="text-sm font-bold">2 tuần</span>
                      <span className="text-xs opacity-80 mt-1">Trước ngày hết hạn</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      name="reminder_frequency"
                      type="radio"
                      value="1_month"
                    />
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-white p-4 text-center hover:bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all h-full">
                      <span className="text-sm font-bold">1 tháng</span>
                      <span className="text-xs opacity-80 mt-1">Trước ngày hết hạn</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Ghi chú thêm
                </label>
                <textarea
                  name="notes"
                  className="w-full min-h-[120px] rounded-lg border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-y transition-all"
                  placeholder="Nhập các thông tin cần lưu ý..."
                  rows={4}
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-white hover:border-slate-400 transition-colors shadow-sm"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-slate-900 text-white font-bold hover:bg-black shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {isSubmitting ? "Đang lưu..." : "Lưu nhắc nhở"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

