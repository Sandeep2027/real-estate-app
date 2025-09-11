import React, { useState, useEffect } from 'react';
import { getInterests, getMessages, getMeetings, getUsers } from '../services/api';
import AddPropertyForm from '../components/AddPropertyForm';
import MessageForm from '../components/MessageForm';
import MeetingForm from '../components/MeetingForm';
import PropertyCard from '../components/PropertyCard';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const token = localStorage.getItem('token');
  const [interests, setInterests] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: int } = await getInterests(token);
        setInterests(int);
        const { data: usrs } = await getUsers();
        setUsers(usrs);
        const { data: mtgs } = await getMeetings(token);
        setMeetings(mtgs);
      } catch (err) {
        toast.error('Fetch Failed');
      }
    };
    fetchData();
  }, [token]);

  const handleSelectUser = async (userId) => {
    setSelectedUser(userId);
    try {
      const { data } = await getMessages(userId, token);
      setMessages(data);
    } catch (err) {
      toast.error('Fetch Messages Failed');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Add Property</h2>
        <AddPropertyForm token={token} />
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Interests</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {interests.map(prop => <PropertyCard key={prop.id} property={prop} />)}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Message Users</h2>
        <div className="space-y-2">
          {users.map(user => (
            <button key={user.id} onClick={() => handleSelectUser(user.id)} className="bg-gray-200 dark:bg-gray-700 p-2 rounded w-full text-left">
              {user.email}
            </button>
          ))}
        </div>
        {selectedUser && (
          <div className="mt-4">
            <h3 className="text-xl font-bold">Chat with User {selectedUser}</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 h-48 overflow-y-auto">
              {messages.map(msg => (
                <p key={msg.id}>{msg.fromUserId}: {msg.content}</p>
              ))}
            </div>
            <MessageForm toUserId={selectedUser} token={token} />
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Schedule Meeting</h2>
        {selectedUser && <MeetingForm userId2={selectedUser} token={token} />}
        <h3 className="text-xl font-bold mt-4">My Meetings</h3>
        <ul>
          {meetings.map(mtg => (
            <li key={mtg.id}>With User {mtg.userId1 === mtg.userId2 ? mtg.userId2 : mtg.userId1} on {mtg.date}: {mtg.notes}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;