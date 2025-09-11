import React, { useState } from 'react';
import { toast } from 'react-toastify';

const OtpForm = ({ onVerify, onResend, email }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onVerify(email, otp);
      toast.success('OTP Verified');
    } catch (err) {
      toast.error('Invalid OTP');
    }
  };

  const handleResend = async () => {
    try {
      await onResend(email);
      toast.success('OTP Resent');
    } catch (err) {
      toast.error('Resend Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-96 mx-auto mt-8 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4">Enter OTP</h2>
      <input
        type="text"
        placeholder="OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="block w-full p-2 mb-4 border rounded bg-gray-100 dark:bg-gray-900"
        required
      />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full mb-2">Verify</button>
      <button type="button" onClick={handleResend} className="bg-gray-600 text-white p-2 rounded w-full">Resend OTP</button>
    </form>
  );
};

export default OtpForm;