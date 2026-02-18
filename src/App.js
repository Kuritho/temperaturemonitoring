// src/App.js
import React, { useState, useEffect } from 'react';
import { database, ref, onValue, set, get } from './firebase';
import { FaFan, FaThermometerHalf, FaTint, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import './App.css';

function App() {
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [fanState, setFanState] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Reference to Firebase paths
  const fanControllerRef = ref(database, '/fan_controller');

  // Load initial data and setup real-time listeners
  useEffect(() => {
    setConnectionStatus('Connected');
    
    // Listen for all fan controller data
    const unsubscribe = onValue(fanControllerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTemperature(data.temperature || 0);
        setHumidity(data.humidity || 0);
        setFanState(data.fan_state || false);
        setManualOverride(data.manual_override || false);
        setLastUpdate(data.last_update || '');
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase error:', error);
      setConnectionStatus('Connection error');
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Toggle manual override mode
  const toggleManualOverride = async () => {
    try {
      const newOverride = !manualOverride;
      await set(ref(database, '/fan_controller/manual_override'), newOverride);
      
      // When disabling manual override, reset manual fan command
      if (!newOverride) {
        await set(ref(database, '/fan_controller/manual_fan_command'), false);
      }
      
      setManualOverride(newOverride);
    } catch (error) {
      console.error('Error toggling manual override:', error);
      alert('Failed to toggle manual mode. Check your connection.');
    }
  };

  // Toggle fan manually (only works in manual mode)
  const toggleFan = async () => {
    if (!manualOverride) {
      alert('Please enable Manual Mode first to control the fan manually.');
      return;
    }
    
    try {
      const newFanState = !fanState;
      await set(ref(database, '/fan_controller/manual_fan_command'), newFanState);
      setFanState(newFanState);
    } catch (error) {
      console.error('Error toggling fan:', error);
      alert('Failed to control fan. Check your connection.');
    }
  };

  // Get temperature color based on value
  const getTempColor = () => {
    if (temperature >= 33) return '#ff4444';
    if (temperature >= 28) return '#ff8800';
    if (temperature >= 23) return '#ffbb33';
    return '#00C851';
  };

  // Get status message
  const getFanStatusMessage = () => {
    if (manualOverride) {
      return fanState ? 'Fan ON (Manual)' : 'Fan OFF (Manual)';
    } else {
      return temperature >= 33 
        ? 'Fan ON (Auto - High Temperature)' 
        : 'Fan OFF (Auto - Normal Temperature)';
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Temperature Monitoring System</h1>
        <div className="connection-status">
          Status: {connectionStatus}
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">Loading sensor data...</div>
        ) : (
          <>
            {/* Sensor Cards */}
            <div className="sensor-grid">
              <div className="sensor-card temperature">
                <FaThermometerHalf className="sensor-icon" />
                <div className="sensor-info">
                  <h3>Temperature</h3>
                  <div className="sensor-value" style={{ color: getTempColor() }}>
                    {temperature.toFixed(1)}°C
                  </div>
                </div>
              </div>

              <div className="sensor-card humidity">
                <FaTint className="sensor-icon" />
                <div className="sensor-info">
                  <h3>Humidity</h3>
                  <div className="sensor-value">
                    {humidity.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Fan Control Section */}
            <div className="fan-control-section">
              <h2>Fan Control</h2>
              
              <div className="control-panel">
                {/* Manual Override Toggle */}
                <button 
                  className={`mode-toggle ${manualOverride ? 'manual' : 'auto'}`}
                  onClick={toggleManualOverride}
                >
                  {manualOverride ? (
                    <>
                      <FaToggleOn /> Manual Mode
                    </>
                  ) : (
                    <>
                      <FaToggleOff /> Auto Mode
                    </>
                  )}
                </button>

                {/* Fan Status Display */}
                <div className={`fan-status ${fanState ? 'on' : 'off'}`}>
                  <FaFan className={`fan-icon ${fanState ? 'spinning' : ''}`} />
                  <div className="fan-status-text">
                    {getFanStatusMessage()}
                  </div>
                </div>

                {/* Manual Fan Control Button */}
                <button 
                  className={`fan-toggle ${fanState ? 'on' : 'off'}`}
                  onClick={toggleFan}
                  disabled={!manualOverride}
                >
                  {fanState ? 'Turn Fan OFF' : 'Turn Fan ON'}
                </button>

                {!manualOverride && (
                  <p className="hint">
                    ℹ️ Fan automatically controls at 33°C. Enable Manual Mode for manual control.
                  </p>
                )}
              </div>
            </div>

            {/* Last Update */}
            <div className="last-update">
              Last Update: {lastUpdate || 'Just now'}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;