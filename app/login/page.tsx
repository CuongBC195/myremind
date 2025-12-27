"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, Shield } from "lucide-react";
import { setAuthToken } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log("Sending login request...");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important: include cookies in request
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        setError("Server trả về lỗi không hợp lệ. Vui lòng thử lại.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseErr) {
          errorData = { error: `Lỗi ${response.status}: ${response.statusText}` };
        }
        setError(errorData.error || `Lỗi ${response.status}: ${response.statusText}`);
        setIsLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log("Login response:", data);
      } catch (parseErr) {
        console.error("Failed to parse JSON:", parseErr);
        setError("Không thể đọc phản hồi từ server");
        setIsLoading(false);
        return;
      }

      if (data.success && data.token) {
        console.log("Login successful, storing token...");
        
        // Store token in localStorage
        setAuthToken(data.token);
        console.log("Token stored in localStorage");
        
        // Redirect immediately
        window.location.replace("/");
      } else {
        setError(data.error || "Đăng nhập thất bại");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login catch error:", err);
      const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng nhập";
      setError(errorMsg);
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
              <h1 className="text-3xl font-black text-black mb-2">Đăng nhập</h1>
              <p className="text-slate-500">Nhập thông tin để truy cập hệ thống</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <LogIn className="h-5 w-5" />
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-black font-semibold hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
