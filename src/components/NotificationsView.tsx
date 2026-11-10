import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Phone,
  MessageCircle,
  QrCode,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Inbox,
  Send,
  Radio,
} from 'lucide-react';
import {
  DealRequest,
  CampusNotification,
  RequestStatus,
  generateWhatsAppLink,
} from '../utils/requests';
import { useAuth } from '../context/AuthContext';
import { CampusListing } from '../utils/deals';

interface NotificationsViewProps {
  requests: DealRequest[];
  notifications: CampusNotification[];
  onUpdateStatus: (requestId: string, status: RequestStatus) => void;
  onOpenChat: (userName: string, itemTitle: string) => void;
  onSelectListingById: (itemId: string) => void;
  onMarkAllAsRead: () => void;
  onOpenSellModal: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  requests,
  notifications,
  onUpdateStatus,
  onOpenChat,
  onSelectListingById,
  onMarkAllAsRead,
  onOpenSellModal,
}) => {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'outgoing' | 'broadcasts'>('incoming');
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="p-6 text-center py-20 space-y-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600">
          <Bell className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Campus Deal Notifications</h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Sign in with your campus phone or email to track incoming rent/buy requests and live campus alerts.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('Sign in to view campus notifications and requests')}
          className="px-6 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Incoming requests on listings posted by currentUser
  const incomingRequests = requests.filter(
    (r) => r.sellerId === currentUser.id || r.sellerName === currentUser.name
  );

  // Outgoing requests sent by currentUser
  const outgoingRequests = requests.filter(
    (r) => r.buyerId === currentUser.id
  );

  // Broadcast notifications
  const broadcasts = notifications.filter((n) => n.type === 'campus_broadcast');

  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'pending').length;

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedUpi(text);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  return (
    <div className="p-4 space-y-4 pb-20 animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>Notifications & Requests</span>
            {pendingIncomingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingIncomingCount} Action Required
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500">
            Direct rent & buy offers on your ads + live campus broadcasts
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllAsRead}
          className="text-xs font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-50 px-2.5 py-1.5 rounded-lg border border-yellow-200 transition-colors"
          aria-label="Mark all notifications as read"
        >
          Mark all read
        </button>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('incoming')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'incoming'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-gray-500 hover:text-slate-800'
          }`}
          aria-label="Incoming Requests on my ads"
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Requests on My Ads</span>
          {incomingRequests.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                pendingIncomingCount > 0
                  ? 'bg-red-500 text-white font-black'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('outgoing')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'outgoing'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-gray-500 hover:text-slate-800'
          }`}
          aria-label="My Sent Requests"
        >
          <Send className="w-3.5 h-3.5" />
          <span>My Sent Requests</span>
          {outgoingRequests.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
              {outgoingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('broadcasts')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'broadcasts'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-gray-500 hover:text-slate-800'
          }`}
          aria-label="Campus Broadcasts"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Campus Alerts</span>
          {broadcasts.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
              {broadcasts.length}
            </span>
          )}
        </button>
      </div>

      {/* 1. INCOMING REQUESTS TAB */}
      {activeSubTab === 'incoming' && (
        <div className="space-y-3">
          {incomingRequests.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
              <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto text-gray-400">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Incoming Requests Yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                When students request to buy or rent items you posted, their offers, handover spots, and contact details will appear here instantly.
              </p>
              <button
                type="button"
                onClick={onOpenSellModal}
                className="px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Post an Item to Rent / Sell
              </button>
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className={`p-4 bg-white rounded-2xl border transition-all ${
                  req.status === 'pending'
                    ? 'border-yellow-400/80 shadow-md ring-1 ring-yellow-400/30'
                    : req.status === 'accepted'
                    ? 'border-emerald-300 shadow-xs'
                    : 'border-gray-200 shadow-xs'
                }`}
              >
                {/* Header: Item & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.itemImage}
                      alt={req.itemTitle}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {req.isRent ? `Rent Request (${req.rentDays} days)` : 'Buy Request'}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-[180px] mt-0.5">
                        {req.itemTitle}
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">
                        Offered: ₹{req.totalPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-amber-700" />
                        Pending
                      </span>
                    )}
                    {req.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Accepted
                      </span>
                    )}
                    {req.status === 'declined' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Declined
                      </span>
                    )}
                    {req.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-blue-600" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Buyer Details Card */}
                <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Requested By:</span>
                    <span className="font-bold text-slate-900">{req.buyerName}</span>
                  </div>
                  {req.buyerReg && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">UMS Registration:</span>
                      <span className="font-mono font-bold text-slate-700">{req.buyerReg}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Phone / Identifier:</span>
                    <span className="font-mono font-semibold text-slate-800">{req.buyerPhone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Proposed Meetup Spot:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      {req.handoverLocation}
                    </span>
                  </div>
                  {req.note && (
                    <div className="pt-1 text-[11px] text-gray-600 italic border-t border-gray-200">
                      "{req.note}"
                    </div>
                  )}
                </div>

                {/* Seller Interactive Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  {req.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(req.id, 'accepted')}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                        aria-label={`Accept request from ${req.buyerName}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Deal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(req.id, 'declined')}
                        className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        aria-label={`Decline request from ${req.buyerName}`}
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {req.status === 'accepted' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(req.id, 'completed')}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      aria-label="Confirm item handover complete"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Handover Completed</span>
                    </button>
                  )}

                  {/* Connect with Buyer Buttons */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => onOpenChat(req.buyerName, req.itemTitle)}
                      className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Open In-App Chat with Buyer"
                      aria-label={`Chat with ${req.buyerName}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    {req.buyerPhone && (
                      <a
                        href={generateWhatsAppLink(req.buyerPhone, req.itemTitle, req.isRent)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-1 text-xs font-bold"
                        title="Chat on WhatsApp"
                        aria-label={`WhatsApp ${req.buyerName}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. MY SENT REQUESTS TAB */}
      {activeSubTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
              <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto text-gray-400">
                <Send className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Requests Sent Yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Explore campus listings and tap "Rent" or "Buy" on any item to send a direct request to the poster.
              </p>
            </div>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.itemImage}
                      alt={req.itemTitle}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        {req.isRent ? `Rent (${req.rentDays} days)` : 'Buy Offer'}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-[180px] mt-0.5">
                        {req.itemTitle}
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">
                        Amount: ₹{req.totalPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-amber-700" />
                        Pending Seller
                      </span>
                    )}
                    {req.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Accepted! Meet Seller
                      </span>
                    )}
                    {req.status === 'declined' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Declined
                      </span>
                    )}
                    {req.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-blue-600" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Handover & Seller Info */}
                <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-bold text-slate-900">{req.sellerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Meetup Location:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {req.handoverLocation}
                    </span>
                  </div>

                  {req.sellerUpiId && req.status === 'accepted' && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                      <span className="text-gray-500">Seller UPI:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-purple-700">
                        <span>{req.sellerUpiId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(req.sellerUpiId!)}
                          className="text-[10px] text-gray-500 hover:text-slate-900 underline ml-1"
                        >
                          {copiedUpi === req.sellerUpiId ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Connect with Seller */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenChat(req.sellerName, req.itemTitle)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Seller</span>
                  </button>

                  {req.sellerPhone && (
                    <a
                      href={generateWhatsAppLink(req.sellerPhone, req.itemTitle, req.isRent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectListingById(req.itemId)}
                    className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-bold"
                  >
                    View Item
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. CAMPUS BROADCASTS TAB */}
      {activeSubTab === 'broadcasts' && (
        <div className="space-y-3">
          {broadcasts.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
              <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto text-gray-400">
                <Radio className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Campus Broadcasts Yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Whenever a student posts an ad for rent or sale, a campus-wide alert appears here immediately.
              </p>
            </div>
          ) : (
            broadcasts.map((b) => (
              <div
                key={b.id}
                className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 hover:border-yellow-400 transition-colors"
              >
                {b.broadcastMeta?.itemImage && (
                  <img
                    src={b.broadcastMeta.itemImage}
                    alt={b.broadcastMeta.itemTitle}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="font-extrabold text-yellow-600">📢 CAMPUS BROADCAST</span>
                    <span>•</span>
                    <span>{b.broadcastMeta?.category || 'Student Trade'}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 truncate mt-0.5">
                    {b.broadcastMeta?.itemTitle || b.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {b.broadcastMeta?.rentPrice
                      ? `Rent ₹${b.broadcastMeta.rentPrice}/day`
                      : b.broadcastMeta?.price
                      ? `₹${b.broadcastMeta.price.toLocaleString('en-IN')}`
                      : ''}
                    <span className="text-gray-400 font-normal ml-2">
                      at {b.broadcastMeta?.location}
                    </span>
                  </p>
                </div>

                {b.itemId && (
                  <button
                    type="button"
                    onClick={() => onSelectListingById(b.itemId!)}
                    className="py-1.5 px-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
