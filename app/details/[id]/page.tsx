"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import { Insurance } from "@/lib/db";
import { getInsuranceAction } from "@/app/actions";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronRight,
  User,
  Phone,
  Calendar,
  CreditCard,
  Home,
  DollarSign,
  AlertCircle,
  Clock,
  FileText,
  Edit,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { numberToVietnameseCurrency } from "@/lib/currency-utils";

export default function InsuranceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInsurance() {
      try {
        setLoading(true);
        const result = await getInsuranceAction(id);
        
        if (result.success && result.data) {
          setInsurance(result.data);
        } else {
          setError(result.error || "Không thể tải thông tin bảo hiểm");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi tải thông tin");
        console.error("Error loading insurance:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadInsurance();
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
            <div className="text-slate-500">Đang tải thông tin...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !insurance) {
    return (
      <Layout>
        <div className="w-full max-w-[1000px] mx-auto p-4 md:p-8 lg:p-12">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error || "Không tìm thấy thông tin bảo hiểm"}
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-slate-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </div>
      </Layout>
    );
  }

  const daysUntilExpiry = differenceInDays(new Date(insurance.expiry_date), new Date());
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

  const getStatusBadge = () => {
    if (insurance.status) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
          Đã gia hạn
        </span>
      );
    } else if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
          Đã hết hạn
        </span>
      );
    } else if (isExpiringSoon) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-600"></span>
          Sắp hết hạn
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
          Còn hiệu lực
        </span>
      );
    }
  };

  const getPriorityBadge = () => {
    if (insurance.priority === "high") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
          <AlertCircle className="h-3 w-3" />
          Ưu tiên cao
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
        Bình thường
      </span>
    );
  };

  const getReminderFrequencyLabel = () => {
    const labels: Record<string, string> = {
      on_due: "Đến hạn",
      "3_days": "3 ngày trước",
      "1_week": "1 tuần trước",
      "2_weeks": "2 tuần trước",
      "1_month": "1 tháng trước",
    };
    return labels[insurance.reminder_frequency || "1_week"] || "1 tuần trước";
  };

  return (
    <Layout>
      <div className="w-full max-w-[1000px] mx-auto p-4 md:p-8 lg:p-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Nhắc nhở
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 font-medium">Chi tiết bảo hiểm</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
                {insurance.customer_name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge()}
                {getPriorityBadge()}
              </div>
            </div>
            <Link
              href={`/edit/${insurance.id}`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-slate-900 text-white font-bold hover:bg-black shadow-md shadow-slate-900/20 transition-all"
            >
              <Edit className="h-5 w-5" />
              Chỉnh sửa
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Thông tin khách hàng */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-slate-800" />
              Thông tin khách hàng & Hợp đồng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Tên khách hàng
                </label>
                <p className="text-base font-bold text-slate-900">{insurance.customer_name}</p>
              </div>
              
              {insurance.phone_number && (
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Số điện thoại
                  </label>
                  <a
                    href={`tel:${insurance.phone_number}`}
                    className="text-base font-medium text-slate-900 hover:text-black transition-colors flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {insurance.phone_number}
                  </a>
                </div>
              )}

              {insurance.date_of_birth && (
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Ngày tháng năm sinh
                  </label>
                  <p className="text-base font-medium text-slate-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(insurance.date_of_birth), "dd/MM/yyyy", { locale: vi })}
                  </p>
                </div>
              )}

              {insurance.cccd && (
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    CCCD/CMND
                  </label>
                  <p className="text-base font-medium text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {insurance.cccd}
                  </p>
                </div>
              )}

              {insurance.address && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Địa chỉ
                  </label>
                  <p className="text-base font-medium text-slate-900 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    {insurance.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin bảo hiểm */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-800" />
              Thông tin bảo hiểm
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Loại bảo hiểm
                </label>
                <p className="text-base font-medium text-slate-900">Bảo hiểm Y tế</p>
              </div>

              {insurance.insurance_code && (
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Mã số bảo hiểm
                  </label>
                  <p className="text-base font-medium text-slate-900">{insurance.insurance_code}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Ngày hết hạn
                </label>
                <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(insurance.expiry_date), "dd/MM/yyyy", { locale: vi })}
                </p>
                {isExpired && (
                  <p className="text-sm text-red-600 font-bold mt-1">
                    Đã hết hạn {Math.abs(daysUntilExpiry)} ngày
                  </p>
                )}
                {!isExpired && isExpiringSoon && (
                  <p className="text-sm text-yellow-600 font-bold mt-1">
                    Còn {daysUntilExpiry} ngày
                  </p>
                )}
                {!isExpired && !isExpiringSoon && (
                  <p className="text-sm text-slate-500 mt-1">
                    Còn {daysUntilExpiry} ngày
                  </p>
                )}
              </div>

              {insurance.payment_amount && (
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Tiền nộp
                  </label>
                  <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {(insurance.payment_amount || 0).toLocaleString("vi-VN")} đ
                  </p>
                  <p className="text-sm text-slate-600 font-medium mt-1">
                    {numberToVietnameseCurrency(insurance.payment_amount || 0)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cài đặt nhắc nhở */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-800" />
              Cài đặt nhắc nhở
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Mức độ ưu tiên
                </label>
                {getPriorityBadge()}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Tần suất nhắc nhở
                </label>
                <p className="text-base font-medium text-slate-900">
                  {getReminderFrequencyLabel()}
                </p>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          {insurance.notes && (
            <div className="p-6 md:p-8 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-800" />
                Ghi chú thêm
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-base text-slate-700 whitespace-pre-wrap">{insurance.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                  Ngày tạo
                </label>
                <p className="text-sm text-slate-600">
                  {format(new Date(insurance.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                  Trạng thái
                </label>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-white hover:border-slate-400 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    </Layout>
  );
}
