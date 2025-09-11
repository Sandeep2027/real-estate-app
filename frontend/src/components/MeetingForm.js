import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { scheduleMeeting } from '../services/api';

const MeetingForm = ({ userId2, token }) => {
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await scheduleMeeting(userId2, date, notes, token);
      toast.success('Meeting Scheduled');
    } catch (err) {
      toast.error('Schedule Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded shadow-md mt-4">
      <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">Schedule</button>
    </form>
  );
};

export default MeetingForm;