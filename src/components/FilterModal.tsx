import React from 'react';
import { X, SlidersHorizontal, Check, BadgeCheck } from 'lucide-react';
import { CATEGORIES } from '../data/campusData';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  activeFilterTab: string;
  onSelectFilterTab: (tab: string) => void;
  umsOnly: boolean;
  onToggleUmsOnly: (val: boolean) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  activeFilterTab,
  onSelectFilterTab,
  umsOnly,
  onToggleUmsOnly,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-label="Filter Campus Listings"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-900" />
              <span>Filter Campus Listings</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Refine by student verification, deal type, and courses
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* UMS Verified Filter */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BadgeCheck className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <span className="font-bold text-teal-950 block text-xs">
                  UMS Verified Students Only
                </span>
                <span className="text-[10px] text-teal-800">
                  Verified with active LPU student registration ID
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={umsOnly}
              onChange={(e) => onToggleUmsOnly(e.target.checked)}
              className="w-4 h-4 accent-teal-700 rounded-sm"
            />
          </div>

          {/* Deal Type */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Deal Type</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectFilterTab('all')}
                className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all ${
                  activeFilterTab === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                All Campus Ads
              </button>
              <button
                type="button"
                onClick={() => onSelectFilterTab('sale')}
                className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all ${
                  activeFilterTab === 'sale'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                For Sale Only
              </button>
              <button
                type="button"
                onClick={() => onSelectFilterTab('rent')}
                className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all ${
                  activeFilterTab === 'rent'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                ⚡ Rentals ₹10+
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Category</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectCategory('All')}
                className={`p-2.5 rounded-lg border text-left font-bold text-xs transition-all flex items-center justify-between ${
                  selectedCategory === 'All'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                <span>All Categories</span>
                {selectedCategory === 'All' && <Check className="w-3.5 h-3.5" />}
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.name)}
                  className={`p-2.5 rounded-lg border text-left font-bold text-xs transition-all flex items-center justify-between ${
                    selectedCategory === cat.name
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {selectedCategory === cat.name && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 rounded-xl font-black text-xs transition-colors text-center"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
