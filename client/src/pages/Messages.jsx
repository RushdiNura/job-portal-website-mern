import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiSend, FiMessageSquare, FiArrowLeft } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../services/socket.js";
import EmptyState from "../components/EmptyState.jsx";
import { TextSkeleton } from "../components/Skeleton.jsx";

export default function Messages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  const activeConversation = conversations.find((c) => c._id === id);

  // Scroll to top on component mount and route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get("/conversations/mine");
      setConversations(data.conversations);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!id) return;
    const loadMessages = async () => {
      setLoadingMessages(true);
      setShouldScrollToBottom(true);
      try {
        const { data } = await api.get(`/conversations/${id}/messages`);
        setMessages(data.messages);
        await api.put(`/conversations/${id}/read`);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [id]);

  // Scroll to bottom only when needed (new messages or conversation change)
  useEffect(() => {
    if (shouldScrollToBottom && messages.length > 0) {
      // bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;

    socket.emit("join_conversation", id, (ack) => {
      if (!ack?.ok) toast.error(ack?.error || "Could not join conversation");
    });

    const onMessage = (msg) => {
      if (msg.conversation === id) {
        setMessages((prev) => [...prev, msg]);
        setShouldScrollToBottom(true);
      }
    };

    const onTyping = ({ isTyping }) => {
      setTypingUser(isTyping);
      clearTimeout(typingTimeout.current);
      if (isTyping) {
        typingTimeout.current = setTimeout(() => setTypingUser(false), 3000);
      }
    };

    socket.on("new_message", onMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.emit("leave_conversation", id);
      socket.off("new_message", onMessage);
      socket.off("typing", onTyping);
      clearTimeout(typingTimeout.current);
    };
  }, [id]);

  const handleTyping = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    socket?.emit("typing", { conversationId: id, isTyping: true });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post(`/conversations/${id}/messages`, { text: text.trim() });
      setText("");
      setShouldScrollToBottom(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const otherPartyName = (c) =>
    user?.role === "employer" ? c.candidate?.name : c.employer?.name;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Messages
      </h1>

      <div className="card grid grid-cols-1 md:grid-cols-3 min-h-[60vh] overflow-hidden">
      {/* <div className="card grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-180px)] min-h-[600px] overflow-hidden"> */}
        {/* Conversation list */}
        <div
          className={`border-r border-slate-100 dark:border-slate-800 ${
            id ? "hidden md:block" : ""
          }`}
        >
          {loadingList ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <TextSkeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={FiMessageSquare}
              title="No conversations yet"
              description="Conversations appear here once you apply to (or receive) an application."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {conversations.map((c) => (
                <li key={c._id}>
                  <button
                    onClick={() => navigate(`/messages/${c._id}`)}
                    className={`w-full text-left px-4 py-3.5 transition-all duration-200 cursor-pointer ${
                      id === c._id
                        ? "bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {otherPartyName(c) || "Unknown"}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[11px] flex items-center justify-center shrink-0 ml-2">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {c.job?.title}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                      {c.lastMessagePreview}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Thread */}
        <div
          className={`md:col-span-2 flex flex-col ${
            !id ? "hidden md:flex" : "flex"
          }`}
        >
        {/* <div
          className={`md:col-span-2 flex flex-col min-h-0 ${
            !id ? "hidden md:flex" : "flex"
          }`}
        > */}
          {!id ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  onClick={() => navigate("/messages")}
                  className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  aria-label="Back"
                >
                  <FiArrowLeft size={18} />
                </button>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    {activeConversation
                      ? otherPartyName(activeConversation)
                      : ""}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeConversation?.job?.title}
                  </p>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              >
              {/* <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3"
              > */}
                {loadingMessages ? (
                  <div className="space-y-3">
                    <TextSkeleton className="h-10 w-2/3" />
                    <TextSkeleton className="h-10 w-1/2" />
                    <TextSkeleton className="h-10 w-3/4" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine =
                      m.sender?._id === user?._id || m.sender === user?._id;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                            mine
                              ? "bg-primary-600 text-white rounded-br-sm"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                {typingUser && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 italic">
                    <span className="flex gap-0.5">
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </span>
                    Typing...
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2"
              >
                <input
                  className="input flex-1"
                  placeholder="Type a message..."
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary px-4 hover:bg-primary-700 transition-colors"
                  aria-label="Send message"
                  disabled={!text.trim()}
                >
                  <FiSend size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
