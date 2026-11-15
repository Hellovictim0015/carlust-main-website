import type { Metadata } from "next";
import { Suspense } from "react";
import { ThreadView } from "@/components/messages/MessagesViews";

export const metadata: Metadata = { title: "Host messages", robots: { index: false } };

async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThreadView id={id} base="/host/messages" />;
}

export default function HostThreadPage({ params }: PageProps<"/host/messages/[id]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-7xl px-4 py-8" />}>
      <Thread params={params} />
    </Suspense>
  );
}
