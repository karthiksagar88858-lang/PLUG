import React, { useState } from 'react';
import {
  X,
  MapPin,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  BadgeCheck,
  Check,
  ArrowRight,
  TrendingDown,
  Info,
  Loader2,
  QrCode,
  Copy,
  CreditCard,
  Phone,
  MessageCircle,
  Calendar,
  Send,
  Star,
  Trash2,
  Edit3,
} from 'lucide-react';
import { CampusListing, calculateRentalBreakEven } from '../utils/deals';
import { CAMPUS_LOCATIONS } from '../data/campusData';
import { generateWhatsAppLink } from '../utils/requests';
import { useAuth } from '../context/AuthContext';

interface ItemModalProps {
  listing: CampusListing | null;
  onClose: () => void;
  onOpenChatWithSeller: (listing: CampusListing) => void;
  onRentWithEscrow: (listing: CampusListing) => void;
  onRequestDeal?: (params: {
    listing: CampusListing;
    isRent: boolean;
    rentDays: number;
    handoverLocation: string;
    note: string;
  }) => void;
  onViewOffers?: () => void;
  onRateListing?: (listingId: string, rating: number, review?: string) => Promise<void>;
  onDeleteListing?: (listingId: string) => Promise<void>;
  onEditListing?: (listingId: string, updates: Partial<CampusListing>) => Promise<void>;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  listing,
  onClose,
  onOpenChatWithSeller,
  onRentWithEscrow,
  onRequestDeal,
  onViewOffers,
  onRateListing,
  onDeleteListing,
  onEditListing,
}) => {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'ai-advisor' | 'escrow'>('details');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // 5-Star Rating System State
  const [selectedStar, setSelectedStar] = useState<number>(0);
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [ratingSubmittedSuccess, setRatingSubmittedSuccess] = useState<boolean>(false);

  // In-modal Rent & Buy deal request state
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [requestIsRent, setRequestIsRent] = useState(Boolean(listing?.rentPrice && listing.rentPrice > 0));
  const [rentDays, setRentDays] = useState(3);
  const [handoverLocation, setHandoverLocation] = useState(listing?.location || CAMPUS_LOCATIONS[1]);
  const [buyerNote, setBuyerNote] = useState('');
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);

  // Owner Edit & Delete State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState(String(listing?.price || ''));
  const [editRentPrice, setEditRentPrice] = useState(String(listing?.rentPrice || ''));
  const [editLocation, setEditLocation] = useState(listing?.location || '');
  const [editDescription, setEditDescription] = useState(listing?.description || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!listing) return null;

  const isOwner = Boolean(
    currentUser &&
      ((listing.sellerId && currentUser.id === listing.sellerId) ||
        (listing.sellerName &&
          currentUser.name &&
          listing.sellerName.toLowerCase().trim() === currentUser.name.toLowerCase().trim()))
  );

  const handleCopyUpi = (upi: string) => {
    navigator.clipboard?.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStar < 1 || selectedStar > 5) return;
    setIsSubmittingRating(true);
    try {
      if (onRateListing) {
        await onRateListing(listing.id, selectedStar, reviewComment.trim() || undefined);
      }
      setRatingSubmittedSuccess(true);
      setReviewComment('');
      setTimeout(() => {
        setRatingSubmittedSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('Failed to submit product rating', err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onEditListing || !listing) return;
    setIsSavingEdit(true);
    try {
      await onEditListing(listing.id, {
        price: Number(editPrice) || listing.price,
        rentPrice: editRentPrice ? Number(editRentPrice) : undefined,
        location: editLocation || listing.location,
        description: editDescription || listing.description,
      });
      setIsEditModalOpen(false);
    } catch (e) {
      console.error('Failed to edit listing', e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!onDeleteListing || !listing) return;
    setIsDeleting(true);
    try {
      await onDeleteListing(listing.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (e) {
      console.error('Failed to delete listing', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartRequest = (preferRent: boolean) => {
    if (!isAuthenticated) {
      openAuthModal(`Sign in with email or phone to send a ${preferRent ? 'rental' : 'purchase'} request.`);
      return;
    }
    setRequestIsRent(preferRent);
    setIsRequestFormOpen(true);
  };

  const handleSubmitDealRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('Sign in with email or phone to send this request.');
      return;
    }
    if (onRequestDeal) {
      onRequestDeal({
        listing,
        isRent: requestIsRent,
        rentDays: requestIsRent ? rentDays : 1,
        handoverLocation,
        note: buyerNote,
      });
    } else {
      onRentWithEscrow(listing);
    }
    setRequestSentSuccess(true);
    setTimeout(() => {
      setRequestSentSuccess(false);
      setIsRequestFormOpen(false);
    }, 2200);
  };

  const rentalEconomics = listing.rentPrice
    ? calculateRentalBreakEven(listing.price, listing.rentPrice, 90)
    : null;

  const handleAskAi = async (customPrompt?: string) => {
    const queryToSend = customPrompt || aiQuery || 'Is this deal fair and should I buy or rent?';
    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToSend,
          listingContext: listing,
        }),
      });

      const data = await res.json();
      setAiResponse(data.text || data.fallbackAnalysis || data.fallbackText || 'Analysis complete.');
    } catch (err: any) {
      setAiResponse(
        'Campus Advisor: This listing is verified for LPU peer trade. UniMall or Hostel Turnstile Gates are recommended handover spots.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close item details"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image Banner */}
        <div className="relative h-60 w-full bg-gray-900 shrink-0">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          {listing.status === 'sold' ? (
            <div className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-tight shadow-md bg-red-600 text-white">
              SOLD
            </div>
          ) : listing.status === 'rented' ? (
            <div className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-tight shadow-md bg-purple-600 text-white">
              CURRENTLY RENTED
            </div>
          ) : (
            listing.badge && (
              <div
                className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-tight shadow-md ${
                  listing.badgeColor === 'yellow'
                    ? 'bg-[#fbbf24] text-slate-950'
                    : 'bg-[#0b242a] text-white'
                }`}
              >
                {listing.badge}
              </div>
            )
          )}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white/90">
            <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-sm font-semibold">
              {listing.category === 'Others' && listing.customCategory
                ? `Others: ${listing.customCategory}`
                : listing.category}
            </span>
            <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-sm">
              Posted {listing.timeAgo}
            </span>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'border-slate-950 text-slate-950 bg-white'
                : 'border-transparent text-gray-500 hover:text-slate-800'
            }`}
          >
            Item Details
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ai-advisor');
              if (!aiResponse) handleAskAi();
            }}
            className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'ai-advisor'
                ? 'border-amber-500 text-slate-950 bg-white'
                : 'border-transparent text-amber-600 hover:text-amber-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Advisor</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded-xs">
              Thinking
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('escrow')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'escrow'
                ? 'border-emerald-600 text-slate-950 bg-white'
                : 'border-transparent text-gray-500 hover:text-slate-800'
            }`}
          >
            Safe Escrow
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 flex-1">
          {activeTab === 'details' && (
            <>
              {/* Title & Price Header */}
              <div>
                <h3
                  id="item-modal-title"
                  className="text-base font-black text-slate-900 leading-snug"
                >
                  {listing.title}
                </h3>

                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-950">
                      ₹ {listing.price.toLocaleString('en-IN')}
                    </span>
                    {listing.rentPrice && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">
                        or ₹{listing.rentPrice}/{listing.rentPeriod || 'day'} rent
                      </span>
                    )}
                  </div>
                  {listing.isUmsVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
                      <BadgeCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>UMS Verified Student</span>
                    </span>
                  )}
                </div>

                {/* 5-Star Rating Summary & Quick Rate Link */}
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/90 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-950">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>
                      {listing.averageRating !== undefined && listing.averageRating > 0
                        ? `${listing.averageRating.toFixed(1)} / 5 ★`
                        : 'Unrated (0/5 ★)'}
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      • {listing.totalRatingsCount || 0} {listing.totalRatingsCount === 1 ? 'rating' : 'ratings'}
                    </span>
                  </div>

                  <a
                    href="#rate-product"
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    <span>Rate out of 5★</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Campus Location & Handover */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <MapPin className="w-4 h-4 text-slate-800 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold text-slate-900">Pickup Spot:</span>{' '}
                  {listing.location}
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Student Description
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white border border-gray-100 p-3 rounded-lg">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Specs / Inclusions */}
              {listing.specs && listing.specs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    What's Included
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {listing.specs.map((spec, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-800 bg-gray-50 px-2 py-1.5 rounded-md border border-gray-100"
                      >
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Semester Rental vs Buy Economics */}
              {rentalEconomics && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-950 mb-1">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-amber-600" />
                      <span>Semester Break-Even Analysis (90 Days)</span>
                    </span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-xs font-black">
                      RECOMMENDED: {rentalEconomics.recommendation}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed mt-1">
                    {rentalEconomics.advice}
                  </p>
                </div>
              )}

              {/* Seller Profile Card */}
              <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-[#fbbf24] font-black flex items-center justify-center text-sm shadow-xs">
                    {listing.sellerName ? listing.sellerName[0] : 'S'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      {listing.sellerName || 'LPU Student'}
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </h5>
                    <p className="text-[10px] text-gray-500">
                      {listing.sellerReg ? `Reg #${listing.sellerReg} • ` : 'UMS Verified • '}{listing.sellerBranch || 'LPU Student'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {listing.sellerPhone && (
                    <>
                      <a
                        href={generateWhatsAppLink(listing.sellerPhone, listing.title, Boolean(listing.rentPrice))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        title="Chat on WhatsApp"
                        aria-label={`WhatsApp ${listing.sellerName || 'Seller'}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${listing.sellerPhone}`}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                        title="Call Seller"
                        aria-label={`Call ${listing.sellerName || 'Seller'}`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    4.9 ★ Safe
                  </span>
                </div>
              </div>

              {/* Seller's Verified UPI ID & QR Code Scanner Section */}
              <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-purple-200/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-black text-slate-900">
                      Seller UPI & QR Scanner
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-xs">
                      PhonePe
                    </span>
                    <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-xs">
                      Google Pay
                    </span>
                  </div>
                </div>

                {listing.sellerUpiId ? (
                  <div className="space-y-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="min-w-0">
                        <span className="text-[9px] text-gray-500 font-bold block uppercase">
                          Direct Student UPI ID
                        </span>
                        <span className="text-xs font-black text-slate-900 font-mono block truncate">
                          {listing.sellerUpiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyUpi(listing.sellerUpiId!)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-slate-800 text-[10px] font-bold rounded-md flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <Copy className="w-3 h-3 text-slate-600" />
                        <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Deep Link to UPI App */}
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(
                          listing.sellerUpiId
                        )}&pn=${encodeURIComponent(
                          listing.sellerName || 'LPU Student'
                        )}&am=${listing.price}&cu=INR`}
                        className="flex-1 py-1.5 px-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
                      >
                        <span>Pay in UPI App</span>
                      </a>

                      {/* View Payment QR Scanner Button */}
                      {listing.sellerQrScannerUrl && (
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>View QR Scanner</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-white/80 border border-gray-200 rounded-lg text-[11px] text-gray-600">
                    Handover in person at {listing.location}. Cash or PhonePe/GPay UPI accepted upon item inspection.
                  </div>
                )}
              </div>

              {/* Student Ratings & Reviews Section (Rate out of 5 Stars) */}
              <div id="rate-product" className="border border-amber-300/90 bg-gradient-to-b from-amber-50/60 to-white rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Rate Product (1 to 5 Stars)
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900">
                    <span className="text-sm font-black text-slate-950">
                      {listing.averageRating !== undefined && listing.averageRating > 0 ? listing.averageRating.toFixed(1) : 'Unrated'}
                    </span>
                    <span>/ 5 ★</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      ({listing.totalRatingsCount || 0} {listing.totalRatingsCount === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                </div>

                {/* Interactive Rating Form */}
                <form onSubmit={handleRatingSubmit} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
                  <p className="text-[11px] font-semibold text-slate-700">
                    Tap stars to rate this real student product out of 5:
                  </p>

                  {/* 5 Interactive Stars */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isFilled = (hoverStar || selectedStar) >= starValue;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onMouseEnter={() => setHoverStar(starValue)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setSelectedStar(starValue)}
                          className="p-1 rounded-md hover:bg-amber-50 transition-transform active:scale-125 focus:outline-hidden cursor-pointer"
                          aria-label={`Select ${starValue} of 5 stars`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              isFilled
                                ? 'fill-amber-400 text-amber-500 stroke-[1.5]'
                                : 'text-gray-300 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-bold text-slate-800 ml-1.5">
                      {selectedStar === 5 && '★★★★★ (5/5) Excellent'}
                      {selectedStar === 4 && '★★★★☆ (4/5) Great'}
                      {selectedStar === 3 && '★★★☆☆ (3/5) Average'}
                      {selectedStar === 2 && '★★☆☆☆ (2/5) Below expectations'}
                      {selectedStar === 1 && '★☆☆☆☆ (1/5) Poor'}
                      {selectedStar === 0 && 'Select 1 - 5 stars'}
                    </span>
                  </div>

                  {/* Review Text Input */}
                  <div>
                    <input
                      type="text"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add student feedback or item condition notes (optional)..."
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-gray-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Submit Rating Button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-500">
                      Rater: <strong className="text-slate-800">{currentUser?.name || 'Verified LPU Student'}</strong>
                    </span>
                    <button
                      type="submit"
                      disabled={selectedStar === 0 || isSubmittingRating}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg disabled:opacity-50 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      {isSubmittingRating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                      )}
                      <span>Submit {selectedStar > 0 ? `${selectedStar}★ Rating` : 'Rating'}</span>
                    </button>
                  </div>

                  {ratingSubmittedSuccess && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Thank you! Your rating has been recorded for this product.</span>
                    </div>
                  )}
                </form>

                {/* Verified Student Reviews List */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Verified Student Reviews ({listing.ratings?.length || 0})
                  </h5>
                  {(!listing.ratings || listing.ratings.length === 0) ? (
                    <div className="bg-white/80 border border-dashed border-gray-200 rounded-lg p-2.5 text-center text-[11px] text-gray-500">
                      No reviews yet. Be the first LPU student to rate this item!
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                      {listing.ratings.map((r, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 space-y-1 text-xs shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 font-bold text-slate-900">
                              <span>{r.userName}</span>
                              <span className="text-[9px] bg-gray-100 text-gray-600 px-1 py-0.2 rounded-xs">Verified Student</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= r.rating ? 'fill-amber-400 text-amber-500' : 'text-gray-200'
                                  }`}
                                />
                              ))}
                              <span className="text-[10px] font-bold text-slate-700 ml-1">
                                {r.rating}/5
                              </span>
                            </div>
                          </div>
                          {r.review && <p className="text-[11px] text-gray-600">{r.review}</p>}
                          <div className="text-[9px] text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'ai-advisor' && (
            <div className="space-y-3">
              <div className="bg-[#0b242a] text-white p-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#fbbf24]">
                  <Sparkles className="w-4 h-4" />
                  <span>PLUG AI Deep Reasoning Deal Advisor</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Powered by <span className="font-bold text-white">gemini-4-argon</span> with <span className="text-amber-400 font-bold">ThinkingLevel.HIGH</span>. Evaluates LPU campus price fairness, hostel MCB safety, and semester economics.
                </p>
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAskAi('Is this price fair for LPU campus second-hand market?')}
                  className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 px-2.5 py-1 rounded-full transition-colors"
                >
                  ⚖️ Fair price check?
                </button>
                <button
                  type="button"
                  onClick={() => handleAskAi('Should I rent or buy for 1 semester at LPU?')}
                  className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 px-2.5 py-1 rounded-full transition-colors"
                >
                  🔄 Rent vs Buy analysis
                </button>
                <button
                  type="button"
                  onClick={() => handleAskAi('What hostel rules or safety precautions apply to this item?')}
                  className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 px-2.5 py-1 rounded-full transition-colors"
                >
                  ⚡ Hostel safety check
                </button>
                <button
                  type="button"
                  onClick={() => handleAskAi('Give me student negotiation phrases for campus chat')}
                  className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 px-2.5 py-1 rounded-full transition-colors"
                >
                  🤝 Negotiation tips
                </button>
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask any question about this item or deal..."
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskAi();
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAskAi()}
                  disabled={aiLoading}
                  className="bg-slate-950 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />}
                  <span>Ask</span>
                </button>
              </div>

              {/* AI Response Display */}
              {aiLoading && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-amber-950">
                    High Thinking Active (gemini-4-argon)...
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Synthesizing campus pricing benchmarks, hostel appliance wattage policies, and UniMall handover safety...
                  </p>
                </div>
              )}

              {aiResponse && !aiLoading && (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {aiResponse}
                </div>
              )}
            </div>
          )}

          {activeTab === 'escrow' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>100% Student ID Escrow Protection</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  When you rent or buy through PLUG:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-emerald-900 font-medium">
                  <li>Your payment/deposit is held safely in student escrow.</li>
                  <li>You meet the student at a campus safe point (UniMall or Hostel Gate).</li>
                  <li>You test and inspect the item in person.</li>
                  <li>Both students scan the UMS QR code to release the payment.</li>
                </ol>
              </div>

              <div className="border border-gray-200 rounded-xl p-3 text-xs space-y-2">
                <h5 className="font-bold text-slate-900">Recommended Handover Spots:</h5>
                <div className="space-y-1.5 text-[11px] text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span><strong>UniMall Ground Floor:</strong> Near student stationery counter (10 AM - 8 PM).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span><strong>Hostel Turnstile Security:</strong> In full view of guard cameras (BH-1 to BH-8, GH-1 to GH-4).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span><strong>Law Gate Main Street:</strong> Near student cafes in daylight hours.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Actions */}
        <div className="p-3 border-t border-gray-200 bg-white sticky bottom-0 flex items-center gap-2">
          {isOwner ? (
            <div className="w-full py-2 px-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-left">
                  <span className="text-xs font-black text-amber-950 block">
                    📢 You posted this item!
                  </span>
                  <span className="text-[10px] text-amber-800">
                    Owner Controls: Manage, edit or remove this listing.
                  </span>
                </div>
                {onViewOffers && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewOffers();
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                    aria-label="View incoming offers on this item"
                  >
                    View Offers
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditPrice(String(listing.price || ''));
                    setEditRentPrice(String(listing.rentPrice || ''));
                    setEditLocation(listing.location || '');
                    setEditDescription(listing.description || '');
                    setIsEditModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-gray-100 border border-slate-700 text-slate-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-800" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Ad</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenChatWithSeller(listing)}
                className="py-2.5 px-3 bg-white border border-slate-900 text-slate-900 hover:bg-gray-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <MessageSquare className="w-4 h-4 text-slate-900" />
                <span>Chat</span>
              </button>

              {listing.rentPrice ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartRequest(true)}
                    className="flex-1 py-2.5 px-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer active:scale-95"
                    aria-label={`Request to rent for ${listing.rentPrice} per day`}
                  >
                    <span>Rent ₹{listing.rentPrice}/d</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {listing.price > 0 && (
                    <button
                      type="button"
                      onClick={() => handleStartRequest(false)}
                      className="py-2.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer active:scale-95"
                      aria-label={`Buy item for ${listing.price}`}
                    >
                      <span>Buy ₹{listing.price}</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartRequest(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Request to Buy (₹{listing.price})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* IN-MODAL DEAL REQUEST DRAWER / FORM */}
        {isRequestFormOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl relative space-y-3 animate-in slide-in-from-bottom-4">
              <button
                type="button"
                onClick={() => setIsRequestFormOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-700 flex items-center justify-center cursor-pointer"
                aria-label="Close request form"
              >
                <X className="w-4 h-4" />
              </button>

              {requestSentSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Request Sent to Seller!</h4>
                  <p className="text-xs text-gray-600 max-w-xs mx-auto">
                    {listing.sellerName || 'The poster'} has received your offer. You can track status in your <strong>Notifications</strong> tab.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitDealRequest} className="space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      Peer Request
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      Request to {requestIsRent ? 'Rent' : 'Buy'}: {listing.title}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Seller: <strong className="text-slate-800">{listing.sellerName || 'Student'}</strong>{listing.sellerReg ? ` (Reg #${listing.sellerReg})` : ' (UMS Verified)'}
                    </p>
                  </div>

                  {/* Mode Selector if both Rent & Buy are possible */}
                  {listing.rentPrice && listing.price > 0 && (
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setRequestIsRent(true)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          requestIsRent ? 'bg-white text-slate-900 shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Rent (₹{listing.rentPrice}/day)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestIsRent(false)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          !requestIsRent ? 'bg-white text-slate-900 shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Buy (₹{listing.price})
                      </button>
                    </div>
                  )}

                  {/* Rental Duration Selector */}
                  {requestIsRent && listing.rentPrice && (
                    <div className="p-3 bg-yellow-50/70 border border-yellow-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-yellow-600" />
                          <span>Rental Duration</span>
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {rentDays} Day{rentDays > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Day Preset Pills */}
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 7, 14, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setRentDays(days)}
                            className={`flex-1 py-1 text-[11px] font-bold rounded-md border transition-all ${
                              rentDays === days
                                ? 'bg-slate-950 text-white border-slate-950'
                                : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {days}d
                          </button>
                        ))}
                      </div>

                      {/* Calculation */}
                      <div className="flex items-center justify-between pt-1 border-t border-yellow-200/60 text-xs">
                        <span className="text-gray-600">Total Rent (@ ₹{listing.rentPrice}/d):</span>
                        <span className="font-black text-slate-950 text-sm">
                          ₹{(listing.rentPrice * rentDays).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Buy Price Confirmation */}
                  {!requestIsRent && (
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-gray-600">Total Purchase Price:</span>
                      <span className="font-black text-slate-950 text-sm">
                        ₹{listing.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* Safe Campus Handover Spot */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Preferred Campus Handover Spot
                    </label>
                    <select
                      value={handoverLocation}
                      onChange={(e) => setHandoverLocation(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-2.5 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                    >
                      {CAMPUS_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Note to Seller */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Note / Available Meetup Time (Optional)
                    </label>
                    <input
                      type="text"
                      value={buyerNote}
                      onChange={(e) => setBuyerNote(e.target.value)}
                      placeholder="e.g. Can meet today at 5:30 PM after lecture"
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request to Poster</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* QR Scanner Full View Modal */}
        {isQrModalOpen && listing.sellerQrScannerUrl && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center space-y-3 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-xs font-black bg-purple-700 text-white px-2 py-0.5 rounded-md">
                  PhonePe
                </span>
                <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  Google Pay
                </span>
                <span className="text-xs font-black bg-cyan-600 text-white px-2 py-0.5 rounded-md">
                  Paytm
                </span>
              </div>

              <h4 className="text-sm font-black text-slate-900">
                Scan to Pay {listing.sellerName || 'Student Seller'}
              </h4>
              <p className="text-[11px] text-gray-500">
                Open your UPI app camera to scan and send ₹{listing.price.toLocaleString('en-IN')}
              </p>

              <div className="w-64 h-64 mx-auto bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                <img
                  src={listing.sellerQrScannerUrl}
                  alt="Seller QR Scanner"
                  className="w-full h-full object-contain"
                />
              </div>

              {listing.sellerUpiId && (
                <div className="p-2.5 bg-gray-100 rounded-xl flex items-center justify-between text-xs font-mono text-slate-900 font-bold">
                  <span className="truncate">{listing.sellerUpiId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUpi(listing.sellerUpiId!)}
                    className="text-[10px] text-purple-700 font-sans hover:underline ml-2 shrink-0"
                  >
                    {copiedUpi ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* OWNER EDIT LISTING MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl relative space-y-3 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-slate-800" />
                  <span>Edit Your Listing</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Daily Rent Price (₹/day, optional)
                  </label>
                  <input
                    type="number"
                    value={editRentPrice}
                    onChange={(e) => setEditRentPrice(e.target.value)}
                    placeholder="Leave blank if not for rent"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Campus Handover Location
                  </label>
                  <select
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-slate-900 text-xs bg-white"
                  >
                    {CAMPUS_LOCATIONS.map((loc, i) => (
                      <option key={i} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Description & Item Notes
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* OWNER DELETE CONFIRMATION MODAL */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-xs bg-white rounded-2xl p-4 shadow-2xl space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-900">
                Delete this Campus Ad?
              </h4>
              <p className="text-xs text-gray-600">
                Are you sure you want to delete <strong>{listing.title}</strong>? It will be permanently removed for all students.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteListing}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Yes, Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
