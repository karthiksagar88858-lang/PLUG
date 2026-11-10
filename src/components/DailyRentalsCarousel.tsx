import React from 'react';
import { Sparkles, Plus, Clock, Star } from 'lucide-react';
import { CampusListing } from '../utils/deals';

interface DailyRentalsCarouselProps {
  rentals: CampusListing[];
  onSelectListing: (listing: CampusListing) => void;
  onOpenSellModal?: () => void;
}

export const DailyRentalsCarousel: React.FC<DailyRentalsCarouselProps> = ({
  rentals,
  onSelectListing,
  onOpenSellModal,
}) => {
  if (rentals.length === 0) {
    return (
      <section className="px-4 py-2">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              ₹10
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">
                Daily Peer Micro-Rentals
              </span>
              <span className="text-[10px] text-amber-900 block truncate">
                Earn daily by renting drafters, EG boards & calcs to hostel peers
              </span>
            </div>
          </div>

          {onOpenSellModal && (
            <button
              type="button"
              onClick={onOpenSellModal}
              className="py-1.5 px-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>List for Rent</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-2.5">
      {/* Header */}
      <div className="px-4 flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-950 font-black text-[10px] shrink-0">
            ₹
          </div>
          <h2 className="text-xs font-black tracking-tight text-slate-900">
            Daily Student Rentals ({rentals.length})
          </h2>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-gray-100 px-2 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3 text-[#fbbf24]" />
          <span>Verified Peers</span>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="px-4 flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        {rentals.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectListing(item)}
            className="w-40 shrink-0 bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            {/* Image Container with Price Overlay Badge */}
            <div className="relative h-28 w-full bg-gray-100 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 bg-[#0b242a]/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-0.5 rounded-sm shadow-xs">
                ₹{item.rentPrice} / {item.rentPeriod || 'day'}
              </div>
            </div>

            {/* Content */}
            <div className="p-2">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs font-bold text-slate-900 truncate flex-1">
                  {item.title}
                </h3>
                {item.averageRating && item.averageRating > 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{item.averageRating}</span>
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5 truncate">
                {item.location}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
