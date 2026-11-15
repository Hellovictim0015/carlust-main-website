import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getConversations, getMessages } from "@/lib/chat";
import { formatShort } from "@/lib/datetime";
import { Avatar } from "../layout/HeaderAccount";
import { Composer } from "./Composer";
import { Inbox } from "./Inbox";

/** Inbox page, shared by /messages and /host/messages. */
export async function InboxView({ base }: { base: string }) {
  await requireUser(base);
  const conversations = await getConversations().catch(() => null);
  return <Inbox conversations={conversations} base={base} />;
}

/** One conversation, shared by /messages/[id] and /host/messages/[id]. */
export async function ThreadView({ id, base }: { id: string; base: string }) {
  const user = await requireUser(`${base}/${id}`);
  const [conversations, messages] = await Promise.all([getConversations().catch(() => null), getMessages(id)]);
  const other = conversations?.find((c) => c.id === id);

  return (
    <Inbox conversations={conversations} activeId={id} base={base}>
      <div className="flex items-center gap-3 border-b border-line-soft p-4">
        <Link href={base} aria-label="Back to conversations" className="text-sm font-semibold underline md:hidden">
          ←
        </Link>
        <Avatar name={other?.name ?? "?"} image={other?.image ?? null} size={36} />
        <span className="font-semibold">{other?.name ?? "Conversation"}</span>
      </div>
      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && <li className="m-auto text-sm text-muted">Say hello 👋</li>}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <li key={m.id} className={`flex max-w-[80%] flex-col ${mine ? "items-end self-end" : "items-start self-start"}`}>
              <span className={`rounded-2xl px-4 py-2.5 whitespace-pre-wrap ${mine ? "bg-brand text-white" : "bg-surface"}`}>
                {m.text}
              </span>
              <span className="mt-0.5 text-[11px] text-muted">{formatShort(m.createdAt)}</span>
            </li>
          );
        })}
      </ol>
      {other ? (
        <Composer receiverId={other.userId} conversationId={id} />
      ) : (
        <p className="border-t border-line-soft p-4 text-sm text-muted">This conversation isn&apos;t available.</p>
      )}
    </Inbox>
  );
}
