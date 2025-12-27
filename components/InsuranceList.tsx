"use client";

import { useState } from "react";
import Link from "next/link";
import { Insurance } from "@/lib/db";
import { toggleStatusAction, deleteInsuranceAction } from "@/app/actions";
import { differenceInDays, format } from "date-fns";
import { Phone, Check, X, Trash2, Edit, Eye } from "lucide-react";

interface InsuranceListProps {
  insurances: Insurance[];
  onUpdate?: () => void;
}

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  xe_may: "Bảo hiểm xe máy",
  y_te: "Bảo hiểm y tế",
  o_to: "Bảo hiểm ô tô",
  khac: "Bảo hiểm khác",
};

const INSURANCE_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  xe_may: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
  },
  y_te: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
  },
  o_to: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    text: "text-purple-700",
  },
  khac: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-700",
  },
};

export default function InsuranceList({ insurances, onUpdate }: InsuranceListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function getDaysUntilExpiry(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return differenceInDays(expiry, today);
  }

  function getExpiryStatus(expiryDate: string, status: boolean) {
    if (status) {
      return { 
        bg: "bg-emerald-50", 
        border: "border-emerald-300", 
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: "Đã gia hạn" 
      };
    }
    
    const daysLeft = getDaysUntilExpiry(expiryDate);
    if (daysLeft < 0) {
      return { 
        bg: "bg-red-50", 
        border: "border-red-300", 
        text: "text-red-700",
        dot: "bg-red-500",
        label: "Quá hạn" 
      };
    } else if (daysLeft === 0) {
      return { 
        bg: "bg-red-100", 
        border: "border-red-400", 
        text: "text-red-800",
        dot: "bg-red-600",
        label: "Hết hạn hôm nay" 
      };
    } else if (daysLeft <= 7) {
      return { 
        bg: "bg-yellow-50", 
        border: "border-yellow-300", 
        text: "text-yellow-700",
        dot: "bg-yellow-500",
        label: "Sắp hết hạn" 
      };
    } else {
      return { 
        bg: "bg-slate-50", 
        border: "border-slate-200", 
        text: "text-slate-600",
        dot: "bg-slate-400",
        label: "Chờ xử lý" 
      };
    }
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    await toggleStatusAction(id, currentStatus);
    if (onUpdate) onUpdate();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa bảo hiểm này?")) return;
    
    setDeletingId(id);
    const result = await deleteInsuranceAction(id);
    setDeletingId(null);
    
    if (result.success && onUpdate) {
      onUpdate();
    }
  }

  if (insurances.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-slate-500 text-lg font-medium">Chưa có bảo hiểm nào</div>
        <div className="text-slate-400 text-sm mt-2">Hãy thêm bảo hiểm mới để bắt đầu!</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left">
        <thead>
          <tr className="border-b border-black bg-white">
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black">
              Khách hàng
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black">
              Ngày gia hạn
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black">
              Loại BH
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black">
              Trạng thái
            </th>
            <th className="px-6 py-4 text-end text-xs font-bold uppercase tracking-wider text-black">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {insurances.map((insurance) => {
            const status = getExpiryStatus(insurance.expiry_date, insurance.status);
            const daysLeft = getDaysUntilExpiry(insurance.expiry_date);
            const initials = getInitials(insurance.customer_name);
            
            return (
              <tr key={insurance.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-900">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/details/${insurance.id}`}
                        className="font-bold text-black hover:text-slate-600 transition-colors block"
                      >
                        {insurance.customer_name}
                      </Link>
                      {insurance.phone_number && (
                        <a
                          href={`tel:${insurance.phone_number}`}
                          className="text-xs text-slate-500 hover:text-black transition-colors flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {insurance.phone_number}
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">
                    {format(new Date(insurance.expiry_date), "dd/MM/yyyy")}
                  </p>
                  {daysLeft < 0 && (
                    <p className="text-xs text-slate-600 font-bold">Quá hạn {Math.abs(daysLeft)} ngày</p>
                  )}
                  {daysLeft === 0 && (
                    <p className="text-xs text-slate-600 font-bold">Hết hạn hôm nay</p>
                  )}
                  {daysLeft > 0 && daysLeft <= 7 && (
                    <p className="text-xs text-slate-600 font-bold">Còn {daysLeft} ngày</p>
                  )}
                  {daysLeft > 7 && (
                    <p className="text-xs text-slate-500">Còn {daysLeft} ngày</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const colors = INSURANCE_TYPE_COLORS[insurance.insurance_type] || INSURANCE_TYPE_COLORS.khac;
                    return (
                      <span className={`inline-flex items-center rounded-full border ${colors.border} ${colors.bg} px-2.5 py-1 text-xs font-bold ${colors.text}`}>
                        {INSURANCE_TYPE_LABELS[insurance.insurance_type]}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border ${status.border} ${status.bg} px-3 py-1 text-xs font-bold ${status.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                    {status.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-end">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/details/${insurance.id}`}
                      className="rounded-lg border border-transparent p-2 text-slate-400 hover:text-black transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    <Link
                      href={`/edit/${insurance.id}`}
                      className="rounded-lg border border-transparent p-2 text-slate-400 hover:text-black transition-colors"
                      title="Sửa"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(insurance.id, insurance.status)}
                      className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-black hover:text-white hover:border-black transition-colors"
                      title={insurance.status ? "Đánh dấu chưa gia hạn" : "Đánh dấu đã gia hạn"}
                    >
                      {insurance.status ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(insurance.id)}
                      disabled={deletingId === insurance.id}
                      className="rounded-none border border-transparent p-2 text-slate-400 hover:text-black transition-colors disabled:opacity-50"
                      title="Xóa"
                    >
                      {deletingId === insurance.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

