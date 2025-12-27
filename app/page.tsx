"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getInsurancesAction } from "@/app/actions";
import { Insurance } from "@/lib/db";
import InsuranceList from "@/components/InsuranceList";
import Layout from "@/components/Layout";
import { differenceInDays } from "date-fns";
import { Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [allInsurances, setAllInsurances] = useState<Insurance[]>([]); // Store all insurances for filter tags
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("y_te"); // Only health insurance now
  const [filterExpiringSoon, setFilterExpiringSoon] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null); // "expired" | "renewed" | null

  function getDaysUntilExpiry(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return differenceInDays(expiry, today);
  }

  async function loadInsurances() {
    try {
      setLoading(true);
      setError(null);
      
      // Always load all insurances first for filter tags count
      // Note: type "all" means no filter, system only supports "y_te" now
      const allResult = await getInsurancesAction({
        type: "y_te", // Only health insurance now
        expiringSoon: false,
      });
      
      if (allResult.success && allResult.data) {
        setAllInsurances(allResult.data);
        
        // Apply client-side filtering based on filterStatus
        let filtered = allResult.data;
        
        if (filterStatus === "expired") {
          filtered = filtered.filter(i => !i.status && getDaysUntilExpiry(i.expiry_date) < 0);
        } else if (filterStatus === "renewed") {
          filtered = filtered.filter(i => i.status);
        } else if (filterExpiringSoon) {
          // Load filtered insurances from server (expiring in 7 days)
          const result = await getInsurancesAction({
            type: "y_te", // Only health insurance now
            expiringSoon: true,
          });
          if (result.success && result.data) {
            filtered = result.data;
          }
        }
        
        setInsurances(filtered);
      } else {
        const errorMsg = allResult.error || "Không thể tải danh sách bảo hiểm";
        setError(errorMsg);
        console.error("Failed to load insurances:", errorMsg);
        setInsurances([]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Có lỗi xảy ra";
      setError(errorMsg);
      console.error("Error loading insurances:", error);
      setInsurances([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Middleware will handle auth check, just load insurances
    // Set checkingAuth to false immediately since middleware already checked
    setCheckingAuth(false);
    loadInsurances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      loadInsurances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterExpiringSoon, filterStatus, checkingAuth]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
          <div className="text-slate-500">Đang kiểm tra đăng nhập...</div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 lg:p-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-medium mb-6">
          <Link href="/" className="text-slate-500 hover:text-black transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-slate-900 font-bold">Quản lý nhắc nhở</span>
        </nav>

        {/* Title Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-black md:text-4xl">
              Danh sách nhắc nhở
            </h1>
            <p className="text-base text-slate-600">
              Theo dõi và quản lý các hợp đồng bảo hiểm sắp đến hạn tái tục.
            </p>
          </div>
          <Link
            href="/add"
            className="group flex h-10 items-center gap-2 rounded-lg bg-black px-5 text-sm font-bold text-white shadow-md shadow-slate-400/20 transition-all hover:bg-slate-800 hover:shadow-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm nhắc nhở mới</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-black bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setFilterExpiringSoon(false);
                setFilterType("y_te");
                setFilterStatus(null);
              }}
              className={`h-12 px-6 rounded-lg border text-sm font-bold transition-colors ${
                !filterExpiringSoon && filterType === "y_te" && filterStatus === null
                  ? "border-black bg-black text-white hover:bg-slate-800"
                  : "border-slate-300 bg-white text-slate-600 hover:border-black hover:text-black"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => {
                setFilterExpiringSoon(true);
                setFilterType("y_te");
                setFilterStatus(null);
              }}
              className={`h-12 px-6 rounded-lg border text-sm font-bold transition-colors ${
                filterExpiringSoon && filterStatus === null
                  ? "border-black bg-black text-white hover:bg-slate-800"
                  : "border-slate-300 bg-white text-slate-600 hover:border-black hover:text-black"
              }`}
            >
              Sắp đến hạn (7 ngày)
            </button>
          </div>
          
          {/* Filter Tags */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button 
              onClick={() => {
                setFilterType("y_te");
                setFilterExpiringSoon(false);
                setFilterStatus(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
                !filterExpiringSoon && filterType === "y_te" && filterStatus === null
                  ? "border-black bg-black text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-black"
              }`}
            >
              Tất cả ({allInsurances.length})
            </button>
            <button 
              onClick={() => {
                setFilterExpiringSoon(true);
                setFilterType("y_te");
                setFilterStatus(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium text-slate-600 border-slate-200 hover:border-slate-400 hover:text-black ${
                filterExpiringSoon && filterStatus === null ? "border-black bg-black text-white" : "bg-white"
              }`}
            >
              Sắp đến hạn ({allInsurances.filter(i => !i.status && getDaysUntilExpiry(i.expiry_date) <= 7 && getDaysUntilExpiry(i.expiry_date) >= 0).length})
            </button>
            <button 
              onClick={() => {
                setFilterExpiringSoon(false);
                setFilterType("y_te");
                setFilterStatus("expired");
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium text-slate-600 border-slate-200 hover:border-slate-400 hover:text-black ${
                filterStatus === "expired" ? "border-black bg-black text-white" : "bg-white"
              }`}
            >
              Đã quá hạn ({allInsurances.filter(i => !i.status && getDaysUntilExpiry(i.expiry_date) < 0).length})
            </button>
            <button 
              onClick={() => {
                setFilterExpiringSoon(false);
                setFilterType("y_te");
                setFilterStatus("renewed");
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium text-slate-600 border-slate-200 hover:border-slate-400 hover:text-black ${
                filterStatus === "renewed" ? "border-black bg-black text-white" : "bg-white"
              }`}
            >
              Đã gia hạn ({allInsurances.filter(i => i.status).length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-1 rounded-xl border border-black bg-white overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
              <div className="text-slate-500">Đang tải dữ liệu...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="inline-block border-2 border-red-200 bg-red-50 rounded-lg px-6 py-4 mb-4">
                <div className="text-red-600 font-medium">{error}</div>
              </div>
              <button
                onClick={loadInsurances}
                className="rounded-lg border border-black bg-black px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <InsuranceList insurances={insurances} onUpdate={loadInsurances} />
          )}
        </div>

        <footer className="text-center text-sm text-slate-500 mt-8">
          <p>Hệ thống tự động kiểm tra và tạo thông báo mỗi ngày lúc 8h sáng</p>
        </footer>
      </div>
    </Layout>
  );
}

