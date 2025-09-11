import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    interest: '',
    meetingDate: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Decode token to get email if user.email is invalid
  const getEmail = () => {
    if (user?.email && !user.email.startsWith('eyJ')) {
      return user.email;
    }
    if (user?.token) {
      try {
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        return payload.email || 'Not logged in';
      } catch (error) {
        console.error('Error decoding token:', error);
        return 'Not logged in';
      }
    }
    return 'Not logged in';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.interest || !formData.meetingDate) {
      toast.error('Please fill in both interest and meeting date');
      return;
    }
    if (!user?.token) {
      toast.error('Please log in to send details');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      await api.post(
        '/profile/send-details',
        {
          interest: formData.interest,
          meetingDate: formData.meetingDate,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Details sent to your email successfully');
      setFormData({ interest: '', meetingDate: '' });
    } catch (error) {
      console.error('Error sending details:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.msg || 'Failed to send details');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Profile</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Email</h3>
        <p className="text-gray-600 dark:text-gray-400">{getEmail()}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-200">Interest</label>
          <input
            type="text"
            name="interest"
            value={formData.interest}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Property ID or description"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200">Meeting Date</label>
          <input
            type="date"
            name="meetingDate"
            value={formData.meetingDate}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Details to Email'}
        </button>
      </form>
    </div>
  );
};

export default Profile;