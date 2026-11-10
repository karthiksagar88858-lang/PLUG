import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDealRequest,
  updateRequestStatus,
  createBroadcastNotification,
  getIncomingRequestsForUser,
  getOutgoingRequestsForUser,
  getNotificationsForUser,
  getUnreadNotificationCount,
  generateWhatsAppLink,
} from './requests';
import { CampusListing } from './deals';

const dummyListing: CampusListing = {
  id: 'item-101',
  title: 'Engineering Drafter & Mini Scale',
  category: 'Lab & Drafters',
  price: 500,
  rentPrice: 20,
  rentPeriod: 'day',
  imageUrl: 'https://images.unsplash.com/photo-1',
  location: 'UniMall & Food Court',
  timeAgo: 'Just now',
  isUmsVerified: true,
  sellerId: 'student-seller-99',
  sellerName: 'Vikas Sharma',
  sellerPhone: '9876543210',
  sellerUpiId: 'vikas@okicici',
};

const dummyBuyer = {
  id: 'student-buyer-42',
  name: 'Rohit Verma',
  identifier: 'rohit@lpu.in',
  regNumber: '12104567',
};

test('createDealRequest creates a valid rent request with correct price and seller notification', () => {
  const result = createDealRequest({
    listing: dummyListing,
    buyer: dummyBuyer,
    isRent: true,
    rentDays: 5,
    handoverLocation: 'UniMall Turnstiles',
    note: 'Please bring today before 5 PM',
  });

  assert.equal(result.request.itemId, 'item-101');
  assert.equal(result.request.isRent, true);
  assert.equal(result.request.rentDays, 5);
  assert.equal(result.request.totalPrice, 100); // 20 * 5
  assert.equal(result.request.buyerId, 'student-buyer-42');
  assert.equal(result.request.sellerId, 'student-seller-99');
  assert.equal(result.request.status, 'pending');

  // Seller notification check
  assert.equal(result.sellerNotification.targetUserId, 'student-seller-99');
  assert.equal(result.sellerNotification.type, 'new_request');
  assert.match(result.sellerNotification.title, /New Rent Request/);
  assert.match(result.sellerNotification.message, /Rohit Verma/);
});

test('createDealRequest handles direct buy request correctly', () => {
  const result = createDealRequest({
    listing: dummyListing,
    buyer: dummyBuyer,
    isRent: false,
    handoverLocation: 'Law Gate Market',
  });

  assert.equal(result.request.isRent, false);
  assert.equal(result.request.totalPrice, 500);
  assert.equal(result.sellerNotification.targetUserId, 'student-seller-99');
  assert.match(result.sellerNotification.title, /New Buy Offer for ₹500/);
});

test('updateRequestStatus updates status and produces buyer notification on accept', () => {
  const { request } = createDealRequest({
    listing: dummyListing,
    buyer: dummyBuyer,
    isRent: true,
    rentDays: 3,
    handoverLocation: 'UniMall',
  });

  const { updatedRequests, buyerNotification } = updateRequestStatus(
    [request],
    request.id,
    'accepted'
  );

  assert.equal(updatedRequests[0].status, 'accepted');
  assert.ok(buyerNotification);
  assert.equal(buyerNotification.targetUserId, 'student-buyer-42');
  assert.match(buyerNotification.title, /Accepted/);
});

test('createBroadcastNotification builds campus broadcast with all users as target', () => {
  const notif = createBroadcastNotification(dummyListing);
  assert.equal(notif.targetUserId, 'all');
  assert.equal(notif.type, 'campus_broadcast');
  assert.match(notif.title, /New/);
  assert.equal(notif.broadcastMeta?.itemTitle, 'Engineering Drafter & Mini Scale');
});

test('getIncomingRequestsForUser and getOutgoingRequestsForUser filter accurately', () => {
  const { request: req1 } = createDealRequest({
    listing: dummyListing,
    buyer: dummyBuyer,
    isRent: false,
    handoverLocation: 'UniMall',
  });

  const incomingForSeller = getIncomingRequestsForUser([req1], 'student-seller-99');
  assert.equal(incomingForSeller.length, 1);

  const incomingForBuyer = getIncomingRequestsForUser([req1], 'student-buyer-42');
  assert.equal(incomingForBuyer.length, 0);

  const outgoingForBuyer = getOutgoingRequestsForUser([req1], 'student-buyer-42');
  assert.equal(outgoingForBuyer.length, 1);

  // Match by userName fallback
  const incomingByName = getIncomingRequestsForUser([req1], undefined, 'Vikas Sharma');
  assert.equal(incomingByName.length, 1);

  const outgoingByName = getOutgoingRequestsForUser([req1], undefined, 'Rohit Verma');
  assert.equal(outgoingByName.length, 1);
});

test('getNotificationsForUser returns broadcast and user-specific notifications', () => {
  const broadcast = createBroadcastNotification(dummyListing);
  const userNotif = {
    id: 'n-1',
    targetUserId: 'student-buyer-42',
    type: 'request_status' as const,
    title: 'Test',
    message: 'Test msg',
    read: false,
    timestamp: new Date().toISOString(),
  };
  const otherUserNotif = {
    id: 'n-2',
    targetUserId: 'other-user',
    type: 'request_status' as const,
    title: 'Other',
    message: 'Other msg',
    read: false,
    timestamp: new Date().toISOString(),
  };

  const list = [broadcast, userNotif, otherUserNotif];
  const userList = getNotificationsForUser(list, 'student-buyer-42');

  assert.equal(userList.length, 2);
  assert.equal(getUnreadNotificationCount(list, 'student-buyer-42'), 2);
  assert.equal(getUnreadNotificationCount(list, 'student-buyer-42', ['n-1']), 1);
});

test('generateWhatsAppLink creates valid url with pre-filled message', () => {
  const link = generateWhatsAppLink('9876543210', 'Campus Gear Bike', true);
  assert.ok(link.startsWith('https://wa.me/919876543210?text='));
  assert.ok(link.includes('Campus%20Gear%20Bike'));
  assert.ok(link.includes('rent'));
});
