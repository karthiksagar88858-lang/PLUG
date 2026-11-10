export interface UserProfile {
  id: string;
  name: string;
  identifier: string; // Email or phone
  authType: 'email' | 'phone';
  regNumber: string;
  branch: string;
  avatarUrl: string;
  isUmsVerified: boolean;
  walletBalance: number;
  upiId?: string; // e.g. yourname@upi
  upiApp?: 'googlepay' | 'phonepe' | 'paytm' | 'other';
  qrScannerUrl?: string; // Data URL or Image URL of payment QR code scanner
}

export function validateIdentifier(input: string): {
  isValid: boolean;
  type: 'email' | 'phone' | 'invalid';
  normalized: string;
} {
  const trimmed = input.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[+]?[\d\s-]{10,15}$/;

  if (emailRegex.test(trimmed)) {
    return { isValid: true, type: 'email', normalized: trimmed.toLowerCase() };
  }

  // Remove non-digit characters for phone check
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 13) {
    return { isValid: true, type: 'phone', normalized: digits };
  }

  return { isValid: false, type: 'invalid', normalized: trimmed };
}

export function validateSignUpData(data: {
  name: string;
  identifier: string;
  password?: string;
  regNumber?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Please provide your full student name.';
  }

  const idCheck = validateIdentifier(data.identifier || '');
  if (!idCheck.isValid) {
    errors.identifier = 'Please provide a valid student email (e.g. name@lpu.in) or 10-digit mobile number.';
  }

  if (!data.password || data.password.length < 4) {
    errors.password = 'Password / PIN must be at least 4 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates standard Indian UPI ID formats (e.g. yourname@upi, student@paytm, name@okhdfcbank)
 */
export function validateUpiId(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  // Standard format: [handle]@[bank_provider]
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,50}@[a-zA-Z0-9.\-_]{2,30}$/;
  return upiRegex.test(trimmed);
}

export const STORAGE_KEYS = {
  CURRENT_USER: 'plug_saved_user_profile',
  CURRENT_USER_ID: 'plug_current_user_id',
  USERS_LIST: 'plug_users',
  LOGGED_OUT: 'plug_logged_out',
  SESSION_TOKEN: 'plug_session_token',
  TOKEN_EXPIRY: 'plug_token_expiry',
};

/**
 * Filter out any legacy dummy/sample profiles
 */
export function sanitizeUserProfiles(profiles: any[]): UserProfile[] {
  if (!Array.isArray(profiles)) return [];
  return profiles.filter((u): u is UserProfile => {
    if (!u || typeof u !== 'object' || !u.id || !u.name) return false;
    const cleanId = String(u.id).toLowerCase();
    const cleanName = String(u.name).toLowerCase();
    const cleanIdent = String(u.identifier || '').toLowerCase();
    if (cleanId === 'user-1' || cleanId === 'user-2' || cleanId === 'user-3') return false;
    if (cleanName.includes('kartik') || cleanName.includes('karthik')) return false;
    if (cleanIdent.includes('kartik') || cleanIdent.includes('karthik')) return false;
    return true;
  });
}

/**
 * Synchronously retrieves stored user session if user has not explicitly logged out
 */
export function getStoredUserSession(storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null): UserProfile | null {
  if (!storage) return null;
  try {
    const isLoggedOut = storage.getItem(STORAGE_KEYS.LOGGED_OUT) === 'true';
    if (isLoggedOut) return null;

    // 1. Direct saved user profile snapshot
    const directRaw = storage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (directRaw) {
      const parsed = JSON.parse(directRaw);
      const sanitized = sanitizeUserProfiles([parsed]);
      if (sanitized.length > 0) return sanitized[0];
    }

    // 2. Lookup by stored current user ID
    const currentId = storage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const usersRaw = storage.getItem(STORAGE_KEYS.USERS_LIST);
    if (usersRaw) {
      const usersList = sanitizeUserProfiles(JSON.parse(usersRaw));
      if (currentId) {
        const found = usersList.find((u) => u.id === currentId);
        if (found) return found;
      }
      if (usersList.length > 0) {
        return usersList[0];
      }
    }
    return null;
  } catch (err) {
    console.warn('Failed to parse stored user session', err);
    return null;
  }
}

/**
 * Synchronously retrieves stored users list
 */
export function getStoredUsers(storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null): UserProfile[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEYS.USERS_LIST);
    if (raw) {
      return sanitizeUserProfiles(JSON.parse(raw));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Persists user session permanently to local storage
 */
export function persistUserSession(
  user: UserProfile,
  storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null
): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEYS.LOGGED_OUT);
    storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    storage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    storage.setItem(STORAGE_KEYS.SESSION_TOKEN, `plug_token_${user.id}_${Date.now()}`);
    storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, (Date.now() + 60 * 86400 * 1000).toString());

    // Update users array
    const existing = getStoredUsers(storage);
    const updated = upsertUserInList(user, existing);
    storage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(updated));
  } catch (err) {
    console.error('Error persisting user session', err);
  }
}

/**
 * Clears user session on explicit logout
 */
export function clearUserSession(
  storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.LOGGED_OUT, 'true');
    storage.removeItem(STORAGE_KEYS.CURRENT_USER);
    storage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    storage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    storage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  } catch (err) {
    console.error('Error clearing user session', err);
  }
}

/**
 * Pure helper to upsert a user in a user list without duplicates
 */
export function upsertUserInList(user: UserProfile, list: UserProfile[]): UserProfile[] {
  const sanitized = sanitizeUserProfiles(list);
  const index = sanitized.findIndex(
    (u) =>
      u.id.toLowerCase() === user.id.toLowerCase() ||
      u.identifier.toLowerCase() === user.identifier.toLowerCase()
  );
  if (index >= 0) {
    const copy = [...sanitized];
    copy[index] = { ...copy[index], ...user };
    return copy;
  }
  return [user, ...sanitized];
}
