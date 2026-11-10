import React from 'react';
import {
  MapPin,
  ChevronDown,
  GraduationCap,
  ShieldCheck,
  Search,
  Mic,
  Sparkles,
  LogIn,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  selectedLocation: string;
  onOpenLocationModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAiSearch: () => void;
  activeFilterTab: string;
  onSelectFilterTab: (tab: string) => void;
  onOpenAccount: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  onOpenScaleDiagnostics?: () => void;
  totalAdsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLocation,
  onOpenLocationModal,
  searchQuery,
  onSearchChange,
  onOpenAiSearch,
  activeFilterTab,
  onSelectFilterTab,
  onOpenAccount,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenScaleDiagnostics,
  totalAdsCount = 0,
}) => {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs">
      {/* Top Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="border-[1.5px] border-slate-900 rounded-md px-1.5 py-0.5 flex items-center justify-center bg-white shadow-2xs">
            <span className="text-[10px] font-black tracking-tighter text-slate-900 leading-none">
              PLUG
            </span>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            PLUG
          </span>
        </div>

        {/* Campus Location Selector */}
        <button
          type="button"
          onClick={onOpenLocationModal}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200/80 transition-colors px-3 py-1.5 rounded-full text-left max-w-[210px] cursor-pointer"
          aria-label="Select Campus Location"
        >
          <MapPin className="w-3.5 h-3.5 text-slate-800 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] leading-tight text-gray-500 block">
              Campus
            </span>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-0.5 truncate">
              {selectedLocation}
              <ChevronDown className="w-3 h-3 text-slate-700 shrink-0" />
            </span>
          </div>
        </button>

        {/* Notifications Center Bell Trigger */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-slate-800 cursor-pointer shrink-0"
          aria-label={`Campus Notifications (${unreadNotificationsCount} unread)`}
        >
          <Bell className="w-5 h-5 text-slate-800" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar with Online Dot or Login Button */}
        {isAuthenticated && currentUser ? (
          <button
            type="button"
            onClick={onOpenAccount}
            className="relative shrink-0 focus:outline-hidden cursor-pointer group"
            aria-label={`Logged in as ${currentUser.name}. View Account Profile.`}
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"
              title="Online on campus"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('Sign in to access student deals')}
            className="flex items-center gap-1 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 px-2.5 py-1.5 rounded-full font-black text-xs shadow-xs transition-colors cursor-pointer"
            aria-label="Sign in with student email or phone"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Sub-bar 1: Hubs & Total Ads Pill */}
      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={onOpenLocationModal}
          className="w-full flex items-center justify-between bg-white border border-gray-200/90 rounded-full px-3 py-1.5 shadow-2xs hover:border-gray-300 transition-colors cursor-pointer"
          aria-label="Campus hub quick selector"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <GraduationCap className="w-4 h-4 text-slate-800" />
            <span>UniMall / Law Gate / Hostels</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-gray-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>{totalAdsCount} Real Student {totalAdsCount === 1 ? 'Ad' : 'Ads'}</span>
          </div>
        </button>
      </div>

      {/* Sub-bar 2: UMS Verified & SAFE DEALS Trust Bar (with 30K High-Concurrency Monitor) */}
      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={onOpenScaleDiagnostics}
          className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200/80 transition-colors rounded-lg px-2.5 py-1.5 text-xs text-slate-800 cursor-pointer"
          aria-label="View Campus High Concurrency Health & Performance Status"
        >
          <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-800 shrink-0" />
            <span>LPU Campus Hub • 30K Concurrency Engine</span>
          </div>
          <span className="bg-[#fbbf24] text-slate-950 font-black text-[10px] tracking-wider px-2 py-0.5 rounded-xs uppercase shrink-0 shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 inline-block animate-ping" />
            <span>SAFE DEALS</span>
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-2.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Find Drafters, Lab Coats, Cycle, Coolers, B.Te"
            className="w-full pl-9 pr-16 py-2 bg-white border border-gray-300 rounded-lg text-xs placeholder:text-gray-400 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
            aria-label="Search campus listings"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenAiSearch}
              className="p-1.5 text-amber-500 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
              title="Ask PLUG AI High-Thinking Campus Advisor"
              aria-label="Open AI campus advisor"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenAiSearch}
              className="p-1.5 text-gray-500 hover:text-slate-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              title="Voice search & campus assistant"
              aria-label="Voice search with AI assistant"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills (Horizontal Scroll) */}
      <div className="px-4 pb-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-semibold">
        <button
          type="button"
          onClick={() => onSelectFilterTab('all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            activeFilterTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'
          }`}
        >
          All Campus Ads
        </button>

        <button
          type="button"
          onClick={() => onSelectFilterTab('sale')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            activeFilterTab === 'sale'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'
          }`}
        >
          For Sale
        </button>

        <button
          type="button"
          onClick={() => onSelectFilterTab('rent')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
            activeFilterTab === 'rent'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-amber-500 font-bold">⚡</span>
          <span>Rentals ₹10+</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilterTab('hostel')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            activeFilterTab === 'hostel'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'
          }`}
        >
          Hostel & PG
        </button>

        <button
          type="button"
          onClick={() => onSelectFilterTab('ums')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            activeFilterTab === 'ums'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'
          }`}
        >
          UMS Verified
        </button>

        <button
          type="button"
          onClick={() => onSelectFilterTab('others')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            activeFilterTab === 'others'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'
          }`}
        >
          Others
        </button>
      </div>
    </header>
  );
};
