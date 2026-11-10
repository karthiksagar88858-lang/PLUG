import { CampusListing } from './deals';

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface DealRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  itemPrice: number;
  isRent: boolean;
  rentDays?: number;
  totalPrice: number;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerReg?: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerUpiId?: string;
  handoverLocation: string;
  note?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'new_request' | 'request_status' | 'campus_broadcast';

export interface CampusNotification {
  id: string;
  targetUserId: string | 'all'; // 'all' for campus-wide broadcasts
  type: NotificationType;
  title: string;
  message: string;
  itemId?: string;
  requestId?: string;
  read: boolean;
  timestamp: string;
  broadcastMeta?: {
    itemTitle: string;
    itemImage: string;
    price: number;
    rentPrice?: number;
    sellerName: string;
    location: string;
    category: string;
  };
}

/**
 * Creates a new rent or buy deal request and its accompanying notification for the seller.
 */
export function createDealRequest(params: {
  listing: CampusListing;
  buyer: {
    id: string;
    name: string;
    identifier: string;
    regNumber?: string;
  };
  isRent: boolean;
  rentDays?: number;
  handoverLocation: string;
  note?: string;
}): {
  request: DealRequest;
  sellerNotification: CampusNotification;
} {
  const { listing, buyer, isRent, rentDays = 1, handoverLocation, note } = params;
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const totalPrice = isRent
    ? (listing.rentPrice || 0) * Math.max(1, rentDays)
    : listing.price;

  const request: DealRequest = {
    id: requestId,
    itemId: listing.id,
    itemTitle: listing.title,
    itemImage: listing.imageUrl,
    itemPrice: listing.price,
    isRent,
    rentDays: isRent ? Math.max(1, rentDays) : undefined,
    totalPrice,
    buyerId: buyer.id,
    buyerName: buyer.name,
    buyerPhone: buyer.identifier,
    buyerReg: buyer.regNumber,
    sellerId: listing.sellerId || 'seller-owner',
    sellerName: listing.sellerName || 'Student Poster',
    sellerPhone: listing.sellerPhone,
    sellerUpiId: listing.sellerUpiId,
    handoverLocation: handoverLocation || listing.location,
    note: note?.trim() || undefined,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const sellerNotification: CampusNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    targetUserId: request.sellerId,
    type: 'new_request',
    title: isRent ? `New Rent Request for ₹${totalPrice}` : `New Buy Offer for ₹${totalPrice}`,
    message: `${buyer.name} sent a request to ${isRent ? `rent for ${rentDays} day(s)` : 'buy'} "${listing.title}" at ${request.handoverLocation}.`,
    itemId: listing.id,
    requestId: request.id,
    read: false,
    timestamp: now,
  };

  return { request, sellerNotification };
}

/**
 * Updates status of a request and creates a status notification for the buyer
 */
export function updateRequestStatus(
  requests: DealRequest[],
  requestId: string,
  newStatus: RequestStatus
): {
  updatedRequests: DealRequest[];
  buyerNotification?: CampusNotification;
} {
  let targetRequest: DealRequest | null = null;
  const updatedRequests = requests.map((req) => {
    if (req.id === requestId) {
      targetRequest = {
        ...req,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      return targetRequest;
    }
    return req;
  });

  if (!targetRequest) {
    return { updatedRequests: requests };
  }

  const req = targetRequest as DealRequest;
  const now = new Date().toISOString();

  let title = '';
  let message = '';

  if (newStatus === 'accepted') {
    title = `Request Accepted! Meet at ${req.handoverLocation}`;
    message = `${req.sellerName} accepted your ${req.isRent ? 'rental' : 'purchase'} request for "${req.itemTitle}". Connect on chat/call to finalize meetup.`;
  } else if (newStatus === 'declined') {
    title = `Request Declined for "${req.itemTitle}"`;
    message = `${req.sellerName} was unable to fulfill your request at this time.`;
  } else if (newStatus === 'completed') {
    title = `Deal Completed: "${req.itemTitle}"`;
    message = `Item handover confirmed between ${req.buyerName} and ${req.sellerName}. Thanks for trading on PLUG!`;
  }

  const buyerNotification: CampusNotification = {
    id: `notif-status-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    targetUserId: req.buyerId,
    type: 'request_status',
    title,
    message,
    itemId: req.itemId,
    requestId: req.id,
    read: false,
    timestamp: now,
  };

  return { updatedRequests, buyerNotification };
}

/**
 * Creates a campus-wide broadcast notification when a new listing is published.
 */
export function createBroadcastNotification(listing: CampusListing): CampusNotification {
  const isRent = Boolean(listing.rentPrice && listing.rentPrice > 0);
  const priceDisplay = isRent
    ? `Rent ₹${listing.rentPrice}/day`
    : `₹${listing.price.toLocaleString('en-IN')}`;

  return {
    id: `broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    targetUserId: 'all',
    type: 'campus_broadcast',
    title: `📢 New ${listing.badge || 'Campus Listing'} Available!`,
    message: `${listing.sellerName || 'Student'} posted "${listing.title}" for ${priceDisplay} at ${listing.location}.`,
    itemId: listing.id,
    read: false,
    timestamp: new Date().toISOString(),
    broadcastMeta: {
      itemTitle: listing.title,
      itemImage: listing.imageUrl,
      price: listing.price,
      rentPrice: listing.rentPrice,
      sellerName: listing.sellerName || 'Campus Student',
      location: listing.location,
      category: listing.category,
    },
  };
}

/**
 * Filters requests received by the user as a seller
 */
export function getIncomingRequestsForUser(
  requests: DealRequest[],
  userId: string | null | undefined,
  userName?: string | null
): DealRequest[] {
  if (!userId && !userName) return [];
  const lowerName = userName ? userName.toLowerCase().trim() : null;
  return requests.filter((r) => {
    if (userId && r.sellerId === userId) return true;
    if (lowerName && r.sellerName && r.sellerName.toLowerCase().trim() === lowerName) return true;
    return false;
  });
}

/**
 * Filters requests sent by the user as a buyer
 */
export function getOutgoingRequestsForUser(
  requests: DealRequest[],
  userId: string | null | undefined,
  userName?: string | null
): DealRequest[] {
  if (!userId && !userName) return [];
  const lowerName = userName ? userName.toLowerCase().trim() : null;
  return requests.filter((r) => {
    if (userId && r.buyerId === userId) return true;
    if (lowerName && r.buyerName && r.buyerName.toLowerCase().trim() === lowerName) return true;
    return false;
  });
}

/**
 * Gets all relevant notifications for a user (targeted to user ID or broadcast to 'all')
 */
export function getNotificationsForUser(
  notifications: CampusNotification[],
  userId: string | null | undefined
): CampusNotification[] {
  return notifications.filter((n) => {
    if (n.targetUserId === 'all') return true;
    return userId ? n.targetUserId === userId : false;
  });
}

/**
 * Counts unread notifications for a user
 */
export function getUnreadNotificationCount(
  notifications: CampusNotification[],
  userId: string | null | undefined,
  readNotificationIds: string[] = []
): number {
  const userNotifs = getNotificationsForUser(notifications, userId);
  return userNotifs.filter((n) => !n.read && !readNotificationIds.includes(n.id)).length;
}

/**
 * Generates direct WhatsApp click-to-chat URL with pre-filled message
 */
export function generateWhatsAppLink(phone: string, itemTitle: string, isRent: boolean): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const message = encodeURIComponent(
    `Hello! I saw your listing "${itemTitle}" on PLUG Campus Marketplace. I would like to ${isRent ? 'rent' : 'buy'} it. Are you available to meet on campus?`
  );
  return `https://wa.me/${targetNumber}?text=${message}`;
}
