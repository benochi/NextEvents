import { useState, useEffect, useCallback } from 'react';
import Pusher from 'pusher-js';
import { User } from '../types';

export function useSSE() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userId, setUserId] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pusherInstance, setPusherInstance] = useState<Pusher | null>(null);

  // Configure Pusher client
  useEffect(() => {
    Pusher.logToConsole = true;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/auth",
      auth: {
        params: {}, 
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    });

    setPusherInstance(pusher);

    return () => {
      pusher.disconnect();
    };
  }, []);

  const addUser = useCallback(() => {
    if (!pusherInstance) return;

    try {
      const newUser: User = { id: userId, messages: [], eventSource: null };

      // Subscribe to the private channel for the new user
      const channel = pusherInstance.subscribe(`private-user-${userId}`);
      
      channel.bind("message-event", (data: { message: string }) => {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === userId ? { ...u, messages: [...u.messages, data.message] } : u
          )
        );
      });

      // Handle subscription error
      channel.bind("pusher:subscription_error", (error: Error) => {
        console.error("Subscription error:", error);
        setError("Error subscribing to channel");
      });

      setUsers((prev) => [...prev, newUser]);
      setUserId((prev) => prev + 1);
    } catch (error) {
      console.error('Error creating connection:', error);
      setError('Error creating connection');
    }
  }, [userId, pusherInstance]);

  const sendMessage = useCallback(async (message: string) => {
    if (selectedUser === null) return;

    try {
      const response = await fetch("/api/pusher", {
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
