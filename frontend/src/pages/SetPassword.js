import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setPassword } from '../services/api';
import { toast } from 'react-toastify';

const SetPassword = () => {
  const { state } = useLocation();
  const { email } = state || {};
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    try {
      await setPassword(email, password);
      toast.success('Password Set');
      navigate('/login');
    } catch (err) {
      toast.error('Set Failed');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-96 mx-auto mt-8 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4">Set Password</h2>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPasswordValue(e.target.value)}
          className="block w-full p-2 mb-4 border rounded bg-gray-100 dark:bg-gray-900"
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="block w-full p-2 mb-4 border rounded bg-gray-100 dark:bg-gray-900"
          required
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">Set</button>
      </form>
    </div>
  );
};

export default SetPassword;