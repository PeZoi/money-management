import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from '@/providers/query-provider';
import { SmoothScrollProvider } from '@/providers/smooth-scroll-provider';
import { FramerMotionProvider } from '@/providers/framer-motion-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import IosInstallPrompt from '@/components/ios-install-prompt';
import 'lenis/dist/lenis.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Money+',
  description: 'Quản lý tài chính cá nhân an toàn, nhanh — chỉ cần tài khoản Google.',
  appleWebApp: {
    capable: true,
    title: 'Money+',
    // Thanh trạng thái iOS trong suốt — giống app native
    statusBarStyle: 'black-translucent',
  },
};

// Viewport config — chặn zoom để giống native app trên iOS
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#16a34a' },
    { media: '(prefers-color-scheme: dark)', color: '#052e16' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn('h-full', 'antialiased', geistSans.variable, geistMono.variable, 'font-sans', inter.variable)}
    >
      <head>
        {/* iOS PWA — bắt buộc có meta tag này để Safari ẩn thanh địa chỉ khi add to home screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Money+" />
        {/* Icon & Manifest — sử dụng file tĩnh chất lượng cao trong thư mục public */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/icon-app.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="min-h-dvh flex flex-col">
        <SmoothScrollProvider>
          <ThemeProvider>
            <QueryProvider>
              <FramerMotionProvider>
                <TooltipProvider>{children}</TooltipProvider>
              </FramerMotionProvider>
            </QueryProvider>
            <Toaster />
            <IosInstallPrompt />
          </ThemeProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
