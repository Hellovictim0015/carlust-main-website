import Image from "next/image";
import Link from "next/link";

/** The app's script wordmark (assets/images/brand_logo.png). */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" aria-label="Carlust home" className="flex shrink-0 items-center">
      <Image
        src="/images/brand_logo.png"
        alt="Carlust"
        width={150}
        height={57}
        priority
        className={`h-10 w-auto ${inverted ? "invert" : ""}`}
      />
    </Link>
  );
}
