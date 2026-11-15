import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/backend";
import { Suspense } from "react";
import { Icon } from "../Icon";
import { ModeSwitchLink } from "./NavLinks";

export function LoginButton() {
  return (
    <Link
      href="/login"
      className="rounded-[14px] bg-brand px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep"
    >
      Log in
    </Link>
  );
}

export function Avatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full bg-ink font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {(name.trim()[0] ?? "C").toUpperCase()}
    </span>
  );
}

/** Log in button, or host switch + profile pill when signed in. */
export async function HeaderAccount() {
  const user = await getCurrentUser();
  if (!user) return <LoginButton />;

  return (
    <div className="flex items-center gap-4">
      <Suspense>
        <ModeSwitchLink isHost={user.isHost} />
      </Suspense>
      <Link
        href="/profile"
        aria-label="Profile"
        className="flex items-center gap-2 rounded-full border border-line py-1.5 pr-1.5 pl-3.5 hover:shadow-card"
      >
        <Icon name="filter" size={18} />
        <Avatar name={user.name || user.phoneNumber} image={user.image} />
      </Link>
    </div>
  );
}
