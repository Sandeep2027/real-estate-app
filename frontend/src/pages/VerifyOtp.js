import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OtpForm from '../components/OtpForm';
import { verifyOtp, sendSignupOtp, forgotPassword } from '../services/api';

const VerifyOtp = () => {
  const { state } = useLocation();
  const { email, type } = state || {};
  const navigate = useNavigate();

  const handleVerify = async (email, otp) => {
    await verifyOtp(email, otp);
    if (type === 'signup') navigate('/set-password', { state: { email } });
    else if (type === 'forgot') navigate('/reset-password', { state: { email } });
  };

  const handleResend = async (email) => {
    if (type === 'signup') await sendSignupOtp(email);
    else if (type === 'forgot') await forgotPassword(email);
  };

  return (
    <div>
      <OtpForm onVerify={handleVerify} onResend={handleResend} email={email} />
    </div>
  );
};

export default VerifyOtp;