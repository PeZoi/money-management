'use client';

import React from 'react';

import { createClient } from '@/lib/supabase/browser';
import Image from 'next/image';
import Logo from '@/app/assets/images/logo.png';
import Icon from '@/app/favicon.ico';

const forest = '#1b5e20';
const forestDeep = '#14532d';
const mint = '#c8e6c9';
const mintSoft = '#e8f5e9';
/** Màu chủ đạo nút CTA — nằm giữa gradient */
const ctaGreen = '#047209';
const ctaGradient = `linear-gradient(135deg, ${forestDeep} 0%, ${ctaGreen} 38%, #0d8a12 72%, #2e7d32 100%)`;

function GoogleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={props.className} {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      if (data) {
        localStorage.setItem('auth_state', JSON.stringify(data));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden bg-[#f4faf4] px-4 py-10 sm:px-6">
      {/* Nền cong / vòng tròn chồng lấn — mobile + desktop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-20%] top-[-18%] h-[min(52vw,420px)] w-[min(52vw,420px)] rounded-full bg-[#a5d6a7]/35 blur-2xl" />
        <div className="absolute right-[-12%] bottom-[-22%] h-[min(60vw,480px)] w-[min(60vw,480px)] rounded-full bg-[#81c784]/30 blur-2xl" />
        <div className="absolute left-[35%] top-[60%] h-[min(40vw,320px)] w-[min(40vw,320px)] -translate-x-1/2 rounded-full bg-[#c8e6c9]/40 blur-xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] shadow-[0_24px_80px_-12px_rgba(27,94,32,0.22)] ring-1 ring-black/5 lg:min-h-[min(560px,85vh)] lg:flex-row lg:rounded-[2.5rem]">
        {/* Cột trái — xanh đậm, desktop ~40% */}
        <aside
          className="relative flex flex-col justify-center overflow-hidden px-8 py-12 text-white sm:px-10 lg:w-[42%] lg:py-16 lg:pl-12 lg:pr-8"
          style={{
            background: `linear-gradient(145deg, ${forestDeep} 0%, ${forest} 45%, #2e7d32 100%)`,
          }}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {/* <div className="absolute -right-16 top-1/2 h-[140%] w-[min(90%,420px)] -translate-y-1/2 rounded-full border border-white/10 bg-white/6" /> */}
            <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="absolute right-8 top-10 h-24 w-24 rounded-full bg-white/5" />
          </div>

          <div className="relative z-1 mx-auto max-w-xs text-center lg:mx-0 lg:text-left">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/25 backdrop-blur-sm lg:mx-0">
              <span className="text-2xl font-bold tracking-tight text-white">
                <Image src={Icon} alt="Money DPH" width={50} height={50} loading="eager" className="object-contain" />
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Chào mừng trở lại!</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Quản lý tài chính cá nhân an toàn, nhanh — chỉ cần tài khoản Google.
            </p>
          </div>
        </aside>

        {/* Cột phải — form chỉ Google */}
        <section className="relative flex flex-1 flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div
            className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/4 rounded-full opacity-60 sm:h-52 sm:w-52"
            style={{ background: `radial-gradient(circle, ${mint} 0%, transparent 70%)` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 -translate-x-1/4 translate-y-1/4 rounded-full opacity-50 sm:h-44 sm:w-44"
            style={{
              background: `radial-gradient(circle, ${mintSoft} 0%, transparent 72%)`,
            }}
            aria-hidden
          />

          <Image
            src={Logo}
            alt="Money DPH"
            width={280}
            height={280}
            className="mx-auto w-auto max-w-[200px] shrink-0 self-center object-contain"
            loading="eager"
            priority
          />

          <div className="relative z-1 mx-auto w-full max-w-md">
            <p className="mt-3 text-sm text-neutral-600 sm:text-base">
              Đăng nhập bằng Google để tiếp tục vào tài khoản của bạn.
            </p>

            <div className="mt-10 space-y-4">
              <button
                type="button"
                disabled={loading}
                onClick={signInWithGoogle}
                style={{ background: ctaGradient }}
                className="flex w-full items-center justify-center gap-3 rounded-lg px-5 py-4 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d6330] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
              >
                <GoogleGlyph className="h-5 w-5 shrink-0" />
                {loading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}
              </button>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <p className="mt-10 text-center text-xs text-neutral-500 sm:text-left">
              Lần đầu đăng nhập? Supabase sẽ tự tạo tài khoản từ Google của bạn.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
