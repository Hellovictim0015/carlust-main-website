const tones = {
  upcoming: "bg-[#e6f2ff] text-[#0052cc]",
  ongoing: "bg-[#fff3e6] text-[#a85f00]",
  completed: "bg-[#e8ffe6] text-[#1f7a44]",
  cancelled: "bg-[#ffe6e6] text-[#c62828]",
  neutral: "bg-surface text-ink-3",
} as const;

export type Tone = keyof typeof tones;

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${tones[tone]}`}>{label}</span>;
}
