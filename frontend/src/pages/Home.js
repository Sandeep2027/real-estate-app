import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
        Welcome to Real Estate Connect
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Discover your dream property or list your own with ease.
      </p>
      <Link
        to="/listings"
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Browse Listings
      </Link>
    </div>
  );
};

export default Home;