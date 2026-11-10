import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CampusListing } from '../utils/deals';
import { DealRequest, CampusNotification, RequestStatus, createBroadcastNotification } from '../utils/requests';
import { UserProfile } from '../utils/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.resolve(DATA_DIR, 'campus_db.json');

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  time: string;
  createdAt: string;
  read: boolean;
}

export interface ChatParticipantProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  branch?: string;
  regNumber?: string;
}

export interface ChatConversation {
  id: string;
  itemId?: string;
  itemTitle?: string;
  itemPrice?: number;
  itemImage?: string;
  itemLocation?: string;
  participants: string[];
  participantProfiles: {
    [userId: string]: ChatParticipantProfile;
  };
  messages: ChatMessage[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: { [userId: string]: number };
  createdAt: string;
  updatedAt: string;
}

export interface CampusDatabaseSchema {
  listings: CampusListing[];
  dealRequests: DealRequest[];
  notifications: CampusNotification[];
  chats: ChatConversation[];
  users: UserProfile[];
  lastUpdated: string;
}

type StoreSubscriber = (event: { type: string; payload: any }) => void;

export class CampusStore {
  private db: CampusDatabaseSchema;
  private dbFilePath: string;
  private subscribers: Set<StoreSubscriber> = new Set();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(dbFilePath: string = DB_FILE) {
    this.dbFilePath = dbFilePath;
    this.db = this.loadFromDisk();
  }

  private loadFromDisk(): CampusDatabaseSchema {
    try {
      const dataDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.listings)) {
          // Retain every real item posted by users without expiry or automatic deletion
          const realListings = parsed.listings.filter(
            (l: CampusListing) =>
              l &&
              l.id &&
              !l.title.toLowerCase().includes('hercules roadeo') &&
              l.id !== 'custom-1793197393086'
          );
          // Sort newest first
          realListings.sort((a: CampusListing, b: CampusListing) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });

          // Filter out any legacy dummy chats or fake names
          const realChats = (Array.isArray(parsed.chats) ? parsed.chats : []).filter(
            (c: ChatConversation) =>
              c &&
              c.id &&
              !JSON.stringify(c).toLowerCase().includes('amanpreet') &&
              !JSON.stringify(c).toLowerCase().includes('rahul verma') &&
              !JSON.stringify(c).toLowerCase().includes('hero sprint')
          );

          // Retain real registered users
          const realUsers = (Array.isArray(parsed.users) ? parsed.users : []).filter(
            (u: UserProfile) =>
              u &&
              u.id &&
              !u.name?.toLowerCase().includes('kartik') &&
              !u.name?.toLowerCase().includes('karthik') &&
              !u.identifier?.toLowerCase().includes('karthik') &&
              !u.identifier?.toLowerCase().includes('kartik')
          );

          return {
            listings: realListings,
            dealRequests: Array.isArray(parsed.dealRequests) ? parsed.dealRequests : [],
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications.filter(
              (n: CampusNotification) => !n.message?.toLowerCase().includes('hercules')
            ) : [],
            chats: realChats,
            users: realUsers,
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('CampusStore: could not read db from disk, creating fresh store', err);
    }

    const initialData: CampusDatabaseSchema = {
      listings: [],
      dealRequests: [],
      notifications: [],
      chats: [],
      users: [],
      lastUpdated: new Date().toISOString(),
    };

    this.saveToDiskSync(initialData);
    return initialData;
  }

  private saveToDiskSync(data: CampusDatabaseSchema) {
    try {
      const dataDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('CampusStore: failed to write db to disk', err);
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.db.lastUpdated = new Date().toISOString();
      this.saveToDiskSync(this.db);
      this.saveTimeout = null;
    }, 50);
  }

  // --- Real-Time Pub/Sub for SSE ---
  public subscribe(subscriber: StoreSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public broadcast(type: string, payload: any) {
    for (const sub of this.subscribers) {
      try {
        sub({ type, payload });
      } catch (err) {
        console.error('CampusStore subscriber error:', err);
      }
    }
  }

  // --- Listings Operations ---
  public getListings(): CampusListing[] {
    return [...this.db.listings];
  }

  public addListing(listing: CampusListing): { listing: CampusListing; notification: CampusNotification } {
    const nowIso = new Date().toISOString();
    const normalizedListing: CampusListing = {
      ...listing,
      id: listing.id || `listing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: listing.createdAt || nowIso,
      updatedAt: nowIso,
      images: listing.images && listing.images.length > 0 ? listing.images : (listing.imageUrl ? [listing.imageUrl] : []),
      type: listing.type || (listing.rentPrice && listing.price ? 'both' : listing.rentPrice ? 'rent' : 'sale'),
      ratings: listing.ratings || [],
      averageRating: listing.averageRating || 0,
      totalRatingsCount: listing.totalRatingsCount || 0,
    };

    // Put newest listings first
    this.db.listings = [
      normalizedListing,
      ...this.db.listings.filter((l) => l.id !== normalizedListing.id),
    ];

    // Create campus broadcast notification for all students
    const notification = createBroadcastNotification(normalizedListing);
    this.db.notifications = [notification, ...this.db.notifications];

    this.saveToDiskSync(this.db);

    // Broadcast in real-time to all connected users
    this.broadcast('NEW_LISTING', {
      listing: normalizedListing,
      notification,
    });

    return { listing: normalizedListing, notification };
  }

  public updateListing(
    id: string,
    updates: Partial<CampusListing>,
    userId?: string
  ): CampusListing | null {
    const existing = this.db.listings.find((l) => l.id === id);
    if (!existing) return null;

    // Check permissions: only the seller can edit
    if (userId && existing.sellerId && existing.sellerId !== userId) {
      return null;
    }

    const updated: CampusListing = {
      ...existing,
      ...updates,
      id: existing.id,
      sellerId: existing.sellerId,
      sellerName: existing.sellerName,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.db.listings = this.db.listings.map((l) => (l.id === id ? updated : l));
    this.saveToDiskSync(this.db);
    this.broadcast('UPDATE_LISTING', { listing: updated });
    return updated;
  }

  public deleteListing(id: string, userId?: string): boolean {
    const existing = this.db.listings.find((l) => l.id === id);
    if (!existing) return false;

    // Check permissions: only owner can delete if userId is provided
    if (userId && existing.sellerId && existing.sellerId !== userId) {
      return false;
    }

    const initialLen = this.db.listings.length;
    this.db.listings = this.db.listings.filter((l) => l.id !== id);
    this.db.notifications = this.db.notifications.filter((n) => n.itemId !== id);
    if (this.db.listings.length !== initialLen) {
      this.saveToDiskSync(this.db);
      this.broadcast('DELETE_LISTING', { id });
      return true;
    }
    return false;
  }

  public rateListing(
    id: string,
    ratingData: { userId: string; userName: string; rating: number; review?: string }
  ): CampusListing | null {
    let updatedListing: CampusListing | null = null;
    const cleanRating = Math.max(1, Math.min(5, Math.round(ratingData.rating)));

    this.db.listings = this.db.listings.map((l) => {
      if (l.id === id) {
        const existingRatings = l.ratings || [];
        const filtered = existingRatings.filter((r) => r.userId !== ratingData.userId);
        const newRating = {
          userId: ratingData.userId,
          userName: ratingData.userName,
          rating: cleanRating,
          review: ratingData.review?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        const allRatings = [newRating, ...filtered];
        const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
        const averageRating = Math.round((sum / allRatings.length) * 10) / 10;

        updatedListing = {
          ...l,
          ratings: allRatings,
          averageRating,
          totalRatingsCount: allRatings.length,
        };
        return updatedListing;
      }
      return l;
    });

    if (updatedListing) {
      this.scheduleSave();
      this.broadcast('LISTING_RATED', { listing: updatedListing });
    }

    return updatedListing;
  }

  // --- Deal Requests Operations ---
  public getDealRequests(userId?: string): DealRequest[] {
    if (!userId) {
      return [...this.db.dealRequests];
    }
    const cleanId = userId.toLowerCase().trim();
    return this.db.dealRequests.filter((r) => {
      const matchBuyer =
        r.buyerId?.toLowerCase() === cleanId ||
        r.buyerPhone?.toLowerCase() === cleanId ||
        r.buyerReg?.toLowerCase() === cleanId;
      const matchSeller =
        r.sellerId?.toLowerCase() === cleanId ||
        r.sellerPhone?.toLowerCase() === cleanId ||
        r.sellerName?.toLowerCase() === cleanId;
      return matchBuyer || matchSeller;
    });
  }

  public addDealRequest(
    request: DealRequest,
    sellerNotification: CampusNotification
  ): { request: DealRequest; sellerNotification: CampusNotification } {
    this.db.dealRequests = [request, ...this.db.dealRequests];
    this.db.notifications = [sellerNotification, ...this.db.notifications];

    this.scheduleSave();

    // Broadcast to relevant seller/parties
    this.broadcast('NEW_DEAL_REQUEST', {
      request,
      notification: sellerNotification,
    });

    return { request, sellerNotification };
  }

  public updateDealRequestStatus(
    requestId: string,
    status: RequestStatus,
    buyerNotification?: CampusNotification
  ): { request: DealRequest; buyerNotification?: CampusNotification } | null {
    let targetRequest: DealRequest | null = null;

    this.db.dealRequests = this.db.dealRequests.map((req) => {
      if (req.id === requestId) {
        targetRequest = {
          ...req,
          status,
          updatedAt: new Date().toISOString(),
        };
        return targetRequest;
      }
      return req;
    });

    if (!targetRequest) {
      return null;
    }

    if (buyerNotification) {
      this.db.notifications = [buyerNotification, ...this.db.notifications];
    }

    this.scheduleSave();

    this.broadcast('DEAL_STATUS_UPDATED', {
      request: targetRequest,
      buyerNotification,
    });

    return { request: targetRequest, buyerNotification };
  }

  // --- Notifications Operations ---
  public getNotifications(userId?: string): CampusNotification[] {
    if (!userId) {
      return [...this.db.notifications];
    }
    const cleanId = userId.toLowerCase().trim();
    return this.db.notifications.filter((n) => {
      if (n.targetUserId === 'all') return true;
      return n.targetUserId?.toLowerCase() === cleanId;
    });
  }

  public addNotification(notification: CampusNotification): CampusNotification {
    this.db.notifications = [notification, ...this.db.notifications];
    this.scheduleSave();
    this.broadcast('NEW_NOTIFICATION', { notification });
    return notification;
  }

  public markNotificationsRead(notificationIds?: string[]): void {
    if (!notificationIds || notificationIds.length === 0) {
      this.db.notifications = this.db.notifications.map((n) => ({ ...n, read: true }));
    } else {
      const idSet = new Set(notificationIds);
      this.db.notifications = this.db.notifications.map((n) =>
        idSet.has(n.id) ? { ...n, read: true } : n
      );
    }
    this.scheduleSave();
    this.broadcast('NOTIFICATIONS_READ', { notificationIds });
  }

  // --- Real Campus Chats Operations ---
  public getChats(userId?: string): ChatConversation[] {
    if (!this.db.chats) this.db.chats = [];
    if (!userId) {
      return [...this.db.chats];
    }
    const cleanId = userId.toLowerCase().trim();
    const userChats = this.db.chats.filter((c) =>
      c.participants && c.participants.some((p) => p.toLowerCase().trim() === cleanId)
    );
    // Sort newest updated first
    userChats.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
    return userChats;
  }

  public getChat(chatId: string): ChatConversation | null {
    if (!this.db.chats) this.db.chats = [];
    return this.db.chats.find((c) => c.id === chatId) || null;
  }

  public findOrCreateChat(data: {
    itemId?: string;
    itemTitle?: string;
    itemPrice?: number;
    itemImage?: string;
    itemLocation?: string;
    buyer: ChatParticipantProfile;
    seller: ChatParticipantProfile;
    initialMessage?: string;
  }): ChatConversation {
    if (!this.db.chats) this.db.chats = [];

    const buyerId = data.buyer.id;
    const sellerId = data.seller.id;

    // Look for existing conversation between buyer and seller (for this item or in general)
    let existing = this.db.chats.find((c) => {
      const matchParticipants =
        c.participants.includes(buyerId) && c.participants.includes(sellerId);
      if (data.itemId) {
        return matchParticipants && c.itemId === data.itemId;
      }
      return matchParticipants;
    });

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowIso = now.toISOString();

    if (existing) {
      // If there is an initial message to add
      if (data.initialMessage && data.initialMessage.trim()) {
        const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newMsg: ChatMessage = {
          id: msgId,
          chatId: existing.id,
          senderId: buyerId,
          senderName: data.buyer.name,
          senderAvatar: data.buyer.avatarUrl,
          text: data.initialMessage.trim(),
          time: timeFormatted,
          createdAt: nowIso,
          read: false,
        };
        existing.messages = [...(existing.messages || []), newMsg];
        existing.lastMessage = newMsg.text;
        existing.lastMessageTime = 'Just now';
        existing.updatedAt = nowIso;
        if (!existing.unreadCount) existing.unreadCount = {};
        existing.unreadCount[sellerId] = (existing.unreadCount[sellerId] || 0) + 1;

        this.scheduleSave();
        this.broadcast('NEW_CHAT_MESSAGE', { chat: existing, message: newMsg });
      }
      return existing;
    }

    const chatId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newChat: ChatConversation = {
      id: chatId,
      itemId: data.itemId,
      itemTitle: data.itemTitle,
      itemPrice: data.itemPrice,
      itemImage: data.itemImage,
      itemLocation: data.itemLocation,
      participants: [buyerId, sellerId],
      participantProfiles: {
        [buyerId]: data.buyer,
        [sellerId]: data.seller,
      },
      messages: [],
      lastMessage: data.initialMessage ? data.initialMessage.trim() : 'Conversation started',
      lastMessageTime: 'Just now',
      unreadCount: {
        [sellerId]: data.initialMessage ? 1 : 0,
        [buyerId]: 0,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (data.initialMessage && data.initialMessage.trim()) {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const firstMsg: ChatMessage = {
        id: msgId,
        chatId: chatId,
        senderId: buyerId,
        senderName: data.buyer.name,
        senderAvatar: data.buyer.avatarUrl,
        text: data.initialMessage.trim(),
        time: timeFormatted,
        createdAt: nowIso,
        read: false,
      };
      newChat.messages.push(firstMsg);
    }

    this.db.chats = [newChat, ...this.db.chats];
    this.scheduleSave();
    this.broadcast('NEW_CHAT', { chat: newChat });
    return newChat;
  }

  public addChatMessage(
    chatId: string,
    messageData: {
      senderId: string;
      senderName: string;
      senderAvatar?: string;
      text: string;
    }
  ): { chat: ChatConversation; message: ChatMessage } | null {
    if (!this.db.chats) this.db.chats = [];
    const chatIndex = this.db.chats.findIndex((c) => c.id === chatId);
    if (chatIndex === -1) return null;

    const chat = this.db.chats[chatIndex];
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowIso = now.toISOString();

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderAvatar: messageData.senderAvatar,
      text: messageData.text.trim(),
      time: timeFormatted,
      createdAt: nowIso,
      read: false,
    };

    if (!chat.unreadCount) chat.unreadCount = {};
    for (const p of chat.participants) {
      if (p !== messageData.senderId) {
        chat.unreadCount[p] = (chat.unreadCount[p] || 0) + 1;
      }
    }

    chat.messages = [...(chat.messages || []), newMsg];
    chat.lastMessage = newMsg.text;
    chat.lastMessageTime = 'Just now';
    chat.updatedAt = nowIso;

    // Move updated chat to top
    this.db.chats.splice(chatIndex, 1);
    this.db.chats.unshift(chat);

    this.scheduleSave();
    this.broadcast('NEW_CHAT_MESSAGE', { chat, message: newMsg });

    return { chat, message: newMsg };
  }

  public markChatRead(chatId: string, userId: string): ChatConversation | null {
    if (!this.db.chats) return null;
    const chat = this.db.chats.find((c) => c.id === chatId);
    if (!chat) return null;

    let modified = false;
    if (chat.messages) {
      chat.messages.forEach((m) => {
        if (m.senderId !== userId && !m.read) {
          m.read = true;
          modified = true;
        }
      });
    }

    if (chat.unreadCount && chat.unreadCount[userId] !== 0) {
      chat.unreadCount[userId] = 0;
      modified = true;
    }

    if (modified) {
      this.scheduleSave();
      this.broadcast('CHAT_READ', { chatId, userId });
    }

    return chat;
  }

  public getUnreadChatsCount(userId: string): number {
    if (!this.db.chats) return 0;
    const cleanId = userId.toLowerCase().trim();
    let totalUnread = 0;
    for (const chat of this.db.chats) {
      if (chat.participants && chat.participants.some((p) => p.toLowerCase().trim() === cleanId)) {
        if (chat.unreadCount && typeof chat.unreadCount[userId] === 'number') {
          totalUnread += chat.unreadCount[userId];
        } else if (chat.messages) {
          const unreadForUser = chat.messages.filter(
            (m) => m.senderId !== userId && !m.read
          ).length;
          totalUnread += unreadForUser;
        }
      }
    }
    return totalUnread;
  }

  public deleteUserChats(userId: string): void {
    if (!this.db.chats) return;
    const cleanId = userId.toLowerCase().trim();
    this.db.chats = this.db.chats.filter(
      (c) => !c.participants.some((p) => p.toLowerCase().trim() === cleanId)
    );
    this.scheduleSave();
  }

  // --- Real Registered Campus Users Operations ---
  public getUsers(): UserProfile[] {
    if (!this.db.users) this.db.users = [];
    return [...this.db.users];
  }

  public getUser(idOrIdentifier: string): UserProfile | null {
    if (!this.db.users) this.db.users = [];
    const clean = idOrIdentifier.trim().toLowerCase();
    return (
      this.db.users.find(
        (u) =>
          u.id.toLowerCase() === clean ||
          u.identifier.toLowerCase() === clean
      ) || null
    );
  }

  public saveUser(user: UserProfile): UserProfile {
    if (!this.db.users) this.db.users = [];
    const cleanId = user.id.toLowerCase();
    const cleanIdent = user.identifier.toLowerCase();

    const existingIndex = this.db.users.findIndex(
      (u) => u.id.toLowerCase() === cleanId || u.identifier.toLowerCase() === cleanIdent
    );

    if (existingIndex >= 0) {
      this.db.users[existingIndex] = {
        ...this.db.users[existingIndex],
        ...user,
      };
      this.scheduleSave();
      this.broadcast('USER_UPDATED', { user: this.db.users[existingIndex] });
      return this.db.users[existingIndex];
    } else {
      this.db.users = [user, ...this.db.users];
      this.scheduleSave();
      this.broadcast('USER_CREATED', { user });
      return user;
    }
  }

  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
    if (!this.db.users) this.db.users = [];
    const cleanId = id.toLowerCase();
    const userIndex = this.db.users.findIndex((u) => u.id.toLowerCase() === cleanId);
    if (userIndex === -1) return null;

    const updated = {
      ...this.db.users[userIndex],
      ...updates,
      id: this.db.users[userIndex].id,
    };
    this.db.users[userIndex] = updated;
    this.scheduleSave();
    this.broadcast('USER_UPDATED', { user: updated });
    return updated;
  }

  public deleteUser(id: string): boolean {
    if (!this.db.users) return false;
    const cleanId = id.toLowerCase();
    const initialLen = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.id.toLowerCase() !== cleanId);
    if (this.db.users.length !== initialLen) {
      this.scheduleSave();
      this.broadcast('USER_DELETED', { id });
      return true;
    }
    return false;
  }
}

// Global singleton instance for server
export const campusStore = new CampusStore();
