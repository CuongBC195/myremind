"use client";

import { useEffect, useState } from "react";

export default function PushNotificationSetup() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if browser supports push notifications
    if (typeof window === "undefined") return;
    
    // Safari iOS doesn't support Web Push API
    const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                        !(window as any).MSStream &&
                        !("PushManager" in window);
    
    if (isSafariIOS) {
      setIsSupported(false);
      return;
    }
    
    // Check for push notification support
    if (
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }

  async function subscribeToPush() {
    if (!isSupported) {
      alert("Trình duyệt của bạn không hỗ trợ thông báo đẩy.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Step 1: Registering service worker...");
      // Check if service worker is already registered
      let registration = await navigator.serviceWorker.getRegistration("/");
      
      if (!registration) {
        // Register service worker
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/"
        });
        console.log("Service worker registered:", registration);
      } else {
        console.log("Service worker already registered:", registration);
      }
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log("Service worker ready");
      
      // Additional wait to ensure service worker is fully activated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Request notification permission
      console.log("Step 2: Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
      
      if (permission !== "granted") {
        alert("Bạn cần cấp quyền thông báo để nhận nhắc nhở.");
        setIsLoading(false);
        return;
      }

      // Get VAPID public key from API
      console.log("Step 3: Fetching VAPID public key...");
      const keyResponse = await fetch("/api/push/vapid-key");
      const keyData = await keyResponse.json();
      
      if (!keyResponse.ok || !keyData.publicKey) {
        throw new Error(keyData.error || "VAPID public key not configured");
      }
      
      const vapidPublicKey = keyData.publicKey;
      console.log("VAPID public key received:", vapidPublicKey.substring(0, 20) + "...");

      // Subscribe to push notifications
      console.log("Step 4: Subscribing to push notifications...");
      console.log("VAPID key length:", vapidPublicKey.length);
      
      let subscription;
      try {
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        console.log("Application server key converted, length:", applicationServerKey.length);
        console.log("Browser:", navigator.userAgent);
        console.log("Is HTTPS:", window.location.protocol === "https:");
        console.log("Is localhost:", window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        
        // Check if push manager is available
        if (!registration.pushManager) {
          throw new Error("PushManager không khả dụng trong Service Worker này");
        }
        
        // Check for existing subscription first
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log("Found existing subscription, reusing it");
          subscription = existingSubscription;
        } else {
          console.log("Creating new push subscription...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          });
        }
        
        console.log("Push subscription created successfully!");
        console.log("Subscription endpoint:", subscription.endpoint);
      } catch (subscribeError: any) {
        console.error("=== Subscribe Error Details ===");
        console.error("Error name:", subscribeError.name);
        console.error("Error message:", subscribeError.message);
        console.error("Error code:", subscribeError.code);
        console.error("Full error:", subscribeError);
        
        // More specific error messages
        if (subscribeError.name === "AbortError" && subscribeError.code === 20) {
          throw new Error("Push service không khả dụng. Có thể do:\n- Trình duyệt không hỗ trợ push trên HTTP (cần HTTPS hoặc localhost)\n- Push service bị block\n- Kết nối internet có vấn đề\n\nVui lòng thử:\n1. Dùng Chrome hoặc Edge\n2. Đảm bảo đang dùng localhost\n3. Kiểm tra cài đặt thông báo của trình duyệt");
        } else if (subscribeError.name === "NotAllowedError") {
          throw new Error("Bạn cần cấp quyền thông báo cho trình duyệt");
        } else if (subscribeError.name === "NotSupportedError") {
          throw new Error("Trình duyệt không hỗ trợ push notifications");
        } else if (subscribeError.name === "InvalidStateError") {
          throw new Error("Service Worker chưa sẵn sàng. Vui lòng refresh trang và thử lại.");
        } else if (subscribeError.message?.includes("push service") || subscribeError.message?.includes("registration")) {
          throw new Error(`Lỗi push service: ${subscribeError.message}. Có thể do trình duyệt hoặc kết nối internet.`);
        } else {
          throw new Error(`Registration failed - ${subscribeError.message || subscribeError.name || "push service error"}`);
        }
      }

      // Send subscription to server
      console.log("Step 5: Saving subscription to server...");
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
        credentials: "include",
      });

      const responseData = await response.json();
      console.log("Server response:", responseData);

      if (response.ok) {
        setIsSubscribed(true);
        console.log("Successfully subscribed to push notifications");
      } else {
        throw new Error(responseData.error || "Failed to save subscription");
      }
    } catch (error: any) {
      console.error("Error subscribing to push:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      let errorMessage = "Không thể đăng ký thông báo đẩy";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      // More user-friendly error messages
      if (errorMessage.includes("push service error") || errorMessage.includes("InvalidStateError")) {
        errorMessage = "Lỗi đăng ký push service. Vui lòng thử lại sau hoặc kiểm tra cài đặt trình duyệt.";
      } else if (errorMessage.includes("NotAllowedError") || errorMessage.includes("permission")) {
        errorMessage = "Bạn cần cấp quyền thông báo cho trình duyệt.";
      } else if (errorMessage.includes("NotSupportedError")) {
        errorMessage = "Trình duyệt của bạn không hỗ trợ thông báo đẩy.";
      }
      
      alert(`${errorMessage}\n\nVui lòng mở Console (F12) để xem chi tiết lỗi.`);
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        setIsSubscribed(false);
        console.log("Successfully unsubscribed from push notifications");
      }
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      alert("Không thể hủy đăng ký thông báo đẩy.");
    } finally {
      setIsLoading(false);
    }
  }

  // Convert VAPID key from base64 URL to Uint8Array
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Brave browser may have push notifications disabled by default
  // Show component but with a note about Brave
  const isBrave = typeof navigator !== "undefined" && (navigator as any).brave?.isBrave;
  
  // Check if Safari iOS
  const isSafariIOS = typeof window !== "undefined" && 
                      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      !(window as any).MSStream &&
                      !("PushManager" in window);
  
  if (!isSupported) {
    // Show message for Safari iOS
    if (isSafariIOS) {
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Thông báo đẩy không khả dụng trên Safari iOS
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Safari trên iPhone/iPad không hỗ trợ Web Push API. Bạn vẫn có thể nhận thông báo trong ứng dụng khi mở trang web.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                💡 Mẹo: Thêm trang web vào màn hình chính (Share → Add to Home Screen) để có trải nghiệm tốt hơn.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null; // Don't show anything if not supported
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Thông báo đẩy
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {isSubscribed
              ? "Bạn sẽ nhận thông báo ngay cả khi không mở ứng dụng"
              : "Bật thông báo đẩy để nhận nhắc nhở khi không mở ứng dụng"}
          </p>
          {isBrave && !isSubscribed && (
            <p className="text-xs text-amber-700 mt-1 font-medium">
              ⚠️ Brave browser: Có thể cần bật thông báo trong cài đặt trình duyệt
            </p>
          )}
        </div>
        <button
          onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSubscribed
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          } disabled:opacity-50`}
        >
          {isLoading
            ? "Đang xử lý..."
            : isSubscribed
            ? "Tắt"
            : "Bật"}
        </button>
      </div>
    </div>
  );
}

