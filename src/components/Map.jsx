import React from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapDisplay = ({ geojsonData }) => {
  return (
    <Map
      initialViewState={{ longitude: -79.39, latitude: 43.65, zoom: 13 }}
      mapStyle="https://api.maptiler.com/maps/darkmatter/style.json?key=duEjNzjCJQeKVVLF9cJC"
    >
      <Source type="geojson" data={geojsonData}>
        <Layer
          id="haze-layer"
          type="circle"
          paint={{
            'circle-radius': ['get', 'size'],
            'circle-color': '#90a4ae',
            'circle-opacity': ['get', 'opacity'],
            'circle-blur': 2.5
          }}
        />
      </Source>
    </Map>
  );
};

export default MapDisplay;