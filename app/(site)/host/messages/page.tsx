import type { Metadata } from "next";
import { Suspense } from "react";
import { InboxView } from "@/components/messages/MessagesViews";

export const metadata: Metadata = { title: "Host messages", robots: { index: false } };

export default function HostMessagesPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-7xl px-4 py-8" />}>
      <InboxView base="/host/messages" />
    </Suspense>
  );
}
