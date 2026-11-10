import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CampusStore } from './campusStore.ts';

test('CampusStore creates real chat and stores real messages between users', () => {
  const store = new CampusStore();

  const buyer = {
    id: 'student_buyer_101',
    name: 'Priya Sharma',
    avatarUrl: 'data:image/svg+xml;utf8,<svg></svg>',
    branch: 'B.Tech CSE',
    regNumber: '12201122',
  };

  const seller = {
    id: 'student_seller_202',
    name: 'Harpreet Singh',
    avatarUrl: 'data:image/svg+xml;utf8,<svg></svg>',
    branch: 'MBA',
    regNumber: '12109988',
  };

  // Find or create chat
  const chat = store.findOrCreateChat({
    itemId: 'ad_drafter_99',
    itemTitle: 'Omega Mini Drafter EG-101',
    itemPrice: 350,
    itemLocation: 'UniMall',
    buyer,
    seller,
    initialMessage: 'Is this mini drafter available for handover today?',
  });

  assert.ok(chat.id.startsWith('chat_'));
  assert.equal(chat.itemId, 'ad_drafter_99');
  assert.equal(chat.messages.length, 1);
  assert.equal(chat.messages[0].senderId, buyer.id);
  assert.equal(chat.unreadCount?.[seller.id], 1);
  assert.equal(chat.unreadCount?.[buyer.id], 0);

  // Check seller's unread chats count
  assert.equal(store.getUnreadChatsCount(seller.id), 1);
  assert.equal(store.getUnreadChatsCount(buyer.id), 0);

  // Seller replies
  const replyResult = store.addChatMessage(chat.id, {
    senderId: seller.id,
    senderName: seller.name,
    senderAvatar: seller.avatarUrl,
    text: 'Yes! Can meet at UniMall fountain at 4:30 PM.',
  });

  assert.ok(replyResult);
  assert.equal(replyResult?.chat.messages.length, 2);
  assert.equal(store.getUnreadChatsCount(buyer.id), 1);

  // Buyer reads the chat
  store.markChatRead(chat.id, buyer.id);
  assert.equal(store.getUnreadChatsCount(buyer.id), 0);

  // Clean up
  store.deleteUserChats(buyer.id);
  assert.equal(store.getChats(buyer.id).length, 0);
});
