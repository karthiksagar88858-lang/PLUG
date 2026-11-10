import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onExplore: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore }) => {
  return (
    <div className="px-4 py-3">
      <div className="bg-[#0b242a] text-white rounded-xl p-3.5 relative overflow-hidden shadow-md">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-1 bg-[#fbbf24] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-tight">
            <span>⚡ LPU MICRO-RENTALS</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-300">
            100% Student ID Escrow
          </span>
        </div>

        {/* Content Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 pr-1">
            <h2 className="text-lg font-black tracking-tight leading-snug">
              Rent Campus Essentials from{' '}
              <span className="text-[#fbbf24] block sm:inline">₹10/day</span>
            </h2>
            <p className="text-slate-300 text-[11px] leading-relaxed mt-1 line-clamp-2">
              Why buy for one semester? Drafters, scientific calcs, lab aprons & heaters on rent. 100%...
            </p>
          </div>

          {/* Right Product Collage Graphic */}
          <div className="w-14 h-14 shrink-0 bg-white/10 border border-white/20 rounded-xl p-2 shadow-xs flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-[#fbbf24] leading-none">₹10</span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-0.5">/day</span>
          </div>
        </div>

        {/* Bottom Details Row */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Handover @ UniMall, Hostels & Law Gate</span>
          </div>

          <button
            type="button"
            onClick={onExplore}
            className="flex items-center gap-1 text-[#fbbf24] font-bold text-xs hover:underline shrink-0 pl-2 focus:outline-hidden"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
