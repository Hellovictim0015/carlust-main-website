"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessage } from "@/app/actions/chat";

/** Message box; polls for new messages every 10s while open. */
export function Composer({ receiverId, conversationId }: { receiverId: string; conversationId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 10_000);
    return () => clearInterval(t);
  }, [router]);

  function send() {
    const msg = text.trim();
    if (!msg) return;
    setError("");
    start(async () => {
      const res = await sendMessage(receiverId, conversationId, msg);
      if (!res.ok) return setError(res.error);
      setText("");
      router.refresh();
      ref.current?.focus();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex flex-col gap-2 border-t border-line-soft p-3"
    >
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex items-end gap-2">
        <label htmlFor="msg" className="sr-only">
          Message
        </label>
        <textarea
          id="msg"
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Type a message"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line px-3 py-2.5 outline-none focus:border-ink"
        />
        <button disabled={pending || !text.trim()} className="h-11 rounded-xl bg-brand px-5 font-semibold text-white disabled:opacity-50">
          Send
        </button>
      </div>
    </form>
  );
}
