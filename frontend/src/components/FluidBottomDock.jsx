import React from 'react';

/**
 * Bottom navigation dock with a spring-animated SVG concave notch and floating active orb.
 * Automatically adapts between the Light Studio surface and the Dark Pit-Wall palette.
 */
export default function FluidBottomDock({
  items = [],
  activeTab,
  onTabChange,
  isLightView = false
}) {
  const count = Math.max(items.length, 1);
  const foundIndex = items.findIndex((item) => item.id === activeTab);
  const activeIndex = foundIndex >= 0 ? foundIndex : 0;
  const activeItem = items[activeIndex];
  const isScannerActive = Boolean(activeItem?.primary);

  // Aligns center of the 92px SVG notch (x=46) with the active column center
  const notchShiftPct = ((activeIndex + 0.5) / count) * 100 - 100;

  const barBg = isLightView ? '#ffffff' : '#11151f';
  const barBorder = isLightView ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)';

  return (
    <div className="relative z-40 shrink-0 w-full select-none">
      <nav aria-label="Navegación principal" className="relative w-full">
        {/* Elevated Curved Surface Track */}
        <div
          className="pointer-events-none"
          style={{
            filter: isLightView
              ? 'drop-shadow(0 -8px 22px rgba(15, 23, 42, 0.09))'
              : 'drop-shadow(0 -10px 26px rgba(0, 0, 0, 0.65))'
          }}
        >
          {/* Fixed 64px top band preserves exact 1:1 circular geometry on the SVG cutout */}
          <div className="relative h-[64px] w-full overflow-hidden">
            <div
              className="cl-dock-spring absolute inset-0 flex w-full"
              style={{
                transform: `translate3d(calc(${notchShiftPct}% - 46px), 0, 0)`
              }}
            >
              {/* Left wing slab (exact 100% flex width; inner +1px overlap prevents subpixel cracks) */}
              <div className="flex-none w-full h-full pt-[1px]">
                <div
                  className="w-[calc(100%+1px)] h-full border-t transition-colors duration-300"
                  style={{ backgroundColor: barBg, borderColor: barBorder }}
                />
              </div>

              {/* Smooth C1-continuous concave bay around the 44px orb */}
              <svg
                width="92"
                height="64"
                viewBox="0 0 92 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-none relative z-10 block"
                aria-hidden="true"
              >
                <path
                  d="M 0 1.5 L 11 1.5 C 16 1.5 17.8 8.2 19.5 13.5 A 27.83 27.83 0 0 0 72.5 13.5 C 74.2 8.2 76 1.5 81 1.5 L 92 1.5 L 92 64 L 0 64 Z"
                  className="transition-colors duration-300"
                  fill={barBg}
                />
                <path
                  d="M 0 1.5 L 11 1.5 C 16 1.5 17.8 8.2 19.5 13.5 A 27.83 27.83 0 0 0 72.5 13.5 C 74.2 8.2 76 1.5 81 1.5 L 92 1.5"
                  className="transition-colors duration-300"
                  stroke={barBorder}
                  strokeWidth="1"
                  fill="none"
                />
              </svg>

              {/* Right wing slab */}
              <div className="flex-none w-full h-full pt-[1px]">
                <div
                  className="-ml-[1px] w-[calc(100%+1px)] h-full border-t transition-colors duration-300"
                  style={{ backgroundColor: barBg, borderColor: barBorder }}
                />
              </div>
            </div>
          </div>

          {/* Safe-area bottom extension seamlessly matching the bar fill */}
          <div
            className="w-full h-[var(--sab)] -mt-[1px] transition-colors duration-300"
            style={{ backgroundColor: barBg }}
          />
        </div>

        {/* Floating Active Orb Track (translates synchronously with the SVG notch) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[17px] left-0 z-20 flex h-11 justify-center cl-dock-spring"
          style={{
            width: `${100 / count}%`,
            transform: `translate3d(${activeIndex * 100}%, 0, 0)`
          }}
        >
          <div
            key={activeTab}
            className={`cl-orb-pop w-11 h-11 rounded-full transition-colors duration-300 ${
              isLightView
                ? 'bg-white border border-slate-900/[0.07] shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                : isScannerActive
                  ? 'bg-red-600 border border-red-400/45 shadow-[0_10px_26px_rgba(220,38,38,0.45)]'
                  : 'bg-[#1a202e] border border-white/[0.14] shadow-[0_10px_24px_rgba(0,0,0,0.68)]'
            }`}
          />
        </div>

        {/* Interactive Tab Slots */}
        <div
          className="absolute top-0 inset-x-0 z-30 grid h-[64px]"
          style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            let iconTone = '';
            let labelTone = '';

            if (isLightView) {
              iconTone = isActive
                ? item.primary
                  ? 'text-red-600'
                  : 'text-[#111318]'
                : 'text-slate-400 group-hover:text-slate-600';
              labelTone = isActive
                ? item.primary
                  ? 'text-red-600 font-bold'
                  : 'text-[#111318] font-bold'
                : 'text-slate-400 font-medium group-hover:text-slate-600';
            } else {
              iconTone = isActive
                ? 'text-white'
                : 'text-zinc-500 group-hover:text-zinc-300';
              labelTone = isActive
                ? item.primary
                  ? 'text-red-400 font-bold'
                  : 'text-white font-bold'
                : 'text-zinc-500 font-medium group-hover:text-zinc-300';
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className="group relative h-full w-full flex flex-col items-center justify-end pb-[8px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/50 active:scale-[0.97]"
              >
                {/* Icon container pops smoothly up into the centered 44px orb when active */}
                <div
                  className={`cl-dock-icon-spring pointer-events-none absolute top-[15px] inset-x-0 mx-auto w-6 h-6 flex items-center justify-center ${iconTone}`}
                  style={{
                    transform: isActive
                      ? 'translate3d(0, -22px, 0) scale(1.12)'
                      : 'translate3d(0, 0, 0) scale(1)'
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.25 : 1.9} />
                  {item.badge && (
                    <span
                      className={`absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-600 text-white font-telemetry text-[8px] font-bold flex items-center justify-center ring-1 ${
                        isLightView ? 'ring-white' : 'ring-[#11151f]'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Concise Bottom Label */}
                <span className={`pointer-events-none text-[9.5px] leading-none tracking-tight transition-colors duration-200 ${labelTone}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
