import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CampusStore } from './campusStore.js';
import { CampusListing } from '../utils/deals.js';
import { DealRequest, CampusNotification } from '../utils/requests.js';

test('CampusStore initializes with listings and allows adding a new listing', () => {
  const store = new CampusStore();
  const initialCount = store.getListings().length;
  assert.ok(initialCount >= 0);

  const testListing: CampusListing = {
    id: `test-listing-${Date.now()}`,
    title: 'Test Casio Scientific Calculator 991ES',
    category: 'Mobiles & Tech',
    price: 500,
    rentPrice: 15,
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
    location: 'UniMall & Food Court',
    timeAgo: 'Just now',
    isUmsVerified: true,
    sellerId: 'student_999',
    sellerName: 'Simran Kaur',
  };

  const { listing, notification } = store.addListing(testListing);
  assert.equal(listing.id, testListing.id);
  assert.equal(notification.targetUserId, 'all');
  assert.match(notification.message, /Simran Kaur/);

  const listings = store.getListings();
  assert.equal(listings[0].id, testListing.id);
  assert.equal(listings.length, initialCount + 1);

  // Clean up
  store.deleteListing(testListing.id);
  assert.equal(store.getListings().length, initialCount);
});

test('CampusStore broadcasts real-time events to subscribers', (t, done) => {
  const store = new CampusStore();
  let receivedEvent = false;

  const unsubscribe = store.subscribe((event) => {
    if (event.type === 'NEW_LISTING') {
      receivedEvent = true;
      assert.equal(event.payload.listing.title, 'Broadcast Event Test Drafter');
      unsubscribe();
      done();
    }
  });

  const testListing: CampusListing = {
    id: `event-test-${Date.now()}`,
    title: 'Broadcast Event Test Drafter',
    category: 'Lab & Drafters',
    price: 350,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    location: 'UniMall',
    timeAgo: 'Just now',
    isUmsVerified: true,
  };

  store.addListing(testListing);
  store.deleteListing(testListing.id);
});

test('CampusStore manages deal requests and status updates accurately', () => {
  const store = new CampusStore();

  const req: DealRequest = {
    id: `req-${Date.now()}`,
    itemId: 'item-101',
    itemTitle: 'Lab Apron',
    itemImage: 'https://example.com/img.jpg',
    itemPrice: 200,
    isRent: false,
    totalPrice: 200,
    buyerId: 'buyer-456',
    buyerName: 'Rahul',
    buyerPhone: '9998887770',
    sellerId: 'seller-123',
    sellerName: 'Arjun',
    sellerPhone: '9988776655',
    handoverLocation: 'UniMall',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sellerNotif: CampusNotification = {
    id: `notif-${Date.now()}`,
    targetUserId: 'seller-123',
    type: 'new_request',
    title: 'New Buy Request',
    message: 'Rahul wants to buy your Lab Apron',
    read: false,
    timestamp: 'Just now',
  };

  store.addDealRequest(req, sellerNotif);

  const sellerRequests = store.getDealRequests('seller-123');
  assert.ok(sellerRequests.some((r) => r.id === req.id));

  const buyerRequests = store.getDealRequests('buyer-456');
  assert.ok(buyerRequests.some((r) => r.id === req.id));

  // Update status
  const buyerNotif: CampusNotification = {
    id: `notif-buyer-${Date.now()}`,
    targetUserId: 'buyer-456',
    type: 'request_status',
    title: 'Deal Accepted',
    message: 'Arjun accepted your request',
    read: false,
    timestamp: 'Just now',
  };

  const updateResult = store.updateDealRequestStatus(req.id, 'accepted', buyerNotif);
  assert.ok(updateResult);
  assert.equal(updateResult?.request.status, 'accepted');

  const updatedReqs = store.getDealRequests('seller-123');
  const target = updatedReqs.find((r) => r.id === req.id);
  assert.equal(target?.status, 'accepted');
});

test('CampusStore rates listings out of 5 stars and computes average correctly', () => {
  const store = new CampusStore();
  const testListing: CampusListing = {
    id: `test-rate-${Date.now()}`,
    title: 'Test Cycle for Rating',
    category: 'Bicycles & Rides',
    price: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
    location: 'UniMall',
    timeAgo: 'Just now',
    isUmsVerified: true,
  };

  store.addListing(testListing);

  // Rate 5 stars
  const ratedListing1 = store.rateListing(testListing.id, {
    userId: 'student_1',
    userName: 'Aman Sharma',
    rating: 5,
    review: 'Smooth gear shifts, highly recommended!',
  });

  assert.ok(ratedListing1);
  assert.equal(ratedListing1?.averageRating, 5);
  assert.equal(ratedListing1?.totalRatingsCount, 1);
  assert.equal(ratedListing1?.ratings?.length, 1);

  // Rate 4 stars
  const ratedListing2 = store.rateListing(testListing.id, {
    userId: 'student_2',
    userName: 'Priya Patel',
    rating: 4,
    review: 'Good condition, fair price.',
  });

  assert.ok(ratedListing2);
  assert.equal(ratedListing2?.averageRating, 4.5);
  assert.equal(ratedListing2?.totalRatingsCount, 2);

  // Clean up
  store.deleteListing(testListing.id);
});

test('CampusStore enforces owner-only edit and delete permissions', () => {
  const store = new CampusStore();
  const testListing: CampusListing = {
    id: `perm-test-${Date.now()}`,
    title: 'Original Title',
    category: 'Books & Notes',
    price: 300,
    imageUrl: 'https://example.com/book.jpg',
    location: 'UniMall',
    timeAgo: 'Just now',
    isUmsVerified: true,
    sellerId: 'real_owner_123',
    sellerName: 'Real Owner',
  };

  store.addListing(testListing);

  // Non-owner cannot update
  const wrongUserUpdate = store.updateListing(testListing.id, { price: 200 }, 'imposter_user');
  assert.equal(wrongUserUpdate, null);
  assert.equal(store.getListings().find((l) => l.id === testListing.id)?.price, 300);

  // Owner CAN update
  const ownerUpdate = store.updateListing(testListing.id, { price: 250, title: 'Updated Title' }, 'real_owner_123');
  assert.ok(ownerUpdate);
  assert.equal(ownerUpdate?.price, 250);
  assert.equal(ownerUpdate?.title, 'Updated Title');

  // Non-owner cannot delete
  const imposterDelete = store.deleteListing(testListing.id, 'imposter_user');
  assert.equal(imposterDelete, false);
  assert.ok(store.getListings().some((l) => l.id === testListing.id));

  // Owner CAN delete
  const ownerDelete = store.deleteListing(testListing.id, 'real_owner_123');
  assert.equal(ownerDelete, true);
  assert.ok(!store.getListings().some((l) => l.id === testListing.id));
});

test('CampusStore saves, updates, queries and deletes real student user profiles', () => {
  const store = new CampusStore();
  const testUser = {
    id: `student_${Date.now()}`,
    name: 'Harpreet Singh',
    identifier: 'harpreet.12204911@lpu.in',
    authType: 'email' as const,
    regNumber: '12204911',
    branch: 'B.Tech Mechanical',
    avatarUrl: 'https://example.com/harpreet.png',
    isUmsVerified: true,
    walletBalance: 500,
    upiId: 'harpreet@okaxis',
  };

  // Save new user
  const saved = store.saveUser(testUser);
  assert.equal(saved.id, testUser.id);
  assert.equal(saved.name, 'Harpreet Singh');

  // Query user by ID and identifier
  const foundById = store.getUser(testUser.id);
  assert.ok(foundById);
  assert.equal(foundById?.name, 'Harpreet Singh');

  const foundByIdent = store.getUser('harpreet.12204911@lpu.in');
  assert.ok(foundByIdent);
  assert.equal(foundByIdent?.id, testUser.id);

  // Update user profile data
  const updated = store.updateUser(testUser.id, {
    branch: 'Robotics & Automation',
    upiId: 'harpreet.new@paytm',
  });
  assert.ok(updated);
  assert.equal(updated?.branch, 'Robotics & Automation');
  assert.equal(updated?.upiId, 'harpreet.new@paytm');

  // Clean up
  const deleted = store.deleteUser(testUser.id);
  assert.equal(deleted, true);
  assert.equal(store.getUser(testUser.id), null);
});

