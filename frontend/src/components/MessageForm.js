import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { sendMessage } from '../services/api';

const MessageForm = ({ toUserId, token }) => {
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendMessage(toUserId, content, token);
      toast.success('Message Sent');
      setContent('');
    } catch (err) {
      toast.error('Send Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Message" className="flex-1 p-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">Send</button>
    </form>
  );
};

export default MessageForm;