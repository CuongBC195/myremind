"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/login");
      } else {
        setError(data.error || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi đăng ký");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white">
                  <Shield className="h-7 w-7" />
                </div>
              </div>
              <h1 className="text-3xl font-black text-black mb-2">Đăng ký</h1>
              <p className="text-slate-500">Tạo tài khoản mới để bắt đầu</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-black">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-200 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-slate-400 font-medium"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-black">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-200 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-slate-400 font-medium"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-black">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-200 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-slate-400 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-black">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-200 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-slate-400 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 rounded-lg bg-black text-white font-bold hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="h-5 w-5" />
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-black font-semibold hover:underline">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
