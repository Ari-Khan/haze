import React from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapDisplay = ({ geojsonData, view, onMapClick }) => {
  return (
    <Map
      initialViewState={{ longitude: -79.39, latitude: 43.65, zoom: 13 }}
      mapStyle="https://api.maptiler.com/maps/darkmatter/style.json?key=duEjNzjCJQeKVVLF9cJC"
      onClick={e => {
        if (view === 'Sim' && onMapClick) {
          onMapClick(e.lngLat, { x: e.point.x, y: e.point.y });
        }
      }}
    >
      <Source type="geojson" data={geojsonData}>
        <Layer
          id="haze-layer"
          type="circle"
          paint={{
            'circle-radius': ['get', 'size'],
            'circle-color': ['get', 'color'],
            'circle-opacity': ['get', 'opacity'],
            'circle-blur': 0.8
          }}
        />
      </Source>
    </Map>
  );
};

export default MapDisplay;