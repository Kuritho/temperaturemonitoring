// src/App.js
import React, { useState, useEffect } from 'react';
import { database, ref, onValue, set } from './firebase';
import { FaFan, FaThermometerHalf, FaClock } from 'react-icons/fa';
import './App.css';

function App() {
  const [temperature, setTemperature] = useState(0);
  const [fanState, setFanState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [currentTime, setCurrentTime] = useState('');

  // Temperature thresholds for fan control
  const TEMP_ON_THRESHOLD = 36;  // Fan turns ON at 36°C
  const TEMP_OFF_THRESHOLD = 30; // Fan turns OFF at or below 30°C

  // Reference to Firebase paths
  const fanControllerRef = ref(database, '/fan_controller');

  // Function to get Philippines time
  const getPhilippinesTime = () => {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return now.toLocaleString('en-PH', options);
  };

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getPhilippinesTime());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Load initial data and setup real-time listeners
  useEffect(() => {
    setConnectionStatus('Connected');
    
    // Listen for all fan controller data
    const unsubscribe = onValue(fanControllerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTemperature(data.temperature || 0);
        setFanState(data.fan_state || false);
        setLastUpdate(data.last_update || '');
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase error:', error);
      setConnectionStatus('Connection error');
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [fanControllerRef]);

  // Get temperature color based on value
  const getTempColor = () => {
    if (temperature >= TEMP_ON_THRESHOLD) return '#ff4444';
    if (temperature >= 33) return '#ff8800';
    if (temperature >= TEMP_OFF_THRESHOLD) return '#ffbb33';
    if (temperature >= 25) return '#ffeb3b';
    if (temperature >= 20) return '#00C851';
    return '#00aaff';
  };

  // Get temperature status message
  const getTempStatus = () => {
    if (temperature >= TEMP_ON_THRESHOLD) return '🚨 Critical Temperature! Fan ON';
    if (temperature >= 33) return '⚠️ Very High Temperature';
    if (temperature >= TEMP_OFF_THRESHOLD + 1) return '🔥 High Temperature';
    if (temperature >= 25) return '🌡️ Warm';
    if (temperature >= 20) return '😊 Normal';
    return '❄️ Cool';
  };

  // Get fan status message based on temperature
  const getFanStatusMessage = () => {
    if (temperature >= TEMP_ON_THRESHOLD) {
      return `Fan ON (Auto - ${TEMP_ON_THRESHOLD}°C Threshold Reached)`;
    } else if (temperature <= TEMP_OFF_THRESHOLD) {
      return `Fan OFF (Auto - Below ${TEMP_OFF_THRESHOLD}°C)`;
    } else {
      return `Fan Holding Previous State (Between ${TEMP_OFF_THRESHOLD}°C and ${TEMP_ON_THRESHOLD}°C)`;
    }
  };

  // Calculate temperature percentage for threshold bar (max 50°C)
  const getTemperaturePercentage = () => {
    return Math.min(100, (temperature / 50) * 100);
  };

  // Determine if fan should be on based on temperature logic
  const shouldFanBeOn = () => {
    if (temperature >= TEMP_ON_THRESHOLD) return true;
    if (temperature <= TEMP_OFF_THRESHOLD) return false;
    return fanState; // Maintain current state in the hysteresis zone
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🌡️ Temperature Monitoring System</h1>
        <div className="connection-status">
          Status: {connectionStatus}
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">Loading sensor data...</div>
        ) : (
          <>
            {/* Philippines Time Display */}
            <div className="time-card">
              <FaClock className="time-icon" />
              <div className="time-info">
                <h3>Philippines Time</h3>
                <div className="time-value">
                  {currentTime}
                </div>
              </div>
            </div>

            {/* Sensor Cards */}
            <div className="sensor-grid">
              <div className="sensor-card temperature">
                <FaThermometerHalf className="sensor-icon" />
                <div className="sensor-info">
                  <h3>Temperature</h3>
                  <div className="sensor-value" style={{ color: getTempColor() }}>
                    {temperature.toFixed(1)}°C
                  </div>
                  <div className="temp-status">{getTempStatus()}</div>
                </div>
              </div>
            </div>

            {/* Temperature Threshold Indicator */}
            <div className="threshold-section">
              <div className="threshold-label">
                <span>Temperature Thresholds</span>
                <div className="threshold-rules">
                  <span className="rule-off">OFF at ≤{TEMP_OFF_THRESHOLD}°C</span>
                  <span className="rule-on">ON at ≥{TEMP_ON_THRESHOLD}°C</span>
                </div>
              </div>
              
              {/* Hysteresis Zone Display */}
              <div className="hysteresis-zone">
                <div className="zone-labels">
                  <span>Fan OFF Zone</span>
                  <span>Hysteresis Zone (Hold State)</span>
                  <span>Fan ON Zone</span>
                </div>
                <div className="hysteresis-bar">
                  <div className="zone-off" style={{ width: `${(TEMP_OFF_THRESHOLD / 50) * 100}%` }}>
                    ≤{TEMP_OFF_THRESHOLD}°C
                  </div>
                  <div className="zone-hysteresis" style={{ width: `${((TEMP_ON_THRESHOLD - TEMP_OFF_THRESHOLD) / 50) * 100}%` }}>
                    {TEMP_OFF_THRESHOLD}°C-{TEMP_ON_THRESHOLD}°C
                  </div>
                  <div className="zone-on" style={{ width: `${((50 - TEMP_ON_THRESHOLD) / 50) * 100}%` }}>
                    ≥{TEMP_ON_THRESHOLD}°C
                  </div>
                </div>
              </div>

              <div className="threshold-bar-container">
                <div className="threshold-bar">
                  <div 
                    className="threshold-fill" 
                    style={{ 
                      width: `${getTemperaturePercentage()}%`,
                      background: temperature >= TEMP_ON_THRESHOLD 
                        ? 'linear-gradient(90deg, #ff4444, #ff0000)' 
                        : temperature <= TEMP_OFF_THRESHOLD
                        ? 'linear-gradient(90deg, #00C851, #00aaff)'
                        : 'linear-gradient(90deg, #ffbb33, #ff8800)'
                    }}
                  />
                  <div className="threshold-marker off-marker" style={{ left: `${(TEMP_OFF_THRESHOLD / 50) * 100}%` }}>
                    <div className="marker-label off">OFF: {TEMP_OFF_THRESHOLD}°C</div>
                  </div>
                  <div className="threshold-marker on-marker" style={{ left: `${(TEMP_ON_THRESHOLD / 50) * 100}%` }}>
                    <div className="marker-label on">ON: {TEMP_ON_THRESHOLD}°C</div>
                  </div>
                </div>
              </div>
              <div className="threshold-values">
                <span>0°C</span>
                <span>20°C</span>
                <span>30°C (OFF)</span>
                <span>36°C (ON)</span>
                <span>50°C+</span>
              </div>
            </div>

            {/* Fan Control Section */}
            <div className="fan-control-section">
              <h2>Fan Control System (With Hysteresis)</h2>
              
              <div className="control-panel">
                {/* Fan Status Display */}
                <div className={`fan-status ${fanState ? 'on' : 'off'}`}>
                  <FaFan className={`fan-icon ${fanState ? 'spinning' : ''}`} />
                  <div className="fan-status-text">
                    {getFanStatusMessage()}
                  </div>
                </div>

                {/* Current Temperature Alert */}
                {temperature >= TEMP_ON_THRESHOLD && (
                  <div className="alert-message-critical">
                    🚨 Critical temperature detected ({temperature.toFixed(1)}°C)! Fan is ON - Cooling in progress
                  </div>
                )}

                {temperature <= TEMP_OFF_THRESHOLD && fanState && (
                  <div className="alert-message-cooling">
                    ❄️ Temperature dropped to {temperature.toFixed(1)}°C (≤{TEMP_OFF_THRESHOLD}°C). Fan will turn OFF.
                  </div>
                )}

                {temperature > TEMP_OFF_THRESHOLD && temperature < TEMP_ON_THRESHOLD && (
                  <div className="warning-message">
                    ⚠️ Temperature is in hysteresis zone ({temperature.toFixed(1)}°C). Fan is {fanState ? 'ON' : 'OFF'} (holding previous state)
                  </div>
                )}

                <div className="info-panel">
                  <div className="info-item">
                    <strong>⚙️ Auto Mode with Hysteresis</strong>
                    <p>Fan turns ON at ≥{TEMP_ON_THRESHOLD}°C and turns OFF at ≤{TEMP_OFF_THRESHOLD}°C</p>
                  </div>
                  <div className="info-item">
                    <strong>📊 Current Status</strong>
                    <p>{temperature >= TEMP_ON_THRESHOLD 
                      ? `Fan is ON - Temperature is ${(temperature - TEMP_ON_THRESHOLD).toFixed(1)}°C above ON threshold` 
                      : temperature <= TEMP_OFF_THRESHOLD
                      ? `Fan is OFF - Temperature is ${(TEMP_OFF_THRESHOLD - temperature).toFixed(1)}°C below OFF threshold`
                      : `Fan is ${fanState ? 'ON' : 'OFF'} - Temperature in hysteresis zone (${TEMP_OFF_THRESHOLD}°C - ${TEMP_ON_THRESHOLD}°C)`}</p>
                  </div>
                  <div className="info-item">
                    <strong>🎯 Hysteresis Logic</strong>
                    <p>Prevents rapid fan toggling by maintaining state between {TEMP_OFF_THRESHOLD}°C and {TEMP_ON_THRESHOLD}°C</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Update from Firebase */}
            <div className="last-update">
              © Phi Lip
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;