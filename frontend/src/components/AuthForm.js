import React, { useState } from 'react';

const AuthForm = ({ title, onSubmit, buttonText, children }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-96 mx-auto mt-8 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block w-full p-2 mb-4 border rounded bg-gray-100 dark:bg-gray-900"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block w-full p-2 mb-4 border rounded bg-gray-100 dark:bg-gray-900"
        required
      />
      {children}
      <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">{buttonText}</button>
    </form>
  );
};

export default AuthForm;