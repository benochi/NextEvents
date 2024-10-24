import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';

export function useSSE() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userId, setUserId] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const addUser = useCallback(() => {
    try {
      const eventSource = new EventSource(`/api/sse?userId=${userId}`);
      const newUser: User = { id: userId, messages: [], eventSource };
      
      eventSource.onopen = () => {
        console.log(`Connection established for user ${userId}`);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          setUsers((prevUsers) =>
            prevUsers.map((u) =>
              u.id === userId ? { ...u, messages: [...u.messages, messageData.message] } : u
            )
          );
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          setError('Error parsing message');
        }
      };

      eventSource.onerror = (error) => {
        console.error(`SSE Error for user ${userId}:`, error);
        setError('Connection error - retrying...');
      };

      setUsers((prev) => [...prev, newUser]);
      setUserId((prev) => prev + 1);
    } catch (error) {
      console.error('Error creating EventSource:', error);
      setError('Error creating connection');
    }
  }, [userId]);

  const sendMessage = useCallback(async (message: string) => {
    if (selectedUser === null) return;

    try {
      const response = await fetch("/api/sse", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser,
          message: message || `Message for user ${selectedUser}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError('Error sending message. Please try again.');
    }
  }, [selectedUser]);

  // Cleanup function to close EventSource connections
  useEffect(() => {
    return () => {
      users.forEach((user) => {
        if (user.eventSource) {
          user.eventSource.close();
        }
      });
    };
  }, [users]);

  return {
    users,
    selectedUser,
    setSelectedUser,
    addUser,
    sendMessage,
    error,
    clearError: () => setError(null),
  };
}
