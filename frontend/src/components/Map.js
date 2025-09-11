import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const Map = ({ lat, lng }) => {
  const mapStyles = { height: "200px", width: "100%" };
  const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={mapStyles} zoom={13} center={position}>
        <Marker position={position} />
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;