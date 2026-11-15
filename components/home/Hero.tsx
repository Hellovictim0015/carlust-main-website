import { Icon, type IconName } from "../Icon";

const tileIcons: IconName[] = ["car", "key", "pin", "fuel", "truck", "calendar", "steering", "shield", "chat", "star"];
const COLUMNS = 12;

/** One column of drifting tiles. Tiles are doubled so the -50% loop is seamless. */
function TileColumn({ index }: { index: number }) {
  const icons = tileIcons.map((_, i) => tileIcons[(i + index * 3) % tileIcons.length]);
  const tiles = [...icons, ...icons];
  return (
    <div className={`min-w-0 overflow-hidden ${index >= 6 ? "hidden md:block" : ""}`}>
      <div className={`${index % 2 === 0 ? "cl-up" : "cl-down"} flex flex-col gap-3.5`}>
        {tiles.map((name, i) => (
          <div
            key={i}
            className={`flex flex-none items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-white/55 ${
              (i + index) % 2 === 0 ? "h-[150px]" : "h-[118px]"
            }`}
          >
            <Icon name={name} size={40} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-brand-deep px-5 pt-10 pb-[150px] text-center md:px-8 md:pt-11">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-10 bottom-0 grid grid-cols-6 gap-3.5 px-3.5 md:grid-cols-12"
      >
        {Array.from({ length: COLUMNS }, (_, i) => (
          <TileColumn key={i} index={i} />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_35%,rgba(185,30,55,.92),rgba(207,47,73,.55)_70%,rgba(207,47,73,.25))]"
      />
      <div className="relative flex flex-col items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-2 text-[13px] font-bold text-white">
          <Icon name="truck" size={16} />
          Doorstep Delivery Available
        </span>
        <h1 className="max-w-[900px] text-[34px] leading-[1.1] font-extrabold tracking-[-1px] text-balance text-white md:text-[46px]">
          Affordable self-drive cars at your doorstep
        </h1>
        <p className="max-w-[640px] text-base leading-normal font-medium text-white md:text-[19px]">
          Rent by the hour from verified hosts — pick up yourself or get it delivered, with or without a
          driver.
        </p>
      </div>
    </div>
  );
}
