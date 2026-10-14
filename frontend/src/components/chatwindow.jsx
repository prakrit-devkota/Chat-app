import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";

export default function ChatWindow({ user, onclickfrnd }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a user to start chatting
      </div>
    );
  }

  const username = user?.username ?? "Unknown";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const status = user?.status || "Offline";

  const handleSend = () => {
    if (!text.trim()) return;
    setMessages([...messages, { id: Date.now(), text, fromMe: true }]);
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with the clicked user */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-lg shrink-0">
          {username.charAt(0).toUpperCase() || "?"}
        </div>

        <div className="min-w-0">
          <p className="font-medium truncate">{displayName}</p>
          <p
            className={`text-sm ${
              status === "Online" ? "text-green-500" : "text-gray-500"
            }`}
          >
            {status}
          </p>
        </div>

        {/* Friend request button */}
        <button
          type="button"
          className={`ml-auto shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            transition-colors duration-200 border
            ${
              requestSent
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
            }`}
          onClick={() => {
            setRequestSent((prev) => !prev);
            onclickfrnd?.();
          }}
          aria-label={requestSent ? "Friend request sent" : "Send friend request"}
          title={requestSent ? "Friend request sent" : "Send friend request"}
        >
          {requestSent ? (
            <UserCheck className="w-5 h-5" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
          >
            <span className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-xs">
              {m.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-4 bg-white border-t border-gray-200">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-5 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}