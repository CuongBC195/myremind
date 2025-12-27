import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "MyRemind - Nhắc nhở Bảo hiểm",
  description: "Ứng dụng quản lý và nhắc nhở tái tục bảo hiểm",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyRemind",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/api/icon/192",
    apple: "/api/icon/180",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${manrope.variable} font-display antialiased`}>
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                  .then((registration) => {
                    // Log ngắn gọn (chỉ log state và scope)
                    console.log('Service Worker đã được đăng ký:', {
                      state: registration.active?.state || 'installing',
                      scope: registration.scope
                    });
                    
                    // Check for updates every hour
                    setInterval(() => {
                      registration.update();
                    }, 60 * 60 * 1000);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available, prompt user to reload
                            console.log('Có phiên bản Service Worker mới');
                            // Optionally show a notification to user
                            if (confirm('Có phiên bản mới. Bạn có muốn tải lại trang không?')) {
                              window.location.reload();
                            }
                          }
                        });
                      }
                    });
                  })
                  .catch((registrationError) => {
                    console.error('Service Worker đăng ký thất bại:', registrationError);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
