import React, { useState } from 'react';
import {
  X,
  Plus,
  ShieldCheck,
  Check,
  Camera,
  Upload,
  User,
  Sparkles,
} from 'lucide-react';
import { CampusListing, validateListingForm } from '../utils/deals';
import { CATEGORIES, CAMPUS_LOCATIONS } from '../data/campusData';
import { useAuth } from '../context/AuthContext';
import { CameraModal } from './CameraModal';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing: (newListing: CampusListing) => void;
}

export const SellModal: React.FC<SellModalProps> = ({
  isOpen,
  onClose,
  onAddListing,
}) => {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');
  const [listingType, setListingType] = useState<'both' | 'sale' | 'rent'>('sale');
  const [price, setPrice] = useState('');
  const [rentPrice, setRentPrice] = useState('');
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[1]);
  const [description, setDescription] = useState('');
  const [isUmsVerified, setIsUmsVerified] = useState(true);

  // Photo state (strictly user-provided real photos only)
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<'item' | 'qr'>('item');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Payment state for this ad
  const [adUpiId, setAdUpiId] = useState(currentUser?.upiId || '');
  const [adUpiApp, setAdUpiApp] = useState<'googlepay' | 'phonepe' | 'paytm' | 'other'>(
    currentUser?.upiApp || 'phonepe'
  );
  const [adQrCodeUrl, setAdQrCodeUrl] = useState<string | null>(
    currentUser?.qrScannerUrl || null
  );

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomPhotoUrl(reader.result);
        if (formErrors.photo) {
          setFormErrors((prev) => {
            const next = { ...prev };
            delete next.photo;
            return next;
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!isAuthenticated || !currentUser) {
      openAuthModal('Please log in with your campus email or phone to post an ad.');
      return;
    }

    const priceNum = price ? Number(price) : 0;
    const rentNum = rentPrice ? Number(rentPrice) : undefined;

    const validation = validateListingForm({
      title,
      category,
      customCategory,
      price: priceNum,
      rentPrice: rentNum,
      location,
    });

    const errors = { ...validation.errors };
    if (!customPhotoUrl) {
      errors.photo = 'Please capture a photo with camera or upload an image of your item.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const finalUpiId = adUpiId.trim() || currentUser.upiId;
    const finalQrScanner = adQrCodeUrl || currentUser.qrScannerUrl;
    const finalUpiApp = adUpiApp || currentUser.upiApp || 'phonepe';

    const nowIso = new Date().toISOString();
    const newListing: CampusListing = {
      id: `listing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      category,
      customCategory: category === 'Others' ? customCategory.trim() : undefined,
      status: 'active',
      price: priceNum,
      rentPrice: rentNum,
      rentPeriod: rentNum ? 'day' : undefined,
      type: listingType === 'both' ? 'both' : listingType === 'rent' ? 'rent' : 'sale',
      badge:
        listingType === 'both'
          ? 'BUY / RENT'
          : listingType === 'rent'
          ? 'FOR RENT'
          : 'FOR SALE',
      badgeColor: listingType === 'both' ? 'yellow' : 'dark',
      imageUrl: customPhotoUrl!,
      images: [customPhotoUrl!],
      location,
      timeAgo: 'Just now',
      isUmsVerified: isUmsVerified && currentUser.isUmsVerified,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerPhone: currentUser.identifier,
      sellerReg: currentUser.regNumber,
      sellerBranch: currentUser.branch,
      sellerUpiId: finalUpiId,
      sellerUpiApp: finalUpiApp,
      sellerQrScannerUrl: finalQrScanner || undefined,
      description:
        description.trim() ||
        'Student verified listing. Handover available at UniMall or Hostel turnstiles with escrow protection.',
      specs: ['Inspected Condition', 'Verified Student ID', 'Safe Handover Ready'],
      depositAmount: rentNum ? rentNum * 10 : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      ratings: [],
      averageRating: 0,
      totalRatingsCount: 0,
    };

    onAddListing(newListing);
    setTitle('');
    setPrice('');
    setRentPrice('');
    setDescription('');
    setCustomPhotoUrl(null);
    setCustomCategory('');
    setFormErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-label="Post a Campus Ad"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>Post a Campus Ad on PLUG</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-xs font-black">
                FREE FOR STUDENTS
              </span>
            </h3>
            <p className="text-[11px] text-gray-500">
              List gear for sale or micro-rent to peers
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

        {/* Current Student Seller Profile Banner */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-[#fbbf24]"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Posting as {currentUser.name}
                </span>
                <span className="text-[10px] text-gray-500">
                  Reg #{currentUser.regNumber} • {currentUser.branch}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">
                  Not logged in. You will be asked to sign in before publishing.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  openAuthModal('Please sign in or create an account to post an ad.')
                }
                className="text-xs font-bold text-amber-600 hover:underline"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Real Item Photo Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-900" />
                <span>Product Photo <span className="text-red-500">*</span></span>
              </label>
              {customPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setCustomPhotoUrl(null)}
                  className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* Photo Action & Preview Card */}
            <div className="bg-slate-950 text-white rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {customPhotoUrl ? (
                    <img
                      src={customPhotoUrl}
                      alt="Real Product Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {customPhotoUrl ? 'Photo Attached' : 'Attach Real Product Photo'}
                  </span>
                  <span className="text-[10px] text-slate-300 block truncate">
                    Take with camera or select from device files
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCameraTarget('item');
                    setIsCameraOpen(true);
                  }}
                  className="py-2 px-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {formErrors.photo && (
              <p className="text-[11px] text-red-600 font-semibold">{formErrors.photo}</p>
            )}
          </div>

          {/* Ad Title */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Ad Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
              }}
              placeholder="e.g. 21-Speed Gear Bicycle with helmet and lock"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
            />
            {formErrors.title && (
              <p className="text-[11px] text-red-600 mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (formErrors.category) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.category;
                    return next;
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name === 'Others' ? 'Others (Anything Else)' : `${cat.name} (${cat.sub})`}
                </option>
              ))}
            </select>

            {/* Extra Item Category / Item Name field when Others is chosen */}
            {category === 'Others' && (
              <div className="mt-2.5 p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg animate-in fade-in">
                <label className="block font-bold text-slate-900 mb-1">
                  Item Category / Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    if (formErrors.customCategory) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.customCategory;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Guitar, Study Table, Bedsheets"
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                />
                {formErrors.customCategory ? (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {formErrors.customCategory}
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-800 mt-1">
                    Please describe what kind of item you are listing so campus peers can search and find it.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Listing Mode: Buy & Rent, Sale, Rent */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Listing Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setListingType('both')}
                className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all ${
                  listingType === 'both'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                Buy & Rent
              </button>
              <button
                type="button"
                onClick={() => setListingType('sale')}
                className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all ${
                  listingType === 'sale'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                For Sale Only
              </button>
              <button
                type="button"
                onClick={() => setListingType('rent')}
                className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all ${
                  listingType === 'rent'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                Rentals Only
              </button>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-2 gap-3">
            {listingType !== 'rent' && (
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Sale Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>
            )}

            {listingType !== 'sale' && (
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Daily Rent (₹/day)
                </label>
                <input
                  type="number"
                  value={rentPrice}
                  onChange={(e) => setRentPrice(e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>
            )}
          </div>
          {formErrors.price && (
            <p className="text-[11px] text-red-600">{formErrors.price}</p>
          )}

          {/* Handover Spot */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Handover Spot on Campus <span className="text-red-500">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs bg-white"
            >
              {CAMPUS_LOCATIONS.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Condition & Item Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Used for 1 semester in Block 34, includes tube and original clips..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
            />
          </div>

          {/* UPI & Payment Scanner Attachment Section */}
          <div className="bg-purple-50/70 border border-purple-200/90 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                <span>PhonePe / Google Pay for this Ad</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded-xs font-bold">
                  Direct Student Payout
                </span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setAdUpiApp('phonepe')}
                className={`py-1 px-1.5 rounded-lg font-bold border text-center transition-all ${
                  adUpiApp === 'phonepe'
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'bg-white text-slate-700 border-gray-200'
                }`}
              >
                PhonePe
              </button>
              <button
                type="button"
                onClick={() => setAdUpiApp('googlepay')}
                className={`py-1 px-1.5 rounded-lg font-bold border text-center transition-all ${
                  adUpiApp === 'googlepay'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-gray-200'
                }`}
              >
                Google Pay
              </button>
              <button
                type="button"
                onClick={() => setAdUpiApp('paytm')}
                className={`py-1 px-1.5 rounded-lg font-bold border text-center transition-all ${
                  adUpiApp === 'paytm'
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-slate-700 border-gray-200'
                }`}
              >
                Paytm / Other
              </button>
            </div>

            <input
              type="text"
              value={adUpiId}
              onChange={(e) => setAdUpiId(e.target.value)}
              placeholder="Enter your UPI ID (e.g. yourname@upi)"
              autoComplete="off"
              className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-slate-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs font-mono"
            />

            {/* QR Scanner snapshot attached */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                {adQrCodeUrl ? (
                  <img
                    src={adQrCodeUrl}
                    alt="QR"
                    className="w-8 h-8 rounded-md object-contain bg-white border border-purple-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700">
                    QR
                  </div>
                )}
                <span className="text-[11px] text-purple-900 font-semibold truncate">
                  {adQrCodeUrl ? 'Payment QR Attached' : 'Attach Payment QR Code'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCameraTarget('qr');
                    setIsCameraOpen(true);
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3 h-3 text-amber-400" />
                  <span>Snap QR</span>
                </button>
                {adQrCodeUrl && (
                  <button
                    type="button"
                    onClick={() => setAdQrCodeUrl(null)}
                    className="text-[10px] text-red-600 hover:underline font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* UMS Verification Badge Toggle */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  Attach UMS Verified Badge
                </span>
                <span className="text-[10px] text-gray-500">
                  Backed by {currentUser ? currentUser.name : 'Student UMS Profile'} (Safe Escrow)
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isUmsVerified}
              onChange={(e) => setIsUmsVerified(e.target.checked)}
              className="w-4 h-4 accent-slate-900 rounded-sm cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Publish Student Ad</span>
          </button>
        </form>

        {/* Live Camera Viewfinder Modal */}
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(capturedDataUrl) => {
            if (cameraTarget === 'qr') {
              setAdQrCodeUrl(capturedDataUrl);
            } else {
              setCustomPhotoUrl(capturedDataUrl);
            }
          }}
          title={
            cameraTarget === 'qr'
              ? 'Snap Photo of PhonePe / Google Pay QR Scanner'
              : 'Snap Photo of Item You Want to Sell'
          }
          facingModeDefault="environment"
        />
      </div>
    </div>
  );
};
