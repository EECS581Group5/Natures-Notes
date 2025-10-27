import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Weather from '../Weather';
import logo from '../nature_logo.png';
import '../App.css';

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="App">
      <div id="top-banner">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Nature Notes is coming soon!</p>
      </div>
      <div className="clear"></div>

      {user && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: '#f5f5f5',
          borderBottom: '1px solid #ddd'
        }}>
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
        </div>
      )}

      <header className="App-header">
        <Weather />
        <br />
      </header>
    </div>
  );
}

export default Home;
