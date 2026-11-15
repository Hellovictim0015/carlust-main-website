import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { safeNext } from "@/lib/nav";

export const metadata: Metadata = { title: "Log in" };

async function Form({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(Array.isArray(next) ? next[0] : next)} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-deep p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_30%,rgba(255,255,255,.12),transparent)]"
        />
        <p className="relative max-w-md text-[40px] leading-[1.1] font-extrabold tracking-[-1px]">
          Affordable self-drive cars at your doorstep
        </p>
        <p className="relative mt-4 max-w-md text-lg text-white/85">
          Rent by the hour from verified hosts — pick up yourself or get it delivered.
        </p>
      </div>
      <main className="flex flex-col px-5 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm font-semibold text-ink-3 hover:text-ink">
            Back to home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <Suspense>
            <Form searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
