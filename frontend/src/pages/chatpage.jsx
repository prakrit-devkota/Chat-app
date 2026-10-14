
import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import UserBox from "../components/userbox";
import ChatWindow from "../components/chatwindow";
import api from "../api/api.js";

export default function Chatpage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    fetchUsers();
  }, []);

  const activeUser = selectedUser || users[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex flex-1 p-4 gap-4 min-h-0">
        <aside className="w-[24%] min-w-[200px] max-w-[24%] border-r border-gray-200 pr-2 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {users.map((user) => (
              <UserBox
                key={user.id}
                user={user}
                onClickbox={() => setSelectedUser(user)}
              />
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-gray-50 rounded-lg">
          {activeUser ? (
            <ChatWindow
              key={activeUser.id}
              user={activeUser}
            />
          ) : (
            <p className="p-4">
              No other users available.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
