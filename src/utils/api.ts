import { CampusListing } from './deals';
import { DealRequest, CampusNotification, RequestStatus } from './requests';
import { UserProfile } from './auth';

/**
 * Client API for full-stack multi-user sync with the backend.
 * Ensures all campus listings, deal requests, and notifications
 * are permanently stored and shared across every student device.
 */

export interface CampusSyncData {
  listings: CampusListing[];
  notifications: CampusNotification[];
  dealRequests: DealRequest[];
  chats?: any[];
  users?: UserProfile[];
}

export async function fetchSync(userId?: string): Promise<CampusSyncData | null> {
  try {
    const url = userId ? `/api/sync?userId=${encodeURIComponent(userId)}` : '/api/sync';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API sync fallback', err);
    return null;
  }
}

export async function fetchListings(): Promise<CampusListing[]> {
  try {
    const res = await fetch('/api/listings');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: CampusListing[] = await res.json();
    return data;
  } catch (err) {
    console.warn('API: failed to fetch listings from shared database', err);
    return [];
  }
}

export async function publishListing(
  listing: CampusListing
): Promise<{ listing: CampusListing; notification: CampusNotification }> {
  const res = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listing),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to publish listing to campus server');
  }
  return res.json();
}

export async function updateListingApi(
  id: string,
  updates: Partial<CampusListing>,
  userId?: string
): Promise<CampusListing | null> {
  try {
    const res = await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, userId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.listing;
  } catch (err) {
    console.error('API update listing error:', err);
    return null;
  }
}

export async function deleteListingApi(id: string, userId?: string): Promise<boolean> {
  try {
    const url = userId ? `/api/listings/${id}?userId=${encodeURIComponent(userId)}` : `/api/listings/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('API delete listing error:', err);
    return false;
  }
}

export async function rateListingApi(
  id: string,
  data: { userId: string; userName: string; rating: number; review?: string }
): Promise<CampusListing> {
  const res = await fetch(`/api/listings/${id}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to submit star rating');
  }
  const result = await res.json();
  return result.listing;
}

export async function fetchDealRequests(userId?: string): Promise<DealRequest[]> {
  try {
    const url = userId ? `/api/deal-requests?userId=${encodeURIComponent(userId)}` : '/api/deal-requests';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API: fallback to local cache for deal requests', err);
    try {
      const cached = localStorage.getItem('plug_deal_requests');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

export async function submitDealRequest(
  request: DealRequest,
  sellerNotification: CampusNotification
): Promise<{ request: DealRequest; sellerNotification: CampusNotification }> {
  const res = await fetch('/api/deal-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, sellerNotification }),
  });
  if (!res.ok) {
    throw new Error('Failed to submit deal request to poster');
  }
  return res.json();
}

export async function updateDealRequestStatusApi(
  requestId: string,
  status: RequestStatus,
  buyerNotification?: CampusNotification
): Promise<{ request: DealRequest; buyerNotification?: CampusNotification }> {
  const res = await fetch(`/api/deal-requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, buyerNotification }),
  });
  if (!res.ok) {
    throw new Error('Failed to update deal request on server');
  }
  return res.json();
}

export async function fetchNotifications(userId?: string): Promise<CampusNotification[]> {
  try {
    const url = userId ? `/api/notifications?userId=${encodeURIComponent(userId)}` : '/api/notifications';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API: fallback to local cache for notifications', err);
    try {
      const cached = localStorage.getItem('plug_notifications');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

export async function markNotificationsAsReadApi(notificationIds?: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds }),
    });
    return res.ok;
  } catch (err) {
    console.error('API mark read error:', err);
    return false;
  }
}

/**
 * Subscribes to real-time events via Server-Sent Events (SSE).
 * Automatically reconnects on network disconnects.
 */
export function subscribeToCampusEvents(
  onEvent: (event: { type: string; payload: any }) => void
): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent(data);
        } catch (err) {
          console.error('SSE JSON parse error:', err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Reconnect after 3 seconds
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn('SSE not supported or connection failed, falling back', err);
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

// --- Real Campus Users Client API ---
export async function fetchUsersApi(): Promise<UserProfile[]> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API: failed to fetch registered users from backend', err);
    return [];
  }
}

export async function saveUserApi(user: UserProfile): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error('API: failed to save user to central backend', err);
    return null;
  }
}

export async function updateUserApi(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error('API: failed to update user profile in central backend', err);
    return null;
  }
}

export async function deleteUserApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('API: failed to delete user from central backend', err);
    return false;
  }
}
