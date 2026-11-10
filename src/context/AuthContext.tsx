import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  validateIdentifier,
  getStoredUserSession,
  getStoredUsers,
  persistUserSession,
  clearUserSession,
  upsertUserInList,
  sanitizeUserProfiles,
} from '../utils/auth';
import { generateNameAvatar } from '../utils/avatar';
import {
  saveUserApi,
  updateUserApi,
  deleteUserApi,
  fetchUsersApi,
} from '../utils/api';

export interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  login: (identifier: string, password?: string) => { success: boolean; error?: string };
  register: (data: {
    name: string;
    identifier: string;
    regNumber?: string;
    branch?: string;
    avatarUrl?: string;
    upiId?: string;
    upiApp?: 'googlepay' | 'phonepe' | 'paytm' | 'other';
    qrScannerUrl?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  switchAccount: (userId: string) => void;
  updateAvatar: (newAvatarUrl: string) => void;
  updatePaymentDetails: (
    upiId: string,
    upiApp: 'googlepay' | 'phonepe' | 'paytm' | 'other',
    qrScannerUrl?: string
  ) => void;
  updateProfile: (details: Partial<UserProfile>) => void;
  deleteAccount: (userId: string) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (intentMessage?: string) => void;
  closeAuthModal: () => void;
  authIntentMessage: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously restore user session on first tick - zero delay, no auth flicker
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getStoredUserSession();
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const stored = getStoredUsers();
    const current = getStoredUserSession();
    if (current) {
      return upsertUserInList(current, stored);
    }
    return stored;
  });

  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(() => {
    // If session is already found synchronously in storage, session check is already done!
    return !getStoredUserSession();
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authIntentMessage, setAuthIntentMessage] = useState<string | null>(null);

  // Sync with central backend database on startup and refresh
  useEffect(() => {
    let isCancelled = false;

    async function syncBackendUsers() {
      try {
        const backendUsers = await fetchUsersApi();
        if (isCancelled) return;

        const cleanBackend = sanitizeUserProfiles(backendUsers);

        if (cleanBackend.length > 0) {
          setAllUsers((prev) => {
            let merged = [...prev];
            for (const bUser of cleanBackend) {
              merged = upsertUserInList(bUser, merged);
            }
            return merged;
          });

          // If current user is logged in, check if backend has updated data
          if (currentUser) {
            const foundInBackend = cleanBackend.find(
              (u) =>
                u.id.toLowerCase() === currentUser.id.toLowerCase() ||
                u.identifier.toLowerCase() === currentUser.identifier.toLowerCase()
            );

            if (foundInBackend) {
              const updatedCurrent: UserProfile = { ...currentUser, ...foundInBackend };
              setCurrentUser(updatedCurrent);
              persistUserSession(updatedCurrent);
            } else {
              // Ensure backend gets local currentUser permanently
              saveUserApi(currentUser).catch((err) =>
                console.warn('Backend sync save notice', err)
              );
            }
          }
        } else if (currentUser) {
          // Push local student user to empty backend store
          saveUserApi(currentUser).catch((err) =>
            console.warn('Backend initial save notice', err)
          );
        }
      } catch (err) {
        console.warn('Backend user sync error', err);
      } finally {
        if (!isCancelled) {
          setIsCheckingSession(false);
        }
      }
    }

    syncBackendUsers();

    const fallbackTimer = setTimeout(() => {
      if (!isCancelled) {
        setIsCheckingSession(false);
      }
    }, 800);

    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Multi-tab sync across browser windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'plug_saved_user_profile') {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            const sanitized = sanitizeUserProfiles([parsed]);
            if (sanitized.length > 0) {
              setCurrentUser(sanitized[0]);
            }
          } catch {}
        } else if (localStorage.getItem('plug_logged_out') === 'true') {
          setCurrentUser(null);
        }
      }

      if (e.key === 'plug_users' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setAllUsers(sanitizeUserProfiles(parsed));
        } catch {}
      }

      if (e.key === 'plug_logged_out' && e.newValue === 'true') {
        setCurrentUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login method: permanently saves user session and syncs to backend database
  const login = (identifier: string, _password?: string) => {
    const idCheck = validateIdentifier(identifier);
    if (!idCheck.isValid) {
      return { success: false, error: 'Please enter a valid email or 10-digit phone number.' };
    }

    const matched = allUsers.find(
      (u) => u.identifier.toLowerCase() === idCheck.normalized.toLowerCase()
    );

    if (matched) {
      persistUserSession(matched);
      setCurrentUser(matched);
      setIsAuthModalOpen(false);
      setAuthIntentMessage(null);

      // Save/refresh on central backend
      saveUserApi(matched).catch((err) => console.warn('Login saveUserApi notice', err));
      return { success: true };
    }

    // Auto-create account if student signs in with new campus email/phone
    const isEmail = idCheck.type === 'email';
    const inferredName = isEmail
      ? identifier.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : `Student ${idCheck.normalized.slice(-4)}`;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: inferredName,
      identifier: idCheck.normalized,
      authType: idCheck.type as 'email' | 'phone',
      regNumber: `12${Math.floor(100000 + Math.random() * 900000)}`,
      branch: 'LPU Student',
      avatarUrl: generateNameAvatar(inferredName),
      isUmsVerified: true,
      walletBalance: 500,
    };

    persistUserSession(newUser);
    setCurrentUser(newUser);
    setAllUsers((prev) => upsertUserInList(newUser, prev));
    setIsAuthModalOpen(false);
    setAuthIntentMessage(null);

    // Save permanently to central backend
    saveUserApi(newUser).catch((err) => console.warn('Login saveUserApi notice', err));
    return { success: true };
  };

  // Register method: permanently saves user data to local storage and central database
  const register = (data: {
    name: string;
    identifier: string;
    regNumber?: string;
    branch?: string;
    avatarUrl?: string;
    upiId?: string;
    upiApp?: 'googlepay' | 'phonepe' | 'paytm' | 'other';
    qrScannerUrl?: string;
  }) => {
    const idCheck = validateIdentifier(data.identifier);
    if (!idCheck.isValid) {
      return { success: false, error: 'Please enter a valid email or 10-digit phone number.' };
    }

    const existing = allUsers.find(
      (u) => u.identifier.toLowerCase() === idCheck.normalized.toLowerCase()
    );

    if (existing) {
      const updatedExisting: UserProfile = {
        ...existing,
        name: data.name.trim() || existing.name,
        regNumber: data.regNumber?.trim() || existing.regNumber,
        branch: data.branch?.trim() || existing.branch,
        avatarUrl: data.avatarUrl || existing.avatarUrl,
        upiId: data.upiId?.trim() || existing.upiId,
        upiApp: data.upiApp || existing.upiApp,
        qrScannerUrl: data.qrScannerUrl || existing.qrScannerUrl,
      };

      persistUserSession(updatedExisting);
      setCurrentUser(updatedExisting);
      setAllUsers((prev) => upsertUserInList(updatedExisting, prev));
      setIsAuthModalOpen(false);
      setAuthIntentMessage(null);

      // Save to central backend
      saveUserApi(updatedExisting).catch((err) => console.warn('Register saveUserApi notice', err));
      return { success: true };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      identifier: idCheck.normalized,
      authType: idCheck.type as 'email' | 'phone',
      regNumber: data.regNumber?.trim() || `12${Math.floor(100000 + Math.random() * 900000)}`,
      branch: data.branch?.trim() || 'B.Tech CSE',
      avatarUrl: data.avatarUrl || generateNameAvatar(data.name),
      isUmsVerified: true,
      walletBalance: 500,
      upiId: data.upiId?.trim() || undefined,
      upiApp: data.upiApp || undefined,
      qrScannerUrl: data.qrScannerUrl || undefined,
    };

    persistUserSession(newUser);
    setCurrentUser(newUser);
    setAllUsers((prev) => upsertUserInList(newUser, prev));
    setIsAuthModalOpen(false);
    setAuthIntentMessage(null);

    // Save permanently to central backend database
    saveUserApi(newUser).catch((err) => console.warn('Register saveUserApi notice', err));
    return { success: true };
  };

  // Explicit logout: ONLY when user taps Log Out
  const logout = () => {
    clearUserSession();
    setCurrentUser(null);
  };

  // Switch account for multi-student devices
  const switchAccount = (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      persistUserSession(target);
      setCurrentUser(target);
    }
  };

  // Update profile avatar and persist everywhere
  const updateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, avatarUrl: newAvatarUrl };
    setCurrentUser(updated);
    setAllUsers((prev) => upsertUserInList(updated, prev));
    persistUserSession(updated);

    // Persist to central backend database
    updateUserApi(updated.id, { avatarUrl: newAvatarUrl }).catch((err) =>
      console.warn('Update avatar API notice', err)
    );
  };

  // Update payment UPI & QR code and persist everywhere
  const updatePaymentDetails = (
    upiId: string,
    upiApp: 'googlepay' | 'phonepe' | 'paytm' | 'other',
    qrScannerUrl?: string
  ) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      upiId: upiId.trim() || undefined,
      upiApp,
      qrScannerUrl: qrScannerUrl !== undefined ? qrScannerUrl : currentUser.qrScannerUrl,
    };
    setCurrentUser(updated);
    setAllUsers((prev) => upsertUserInList(updated, prev));
    persistUserSession(updated);

    // Persist to central backend database
    updateUserApi(updated.id, {
      upiId: updated.upiId,
      upiApp: updated.upiApp,
      qrScannerUrl: updated.qrScannerUrl,
    }).catch((err) => console.warn('Update payment API notice', err));
  };

  // Update profile fields (name, branch, regNumber, etc.) and persist everywhere
  const updateProfile = (details: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, ...details };
    setCurrentUser(updated);
    setAllUsers((prev) => upsertUserInList(updated, prev));
    persistUserSession(updated);

    // Persist to central backend database
    updateUserApi(updated.id, details).catch((err) =>
      console.warn('Update profile API notice', err)
    );
  };

  // Delete account with confirmation
  const deleteAccount = (userId: string) => {
    // Delete on backend
    deleteUserApi(userId).catch((err) => console.warn('Delete user API notice', err));

    setAllUsers((prev) => prev.filter((u) => u.id !== userId));

    if (currentUser?.id === userId) {
      clearUserSession();
      setCurrentUser(null);
    }
  };

  const openAuthModal = (intentMessage?: string) => {
    setAuthIntentMessage(intentMessage || 'Please sign in or create an account to continue.');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthIntentMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated: !!currentUser,
        isCheckingSession,
        login,
        register,
        logout,
        switchAccount,
        updateAvatar,
        updatePaymentDetails,
        updateProfile,
        deleteAccount,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authIntentMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
