import React from 'react';

const SubscriptionForm = () => {
  return (
    <div className="bg-gray-200 dark:bg-gray-700 p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Subscribe to Newsletter</h2>
      <form className="flex justify-center space-x-2">
        <input type="email" placeholder="Your email" className="p-2 rounded bg-white dark:bg-gray-800" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Subscribe</button>
      </form>
    </div>
  );
};

export default SubscriptionForm;