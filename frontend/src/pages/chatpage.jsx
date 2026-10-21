
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/navbar";
import UserBox from "../components/userbox";
import ChatWindow from "../components/chatwindow";
import api from "../api/api.js";
import { Check, UsersRound } from "lucide-react";

function getUserIdFromToken(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const decoded = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    );

    const id = Number(decoded.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

function normalizeIds(ids = []) {
  return [
    ...new Set(
      ids.map(Number).filter((id) => Number.isSafeInteger(id))
    ),
  ];
}

export default function Chatpage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [friendsView, setFriendsView] = useState(false);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [sendingRequestId, setSendingRequestId] = useState(null);
  const [friendRequestError, setFriendRequestError] = useState("");
  const [friendRequestNotification, setFriendRequestNotification] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [socket, setSocket] = useState(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const conversationIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const historyRequestRef = useRef(0);
  const incomingRequestIdsRef = useRef(null);

  const token = localStorage.getItem("access_token");
  const currentUserId = token ? getUserIdFromToken(token) : null;

  conversationIdRef.current = conversationId;
  currentUserIdRef.current = currentUserId;
  const refreshFriendData = useCallback(async () => {
    try {
      const [friendsResponse, requestsResponse, sentRequestsResponse] =
        await Promise.all([
          api.get("/users/friends"),
          api.get("/users/friends/requests"),
          api.get("/users/friends/requests/sent"),
        ]);

      const nextIncomingRequests = requestsResponse.data;
      const nextRequestIds = new Set(
        nextIncomingRequests.map((request) => Number(request.id))
      );
      const previousRequestIds = incomingRequestIdsRef.current;

      if (previousRequestIds) {
        const newRequests = nextIncomingRequests.filter(
          (request) => !previousRequestIds.has(Number(request.id))
        );

        if (newRequests.length > 0) {
          const names = newRequests.map((request) => request.username).join(", ");
          setFriendRequestNotification(
            `${newRequests.length === 1 ? "New friend request" : "New friend requests"} from ${names}.`
          );
        }
      }

      incomingRequestIdsRef.current = nextRequestIds;
      setFriends(friendsResponse.data);
      setIncomingRequests(nextIncomingRequests);
      setSentRequests(sentRequestsResponse.data);
    } catch (error) {
      console.error("[Friends] Failed to load:", error);
    }
  }, []);

  const getFriendRequestStatus = (userId) => {
    const id = Number(userId);
    if (friends.some((friend) => Number(friend.id) === id)) return "friend";
    if (incomingRequests.some((request) => Number(request.id) === id)) {
      return "incoming";
    }
    if (sentRequests.some((request) => Number(request.id) === id)) {
      return "sent";
    }
    return "none";
  };

  const sendFriendRequest = async (user) => {
    if (!user || getFriendRequestStatus(user.id) !== "none") return;

    setSendingRequestId(Number(user.id));
    setFriendRequestError("");

    try {
      await api.post(`/users/friend-request/${user.id}`);
      setSentRequests((previous) => [...previous, user]);
    } catch (error) {
      setFriendRequestError(
        error.response?.data?.detail || "Unable to send friend request."
      );
    } finally {
      setSendingRequestId(null);
    }
  };

  const acceptFriendRequest = async (user) => {
    setAcceptingRequestId(user.id);
    setFriendRequestError("");

    try {
      await api.post(`/users/friend-request-accept/${user.id}`);
      setIncomingRequests((previous) =>
        previous.filter((request) => request.id !== user.id)
      );
      incomingRequestIdsRef.current?.delete(Number(user.id));
      setFriends((previous) => [...previous, user]);
    } catch (error) {
      setFriendRequestError(
        error.response?.data?.detail || "Unable to accept request."
      );
    } finally {
      setAcceptingRequestId(null);
    }
  };
  const activeUser = (() => {
    const user = selectedUser ?? users[0];

    if (!user) return null;

    return {
      ...user,
      is_online: onlineUserIds.includes(Number(user.id)),
    };
  })();

  // 1. Load registered users.
  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const response = await api.get("/users");

        if (!cancelled) {
          setUsers(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Users] Failed to load:", error);
        }
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refreshFriendData();
    const intervalId = window.setInterval(refreshFriendData, 15000);
    window.addEventListener("focus", refreshFriendData);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshFriendData);
    };
  }, [refreshFriendData]);

  // 2. Find/create the conversation and load its history.
  useEffect(() => {
    if (!activeUser) {
      conversationIdRef.current = null;
      setConversationId(null);
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    let cancelled = false;
    const requestId = ++historyRequestRef.current;

    async function loadConversation() {
      setLoadingMessages(true);
      conversationIdRef.current = null;
      setConversationId(null);
      setMessages([]);

      try {
        const response = await api.post("/conversation", {
          user_b_id: Number(activeUser.id),
        });

        if (cancelled) return;

        const id = Number(response.data.conversation_id);

        conversationIdRef.current = id;
        setConversationId(id);

        const historyResponse = await api.get(
          `/conversations/${id}/messages`
        );

        if (
          cancelled ||
          requestId !== historyRequestRef.current
        ) {
          return;
        }

        const history = historyResponse.data.map((message) => ({
          ...message,
          text: message.body,
          fromMe:
            Number(message.sender_id) === currentUserIdRef.current,
        }));

        // Preserve any live messages received while history loaded.
        setMessages((previous) => {
          const byId = new Map();

          for (const message of history) {
            byId.set(Number(message.id), message);
          }

          for (const message of previous) {
            if (message.id != null) {
              byId.set(Number(message.id), message);
            }
          }

          return [...byId.values()].sort(
            (a, b) => Number(a.id) - Number(b.id)
          );
        });
      } catch (error) {
        if (!cancelled) {
          console.error("[Conversation] Failed to load:", error);
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [activeUser?.id]);

  // 3. Establish the authenticated WebSocket connection.
  useEffect(() => {
    if (!token || currentUserId === null) {
      console.error("[WS] Missing token or invalid user ID");
      setSocket(null);
      return;
    }

    let intentionalClose = false;

    const ws = new WebSocket("ws://localhost:8000/ws");

    console.log(`[WS] Creating connection for user ${currentUserId}`);

    ws.onopen = () => {
      console.log(`[WS] Open for user ${currentUserId}`);

      ws.send(
        JSON.stringify({
          type: "authenticate",
          token,
        })
      );
    };

    ws.onmessage = (event) => {
      let data;

      try {
        data = JSON.parse(event.data);
      } catch {
        console.error("[WS] Invalid JSON:", event.data);
        return;
      }

      console.log("[WS] Received:", data);

      switch (data.type) {
        case "online_users": {
          setOnlineUserIds(normalizeIds(data.user_ids));
          break;
        }

        case "user_connected": {
          const id = Number(data.user_id);

          if (!Number.isSafeInteger(id)) break;

          setOnlineUserIds((previous) =>
            normalizeIds([...previous, id])
          );
          break;
        }

        case "user_status": {
          const id = Number(data.user_id);

          if (!Number.isSafeInteger(id)) break;

          setOnlineUserIds((previous) => {
            const normalized = normalizeIds(previous);

            if (data.status === "offline") {
              return normalized.filter((item) => item !== id);
            }

            if (data.status === "online") {
              return normalizeIds([...normalized, id]);
            }

            return normalized;
          });
          break;
        }

        case "message":
        case "message_sent": {
          const incoming = data.message;

          if (!incoming) {
            console.error("[WS] Missing message payload:", data);
            break;
          }

          if (
            Number(incoming.conversation_id) !==
            Number(conversationIdRef.current)
          ) {
            break;
          }

          const normalizedMessage = {
            ...incoming,
            text: incoming.body,
            fromMe:
              Number(incoming.sender_id) === currentUserIdRef.current,
          };

          setMessages((previous) => {
            const exists = previous.some(
              (message) =>
                message.id != null &&
                Number(message.id) === Number(incoming.id)
            );

            return exists
              ? previous
              : [...previous, normalizedMessage];
          });

          break;
        }

        case "error": {
          console.error("[WS] Server error:", data.detail);
          break;
        }

        default:
          console.log("[WS] Unhandled event:", data);
      }
    };

    ws.onerror = (event) => {
      console.error("[WS] Error event:", event);
    };

    ws.onclose = (event) => {
      console.log("[WS] Closed:", {
        userId: currentUserId,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        intentional: intentionalClose,
      });
    };

    setSocket(ws);

    return () => {
      intentionalClose = true;

      console.log("[WS] React cleanup:", {
        userId: currentUserId,
        readyState: ws.readyState,
      });

      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close(1000, "Chat page cleanup");
      }

      setSocket((current) => (current === ws ? null : current));
    };
  }, [token, currentUserId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex flex-1 p-4 gap-4 min-h-0">
        <aside className="w-[24%] min-w-[200px] max-w-[24%] border-r border-gray-200 pr-2 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
              <h2 className="font-semibold text-gray-800">
                {friendsView ? "Friends" : "People"}
              </h2>
              <button
                type="button"
                aria-label={friendsView ? "Show people" : "Show friends and requests"}
                aria-pressed={friendsView}
                title={friendsView ? "Show people" : "Show friends and requests"}
                onClick={() => {
                  setFriendsView((showing) => !showing);
                  setFriendRequestError("");
                  setFriendRequestNotification("");
                  refreshFriendData();
                }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                  friendsView
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <UsersRound aria-hidden="true" size={20} />
                {incomingRequests.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-semibold text-white">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {friendRequestNotification && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mx-2 mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {friendRequestNotification}
                </p>
              )}
              {friendRequestError && (
                <p role="alert" className="px-2 py-2 text-sm text-rose-600">
                  {friendRequestError}
                </p>
              )}
              {friendsView ? (
                <>
                  {incomingRequests.length > 0 && (
                    <section aria-label="Incoming friend requests" className="py-2">
                      <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Requests
                      </h3>
                      {incomingRequests.map((user) => (
                        <div key={user.id} className="flex min-h-14 items-center gap-2 px-2 py-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 font-semibold text-rose-700">
                            {user.username?.charAt(0).toUpperCase() || "?"}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                            {user.username}
                          </span>
                          <button
                            type="button"
                            aria-label={`Accept friend request from ${user.username}`}
                            title="Accept request"
                            disabled={acceptingRequestId === user.id}
                            onClick={() => acceptFriendRequest(user)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <Check aria-hidden="true" size={18} />
                          </button>
                        </div>
                      ))}
                    </section>
                  )}
                  <section aria-label="Friends" className="py-2">
                    <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Friends
                    </h3>
                    {friends.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-gray-500">No friends yet.</p>
                    ) : (
                      friends.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="flex w-full min-h-14 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-100"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                            {user.username?.charAt(0).toUpperCase() || "?"}
                          </span>
                          <span className="min-w-0 truncate text-sm font-medium text-gray-800">
                            {user.username}
                          </span>
                        </button>
                      ))
                    )}
                  </section>
                </>
              ) : (
                users.map((user) => (
                  <UserBox
                    key={user.id}
                    user={{
                      ...user,
                      is_online: onlineUserIds.includes(Number(user.id)),
                    }}
                    onClickbox={() => setSelectedUser(user)}
                    onFriendRequest={() => sendFriendRequest(user)}
                    requestStatus={getFriendRequestStatus(user.id)}
                    sendingRequest={sendingRequestId === Number(user.id)}
                  />
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-gray-50 rounded-lg overflow-hidden">
          {activeUser ? (
            <ChatWindow
              key={activeUser.id}
              user={activeUser}
              socket={socket}
              conversationId={conversationId}
              messages={messages}
              loadingMessages={loadingMessages}
              requestStatus={getFriendRequestStatus(activeUser.id)}
              sendingRequest={sendingRequestId === Number(activeUser.id)}
              onFriendRequest={() => sendFriendRequest(activeUser)}
            />
          ) : (
            <div className="p-4 text-gray-500">
              No other users available.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
