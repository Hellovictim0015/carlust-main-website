import Link from "next/link";
import { Icon, type IconName } from "../Icon";

const eyebrow = "mb-2 text-sm font-bold tracking-[.6px] text-brand-text";
const sectionTitle = "text-[30px] leading-tight font-extrabold tracking-[-.8px] text-balance md:text-[40px]";

const features: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "truck",
    title: "Doorstep delivery",
    body: "Choose Pick Up Myself or have the car delivered to your address for a fixed fee of ₹200 plus ₹22/km.",
  },
  {
    icon: "steering",
    title: "Cars With Driver",
    body: "Personal Driver Included on selected cars — a professional driver comes with the vehicle.",
  },
  {
    icon: "clock",
    title: "Pay by the hour",
    body: "Quick Duration Selection of 10h, 12h, 24h, 48h or 72h — or enter custom hours.",
  },
  {
    icon: "wallet",
    title: "Transparent price breakup",
    body: "Base fare, convenience fee, GST 18% and a refundable security deposit — shown before you pay.",
  },
  {
    icon: "shield",
    title: "Verified renters & hosts",
    body: "Identity verification with driving license and Aadhar keeps every trip safe for both sides.",
  },
  {
    icon: "tag",
    title: "Coupons & Wishlists",
    body: "Apply available coupons at checkout and save cars you love to your Wishlists.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 pb-[88px] md:px-8">
      <p className={eyebrow}>WHY CARLUST</p>
      <h2 className={`${sectionTitle} mb-8`}>Everything from the app, now on the web</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        {features.map((f) => (
          <article key={f.title} className="flex flex-col gap-3 rounded-2xl border border-line-soft p-7">
            <span className="flex size-[52px] items-center justify-center rounded-[14px] bg-brand-soft text-brand">
              <Icon name={f.icon} size={26} />
            </span>
            <h3 className="text-xl font-bold">{f.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const steps = [
  {
    title: "Find your dream car",
    body: "Enter your destination and trip dates, then filter by price, transmission, seats and features.",
  },
  {
    title: "Pick Up Myself or Doorstep delivery",
    body: "Choose your duration and how you get the car. See the full price breakup instantly.",
  },
  { title: "Proceed to Pay", body: "Apply a coupon and pay securely. Your booking is confirmed right away." },
  {
    title: "Verify Your Identity",
    body: "Upload your driving license and Aadhar card. Once approved, start your trip.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-4 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-[72px] md:px-8 md:py-[88px]">
        <p className={eyebrow}>HOW IT WORKS</p>
        <h2 className={`${sectionTitle} mb-10`}>On the road in four steps</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 rounded-2xl bg-white p-7 shadow-card">
              <span
                className={`flex size-10 items-center justify-center rounded-full font-extrabold text-white ${
                  i === steps.length - 1 ? "bg-brand" : "bg-ink"
                }`}
              >
                {i + 1}
              </span>
              <h3 className="text-[19px] font-bold">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const hostPoints: { icon: IconName; title: string; body: string }[] = [
  { icon: "bolt", title: "Turn Instant Book on or off", body: "Choose how customer will book" },
  { icon: "calendar", title: "Set up your calendar", body: "Change which dates are available" },
  { icon: "car", title: "Vehicle Details", body: "Update car information and photos" },
  { icon: "wallet", title: "Pricing Setup", body: "Set your daily and weekly rates" },
];

export function HostCta() {
  return (
    <section id="host" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-[72px] md:px-8 md:py-[88px]">
      <div className="flex flex-wrap items-center gap-12 rounded-[28px] bg-ink p-7 text-white md:p-14">
        <div className="flex flex-[1_1_380px] flex-col gap-[18px]">
          <p className="text-sm font-bold tracking-[.6px] text-brand-tint">BECOME A HOST</p>
          <h2 className="text-[32px] leading-[1.1] font-extrabold tracking-[-.8px] text-balance md:text-[44px]">
            It&apos;s easy to start hosting and earn extra income.
          </h2>
          <p className="text-[17px] leading-relaxed text-night-text">
            Add your first car to start earning. Customer can book your Car 24 hours after you publish.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/host" className="rounded-[14px] bg-brand px-[26px] py-4 text-base font-bold hover:bg-brand-deep">
              List your car
            </Link>
            <Link
              href="/host"
              className="rounded-[14px] border border-ink-3 px-[26px] py-4 text-base font-semibold hover:border-white"
            >
              How hosting works
            </Link>
          </div>
        </div>
        <div className="grid flex-[1_1_420px] grid-cols-1 gap-3.5 sm:grid-cols-2">
          {hostPoints.map((p) => (
            <div key={p.title} className="flex flex-col gap-2 rounded-2xl border border-night-line bg-night p-[22px]">
              <span className="text-brand-tint">
                <Icon name={p.icon} size={24} />
              </span>
              <h3 className="text-[17px] font-bold">{p.title}</h3>
              <p className="text-sm text-night-text">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-8 rounded-[28px] border border-line-soft bg-brand-soft p-7 md:p-14">
        <div className="flex flex-[1_1_420px] flex-col gap-3">
          <h2 className={sectionTitle}>Ready for your next trip?</h2>
          <p className="text-[17px] text-ink-3">Book on the web or get the Carlust app.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="rounded-[14px] bg-brand px-7 py-4 text-base font-bold text-white shadow-brand hover:bg-brand-deep"
          >
            Find your dream car
          </Link>
          <Link href="/login" className="rounded-[14px] bg-ink px-7 py-4 text-base font-bold text-white">
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
