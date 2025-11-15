import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, History, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getRecentlyViewed } from "../../api/recentlyViewed";
import {
  sendChatMessage,
  fetchChatHistory,
  fetchChatSession,
  type ChatMessagePayload,
  type ChatSessionSummary,
  type ChatRecommendation,
  type ChatResponsePayload,
} from "../../api/aiChat";
import "./AIChatWidget.css";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  isPending?: boolean;
  errored?: boolean;
  html?: string;
  metadata?: ChatResponsePayload["metadata"];
  recommendations?: ChatRecommendation[];
}

const STORAGE_KEY = "ai-chat-history:v1";

const defaultGreetings: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Xin chào! Mình là QBot – trợ lý AI của cửa hàng LEGO. Bạn có thể hỏi về đơn hàng, sản phẩm gợi ý hoặc chính sách mua hàng.",
    createdAt: new Date().toISOString(),
  },
];

const quickPrompts = [
  "Đơn hàng của tôi đang được giao tới đâu?",
  "Gợi ý cho mình vài bộ LEGO đang hot.",
  "Tôi có thể đổi trả sản phẩm như thế nào?",
];

const truncatePreview = (value: string | null | undefined, limit = 90) =>
  value && value.length > limit ? `${value.slice(0, limit).trim()}…` : value ?? null;

const loadPersistedMessages = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultGreetings;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultGreetings;
    }
    return parsed as ChatMessage[];
  } catch {
    return defaultGreetings;
  }
};

const persistMessages = (messages: ChatMessage[]) => {
  try {
    const clean = messages.map(({ isPending, errored, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    /* ignore storage errors */
  }
};

const sanitizeMessage = (input: string) => input.trim();

const mapMessagesToPayload = (messages: ChatMessage[]): ChatMessagePayload[] =>
  messages
    .filter((message) => !message.isPending)
    .map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.createdAt,
    }));

const renderWithBreaks = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatUiPrice = (value?: number) => {
  if (value == null) return null;
  return vndFormatter.format(Number(value));
};

const AIChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { cart } = useCart();

  const isAuthenticated = Boolean(user);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(defaultGreetings);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [historySessions, setHistorySessions] = useState<ChatSessionSummary[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setMessages(defaultGreetings);
      setSessionId(null);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setMessages(loadPersistedMessages());
      setSessionId(null);
      setHistorySessions([]);
      setIsHistoryOpen(false);
      setHistoryError(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      persistMessages(messages.filter((message) => !message.isPending));
    }
  }, [messages, isAuthenticated]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = setTimeout(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(handle);
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    (async () => {
      try {
        const viewed = await getRecentlyViewed();
        setRecentlyViewed(viewed);
      } catch (error) {
        console.warn("AIChatWidget: failed to load recently viewed items", error);
      }
    })();
  }, [isOpen, isAuthenticated]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        setIsHistoryOpen(false);
      }
      return !prev;
    });
    setErrorMessage(null);
    setHistoryError(null);
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const setLastMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = message;
      return next;
    });
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages(defaultGreetings);
    setSessionId(null);
    setErrorMessage(null);
    setIsHistoryOpen(false);
    setHistoryError(null);
    if (!isAuthenticated) {
      persistMessages(defaultGreetings);
    }
  }, [isAuthenticated]);

  const upsertHistorySession = useCallback(
    (session: ChatSessionSummary | null, lastReply?: string) => {
      if (!session) return;
      const enriched = {
        ...session,
        lastMessagePreview: truncatePreview(lastReply ?? session.lastMessagePreview),
      };
      setHistorySessions((prev) => {
        const next = [...prev];
        const index = next.findIndex((item) => item.id === enriched.id);
        if (index >= 0) {
          next[index] = { ...next[index], ...enriched };
        } else {
          next.unshift(enriched);
        }
        return next.slice(0, 40);
      });
    },
    []
  );

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const { sessions } = await fetchChatHistory();
      setHistorySessions(
        sessions.map((session) => ({
          ...session,
          lastMessagePreview: truncatePreview(session.lastMessagePreview),
        }))
      );
    } catch (error: any) {
      setHistoryError(
        error?.response?.data?.message || error?.message || "Không thể tải lịch sử."
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isHistoryOpen && isAuthenticated) {
      void loadHistory();
    }
  }, [isHistoryOpen, isAuthenticated, loadHistory]);

  const handleHistoryButton = useCallback(() => {
    if (!isAuthenticated) {
      startNewConversation();
      return;
    }
    setIsHistoryOpen((prev) => {
      const next = !prev;
      if (!prev) {
        void loadHistory();
      }
      return next;
    });
  }, [isAuthenticated, loadHistory, startNewConversation]);

  const handleSelectSession = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      setIsSessionLoading(true);
      setHistoryError(null);
      try {
        const { session } = await fetchChatSession(id);
        const formatted = session.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.timestamp ?? new Date().toISOString(),
        }));
        setMessages(formatted.length ? formatted : defaultGreetings);
        setSessionId(session.id);
        setIsHistoryOpen(false);
        setErrorMessage(null);
        upsertHistorySession(session, session.messages.at(-1)?.content);
      } catch (error: any) {
        setHistoryError(
          error?.response?.data?.message || error?.message || "Không thể tải cuộc trò chuyện."
        );
      } finally {
        setIsSessionLoading(false);
      }
    },
    [isAuthenticated, upsertHistorySession]
  );

  const formatTimestamp = useCallback((value?: string) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("vi-VN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return value;
    }
  }, []);

  const contextPayload = useMemo(() => {
    const cartItems = cart.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const localSearches = (() => {
      try {
        const raw = localStorage.getItem("searchHistory");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(-5) : [];
      } catch {
        return [];
      }
    })();

    const clicks = recentlyViewed.slice(0, 5).map((item: any) => ({
      id: item._id ?? item.id,
      name: item.name ?? item.title,
      price: item.price,
      theme: item.theme,
    }));

    return {
      cart: {
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      },
      recentSearches: localSearches,
      recentClicks: clicks,
      featuredProducts: recentlyViewed.slice(0, 3).map((item: any) => ({
        id: item._id ?? item.id,
        name: item.name,
        price: item.price,
        tags: item.tags ?? (item.theme ? [item.theme] : []),
      })),
    };
  }, [cart.items, recentlyViewed]);

  const handleSend = useCallback(
    async (prompt?: string) => {
      const messageText = sanitizeMessage(prompt ?? input);
      if (!messageText || isSending) return;

      setErrorMessage(null);
      setIsSending(true);
      setInput("");
      if (isHistoryOpen) {
        setIsHistoryOpen(false);
      }

      const outgoingMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageText,
        createdAt: new Date().toISOString(),
      };

      appendMessage(outgoingMessage);

      const pendingAssistant: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Đang soạn câu trả lời...",
        createdAt: new Date().toISOString(),
        isPending: true,
      };

      appendMessage(pendingAssistant);

      try {
        const response = await sendChatMessage({
          messages: mapMessagesToPayload([...messages, outgoingMessage]),
          context: contextPayload,
          customer: user
            ? {
                name: user.name ?? user.fullName ?? undefined,
                email: user.email,
              }
            : undefined,
          sessionId: sessionId ?? undefined,
        });

        const metadata = response.metadata;
        const recommendations = metadata?.recommendations;

        setLastMessage({
          ...pendingAssistant,
          content: response.reply,
          createdAt: new Date().toISOString(),
          isPending: false,
          html: metadata?.html,
          metadata,
          recommendations,
        });

        if (isAuthenticated && response.session) {
          setSessionId(response.session.id);
          upsertHistorySession(response.session, response.reply);
          if (isHistoryOpen) {
            void loadHistory();
          }
        }
      } catch (error: any) {
        const fallback = error?.response?.data?.message || error?.message || "Không thể kết nối tới AI. Vui lòng thử lại.";
        setLastMessage({
          ...pendingAssistant,
          content: fallback,
          createdAt: new Date().toISOString(),
          isPending: false,
          errored: true,
        });
        setErrorMessage(fallback);
      } finally {
        setIsSending(false);
      }
    },
    [
      appendMessage,
      contextPayload,
      isAuthenticated,
      isHistoryOpen,
      isSending,
      loadHistory,
      messages,
      sessionId,
      setLastMessage,
      upsertHistorySession,
      user,
      input,
    ]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      void handleSend();
    },
    [handleSend]
  );

  const renderMessageContent = (message: ChatMessage) => {
    if (message.role === "assistant" && message.recommendations?.length) {
      return (
        <>
          <div>{renderWithBreaks(message.content)}</div>
          <ol className="ai-chat-recommendations">
            {message.recommendations.map((rec, index) => {
              const detailSources = rec.details
                ? [rec.details]
                : [
                    rec.priceLabel ?? formatUiPrice(rec.price),
                    rec.tags?.length ? rec.tags.join(", ") : null,
                  ];
              const details = detailSources
                .filter((value): value is string => !!value)
                .filter((value, detailIndex, arr) => arr.indexOf(value) === detailIndex)
                .join(" • ");
              return (
                <li key={rec.url ?? rec.id ?? `${message.id}-${index}`}>
                  {rec.url ? (
                    <a href={rec.url} target="_blank" rel="noopener noreferrer">
                      {rec.name}
                    </a>
                  ) : (
                    <span>{rec.name}</span>
                  )}
                  {details && (
                    <span className="ai-chat-recommendations__details">{details}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      );
    }

    if (message.role === "assistant" && message.html) {
      return <span dangerouslySetInnerHTML={{ __html: message.html }} />;
    }

    return renderWithBreaks(message.content);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="ai-chat-toggle"
        aria-label="Open AI assistant"
        onClick={toggleOpen}
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <div className="ai-chat-header__title">
          <MessageCircle size={18} />
          <span>QBot - Trợ lý AI</span>
        </div>
        <div className="ai-chat-header__actions">
          <button
            type="button"
            className="ai-chat-new-btn"
            onClick={startNewConversation}
            title="Tạo cuộc trò chuyện mới"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="ai-chat-history-btn"
            onClick={handleHistoryButton}
            title={
              isAuthenticated ? "Xem lịch sử hội thoại" : "Xóa hội thoại cục bộ"
            }
          >
            <History size={16} />
          </button>
          <button
            type="button"
            className="ai-chat-close-btn"
            onClick={toggleOpen}
            aria-label="Close AI chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {isAuthenticated && isHistoryOpen && (
        <div className="ai-chat-history-panel">
          <div className="ai-chat-history-panel__header">
            <span>Lịch sử hội thoại</span>
            <button
              type="button"
              aria-label="Đóng lịch sử"
              onClick={() => setIsHistoryOpen(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div className="ai-chat-history-panel__content">
            {isHistoryLoading ? (
              <div className="ai-chat-history-panel__empty">
                <Loader2 className="ai-chat-spinner" size={18} />
              </div>
            ) : historySessions.length > 0 ? (
              historySessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={`ai-chat-history-panel__item${
                    session.id === sessionId ? " ai-chat-history-panel__item--active" : ""
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                  disabled={isSessionLoading}
                >
                  <div className="ai-chat-history-panel__item-title">{session.title}</div>
                  <div className="ai-chat-history-panel__item-meta">
                    <span>{formatTimestamp(session.updatedAt ?? session.createdAt)}</span>
                    <span>{session.messageCount ?? 0} tin nhắn</span>
                  </div>
                  {session.lastMessagePreview && (
                    <div className="ai-chat-history-panel__item-preview">
                      {session.lastMessagePreview}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="ai-chat-history-panel__empty">
                Chưa có cuộc trò chuyện nào.
              </div>
            )}
          </div>
          {historyError && <div className="ai-chat-history-panel__error">{historyError}</div>}
          {isSessionLoading && (
            <div className="ai-chat-history-panel__overlay">
              <Loader2 className="ai-chat-spinner" size={18} />
            </div>
          )}
        </div>
      )}

      <div className="ai-chat-body">
        <div className="ai-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-chat-message ai-chat-message--${message.role}${
                message.errored ? " ai-chat-message--error" : ""
              }`}
            >
              <div className="ai-chat-message__content">
                {renderMessageContent(message)}
              </div>
              <span className="ai-chat-message__time">
                {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          <div ref={scrollAnchorRef} />
        </div>

        <div className="ai-chat-quick-prompts">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isSending}
              onClick={() => handleSend(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <form className="ai-chat-footer" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nhập câu hỏi của bạn..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !sanitizeMessage(input)}>
          {isSending ? <Loader2 className="ai-chat-spinner" size={18} /> : <Send size={18} />}
        </button>
      </form>

      {errorMessage && <div className="ai-chat-error">{errorMessage}</div>}
    </div>
  );
};

export default AIChatWidget;
