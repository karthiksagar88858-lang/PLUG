import React, { useState } from 'react';
import {
  Heart,
  Package,
  Plus,
  Trash2,
  LogIn,
  Edit2,
  CheckCircle2,
  Repeat,
  AlertTriangle,
  X,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CampusListing } from '../utils/deals';
import { CAMPUS_LOCATIONS } from '../data/campusData';
import { useAuth } from '../context/AuthContext';

interface MyAdsViewProps {
  allListings: CampusListing[];
  favoriteIds: string[];
  myListings: CampusListing[];
  onSelectListing: (listing: CampusListing) => void;
  onRemoveFavorite: (id: string) => void;
  onOpenSellModal: () => void;
  onDeleteListing?: (id: string) => Promise<void>;
  onEditListing?: (listingId: string, updates: Partial<CampusListing>) => Promise<void>;
  onUpdateListingStatus?: (listingId: string, status: 'active' | 'sold' | 'rented') => Promise<void>;
}

export const MyAdsView: React.FC<MyAdsViewProps> = ({
  allListings,
  favoriteIds,
  myListings,
  onSelectListing,
  onRemoveFavorite,
  onOpenSellModal,
  onDeleteListing,
  onEditListing,
  onUpdateListingStatus,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [tab, setTab] = useState<'favorites' | 'posted'>('posted');

  // Delete Confirmation Modal State
  const [listingToDelete, setListingToDelete] = useState<CampusListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal State
  const [listingToEdit, setListingToEdit] = useState<CampusListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editRentPrice, setEditRentPrice] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const favoriteItems = allListings.filter((l) => favoriteIds.includes(l.id));

  const handleStartEdit = (item: CampusListing, e: React.MouseEvent) => {
    e.stopPropagation();
    setListingToEdit(item);
    setEditTitle(item.title);
    setEditPrice(item.price ? item.price.toString() : '');
    setEditRentPrice(item.rentPrice ? item.rentPrice.toString() : '');
    setEditLocation(item.location || CAMPUS_LOCATIONS[0]);
    setEditDescription(item.description || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingToEdit || !onEditListing) return;

    if (!editTitle.trim() || editTitle.trim().length < 5) {
      setEditError('Title must be at least 5 characters long.');
      return;
    }

    const priceNum = Number(editPrice) || 0;
    const rentNum = editRentPrice ? Number(editRentPrice) : undefined;
    if (priceNum <= 0 && (!rentNum || rentNum <= 0)) {
      setEditError('Please set either a valid purchase price or daily rent rate.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await onEditListing(listingToEdit.id, {
        title: editTitle.trim(),
        price: priceNum,
        rentPrice: rentNum,
        location: editLocation.trim(),
        description: editDescription.trim(),
      });
      setListingToEdit(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete || !onDeleteListing) return;
    setIsDeleting(true);
    try {
      await onDeleteListing(listingToDelete.id);
      setListingToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (
    item: CampusListing,
    newStatus: 'active' | 'sold' | 'rented',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (onUpdateListingStatus) {
      await onUpdateListingStatus(item.id, newStatus);
    } else if (onEditListing) {
      await onEditListing(item.id, { status: newStatus });
    }
  };

  return (
    <div className="p-4 pb-24 space-y-3">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setTab('posted')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            tab === 'posted'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-gray-500 hover:text-slate-800'
          }`}
        >
          My Posted Ads ({isAuthenticated ? myListings.length : 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('favorites')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            tab === 'favorites'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-gray-500 hover:text-slate-800'
          }`}
        >
          Saved Favorites ({favoriteItems.length})
        </button>
      </div>

      {/* Posted Ads Tab */}
      {tab === 'posted' && (
        <div className="space-y-3">
          {!isAuthenticated ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 space-y-3 shadow-2xs">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Sign In Required</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Sign in with your campus account to view, edit, or manage your posted student ads.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal('Sign in to view your posted ads')}
                className="px-4 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[3]" />
                <span>Sign In to Campus Hub</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenSellModal}
                className="w-full py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Post a New Ad on Campus</span>
              </button>

              {myListings.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 space-y-2 shadow-2xs">
                  <Package className="w-10 h-10 text-gray-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-800">No active ads posted</h4>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    You haven't posted any items yet. Sell your drafters, cycles, books, heaters, or tech to campus peers!
                  </p>
                </div>
              ) : (
                myListings.map((item) => {
                  const isSold = item.status === 'sold';
                  const isRented = item.status === 'rented';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectListing(item)}
                      className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative"
                    >
                      {/* Top Row: Thumbnail + Info */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className={`w-full h-full object-cover ${isSold || isRented ? 'opacity-60 grayscale-30' : ''}`}
                          />
                          {/* Status overlay badge */}
                          {isSold ? (
                            <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                              <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs uppercase">
                                SOLD
                              </span>
                            </div>
                          ) : isRented ? (
                            <div className="absolute inset-0 bg-purple-950/40 flex items-center justify-center">
                              <span className="bg-purple-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs uppercase">
                                RENTED
                              </span>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              {item.category === 'Others' && item.customCategory
                                ? `Others: ${item.customCategory}`
                                : item.category}
                            </span>
                            {/* Status Indicator */}
                            {isSold ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.2 rounded-full">
                                Sold
                              </span>
                            ) : isRented ? (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.2 rounded-full">
                                Currently Rented
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                <span>Live on Campus</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {item.title}
                          </h4>

                          <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="text-sm font-black text-slate-900">
                              ₹ {item.price.toLocaleString('en-IN')}
                            </span>
                            {item.rentPrice && (
                              <span className="text-[11px] text-gray-500 font-bold">
                                • ₹{item.rentPrice}/{item.rentPeriod || 'day'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-gray-500 pt-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Owner Controls Bar: Status toggle, Edit, Delete */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          {/* Sold / Rented toggles */}
                          {!isSold && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleStatus(item, 'sold', e)}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Mark this item as sold to campus peers"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Mark Sold</span>
                            </button>
                          )}

                          {!isRented && item.rentPrice && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleStatus(item, 'rented', e)}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Mark this item as currently rented"
                            >
                              <Repeat className="w-3.5 h-3.5 text-purple-600" />
                              <span>Mark Rented</span>
                            </button>
                          )}

                          {(isSold || isRented) && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleStatus(item, 'active', e)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reactivate listing on campus marketplace"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Reactivate Ad</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Edit Ad Button */}
                          {onEditListing && (
                            <button
                              type="button"
                              onClick={(e) => handleStartEdit(item, e)}
                              className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Ad Details"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Ad Button (with confirmation popup) */}
                          {onDeleteListing && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setListingToDelete(item);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Ad"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {tab === 'favorites' && (
        <div className="space-y-2.5">
          {favoriteItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <Heart className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">No saved items yet</h4>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                Tap the heart icon on any campus listing to save it and track price drops!
              </p>
            </div>
          ) : (
            favoriteItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectListing(item)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                      ₹ {item.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {item.location}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(item.id);
                  }}
                  aria-label="Remove favorite"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 id="delete-dialog-title" className="text-sm font-black text-slate-900">
                Delete Campus Ad?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{listingToDelete.title}"</strong>? This will permanently remove your listing from the shared campus database.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Ad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ad Modal */}
      {listingToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-dialog-title"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="edit-dialog-title" className="text-sm font-black text-slate-900">
                    Edit Campus Ad
                  </h3>
                  <p className="text-[10px] text-gray-500">Update price, rent rate, or details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setListingToEdit(null)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-4 space-y-3.5 text-xs">
              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                  {editError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ad Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Rent Price (₹/day)
                  </label>
                  <input
                    type="number"
                    value={editRentPrice}
                    onChange={(e) => setEditRentPrice(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Campus Handover Spot */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Handover Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 text-xs bg-white"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Condition & Notes
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 text-xs resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setListingToEdit(null)}
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
