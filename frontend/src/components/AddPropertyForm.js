import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { addProperty } from '../services/api';

const AddPropertyForm = ({ token }) => {
  const [formData, setFormData] = useState({
    name: '', buildingNumber: '', city: '', country: '', latitude: '', longitude: '', price: '', type: '', image: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addProperty(formData, token);
      toast.success('Property Added');
    } catch (err) {
      toast.error('Add Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded shadow-md">
      <input name="name" placeholder="Name" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <input name="buildingNumber" placeholder="Building Number" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <input name="city" placeholder="City" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <input name="country" placeholder="Country" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <input name="latitude" type="number" placeholder="Latitude" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <input name="longitude" type="number" placeholder="Longitude" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <input name="price" type="number" placeholder="Price" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <select name="type" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required>
        <option value="">Type</option>
        <option value="sale">Sale</option>
        <option value="rent">Rent</option>
      </select>
      <input name="image" placeholder="Image URL" onChange={handleChange} className="block w-full p-2 mb-2 border rounded bg-gray-100 dark:bg-gray-900" required />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">Add Property</button>
    </form>
  );
};

export default AddPropertyForm;