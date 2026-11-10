import React, { useEffect } from 'react';
import { X, Sparkles, ArrowRight, MapPin, Tag } from 'lucide-react';
import { CampusNotification } from '../utils/requests';

interface CampusBroadcastPopupProps {
  notification: CampusNotification | null;
  onDismiss: () => void;
  onViewItem: (itemId: string) => void;
}

export const CampusBroadcastPopup: React.FC<CampusBroadcastPopupProps> = ({
  notification,
  onDismiss,
  onViewItem,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification || notification.type !== 'campus_broadcast' || !notification.broadcastMeta) {
    return null;
  }

  const { broadcastMeta, itemId } = notification;
  const isRent = Boolean(broadcastMeta.rentPrice && broadcastMeta.rentPrice > 0);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-4 right-4 max-w-md mx-auto z-60 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-950 text-white rounded-2xl p-3 shadow-2xl border border-yellow-400/40 backdrop-blur-md flex items-center gap-3">
        {/* Item Thumbnail */}
        <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-900 relative">
          <img
            src={broadcastMeta.itemImage}
            alt={broadcastMeta.itemTitle}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0 right-0 bg-[#fbbf24] text-slate-950 text-[8px] font-black px-1 rounded-tl-sm">
            NEW
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider text-[#fbbf24]">
              <Sparkles className="w-3 h-3 text-[#fbbf24]" />
              {isRent ? 'Just Put on Rent' : 'Just Listed for Sale'}
            </span>
            <span className="text-gray-400 text-[10px]">• Campus Alert</span>
          </div>

          <h4 className="text-xs font-bold text-white truncate leading-tight mt-0.5">
            {broadcastMeta.itemTitle}
          </h4>

          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="font-extrabold text-[#fbbf24]">
              {isRent
                ? `₹${broadcastMeta.rentPrice}/day`
                : `₹${broadcastMeta.price.toLocaleString('en-IN')}`}
            </span>
            <span className="text-gray-400 truncate flex items-center gap-0.5 text-[10px]">
              <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
              {broadcastMeta.location}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => itemId && onViewItem(itemId)}
            className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 text-xs font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors shadow-xs cursor-pointer active:scale-95"
            aria-label={`View ${broadcastMeta.itemTitle}`}
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss campus notification"
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
