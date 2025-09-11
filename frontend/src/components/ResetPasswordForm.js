import React, { useState } from 'react';
import { toast } from 'react-toastify';

const ResetPasswordForm = ({ onReset, email }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    try {
      await onReset(email, password);
      toast.success('Password Reset');
    } catch (err) {
      toast.error('Reset Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-96 mx-auto mt-8 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
      <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">Reset</button>
    </form>
  );
};

export default ResetPasswordForm;