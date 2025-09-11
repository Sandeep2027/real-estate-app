import React from 'react';
import Map from './Map';

const PropertyCard = ({ property, onInterest }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-md animate-fadeIn">
      <img src={property.image} alt={property.name} className="w-full h-48 object-cover rounded" />
      <h3 className="text-xl font-bold mt-2">{property.name}</h3>
      <p>{property.city}, {property.country}</p>
      <p>Price: ${property.price}</p>
      <p>Type: {property.type}</p>
      <Map lat={property.latitude} lng={property.longitude} />
      {onInterest && <button onClick={onInterest} className="bg-blue-600 text-white p-2 rounded mt-2">Show Interest</button>}
    </div>
  );
};

export default PropertyCard;