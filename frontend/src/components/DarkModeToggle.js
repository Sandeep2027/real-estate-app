import React from 'react';

const DarkModeToggle = () => {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <button onClick={toggleDarkMode} className="bg-gray-600 text-white p-2 rounded">Toggle Dark Mode</button>
  );
};

export default DarkModeToggle;