import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Listings = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [search, setSearch] = useState({
    city: '',
    type: '',
    minPrice: '',
    maxPrice: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/properties');
        setProperties(response.data);
        setFilteredProperties(response.data);
        if (response.data.length === 0) {
          toast.info('No properties available. Try adding some via the dashboard.');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to fetch properties. Please check the backend server.');
        toast.error('Failed to fetch properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await api.get('/properties/search', {
        params: {
          city: search.city,
          type: search.type,
          minPrice: search.minPrice,
          maxPrice: search.maxPrice,
        },
      });
      setFilteredProperties(response.data);
      if (response.data.length === 0) {
        toast.info('No properties match your search criteria.');
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      setError('Error searching properties. Please try again.');
      toast.error('Error searching properties. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterest = async (propertyId) => {
    if (!user) {
      toast.error('Please log in to express interest');
      return;
    }
    try {
      await api.post(
        '/properties/interest',
        { propertyId },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Interest expressed successfully');
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast.error('Failed to express interest');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Property Listings</h2>
      <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          name="city"
          placeholder="City"
          value={search.city}
          onChange={handleInputChange}
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        <select
          name="type"
          value={search.type}
          onChange={handleInputChange}
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select Type</option>
          <option value="rent">Rent</option>
          <option value="sale">Sale</option>
        </select>
        <input
          type="number"
          name="minPrice"
          placeholder="Min Price"
          value={search.minPrice}
          onChange={handleInputChange}
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Max Price"
          value={search.maxPrice}
          onChange={handleInputChange}
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </form>
      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-400">Loading properties...</p>
      ) : error ? (
        <p className="text-center text-red-600 dark:text-red-400">{error}</p>
      ) : filteredProperties.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">
          No properties available. Try adding some via the dashboard.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="border rounded-lg p-4 dark:bg-gray-800 dark:text-white"
            >
              <h3 className="text-xl font-semibold">{property.title}</h3>
              <p>City: {property.city}</p>
              <p>Type: {property.type}</p>
              <p>Price: ${property.price.toLocaleString()}</p>
              <div className="h-64 my-4">
                <MapContainer
                  center={[property.latitude, property.longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[property.latitude, property.longitude]}>
                    <Popup>{property.title}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              {user && (
                <button
                  onClick={() => handleInterest(property.id)}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Express Interest
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Listings;