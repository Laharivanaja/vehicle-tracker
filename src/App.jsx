import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ==================== UTILITY FUNCTIONS ====================

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculates speed between current and previous point
 * @returns Speed in km/h as a formatted string
 */
function calculateSpeedKmH(currentIndex, routeData) {
  if (currentIndex === 0 || routeData.length <= 1) return '0.00';

  const currPoint = routeData[currentIndex];
  const prevPoint = routeData[currentIndex - 1];

  if (!prevPoint || !currPoint) return '0.00';

  const distanceKm = calculateDistanceKm(
    prevPoint.lat, prevPoint.lng,
    currPoint.lat, currPoint.lng
  );

  const timeDeltaMs = new Date(currPoint.timestamp).getTime() - new Date(prevPoint.timestamp).getTime();
  const timeDeltaHours = timeDeltaMs / (1000 * 60 * 60);

  if (timeDeltaHours <= 0) return 'N/A';

  const speed = distanceKm / timeDeltaHours;
  return speed.toFixed(2);
}

/**
 * Formats elapsed time from start
 */
function formatElapsedTime(startTime, currentTime) {
  if (!startTime || !currentTime) return '00:00';
  
  const deltaMs = new Date(currentTime).getTime() - new Date(startTime).getTime();
  const seconds = Math.floor(deltaMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}



/**
 * Custom marker component between positions
 */
function AnimatedMarker({ position, icon, duration = 2000 }) {
  const markerRef = useRef(null);
  const map = useMap();
  const prevPositionRef = useRef(position);

  useEffect(() => {
    if (markerRef.current && position) {
      const marker = markerRef.current;
      const startLatLng = prevPositionRef.current;
      const endLatLng = position;

     
      if (!startLatLng || (startLatLng[0] === endLatLng[0] && startLatLng[1] === endLatLng[1])) {
        prevPositionRef.current = position;
        return;
      }

      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(1, elapsedTime / duration);

        // Linear interpolation
        const lat = startLatLng[0] + (endLatLng[0] - startLatLng[0]) * progress;
        const lng = startLatLng[1] + (endLatLng[1] - startLatLng[1]) * progress;

        marker.setLatLng([lat, lng]);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          marker.setLatLng(endLatLng);
          prevPositionRef.current = endLatLng;
        }
      };

      requestAnimationFrame(animate);
      
      // Pan map to follow vehicle
      map.panTo(endLatLng, { animate: true, duration: 1 });
    }
  }, [position, duration, map]);

  return <Marker ref={markerRef} position={position} icon={icon} />;
}

//MAIN COMPONENT 

export default function App() {
  const [routeData, setRouteData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef(null);

  // Initial map center (Hyderabad)
  const INITIAL_CENTER = [17.385044, 78.486671];

  //CURRENT TIME UPDATER
  
  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  //DATA LOADING
  
  useEffect(() => {
    // Fetch route data from public folder
    const loadRouteData = async () => {
      try {
        const response = await fetch('/dummy-route.json');
        const data = await response.json();
        
        const loadedData = data.map(point => ({
          lat: point.latitude,
          lng: point.longitude,
          timestamp: point.timestamp
        }));
        
        setRouteData(loadedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading route data:', error);
        setIsLoading(false);
      }
    };

    loadRouteData();
  }, []);

  //SIMULATION LOGIC
  
  useEffect(() => {
    if (isPlaying && routeData.length > 0 && currentIndex < routeData.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          // Stop at the end of route
          if (prevIndex >= routeData.length - 1) {
            setIsPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 2000); // Update every 2 seconds
    }

    // Cleanup interval on unmount or state change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, routeData]);

  //CONTROL HANDLERS
  
  const togglePlay = () => {
    if (currentIndex >= routeData.length - 1) {
      // If at end, restart from beginning
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  //RENDER DATA PREPARATION
  
  const currentPosition = routeData[currentIndex] || routeData[0] || { 
    lat: INITIAL_CENTER[0], 
    lng: INITIAL_CENTER[1], 
    timestamp: null 
  };
  
  const fullRouteCoords = routeData.map(p => [p.lat, p.lng]);
  const traveledRouteCoords = routeData.slice(0, currentIndex + 1).map(p => [p.lat, p.lng]);
  
  // Calculate progress percentage
  const progressPercentage = routeData.length > 0 
    ? ((currentIndex + 1) / routeData.length) * 100 
    : 0;

  // Create custom vehicle icon
  const vehicleIcon = L.divIcon({
    className: 'custom-vehicle-icon',
    html: '<div style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚗</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  //LOADING STATE
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-5xl mb-4">🚗</div>
          <div className="text-xl text-gray-700 font-medium">Loading route data...</div>
        </div>
      </div>
    );
  }

  //MAIN RENDER
  
  return (
    <div className="h-screen w-full relative bg-gray-100">
      {/* Map Container */}
      <MapContainer
        center={INITIAL_CENTER}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Full planned route (gray) */}
        {fullRouteCoords.length > 0 && (
          <Polyline
            pathOptions={{ 
              color: '#9ca3af', 
              weight: 5, 
              opacity: 0.4,
              dashArray: '10, 10'
            }}
            positions={fullRouteCoords}
          />
        )}
        
        {/* Traveled route (red) */}
        {traveledRouteCoords.length > 0 && (
          <Polyline
            pathOptions={{ 
              color: '#ef4444', 
              weight: 6, 
              opacity: 0.9 
            }}
            positions={traveledRouteCoords}
          />
        )}
        
        
        <AnimatedMarker
          position={[currentPosition.lat, currentPosition.lng]}
          icon={vehicleIcon}
        />
      </MapContainer>

      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-[1000] p-6 bg-white shadow-2xl rounded-2xl w-full max-w-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">🚗 Vehicle Tracker</h2>
          <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        </div>
        
        {/* Metadata Cards */}
        <div className="space-y-3 mb-5">
          {/* Coordinates */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
            <p className="text-xs text-blue-600 font-semibold mb-1">📍 CURRENT LOCATION</p>
            <p className="font-mono text-sm text-blue-900 font-bold">
              {currentPosition.lat?.toFixed(6)}°N, {currentPosition.lng?.toFixed(6)}°E
            </p>
          </div>
          
          {/* Current Time */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
            <p className="text-xs text-purple-600 font-semibold mb-1">⏰ CURRENT TIME</p>
            <p className="font-medium text-sm text-purple-900">
              {currentTime.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </p>
          </div>
          
          {/* Speed */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
            <p className="text-xs text-green-600 font-semibold mb-1">🏎️ SPEED</p>
            <p className="font-bold text-2xl text-green-900">
              {calculateSpeedKmH(currentIndex, routeData)} <span className="text-sm">km/h</span>
            </p>
          </div>
          
          {/* Elapsed Time */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
            <p className="text-xs text-orange-600 font-semibold mb-1">⏱️ ELAPSED TIME</p>
            <p className="font-bold text-xl text-orange-900">
              {routeData.length > 0 && formatElapsedTime(routeData[0].timestamp, currentPosition.timestamp)}
            </p>
          </div>
          
          {/* Progress */}
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-indigo-600 font-semibold">📊 PROGRESS</p>
              <p className="font-bold text-sm text-indigo-900">
                {currentIndex + 1} / {routeData.length}
              </p>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-1"
                style={{ width: `${progressPercentage}%` }}
              >
                {progressPercentage > 10 && (
                  <span className="text-xs text-white font-bold">{Math.round(progressPercentage)}%</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          <button
            onClick={togglePlay}
            disabled={routeData.length === 0}
            className="flex-1 px-5 py-3 text-white font-bold rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ 
              backgroundColor: isPlaying ? '#ef4444' : '#22c55e',
              boxShadow: isPlaying ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(34, 197, 94, 0.4)'
            }}
          >
            {isPlaying ? '⏸️ Pause' : currentIndex >= routeData.length - 1 ? '🔄 Replay' : '▶️ Play'}
          </button>
          <button
            onClick={resetSimulation}
            disabled={routeData.length === 0}
            className="px-5 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 font-bold rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            ↻ Reset
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">
        <p className="text-xs text-gray-600">
          Vehicle Movement Simulation | Frontend Developer Assignment
        </p>
      </div>
    </div>
  );
}