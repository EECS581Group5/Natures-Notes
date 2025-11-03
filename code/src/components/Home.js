import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Weather from '../Weather';
import { getRecentLocations } from '../services/locationService';
import logo from '../nature_logo.png';
import '../App.css';

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentLocations, setRecentLocations] = useState([]);
  useEffect(() => {
  const fetchRecent = async () => {
    if (!user) return;
    try {
      console.log('Fetching recent locations for user:', user);
      const locations = await getRecentLocations();
      console.log('Recent locations fetched:', locations);
      setRecentLocations(locations);
    } catch (err) {
      console.error(err);
    }
  };
  fetchRecent();
}, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="App">
      <div id="top-banner">
        <img src={logo} className="App-logo" alt="logo" />
      </div>
      
      <div className='guestLogOut'>
      {user && (
        <div>
          <p style={{ margin: '0 0 10px 0', color: '#333' }}>
            Welcome back, <strong>{user.username}</strong>!
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>)}
      </div>
      
            <header className="App-header">
        <Weather />
        <br />

        {user && recentLocations.length > 0 && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            background: '#e8f5e9',
            padding: '10px 20px',
            borderRadius: '10px'
          }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Recent Locations</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#555' }}>
              {recentLocations.map(loc => (
                <li key={loc.id}>
                  <strong>Lat:</strong> {Math.round(loc.latitude,3)}, <strong>Lon:</strong> {Math.round(loc.longitude,3)} <br />
                  <small>{new Date(loc.accessed_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

    </div>
  );
}

export default Home;
