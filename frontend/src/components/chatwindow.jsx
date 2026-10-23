
import { useState } from "react";
import { Video, UserPlus, UserCheck } from "lucide-react";
import CallWindow from "./callwindow";

export default function ChatWindow({
  user,
  onFriendRequest,
  requestStatus = "none",
  sendingRequest = false,
  socket,
  conversationId,
  messages = [],
  loadingMessages = false,
}) {
  const [text, setText] = useState("");
  const [callOpen, setCallOpen] = useState(false);
 

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a user to start chatting
      </div>
    );
  }

  const username = user?.username ?? "Unknown";
  const displayName =
    username.charAt(0).toUpperCase() + username.slice(1);

  const isOnline = Boolean(
    user?.is_online ?? user?.status === "Online"
  );

  const status = isOnline ? "Online" : "Offline";

  function handleSend() {
    const body = text.trim();

    if (!body) return;

    if (!conversationId) {
      console.error("No conversation selected");
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    socket.send(
      JSON.stringify({
        type: "message",
        conversation_id: conversationId,
        body,
      })
    );

    setText("");
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-lg shrink-0">
          {username.charAt(0).toUpperCase() || "?"}
        </div>

        <div className="min-w-0">
          <p className="font-medium truncate">{displayName}</p>

          <p
            className={`text-sm ${
              isOnline ? "text-green-500" : "text-gray-500"
            }`}
          >
            {status}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm transition-colors hover:bg-emerald-200"
            onClick={() => setCallOpen(true)}
            aria-label={`Start video call with ${displayName}`}
            title={`Video call with ${displayName}`}
          >
            <Video aria-hidden="true" className="h-5 w-5" />
          </button>

          {/* Friend request button */}
          <button
            type="button"
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            transition-colors duration-200 border
            ${
              requestStatus !== "none"
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
            }`}
          onClick={onFriendRequest}
          disabled={requestStatus !== "none" || sendingRequest}
          aria-label={
            requestStatus === "friend"
              ? "Already friends"
              : requestStatus === "incoming"
                ? "Friend request received"
                : requestStatus === "sent"
                  ? "Friend request sent"
                  : "Send friend request"
          }
          title={
            requestStatus === "friend"
              ? "Already friends"
              : requestStatus === "incoming"
                ? "Friend request received; open Friends to accept"
                : requestStatus === "sent"
                  ? "Friend request sent"
                  : sendingRequest
                    ? "Sending friend request"
                    : "Send friend request"
          }
          >
            {requestStatus !== "none" ? (
              <UserCheck className="w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loadingMessages ? (
          <p className="text-center text-gray-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`max-w-xs break-words rounded-lg px-3 py-2 ${
                  m.fromMe
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                {m.text ?? m.body}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-200 bg-white p-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!conversationId || loadingMessages}
          className="rounded-full bg-blue-500 px-5 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {callOpen && (
        <CallWindow user={user} onClose={() => setCallOpen(false)} />
      )}
    </div>
  );
}
