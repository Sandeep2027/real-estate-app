import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Messages = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        toast.error('Failed to fetch users');
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/messages/${selectedUserId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          setMessages(response.data);
        } catch (error) {
          toast.error('Failed to fetch messages');
        }
      };
      fetchMessages();
    }
  }, [selectedUserId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !content) return;
    try {
      await api.post(
        '/messages',
        { toUserId: selectedUserId, content },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setContent('');
      const response = await api.get(`/messages/${selectedUserId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages(response.data);
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Messages</h2>
      <div className="flex">
        <div className="w-1/4 border-r pr-4">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          {users.map((u) => (
            <div
              key={u.id}
              className={`p-2 cursor-pointer ${selectedUserId === u.id ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
              onClick={() => setSelectedUserId(u.id)}
            >
              {u.email}
            </div>
          ))}
        </div>
        <div className="w-3/4 pl-4">
          {selectedUserId ? (
            <>
              <div className="h-96 overflow-y-auto border p-4 mb-4 dark:bg-gray-800 dark:text-white">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-2 ${msg.fromUserId === user.id ? 'text-right' : 'text-left'}`}
                  >
                    <p className="inline-block p-2 rounded bg-gray-100 dark:bg-gray-700">
                      {msg.content}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Select a user to start messaging</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;