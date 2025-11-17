import React, { useRef, useEffect, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import '../styles/Globe.css';

const GlobeComponent = ({ onLocationSelect, recentLocations = [] }) => {
  const globeEl = useRef();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState([]);

  // Convert recent locations to globe markers
  useEffect(() => {
    const newMarkers = recentLocations.map((loc, index) => ({
      id: `marker-${index}`,
      lat: loc.latitude,
      lng: loc.longitude,
      label: loc.city_name || `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`,
      color: '#43B548',
      size: 0.5,
      altitude: 0.01
    }));
    setMarkers(newMarkers);
  }, [recentLocations]);

  // Handle globe click
  const handleGlobeClick = useCallback((lat, lng) => {
    if (!lat || !lng) return;

    // Visual feedback
    setSelectedLocation({ lat, lng });

    // Animate camera to location
    if (globeEl.current) {
      globeEl.current.pointOfView({
        lat,
        lng,
        altitude: 0.5
      }, 1000);
    }

    // Trigger parent handler
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  // Initialize globe settings
  useEffect(() => {
    if (globeEl.current) {
      // Set initial view
      globeEl.current.pointOfView({
        lat: 39.8283,
        lng: -98.5795, // Center of USA
        altitude: 2.5
      });

      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;

      // Enable zoom and rotation
      globeEl.current.controls().enableZoom = true;
      globeEl.current.controls().zoomSpeed = 0.8;

      setIsLoading(false);
    }
  }, []);

  // Custom marker layer
  const markerSvg = useCallback((marker) => {
    const size = marker.size || 1;
    return `
      <svg viewBox="0 0 24 24" width="${size * 20}" height="${size * 20}">
        <circle cx="12" cy="12" r="10" fill="${marker.color}" opacity="0.7"/>
        <circle cx="12" cy="12" r="6" fill="${marker.color}"/>
      </svg>
    `;
  }, []);

  // Pulse animation for selected location
  const pulseMarkers = selectedLocation ? [{
    lat: selectedLocation.lat,
    lng: selectedLocation.lng,
    color: '#FF5722',
    size: 0.8,
    altitude: 0.02
  }] : [];

  return (
    <div className="globe-container">
      {isLoading && (
        <div className="globe-loading">
          <div className="loading-spinner"></div>
          <p>Loading globe...</p>
        </div>
      )}

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        showAtmosphere={true}
        atmosphereColor="lightblue"
        atmosphereAltitude={0.15}
        onGlobeClick={(coords) => {
          const { lat, lng } = coords;
          handleGlobeClick(lat, lng);
        }}

        // Recent locations markers
        htmlElementsData={[...markers, ...pulseMarkers]}
        htmlElement={(marker) => {
          const el = document.createElement('div');
          el.innerHTML = markerSvg(marker);
          el.style.color = marker.color;
          el.style.width = `${(marker.size || 1) * 20}px`;
          el.style.pointerEvents = 'none';

          // Add pulse animation for selected location
          if (marker === pulseMarkers[0]) {
            el.classList.add('pulse-marker');
          }

          // Tooltip
          if (marker.label) {
            el.title = marker.label;
          }

          return el;
        }}

        // Clouds layer (optional)
        cloudsImageUrl="//unpkg.com/three-globe/example/img/fair-clouds.png"
        cloudsAltitude={0.004}
        cloudsRotationSpeed={-0.006}

        // Performance settings
        enablePointerInteraction={true}
        width={window.innerWidth * 0.5}
        height={window.innerHeight * 0.7}
      />

      {selectedLocation && (
        <div className="selected-coords">
          <span>Selected: </span>
          <strong>{selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°</strong>
        </div>
      )}

      <div className="globe-controls">
        <div className="control-hint">
          <span className="hint-icon">🖱️</span>
          <span>Click anywhere on the globe to select location</span>
        </div>
        <div className="control-hint">
          <span className="hint-icon">🔄</span>
          <span>Drag to rotate • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};

export default GlobeComponent;