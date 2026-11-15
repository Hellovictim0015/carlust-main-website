import { Fragment, type ReactNode } from "react";

/** Minimal renderer for the app's legal markdown: #/##/### headings, "- " lists, **bold**, paragraphs. */
function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="ml-5 list-disc space-y-1.5 text-ink-3">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      continue;
    }
    flush();
    if (!line) continue;
    const k = blocks.length;
    if (line.startsWith("### ")) blocks.push(<h3 key={k} className="mt-2 font-bold">{inline(line.slice(4))}</h3>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={k} className="mt-6 text-xl font-extrabold">{inline(line.slice(3))}</h2>);
    else if (line.startsWith("# ")) blocks.push(<h1 key={k} className="text-[30px] leading-tight font-extrabold">{inline(line.slice(2))}</h1>);
    else blocks.push(<p key={k} className="leading-relaxed text-ink-3">{inline(line)}</p>);
  }
  flush();
  return <div className="flex flex-col gap-3">{blocks}</div>;
}
