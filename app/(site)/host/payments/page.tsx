import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BankForm } from "@/components/host/HostControls";
import { requireUser } from "@/lib/auth";
import { formatShort } from "@/lib/datetime";
import { getBankAccount, getTransactions } from "@/lib/host";
import { formatInr } from "@/lib/pricing";

export const metadata: Metadata = { title: "Payments & Payouts", robots: { index: false } };

const mask = (n: string) => (n.length > 4 ? `•••• ${n.slice(-4)}` : n);

async function Payments({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  await requireUser("/host/payments");
  const [tx, bank] = await Promise.all([getTransactions(page).catch(() => null), getBankAccount()]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold">Transaction History</h2>
        {!tx ? (
          <p className="text-muted">Couldn&apos;t load transactions.</p>
        ) : tx.rows.length === 0 ? (
          <p className="rounded-2xl border border-line-soft p-6 text-muted">No completed transactions yet.</p>
        ) : (
          <ul className="divide-y divide-line-soft rounded-2xl border border-line-soft">
            {tx.rows.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.carName || "Booking payout"}</p>
                  <p className="text-xs text-muted">
                    {t.createdAt ? formatShort(t.createdAt) + " · " : ""}
                    {t.settlement || t.status}
                  </p>
                </div>
                <span className="font-bold">{formatInr(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between text-sm">
          {page > 1 ? <Link href={`/host/payments?page=${page - 1}`} className="font-semibold underline">← Newer</Link> : <span />}
          {tx?.hasNext && <Link href={`/host/payments?page=${page + 1}`} className="font-semibold underline">Older →</Link>}
        </div>
      </section>

      <section id="bank" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="text-2xl font-extrabold">Bank Account</h2>
        {bank ? (
          <dl className="grid gap-3 rounded-2xl border border-line-soft p-5 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Account holder</dt><dd className="font-semibold">{bank.holder}</dd></div>
            <div><dt className="text-muted">Account number</dt><dd className="font-semibold">{mask(bank.accountNumber)}</dd></div>
            <div><dt className="text-muted">IFSC</dt><dd className="font-semibold">{bank.ifsc}</dd></div>
            <div><dt className="text-muted">Bank</dt><dd className="font-semibold">{bank.bankName}{bank.branch ? `, ${bank.branch}` : ""}</dd></div>
          </dl>
        ) : (
          <>
            <p className="text-muted">Add the account where you want to receive payouts.</p>
            <BankForm />
          </>
        )}
      </section>
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/host/payments">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/host/menu" className="mb-2 inline-block text-sm font-semibold underline">← Back to menu</Link>
      <h1 className="mb-6 text-[32px] font-extrabold tracking-[-.6px]">Payment &amp; Payouts</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-placeholder" />}>
        <Payments searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
