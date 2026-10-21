import { UserPlus, UserCheck } from "lucide-react";

export default function UserBox({
  user,
  onClickbox,
  onFriendRequest,
  requestStatus = "none",
  sendingRequest = false,
}) {

  const username = user?.username ?? "Unknown";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const isOnline = Boolean(user?.is_online ?? user?.status === "Online");
  const status = isOnline ? "Online" : "Offline";

  return (
    <div
      className="flex items-center space-x-3 py-3 px-2 min-h-[72px] rounded-lg hover:bg-gray-100 cursor-pointer"
      onClick={onClickbox}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-lg shrink-0">
        {username.charAt(0).toUpperCase() || "?"}
      </div>

      {/* User information */}
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-base truncate">{displayName}</span>

        <span
          className={`text-sm ${
            status === "Online" ? "text-green-500" : "text-gray-500"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Friend request button */}
      <button
        type="button"
        className={`ml-auto shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          transition-colors duration-200 border
          ${
            requestStatus !== "none"
              ? "bg-blue-50 border-blue-200 text-blue-600"
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
          }`}
        onClick={(event) => {
          event.stopPropagation();
          onFriendRequest?.();
        }}
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
  );
}