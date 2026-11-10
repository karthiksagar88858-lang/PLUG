import React from 'react';
import { SlidersHorizontal, Heart, ShieldCheck, ChevronDown, Check, ShoppingBag, Plus, Camera, Star } from 'lucide-react';
import { CampusListing } from '../utils/deals';

interface ListingGridProps {
  listings: CampusListing[];
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelectListing: (listing: CampusListing) => void;
  onOpenFilterModal: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  totalAdsCount: number;
  onOpenSellModal?: () => void;
}

export const ListingGrid: React.FC<ListingGridProps> = ({
  listings,
  favorites,
  onToggleFavorite,
  onSelectListing,
  onOpenFilterModal,
  onLoadMore,
  hasMore,
  totalAdsCount,
  onOpenSellModal,
}) => {
  return (
    <section className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-black tracking-tight text-slate-900">
          Fresh Campus Listings
        </h2>
        <button
          type="button"
          onClick={onOpenFilterModal}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-gray-200/90 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors"
          aria-label="Filter listings by UMS verification and categories"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-800" />
          <span>Filter (UMS Verified)</span>
        </button>
      </div>

      {/* Empty State when no real items are posted yet */}
      {listings.length === 0 ? (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              No listings yet. Be the first to post!
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Have books, cycles, lab drafters, coolers, or tech to sell or rent? List them for LPU campus peers now.
            </p>
          </div>
          {onOpenSellModal && (
            <button
              type="button"
              onClick={onOpenSellModal}
              className="px-5 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Sell or Rent an Item</span>
            </button>
          )}
        </div>
      ) : (
        /* 2-Column Product Grid */
        <div className="grid grid-cols-2 gap-3">
        {listings.map((item) => {
          const isFav = favorites.includes(item.id);

          return (
            <article
              key={item.id}
              onClick={() => onSelectListing(item)}
              className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs hover:shadow-sm hover:border-gray-300 transition-all flex flex-col cursor-pointer group"
            >
              {/* Image & Badges */}
              <div className="relative h-36 w-full bg-gray-100 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Top-Left Category/Type or SOLD/RENTED Badge */}
                {item.status === 'sold' ? (
                  <div className="absolute top-2 left-2 text-[9px] font-black tracking-tight px-2 py-0.5 rounded-xs uppercase shadow-sm bg-red-600 text-white">
                    SOLD
                  </div>
                ) : item.status === 'rented' ? (
                  <div className="absolute top-2 left-2 text-[9px] font-black tracking-tight px-2 py-0.5 rounded-xs uppercase shadow-sm bg-purple-600 text-white">
                    RENTED
                  </div>
                ) : (
                  item.badge && (
                    <div
                      className={`absolute top-2 left-2 text-[9px] font-black tracking-tight px-1.5 py-0.5 rounded-xs uppercase shadow-2xs ${
                        item.badgeColor === 'yellow'
                          ? 'bg-[#fbbf24] text-slate-950'
                          : item.badgeColor === 'emerald'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0b242a] text-white'
                      }`}
                    >
                      {item.badge}
                    </div>
                  )
                )}

                {/* Top-Right Favorite Button */}
                <button
                  type="button"
                  onClick={(e) => onToggleFavorite(item.id, e)}
                  aria-label={isFav ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center text-slate-700 hover:text-red-500 shadow-2xs transition-colors"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isFav ? 'fill-red-500 text-red-500' : 'text-slate-600'
                    }`}
                  />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Price Row */}
                  <div className="flex items-baseline justify-between gap-1 mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900 tracking-tight">
                        ₹ {item.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Secondary rent rate or UMS badge */}
                    {item.rentPrice ? (
                      <span className="text-[10px] text-gray-500 font-bold shrink-0">
                        ₹{item.rentPrice}/{item.rentPeriod || 'day'}
                      </span>
                    ) : item.isUmsVerified ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-600 shrink-0">
                        <Check className="w-3 h-3 text-teal-600 stroke-[3]" />
                        <span>UMS</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 mb-1">
                    {item.averageRating && item.averageRating > 0 ? (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                        <span>{item.averageRating}</span>
                        <span className="text-gray-400 font-normal">({item.totalRatingsCount})</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-gray-300" />
                        <span>Rate out of 5★</span>
                      </span>
                    )}
                  </div>

                  {/* Others custom category badge */}
                  {item.category === 'Others' && item.customCategory && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-xs inline-block mb-1">
                      {item.customCategory}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-950 transition-colors">
                    {item.title}
                  </h3>
                </div>

                {/* Footer Location & Time */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 mt-1 border-t border-gray-100">
                  <span className="truncate pr-1">{item.location}</span>
                  <span className="shrink-0">{item.timeAgo}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      )}

      {/* Safe Campus Handover Points Card */}
      <div className="mt-4 bg-gray-50 border border-gray-200/90 rounded-xl p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-slate-800" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900">
            Safe Campus Handover Points
          </h4>
          <p className="text-[11px] text-gray-600 font-normal leading-relaxed mt-0.5">
            Deal safely in UniMall, Hostel Turnstile Gates, or Law Gate cafes.
          </p>
        </div>
      </div>

      {/* Load More Button (Only if listings exist) */}
      {listings.length > 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={!hasMore}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
              hasMore
                ? 'bg-gray-200/90 hover:bg-gray-300 text-slate-900 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>
              {hasMore
                ? 'Load More Ads in LPU & Phagwara'
                : 'All Campus Listings Loaded'}
            </span>
            {hasMore && <ChevronDown className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          <p className="text-[11px] text-gray-500 font-medium mt-2">
            Showing {listings.length} real student {listings.length === 1 ? 'ad' : 'ads'} inside LPU Campus & Law Gate
          </p>
        </div>
      )}
    </section>
  );
};
