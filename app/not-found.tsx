import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-5">
      <Logo />
      <h1 className="text-[32px] font-extrabold tracking-[-.6px]">Page not found</h1>
      <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist or the car is no longer listed.</p>
      <Link href="/explore" className="rounded-[14px] bg-brand px-5 py-3 font-semibold text-white">
        Find your dream car
      </Link>
    </main>
  );
}
