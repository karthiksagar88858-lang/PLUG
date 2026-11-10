import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryGrid } from './components/CategoryGrid';
import { DailyRentalsCarousel } from './components/DailyRentalsCarousel';
import { ListingGrid } from './components/ListingGrid';
import { BottomNav, TabType } from './components/BottomNav';
import { ItemModal } from './components/ItemModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { LocationModal } from './components/LocationModal';
import { FilterModal } from './components/FilterModal';
import { SellModal } from './components/SellModal';
import { AuthModal } from './components/AuthModal';
import { ChatsView } from './components/ChatsView';
import { AccountView } from './components/AccountView';
import { MyAdsView } from './components/MyAdsView';
import { NotificationsView } from './components/NotificationsView';
import { CampusBroadcastPopup } from './components/CampusBroadcastPopup';
import { SystemScaleModal } from './components/SystemScaleModal';
import { InstallGuideTopBanner } from './components/InstallGuideTopBanner';
import { CampusListing, filterListings } from './utils/deals';
import {
  DealRequest,
  CampusNotification,
  RequestStatus,
  createDealRequest,
  updateRequestStatus,
  createBroadcastNotification,
  getUnreadNotificationCount,
} from './utils/requests';
import {
  fetchSync,
  fetchListings,
  publishListing,
  deleteListingApi,
  updateListingApi,
  fetchDealRequests,
  submitDealRequest,
  updateDealRequestStatusApi,
  fetchNotifications,
  markNotificationsAsReadApi,
  subscribeToCampusEvents,
  rateListingApi,
} from './utils/api';
import { playCampusNotificationChime } from './utils/sound';

function AppContent() {
  const { currentUser, isAuthenticated, isCheckingSession, openAuthModal } = useAuth();

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [realUnreadChatsCount, setRealUnreadChatsCount] = useState<number>(0);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('LPU, Phagwara');
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'sale' | 'rent' | 'hostel' | 'ums'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [umsOnly, setUmsOnly] = useState(false);

  // Listings & Data State: Central shared database is the single source of truth
  const [allListings, setAllListings] = useState<CampusListing[]>([]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('plug_favorites');
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('plug_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  const [visibleCount, setVisibleCount] = useState(6);

  // Modals State
  const [selectedListing, setSelectedListing] = useState<CampusListing | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deal Requests State (synced with localStorage)
  const [dealRequests, setDealRequests] = useState<DealRequest[]>(() => {
    try {
      const saved = localStorage.getItem('plug_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('plug_requests', JSON.stringify(dealRequests));
    } catch (e) {
      console.error(e);
    }
  }, [dealRequests]);

  // Notifications State (synced with localStorage)
  const [notifications, setNotifications] = useState<CampusNotification[]>(() => {
    try {
      const saved = localStorage.getItem('plug_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('plug_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  // Initial load from server database on mount
  React.useEffect(() => {
    let isMounted = true;

    fetchSync(currentUser?.id).then((data) => {
      if (isMounted && data) {
        setAllListings(data.listings);
        setDealRequests(data.dealRequests);
        setNotifications(data.notifications);
      }
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Real-time synchronization across all campus devices & users via SSE + auto-poll fallback
  React.useEffect(() => {
    const unsubscribe = subscribeToCampusEvents((event) => {
      if (event.type === 'NEW_LISTING') {
        const { listing, notification } = event.payload;

        // Add to listings if not already present
        setAllListings((prev) => {
          if (prev.some((item) => item.id === listing.id)) return prev;
          return [listing, ...prev];
        });

        // Add to notifications
        if (notification) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });

          // If posted by another student, trigger immediate campus broadcast alert!
          if (!currentUser || listing.sellerId !== currentUser.id) {
            setActiveBroadcast(notification);
            playCampusNotificationChime();
            showToast(`⚡ New Ad: ${listing.title} posted in ${listing.location}!`);
          }
        }
      }

      if (event.type === 'DELETE_LISTING') {
        const { id } = event.payload;
        setAllListings((prev) => prev.filter((item) => item.id !== id));
      }

      if (event.type === 'UPDATE_LISTING') {
        const { listing } = event.payload;
        if (listing) {
          setAllListings((prev) =>
            prev.map((item) => (item.id === listing.id ? listing : item))
          );
          setSelectedListing((prev) => (prev && prev.id === listing.id ? listing : prev));
        }
      }

      if (event.type === 'NEW_DEAL_REQUEST') {
        const { request, notification } = event.payload;
        setDealRequests((prev) => {
          if (prev.some((r) => r.id === request.id)) return prev;
          return [request, ...prev];
        });

        if (notification) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });

          // Check if current user is the poster receiving this request
          const isTargetPoster =
            currentUser &&
            (request.sellerId === currentUser.id ||
             request.sellerPhone === currentUser.identifier ||
             request.sellerName?.toLowerCase() === currentUser.name?.toLowerCase());

          if (isTargetPoster) {
            playCampusNotificationChime();
            showToast(`📬 New ${request.isRent ? 'Rent' : 'Buy'} Request from ${request.buyerName}!`);
          }
        }
      }

      if (event.type === 'DEAL_STATUS_UPDATED') {
        const { request, buyerNotification } = event.payload;
        setDealRequests((prev) =>
          prev.map((r) => (r.id === request.id ? request : r))
        );

        if (buyerNotification) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === buyerNotification.id)) return prev;
            return [buyerNotification, ...prev];
          });

          if (currentUser && request.buyerId === currentUser.id) {
            showToast(`🎉 Your deal request was ${request.status.toUpperCase()} by ${request.sellerName}!`);
          }
        }
      }

      if (event.type === 'LISTING_RATED') {
        const { listing } = event.payload;
        if (listing) {
          setAllListings((prev) =>
            prev.map((item) => (item.id === listing.id ? listing : item))
          );
          setSelectedListing((prev) => (prev && prev.id === listing.id ? listing : prev));
        }
      }

      if (event.type === 'NEW_CHAT_MESSAGE' || event.type === 'CHAT_READ') {
        if (currentUser) {
          fetch(`/api/chats/unread-count?userId=${encodeURIComponent(currentUser.id)}`)
            .then((r) => r.json())
            .then((d) => {
              if (typeof d.unreadCount === 'number') setRealUnreadChatsCount(d.unreadCount);
            })
            .catch(() => {});
        }
      }
    });

    // Ultra-fast background sync every 1500ms + on focus/visibility change
    const syncFast = () => {
      fetchSync(currentUser?.id).then((data) => {
        if (data) {
          setAllListings(data.listings);
          setDealRequests(data.dealRequests);
          setNotifications(data.notifications);
        }
      }).catch(() => {});

      if (currentUser) {
        fetch(`/api/chats/unread-count?userId=${encodeURIComponent(currentUser.id)}`)
          .then((r) => r.json())
          .then((d) => {
            if (typeof d.unreadCount === 'number') setRealUnreadChatsCount(d.unreadCount);
          })
          .catch(() => {});
      } else {
        setRealUnreadChatsCount(0);
      }
    };

    const pollInterval = setInterval(syncFast, 1500);
    window.addEventListener('focus', syncFast);
    document.addEventListener('visibilitychange', syncFast);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      window.removeEventListener('focus', syncFast);
      document.removeEventListener('visibilitychange', syncFast);
    };
  }, [currentUser]);

  // Cross-tab localStorage synchronization for user-specific items (requests, notifications, favorites)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'plug_requests' && e.newValue) {
        try {
          setDealRequests(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'plug_notifications' && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'plug_favorites' && e.newValue) {
        try {
          setFavorites(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Active Broadcast Pop-up Alert
  const [activeBroadcast, setActiveBroadcast] = useState<CampusNotification | null>(null);

  // Unread notification count for current user
  const unreadNotificationsCount = useMemo(() => {
    return getUnreadNotificationCount(notifications, currentUser?.id);
  }, [notifications, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('Please sign in with email or phone to save favorite items.');
      return;
    }
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    showToast(favorites.includes(id) ? 'Removed from favorites' : 'Saved to favorites');
  };

  // Open sell modal (guards for authentication)
  const handleOpenSellModal = () => {
    if (!isAuthenticated) {
      openAuthModal('Please sign in or create an account with email/phone before posting an ad.');
      return;
    }
    setIsSellModalOpen(true);
  };

  // Add new listing from SellModal: Persists to central shared database and broadcasts to EVERY user
  const handleAddListing = async (newListing: CampusListing) => {
    // 1. Optimistic UI update
    setAllListings((prev) => [newListing, ...prev.filter((l) => l.id !== newListing.id)]);

    // Create broadcast notification for all campus students
    const broadcastNotif = createBroadcastNotification(newListing);
    setNotifications((prev) => [broadcastNotif, ...prev]);

    // Pop real-time message alert to current user
    setActiveBroadcast(broadcastNotif);
    showToast('Success! Ad posted and live on the Home page.');

    // Switch to Home page and reset filters so the newly posted ad appears immediately
    setActiveTab('home');
    setActiveFilterTab('all');
    setSelectedCategory('All');

    // 2. Persist to shared database on server backend (available to all users across network)
    try {
      const response = await publishListing(newListing);
      if (response && response.listing) {
        setAllListings((prev) => [
          response.listing,
          ...prev.filter((l) => l.id !== response.listing.id && l.id !== newListing.id),
        ]);
      }
    } catch (err) {
      console.error('Failed to sync listing to campus server:', err);
    }
  };

  // Delete listing: Only owner can delete (verified on server)
  const handleDeleteListing = async (listingId: string) => {
    if (!currentUser) {
      openAuthModal('Please sign in to delete your ad.');
      return;
    }
    setAllListings((prev) => prev.filter((item) => item.id !== listingId));
    if (selectedListing?.id === listingId) {
      setSelectedListing(null);
    }
    showToast('Ad deleted successfully.');
    try {
      await deleteListingApi(listingId, currentUser.id);
    } catch (err: any) {
      console.error('Failed to delete listing:', err);
      showToast(err.message || 'Failed to delete listing');
      fetchListings().then(setAllListings).catch(() => {});
    }
  };

  // Edit listing: Only owner can edit (verified on server)
  const handleEditListing = async (listingId: string, updates: Partial<CampusListing>) => {
    if (!currentUser) {
      openAuthModal('Please sign in to edit your ad.');
      return;
    }
    try {
      const updated = await updateListingApi(listingId, updates, currentUser.id);
      if (updated) {
        setAllListings((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        if (selectedListing?.id === updated.id) {
          setSelectedListing(updated);
        }
        showToast('Ad updated successfully!');
      }
    } catch (err: any) {
      console.error('Failed to update listing:', err);
      showToast(err.message || 'Failed to update listing');
    }
  };

  // Handle buyer submitting a rent/buy request on an ad (routed to the poster across network)
  const handleRequestDeal = async (params: {
    listing: CampusListing;
    isRent: boolean;
    rentDays: number;
    handoverLocation: string;
    note: string;
  }) => {
    if (!currentUser) {
      openAuthModal('Please sign in to send a deal request.');
      return;
    }

    const { request, sellerNotification } = createDealRequest({
      listing: params.listing,
      buyer: {
        id: currentUser.id,
        name: currentUser.name,
        identifier: currentUser.identifier,
        regNumber: currentUser.regNumber,
      },
      isRent: params.isRent,
      rentDays: params.rentDays,
      handoverLocation: params.handoverLocation,
      note: params.note,
    });

    // 1. Optimistic UI update
    setDealRequests((prev) => [request, ...prev]);
    setNotifications((prev) => [sellerNotification, ...prev]);
    showToast(`Request sent directly to ${params.listing.sellerName || 'poster'}! Track in Notifications.`);

    // 2. Persist to server backend (routes request directly to the poster on their device)
    try {
      await submitDealRequest(request, sellerNotification);
    } catch (err) {
      console.error('Failed to sync deal request to server:', err);
    }
  };

  // Handle seller updating status (accept / decline / complete)
  const handleUpdateStatus = async (requestId: string, status: RequestStatus) => {
    const { updatedRequests, buyerNotification } = updateRequestStatus(
      dealRequests,
      requestId,
      status
    );
    setDealRequests(updatedRequests);
    if (buyerNotification) {
      setNotifications((prev) => [buyerNotification, ...prev]);
    }
    showToast(`Deal request updated to ${status.toUpperCase()}!`);

    // Persist to server backend
    try {
      await updateDealRequestStatusApi(requestId, status, buyerNotification);
    } catch (err) {
      console.error('Failed to sync status update to server:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read');
    try {
      await markNotificationsAsReadApi();
    } catch (err) {
      console.error('Failed to mark read on server:', err);
    }
  };

  // Handle rating a listing (1 to 5 stars)
  const handleRateListing = async (listingId: string, rating: number, review?: string) => {
    const userId = currentUser?.id || 'guest-' + Math.random().toString(36).slice(2, 7);
    const userName = currentUser?.name || 'Verified LPU Student';
    try {
      const updated = await rateListingApi(listingId, {
        userId,
        userName,
        rating,
        review,
      });
      if (updated) {
        setAllListings((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        if (selectedListing && selectedListing.id === updated.id) {
          setSelectedListing(updated);
        }
        showToast(`⭐ Rated ${rating}/5 stars successfully!`);
      }
    } catch (err) {
      console.error('Failed to rate listing', err);
      showToast('Could not save rating. Please try again.');
    }
  };

  // Filter listings based on current filters
  const filteredListings = useMemo(() => {
    let list = filterListings(allListings, {
      category: selectedCategory,
      searchQuery,
      filterType:
        activeFilterTab === 'sale'
          ? 'sale'
          : activeFilterTab === 'rent'
          ? 'rent'
          : activeFilterTab === 'ums'
          ? 'ums'
          : 'all',
      location: selectedLocation === 'LPU, Phagwara' ? undefined : selectedLocation,
    });

    if (activeFilterTab === 'hostel') {
      list = list.filter((item) => item.category === 'Hostel & PG');
    }

    if (activeFilterTab === 'others') {
      list = list.filter((item) => item.category === 'Others');
    }

    if (umsOnly) {
      list = list.filter((item) => item.isUmsVerified);
    }

    // Sort newest first
    list = [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return list;
  }, [allListings, selectedCategory, searchQuery, activeFilterTab, selectedLocation, umsOnly]);

  const displayedListings = filteredListings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredListings.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  // Open or start real chat conversation with ad seller
  const handleOpenChatWithSeller = async (listing: CampusListing) => {
    if (!isAuthenticated || !currentUser) {
      openAuthModal('Please sign in with email or phone to chat with seller.');
      return;
    }
    try {
      const sellerId = listing.sellerId || `seller_${listing.id}`;
      const sellerName = listing.sellerName || 'Campus Seller';
      const sellerAvatar = listing.sellerAvatar;

      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: listing.id,
          itemTitle: listing.title,
          itemPrice: listing.price || listing.rentPrice,
          itemImage: listing.imageUrl || (listing.images && listing.images[0]),
          itemLocation: listing.location,
          buyer: {
            id: currentUser.id,
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl,
            branch: currentUser.branch,
            regNumber: currentUser.regNumber,
          },
          seller: {
            id: sellerId,
            name: sellerName,
            avatarUrl: sellerAvatar,
          },
          initialMessage: `Hi ${sellerName}! I saw your ad "${listing.title}" on PLUG. Is it available?`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.chat) {
          setActiveChatId(data.chat.id);
        }
      }
    } catch (err) {
      console.warn('Could not open chat with seller', err);
    }
    setSelectedListing(null);
    setActiveTab('chats');
  };

  // Real user-posted rentals (no mock items)
  const dailyRentalsListings = useMemo(
    () => allListings.filter((item) => item.rentPrice && item.rentPrice > 0),
    [allListings]
  );

  // Branded session verification loading splash screen on startup
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#0b242a] flex flex-col items-center justify-center p-6 text-white text-center antialiased">
        <div className="w-20 h-20 rounded-2xl bg-[#fbbf24] text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-500/10 mb-4 animate-pulse">
          PLUG
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">
          PLUG LPU
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-xs">
          Campus Peer Exchange & Micro-Rentals
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-amber-400 font-semibold bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Restoring verified campus session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between items-center antialiased">
      {/* Mobile-First Centered Container */}
      <div className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col relative pb-16">
        {/* App Install Video Guide at the Very Top */}
        <InstallGuideTopBanner />

        {/* Header Component */}
        <Header
          selectedLocation={selectedLocation}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAiSearch={() => setIsAiModalOpen(true)}
          activeFilterTab={activeFilterTab}
          onSelectFilterTab={(tab) => {
            setActiveFilterTab(tab);
            if (tab === 'hostel') setSelectedCategory('Hostel & PG');
            if (tab === 'all') setSelectedCategory('All');
          }}
          onOpenAccount={() => setActiveTab('account')}
          onOpenNotifications={() => setActiveTab('notifications')}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenScaleDiagnostics={() => setIsScaleModalOpen(true)}
          totalAdsCount={allListings.length}
        />

        {/* Dynamic Main View */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <>
              {/* Micro-Rentals Hero Banner */}
              <HeroBanner
                onExplore={() => {
                  setActiveFilterTab('rent');
                  showToast('Showing all campus micro-rentals from ₹10/day');
                }}
              />

              {/* LPU Campus Categories Grid */}
              <CategoryGrid
                selectedCategory={selectedCategory}
                onSelectCategory={(catName) => {
                  setSelectedCategory(catName);
                  if (catName !== 'All') {
                    showToast(`Filtered by ${catName}`);
                  }
                }}
                onSeeAll={() => setIsFilterModalOpen(true)}
              />

              {/* Daily Rentals Under ₹50 (Real Campus Listings) */}
              <DailyRentalsCarousel
                rentals={dailyRentalsListings}
                onSelectListing={setSelectedListing}
                onOpenSellModal={handleOpenSellModal}
              />

              {/* Fresh Campus Listings Grid */}
              <ListingGrid
                listings={displayedListings}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectListing={setSelectedListing}
                onOpenFilterModal={() => setIsFilterModalOpen(true)}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                totalAdsCount={allListings.length}
                onOpenSellModal={handleOpenSellModal}
              />
            </>
          )}

          {activeTab === 'chats' && (
            <ChatsView
              initialChatId={activeChatId}
              onExploreAds={() => setActiveTab('home')}
              onSelectListingById={(itemId) => {
                const found = allListings.find((l) => l.id === itemId);
                if (found) setSelectedListing(found);
                else showToast('Listing not found or was removed.');
              }}
            />
          )}

          {activeTab === 'my-ads' && (
            <MyAdsView
              allListings={allListings}
              favoriteIds={favorites}
              myListings={
                currentUser
                  ? allListings.filter((l) => l.sellerId === currentUser.id)
                  : []
              }
              onSelectListing={setSelectedListing}
              onRemoveFavorite={(id) => {
                setFavorites((prev) => prev.filter((item) => item !== id));
                showToast('Removed from favorites');
              }}
              onOpenSellModal={handleOpenSellModal}
              onDeleteListing={handleDeleteListing}
              onEditListing={handleEditListing}
              onUpdateListingStatus={async (id, status) => {
                await handleEditListing(id, { status });
              }}
            />
          )}

          {activeTab === 'account' && (
            <AccountView
              onOpenAiHelp={() => setIsAiModalOpen(true)}
              onOpenScaleDiagnostics={() => setIsScaleModalOpen(true)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              requests={dealRequests}
              notifications={notifications}
              onUpdateStatus={handleUpdateStatus}
              onOpenChat={(userName, itemTitle) => {
                setActiveTab('chats');
                showToast(`Chatting with ${userName} regarding "${itemTitle}"`);
              }}
              onSelectListingById={(itemId) => {
                const found = allListings.find((i) => i.id === itemId);
                if (found) setSelectedListing(found);
                else showToast('Listing not found or was removed.');
              }}
              onMarkAllAsRead={handleMarkAllNotificationsRead}
              onOpenSellModal={handleOpenSellModal}
            />
          )}
        </main>

        {/* Real-Time Campus-Wide Broadcast Pop-Up */}
        <CampusBroadcastPopup
          notification={activeBroadcast}
          onDismiss={() => setActiveBroadcast(null)}
          onViewItem={(itemId) => {
            setActiveBroadcast(null);
            const found = allListings.find((l) => l.id === itemId);
            if (found) {
              setSelectedListing(found);
            }
          }}
        />

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            if ((tab === 'chats' || tab === 'my-ads' || tab === 'notifications') && !isAuthenticated) {
              openAuthModal(`Sign in with email or phone to view ${tab === 'chats' ? 'chats' : tab === 'notifications' ? 'notifications' : 'saved ads'}.`);
              return;
            }
            setActiveTab(tab);
          }}
          onOpenSellModal={handleOpenSellModal}
          unreadChatsCount={realUnreadChatsCount}
          savedCount={favorites.length}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-xs animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Item Details & AI Deal Advisor Modal */}
        {selectedListing && (
          <ItemModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onOpenChatWithSeller={(item) => handleOpenChatWithSeller(item)}
            onRentWithEscrow={(item) => {
              if (!isAuthenticated) {
                openAuthModal('Please sign in with email or phone to reserve with escrow.');
                return;
              }
              setSelectedListing(null);
              showToast(`Escrow reserved for ${item.title}! Meet seller at ${item.location}.`);
            }}
            onRequestDeal={handleRequestDeal}
            onViewOffers={() => setActiveTab('notifications')}
            onRateListing={handleRateListing}
            onDeleteListing={handleDeleteListing}
            onEditListing={handleEditListing}
          />
        )}

        {/* Dedicated Gemini 4 Argon High-Thinking Campus Advisor Modal */}
        <AiAdvisorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onSelectSearchKeyword={(kw) => {
            setSearchQuery(kw);
            setIsAiModalOpen(false);
          }}
        />

        {/* Campus Location Switcher Modal */}
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            showToast(`Location set to ${loc}`);
          }}
        />

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          activeFilterTab={activeFilterTab}
          onSelectFilterTab={setActiveFilterTab}
          umsOnly={umsOnly}
          onToggleUmsOnly={setUmsOnly}
          onReset={() => {
            setSelectedCategory('All');
            setActiveFilterTab('all');
            setUmsOnly(false);
            showToast('Filters reset to default');
          }}
        />

        {/* Sell / Post Ad Modal with Camera Feature */}
        <SellModal
          isOpen={isSellModalOpen}
          onClose={() => setIsSellModalOpen(false)}
          onAddListing={handleAddListing}
        />

        {/* Auth Modal (Email / Phone / Multi-User Login & Profile Picture Snap) */}
        <AuthModal />

        {/* 30,000+ Concurrency & High-Scale Diagnostics Modal */}
        <SystemScaleModal
          isOpen={isScaleModalOpen}
          onClose={() => setIsScaleModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
