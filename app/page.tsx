"use client";
import { useState, useEffect } from "react";
import { useSSE } from "./hooks/useSSE";

export default function Home() {
  const { users, selectedUser, setSelectedUser, addUser, sendMessage, error, clearError } = useSSE();
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText("");
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SSE User Dashboard</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <button
          onClick={addUser}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add User
        </button>
        
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Enter message..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedUser}
          />
          <button
            onClick={handleSendMessage}
            disabled={!selectedUser || !messageText.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Message
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user.id)}
            className={`border rounded-lg p-4 transition-all ${
              selectedUser === user.id 
                ? 'border-blue-500 shadow-lg' 
                : 'border-gray-300 hover:border-blue-300'
            } cursor-pointer`}
          >
            <h3 className="font-semibold flex justify-between items-center">
              <span>User {user.id}</span>
              {selectedUser === user.id && (
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Selected
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mb-2">Subscribed to events</p>
            <div className="max-h-40 overflow-y-auto">
              {user.messages.map((msg, index) => (
                <div
                  key={index}
                  className="text-sm bg-gray-50 p-2 rounded mb-1 break-words"
                >
                  {msg}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
