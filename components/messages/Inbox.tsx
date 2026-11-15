import Link from "next/link";
import type { ReactNode } from "react";
import type { Conversation } from "@/lib/chat";
import { Avatar } from "../layout/HeaderAccount";

/** Conversation list + optional open thread (messages_screen + chat_screen). */
export function Inbox({
  conversations,
  activeId,
  children,
  base = "/messages",
}: {
  conversations: Conversation[] | null;
  activeId?: string;
  children?: ReactNode;
  /** "/messages" on the guest side, "/host/messages" on the host side. */
  base?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="mb-6 text-[32px] font-extrabold tracking-[-.6px]">Messages</h1>
      <div className="flex min-h-[520px] overflow-hidden rounded-2xl border border-line-soft">
        <nav aria-label="Conversations" className={`w-full flex-none border-r border-line-soft md:w-[320px] ${activeId ? "hidden md:block" : ""}`}>
          {conversations === null ? (
            <p className="p-6 text-muted">We couldn&apos;t load your messages. Please refresh.</p>
          ) : conversations.length === 0 ? (
            <div className="p-6">
              <p className="font-semibold">No messages yet</p>
              <p className="mt-1 text-sm text-muted">Use “Contact Host” on a car or trip to start a conversation.</p>
            </div>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${base}/${c.id}`}
                    aria-current={c.id === activeId ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-surface ${c.id === activeId ? "bg-surface" : ""}`}
                  >
                    <Avatar name={c.name} image={c.image} size={44} />
                    <span className="truncate font-semibold">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <div className={`min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
          {children ?? <p className="m-auto p-6 text-muted">Select a conversation</p>}
        </div>
      </div>
    </div>
  );
}
