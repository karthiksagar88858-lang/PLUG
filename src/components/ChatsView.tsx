import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  MapPin,
  Send,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChatConversation, ChatMessage } from '../server/campusStore';

interface ChatsViewProps {
  initialChatId?: string | null;
  onExploreAds?: () => void;
  onSelectListingById?: (itemId: string) => void;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  initialChatId,
  onExploreAds,
  onSelectListingById,
}) => {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch real chats from backend
  const fetchChats = async () => {
    if (!currentUser) {
      setChats([]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/chats?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data: ChatConversation[] = await res.json();
        setChats(data);
        if (data.length > 0) {
          if (!selectedChatId || !data.some((c) => c.id === selectedChatId)) {
            setSelectedChatId(initialChatId && data.some((c) => c.id === initialChatId) ? initialChatId : data[0].id);
          }
        } else {
          setSelectedChatId(null);
        }
      }
    } catch (err) {
      console.warn('Failed to load campus chats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentUser]);

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
    }
  }, [initialChatId]);

  // Mark chat as read when selected
  useEffect(() => {
    if (!selectedChatId || !currentUser) return;
    fetch(`/api/chats/${selectedChatId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    }).catch(console.error);

    // Locally clear unread count for current user
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId && c.unreadCount
          ? {
              ...c,
              unreadCount: { ...c.unreadCount, [currentUser.id]: 0 },
              messages: (c.messages || []).map((m) =>
                m.senderId !== currentUser.id ? { ...m, read: true } : m
              ),
            }
          : c
      )
    );
  }, [selectedChatId, currentUser]);

  // Listen to SSE real-time chat updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'NEW_CHAT' && parsed.payload?.chat) {
          const newChat: ChatConversation = parsed.payload.chat;
          if (currentUser && newChat.participants.includes(currentUser.id)) {
            setChats((prev) => {
              if (prev.some((c) => c.id === newChat.id)) return prev;
              return [newChat, ...prev];
            });
          }
        }

        if (parsed.type === 'NEW_CHAT_MESSAGE' && parsed.payload?.chat) {
          const updatedChat: ChatConversation = parsed.payload.chat;
          if (currentUser && updatedChat.participants.includes(currentUser.id)) {
            setChats((prev) => {
              const filtered = prev.filter((c) => c.id !== updatedChat.id);
              return [updatedChat, ...filtered];
            });
          }
        }
      } catch (e) {
        console.error('SSE chat error', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser]);

  // Scroll to bottom of message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedChatId]);

  const activeChat = chats.find((c) => c.id === selectedChatId) || null;

  const handleSend = async () => {
    if (!input.trim() || !selectedChatId || !currentUser || isSending) return;
    const textToSend = input.trim();
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch(`/api/chats/${selectedChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatarUrl,
          text: textToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.chat) {
          setChats((prev) => {
            const filtered = prev.filter((c) => c.id !== data.chat.id);
            return [data.chat, ...filtered];
          });
        }
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  // Helper to get peer profile for current user
  const getPeer = (chat: ChatConversation) => {
    if (!currentUser) return { name: 'Campus Peer', avatarUrl: undefined };
    const peerId = chat.participants.find((p) => p !== currentUser.id);
    if (peerId && chat.participantProfiles?.[peerId]) {
      return chat.participantProfiles[peerId];
    }
    return { name: 'Campus Peer', avatarUrl: undefined };
  };

  // Not signed in state
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-black text-slate-900">
            Sign In to View Campus Chats
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Direct peer messaging with verified LPU students. Sign in to chat with sellers and arrange safe handovers.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('Sign in to access your campus chats')}
            className="w-full py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Sign In with Email or Phone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-slate-900" />
            <span>Campus Chats & Deals</span>
          </h2>
          <p className="text-[11px] text-gray-500">
            Direct peer messaging between verified LPU students
          </p>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          UMS Safe Chat
        </span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-gray-500 space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading your campus conversations...</p>
        </div>
      ) : chats.length === 0 ? (
        /* CLEAN EMPTY STATE: ZERO MOCK DATA */
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-200">
            <MessageSquare className="w-7 h-7 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              No chats yet. Message a seller from any ad to start.
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              When you find books, drafters, or cycles you want to buy or rent, tap "Message Seller" to open a real chat here.
            </p>
          </div>
          {onExploreAds && (
            <button
              type="button"
              onClick={onExploreAds}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Browse Real Campus Ads</span>
            </button>
          )}
        </div>
      ) : (
        /* REAL CHATS LIST */
        <>
          <div className="space-y-2">
            {chats.map((c) => {
              const peer = getPeer(c);
              const isSelected = selectedChatId === c.id;
              const unreadForMe = c.unreadCount?.[currentUser.id] || 0;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedChatId(c.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white border-gray-200 text-slate-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    {peer.avatarUrl ? (
                      <img
                        src={peer.avatarUrl}
                        alt={peer.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20 bg-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {peer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold truncate flex items-center gap-1">
                        <span>{peer.name}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </h4>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-slate-400' : 'text-gray-400'
                        }`}
                      >
                        {c.lastMessageTime || 'Today'}
                      </span>
                    </div>

                    {c.itemTitle && (
                      <span
                        className={`text-[10px] font-bold block truncate mt-0.5 ${
                          isSelected ? 'text-[#fbbf24]' : 'text-amber-600'
                        }`}
                      >
                        Item: {c.itemTitle}
                      </span>
                    )}

                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-gray-500'
                      }`}
                    >
                      {c.lastMessage || 'Conversation started'}
                    </p>
                  </div>

                  {unreadForMe > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shrink-0">
                      {unreadForMe}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ACTIVE CHAT THREAD */}
          {activeChat && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs mt-3 flex flex-col h-72">
              {/* Active Header */}
              <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-gray-300">
                    {getPeer(activeChat).avatarUrl ? (
                      <img
                        src={getPeer(activeChat).avatarUrl}
                        alt={getPeer(activeChat).name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-1 text-gray-500" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {getPeer(activeChat).name}
                    </span>
                    {activeChat.itemTitle && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeChat.itemId && onSelectListingById) {
                            onSelectListingById(activeChat.itemId);
                          }
                        }}
                        className="text-[10px] text-amber-600 hover:underline font-semibold truncate flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ad: {activeChat.itemTitle}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>

                {activeChat.itemLocation && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 shrink-0">
                    <MapPin className="w-3 h-3 text-slate-600" />
                    <span className="truncate max-w-[120px]">{activeChat.itemLocation}</span>
                  </span>
                )}
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs no-scrollbar bg-slate-50/50">
                {(!activeChat.messages || activeChat.messages.length === 0) ? (
                  <div className="text-center text-gray-400 text-[11px] py-4">
                    Send a message to start negotiating or coordinate handover!
                  </div>
                ) : (
                  activeChat.messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-1.5 leading-snug shadow-2xs ${
                            isMe
                              ? 'bg-slate-950 text-white rounded-tr-xs'
                              : 'bg-white text-slate-800 border border-gray-200 rounded-tl-xs'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <span
                            className={`text-[9px] block text-right mt-0.5 ${
                              isMe ? 'text-slate-400' : 'text-gray-400'
                            }`}
                          >
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-2 border-t border-gray-100 bg-white flex items-center gap-1.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type message (e.g. Can we meet at UniMall?)..."
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className="p-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5 text-[#fbbf24]" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
