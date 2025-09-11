import React, { useState, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AddProperty = () => {
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    type: '',
    price: '',
    latitude: '',
    longitude: '',
  });
  const { user } = useContext(AuthContext);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        '/properties',
        {
          title: formData.title,
          city: formData.city,
          type: formData.type,
          price: parseFloat(formData.price),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Property added successfully');
      setFormData({
        title: '',
        city: '',
        type: '',
        price: '',
        latitude: '',
        longitude: '',
      });
    } catch (error) {
      toast.error('Failed to add property');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Add Property</h2>
      <form onSubmit={handleSubmit} className="max-w-md">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleInputChange}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="">Select Type</option>
          <option value="rent">Rent</option>
          <option value="sale">Sale</option>
        </select>
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleInputChange}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="number"
          name="latitude"
          placeholder="Latitude"
          value={formData.latitude}
          onChange={handleInputChange}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="number"
          name="longitude"
          placeholder="Longitude"
          value={formData.longitude}
          onChange={handleInputChange}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Property
        </button>
      </form>
    </div>
  );
};

export default AddProperty;