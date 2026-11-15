import { cacheLife } from "next/cache";
import Link from "next/link";
import { Icon } from "../Icon";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
import { Logo } from "./Logo";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Find your dream car", href: "/explore" },
      { label: "Cars With Driver", href: "/explore?driver=1" },
      { label: "Doorstep delivery", href: "/explore?delivery=1" },
      { label: "Wishlists", href: "/wishlist" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { label: "Become a Host", href: "/#host" },
      { label: "List your car", href: "/host" },
      { label: "Payment & Payouts", href: "/host" },
      { label: "Self Book Management", href: "/host" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "#footer" },
      { label: "Cancellation Policy", href: "/legal/cancellation" },
      { label: "Refund policy", href: "/legal/refund" },
      { label: "Payments policy", href: "/legal/payments" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer id="footer" className="bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pt-16 pb-8 md:px-8">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="flex max-w-80 flex-col gap-4">
            <Logo inverted />
            <p className="text-[15px] leading-relaxed text-night-text">
              Affordable self-drive cars at your doorstep.
            </p>
            {/* TODO: replace with official App Store / Google Play badges and store URLs. */}
            <div className="flex flex-wrap gap-2.5">
              <span className="rounded-[10px] border border-[#3a3a3a] px-3.5 py-2.5 text-[13px] font-semibold">
                App Store
              </span>
              <span className="rounded-[10px] border border-[#3a3a3a] px-3.5 py-2.5 text-[13px] font-semibold">
                Google Play
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="flex min-w-40 flex-col gap-3">
              <p className="mb-1 text-[15px] font-bold">{col.title}</p>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-night-text transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex min-w-50 flex-col gap-3">
            <p className="mb-1 text-[15px] font-bold">Contact</p>
            <a
              href="tel:+918000585654"
              className="flex items-center gap-2 text-sm text-night-text hover:text-white"
            >
              <Icon name="phone" size={16} />
              +91 8000585654
            </a>
            <a
              href="mailto:carlust0001@gmail.com"
              className="flex items-center gap-2 text-sm text-night-text hover:text-white"
            >
              <Icon name="mail" size={16} />
              carlust0001@gmail.com
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 border-t border-night-line pt-6 text-[13px] text-night-text">
          <span>© <CopyrightYear /> Carlust Automotive Private Limited</span>
          <span className="flex flex-wrap gap-5">
            <Link href="/legal/terms" className="hover:text-white">Terms of service</Link>
            <Link href="/legal/privacy" className="hover:text-white">Privacy policy</Link>
            <Link href="/legal/refund" className="hover:text-white">Refund policy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
