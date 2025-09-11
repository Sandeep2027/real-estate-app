import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Real Estate Connect</h3>
            <p className="text-sm opacity-80">Empowering Your Property Journey © 2025</p>
          </div>
          <div className="flex space-x-6">
            <a
              href="/about"
              className="text-sm hover:text-yellow-300 transition-colors duration-300"
            >
              About
            </a>
            <a
              href="/contact"
              className="text-sm hover:text-yellow-300 transition-colors duration-300"
            >
              Contact
            </a>
            <a
              href="/privacy"
              className="text-sm hover:text-yellow-300 transition-colors duration-300"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;