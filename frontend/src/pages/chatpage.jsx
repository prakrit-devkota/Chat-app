
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar";
import UserBox from "../components/userbox";
import ChatWindow from "../components/chatwindow";
import api from "../api/api.js";

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
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [socket, setSocket] = useState(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const conversationIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const historyRequestRef = useRef(0);

  const token = localStorage.getItem("access_token");
  const currentUserId = token ? getUserIdFromToken(token) : null;

  conversationIdRef.current = conversationId;
  currentUserIdRef.current = currentUserId;

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
          <div className="h-full overflow-y-auto">
            {users.map((user) => (
              <UserBox
                key={user.id}
                user={{
                  ...user,
                  is_online: onlineUserIds.includes(Number(user.id)),
                }}
                onClickbox={() => setSelectedUser(user)}
              />
            ))}
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
