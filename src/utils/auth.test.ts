import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateIdentifier,
  validateSignUpData,
  validateUpiId,
  getStoredUserSession,
  persistUserSession,
  clearUserSession,
  getStoredUsers,
  sanitizeUserProfiles,
} from './auth';

test('validateIdentifier correctly detects emails', () => {
  const result = validateIdentifier('student@lpu.in');
  assert.equal(result.isValid, true);
  assert.equal(result.type, 'email');
  assert.equal(result.normalized, 'student@lpu.in');
});

test('validateIdentifier correctly detects 10-digit mobile phone numbers', () => {
  const result = validateIdentifier('9876543210');
  assert.equal(result.isValid, true);
  assert.equal(result.type, 'phone');
  assert.equal(result.normalized, '9876543210');
});

test('validateIdentifier rejects malformed inputs', () => {
  const result = validateIdentifier('invalid-text');
  assert.equal(result.isValid, false);
  assert.equal(result.type, 'invalid');
});

test('validateSignUpData enforces name, valid identifier, and password', () => {
  const invalid = validateSignUpData({
    name: 'A',
    identifier: '123',
    password: '1',
  });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.identifier);
  assert.ok(invalid.errors.password);

  const valid = validateSignUpData({
    name: 'Verified Student',
    identifier: '9876543210',
    password: 'password123',
  });
  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('validateUpiId correctly validates PhonePe, Google Pay, and Paytm handles', () => {
  // Valid handles
  assert.equal(validateUpiId('student@okhdfcbank'), true);
  assert.equal(validateUpiId('user@ybl'), true);
  assert.equal(validateUpiId('student.2024@paytm'), true);
  assert.equal(validateUpiId('user_name@oksbi'), true);
  assert.equal(validateUpiId('priya-sharma@axl'), true);

  // Invalid handles
  assert.equal(validateUpiId(''), false);
  assert.equal(validateUpiId('not-a-upi'), false);
  assert.equal(validateUpiId('user@'), false);
  assert.equal(validateUpiId('@okhdfcbank'), false);
  assert.equal(validateUpiId('user@@bank'), false);
  assert.equal(validateUpiId('user with spaces@bank'), false);
});

test('session persistence: saves, restores, and clears user session safely', () => {
  const mockStorageMap = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => mockStorageMap.get(k) ?? null,
    setItem: (k: string, v: string) => mockStorageMap.set(k, v),
    removeItem: (k: string) => mockStorageMap.delete(k),
    clear: () => mockStorageMap.clear(),
    key: (i: number) => Array.from(mockStorageMap.keys())[i] || null,
    length: 0,
  } as unknown as Storage;

  const testUser = {
    id: 'user-real-999',
    name: 'Aarav Patel',
    identifier: 'aarav@lpu.in',
    authType: 'email' as const,
    regNumber: '12204999',
    branch: 'B.Tech CSE',
    avatarUrl: 'https://example.com/avatar.png',
    isUmsVerified: true,
    walletBalance: 500,
    upiId: 'aarav@okaxis',
  };

  // Initially empty
  assert.equal(getStoredUserSession(mockStorage), null);

  // Persist session
  persistUserSession(testUser, mockStorage);

  // Stored properly
  const restored = getStoredUserSession(mockStorage);
  assert.ok(restored);
  assert.equal(restored?.id, 'user-real-999');
  assert.equal(restored?.name, 'Aarav Patel');
  assert.equal(restored?.identifier, 'aarav@lpu.in');

  // Verify list also updated
  const users = getStoredUsers(mockStorage);
  assert.equal(users.length, 1);
  assert.equal(users[0].id, 'user-real-999');

  // Clear session on logout
  clearUserSession(mockStorage);
  assert.equal(getStoredUserSession(mockStorage), null);
  assert.equal(mockStorage.getItem('plug_logged_out'), 'true');
});

test('sanitizeUserProfiles rejects legacy mock identities', () => {
  const mixed = [
    { id: 'user-1', name: 'Fake 1' },
    { id: 'user-2', name: 'Fake 2' },
    { id: 'user-real-1', name: 'Karthik Demo', identifier: 'karthik@lpu.in' },
    { id: 'user-real-2', name: 'Simran Kaur', identifier: 'simran@lpu.in' },
  ];
  const cleaned = sanitizeUserProfiles(mixed);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].name, 'Simran Kaur');
});
