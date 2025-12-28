"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { User, Mail, Lock, Save, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { clearAuthToken } from "@/lib/auth-client";

interface UserData {
  id: string;
  email: string;
  name: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setSuccess("Cập nhật thông tin thành công");
      } else {
        setError(data.error || "Cập nhật thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Đổi mật khẩu thành công");
        e.currentTarget.reset();
      } else {
        setError(data.error || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleLogout() {
    // Clear localStorage first
    clearAuthToken();
    
    // Clear cookie on client side as well
    document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Clear cookie via API
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout API error:", err);
    }
    
    // Force redirect to login
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
            <div className="text-slate-500">Đang tải...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
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
            <span className="text-slate-900 font-medium">Hồ sơ</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
                Hồ sơ cá nhân
              </h1>
              <p className="text-slate-500 text-base font-normal max-w-2xl">
                Quản lý thông tin tài khoản và mật khẩu
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-white hover:border-slate-400 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-100 flex">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === "profile"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === "password"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Đổi mật khẩu
            </button>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            {activeTab === "profile" ? (
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-900 text-sm font-semibold leading-normal">Họ và tên</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        name="name"
                        type="text"
                        defaultValue={user.name}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-slate-300 bg-white text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-900 text-sm font-semibold leading-normal">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        name="email"
                        type="email"
                        defaultValue={user.email}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-slate-300 bg-white text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-lg bg-slate-900 text-white font-bold hover:bg-black shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-900 text-sm font-semibold leading-normal">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        name="currentPassword"
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-slate-300 bg-white text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-900 text-sm font-semibold leading-normal">Mật khẩu mới</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-slate-300 bg-white text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-slate-900 text-sm font-semibold leading-normal">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-slate-300 bg-white text-base text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-8 py-3 rounded-lg bg-slate-900 text-white font-bold hover:bg-black shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="h-5 w-5" />
                    {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

