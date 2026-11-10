import React from 'react';
import { X, MapPin, Check, Building2, Coffee, Shield } from 'lucide-react';
import { CAMPUS_LOCATIONS } from '../data/campusData';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation,
}) => {
  if (!isOpen) return null;

  const getLocationIcon = (loc: string) => {
    if (loc.includes('UniMall')) return <Building2 className="w-4 h-4 text-amber-500" />;
    if (loc.includes('Law Gate')) return <Coffee className="w-4 h-4 text-emerald-600" />;
    if (loc.includes('Hostel')) return <Shield className="w-4 h-4 text-blue-600" />;
    return <MapPin className="w-4 h-4 text-slate-700" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-label="Select Campus Pickup Hub"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-900" />
              <span>Select LPU Campus Hub</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Filter student ads near your hostel, block, or PG
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

        {/* Location List */}
        <div className="p-3 space-y-1.5">
          {CAMPUS_LOCATIONS.map((loc) => {
            const isSelected = selectedLocation.toLowerCase().includes(loc.toLowerCase()) || (loc === 'All Campus & Law Gate' && selectedLocation === 'LPU, Phagwara');

            return (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  onSelectLocation(loc === 'All Campus & Law Gate' ? 'LPU, Phagwara' : loc);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-slate-800 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-white/20' : 'bg-white border border-gray-200'
                    }`}
                  >
                    {getLocationIcon(loc)}
                  </div>
                  <div>
                    <span className="text-xs block">{loc}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-slate-300' : 'text-gray-500'
                      }`}
                    >
                      {loc.includes('UniMall')
                        ? 'Central hub • Safe handover zone'
                        : loc.includes('Hostel')
                        ? 'Turnstile security gate handover'
                        : 'Verified student peer area'}
                    </span>
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-[#fbbf24] stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
