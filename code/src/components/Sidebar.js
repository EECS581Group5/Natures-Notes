import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ recentSearches = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const searchDate = new Date(dateString);
    const diffMs = now - searchDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatLocation = (lat, lon) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-title">
          <h1>Nature Notes</h1>
          <p>Weather & Ambience</p>
        </div>
      </div>

      <div
        className="user-profile"
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        ref={(el) => {
          if (el && showProfileMenu) {
            const rect = el.getBoundingClientRect();
            const menu = el.querySelector('.profile-menu');
            if (menu) {
              menu.style.bottom = `${window.innerHeight - rect.bottom}px`;
            }
          }
        }}
      >
        <div className="user-avatar">
          {user?.username?.substring(0, 2).toUpperCase() || 'AJ'}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.username || 'Alex Johnson'}</div>
          <div className="user-badge">Premium User</div>
        </div>

        {showProfileMenu && (
          <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="profile-menu-header">
              <div className="user-name">{user?.username || 'Alex Johnson'}</div>
              <div className="user-email">{user?.email || 'alex@example.com'}</div>
            </div>
            <div className="profile-menu-divider"></div>
            <button className="profile-menu-item" onClick={handleLogout}>
              <span className="logout-icon"></span>
              Logout
            </button>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className={`nav-icon icon-${item.icon}`}></span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="recent-searches">
        <h3>Recent Searches</h3>
        <div className="search-list">
          {recentSearches.length > 0 ? (
            recentSearches.map((search) => (
              <div key={search.id} className="search-item">
                <div className="search-location">
                  <span className="location-name">{formatLocation(search.latitude, search.longitude)}</span>
                </div>
                <div className="search-time">{formatTimeAgo(search.accessed_at)}</div>
              </div>
            ))
          ) : (
            <div className="no-searches">No recent searches</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
