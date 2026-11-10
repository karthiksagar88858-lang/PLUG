import React from 'react';
import { Home, MessageSquare, Plus, Heart, User } from 'lucide-react';

export type TabType = 'home' | 'chats' | 'sell' | 'my-ads' | 'account' | 'notifications';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenSellModal: () => void;
  unreadChatsCount?: number;
  savedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenSellModal,
  unreadChatsCount = 1,
  savedCount = 0,
}) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200/90 z-40 px-3 py-1.5 flex items-center justify-between shadow-lg"
    >
      {/* Home */}
      <button
        type="button"
        onClick={() => onChangeTab('home')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'home' ? 'text-slate-950 font-bold' : 'text-gray-500 hover:text-slate-800'
        }`}
        aria-label="Home Marketplace"
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 font-semibold">Home</span>
      </button>

      {/* Chats */}
      <button
        type="button"
        onClick={() => onChangeTab('chats')}
        className={`flex-1 flex flex-col items-center py-1 relative transition-colors ${
          activeTab === 'chats' ? 'text-slate-950 font-bold' : 'text-gray-500 hover:text-slate-800'
        }`}
        aria-label="Campus Chats"
      >
        <div className="relative">
          <MessageSquare className={`w-5 h-5 ${activeTab === 'chats' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          {unreadChatsCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
              {unreadChatsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 font-semibold">Chats</span>
      </button>

      {/* SELL (Elevated Center Button) */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-5">
        <button
          type="button"
          onClick={onOpenSellModal}
          className="w-13 h-13 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] border-[2.5px] border-slate-950 flex flex-col items-center justify-center shadow-md active:scale-95 transition-all text-slate-950"
          aria-label="Post an ad to sell or rent campus items"
        >
          <Plus className="w-6 h-6 stroke-[3] text-slate-950" />
          <span className="text-[9px] font-black tracking-wider uppercase leading-none mt-0.5">
            SELL
          </span>
        </button>
      </div>

      {/* My Ads */}
      <button
        type="button"
        onClick={() => onChangeTab('my-ads')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'my-ads' ? 'text-slate-950 font-bold' : 'text-gray-500 hover:text-slate-800'
        }`}
        aria-label="My Ads and Saved Items"
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${activeTab === 'my-ads' ? 'stroke-[2.5] fill-slate-950 text-slate-950' : 'stroke-[1.8]'}`} />
          {savedCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-slate-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 font-semibold">My Ads</span>
      </button>

      {/* Account */}
      <button
        type="button"
        onClick={() => onChangeTab('account')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'account' ? 'text-slate-950 font-bold' : 'text-gray-500 hover:text-slate-800'
        }`}
        aria-label="Student Account & UMS Verification"
      >
        <User className={`w-5 h-5 ${activeTab === 'account' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 font-semibold">Account</span>
      </button>
    </nav>
  );
};
