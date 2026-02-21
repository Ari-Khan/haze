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
              'circle-color': '#ff0000',
              'circle-opacity': 1,
              'circle-blur': 0,
              'circle-pitch-scale': 'viewport',
              'circle-pitch-alignment': 'viewport'
            }}
        />
      </Source>
    </Map>
  );
};

export default MapDisplay;