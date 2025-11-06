import React, { useState, useEffect } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import spotifyService from '../services/spotifyService';
import './PlaylistMapper.css';

const WEATHER_CONDITIONS = [
  { value: 'Clear', label: 'Clear/Sunny', icon: '☀️' },
  { value: 'Clouds', label: 'Cloudy', icon: '☁️' },
  { value: 'Rain', label: 'Rainy', icon: '🌧️' },
  { value: 'Drizzle', label: 'Drizzle', icon: '🌦️' },
  { value: 'Thunderstorm', label: 'Thunderstorm', icon: '⛈️' },
  { value: 'Snow', label: 'Snowy', icon: '❄️' },
  { value: 'Mist', label: 'Misty', icon: '🌫️' },
  { value: 'Smoke', label: 'Smoky', icon: '💨' },
  { value: 'Haze', label: 'Hazy', icon: '🌁' },
  { value: 'Dust', label: 'Dusty', icon: '🏜️' },
  { value: 'Fog', label: 'Foggy', icon: '🌫️' },
  { value: 'Sand', label: 'Sandy', icon: '🏖️' },
  { value: 'Ash', label: 'Ash', icon: '🌋' },
  { value: 'Squall', label: 'Squall', icon: '💨' },
  { value: 'Tornado', label: 'Tornado', icon: '🌪️' }
];

function PlaylistMapper({ onClose }) {
  const { isConnected, accessToken } = useSpotify();
  const [mappings, setMappings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load existing mappings
  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const data = await spotifyService.getWeatherPlaylistMappings();
      const mappingsObj = {};
      data.forEach(mapping => {
        mappingsObj[mapping.weather_condition] = {
          id: mapping.spotify_playlist_id,
          name: mapping.playlist_name,
          image: mapping.playlist_image
        };
      });
      setMappings(mappingsObj);
    } catch (error) {
      console.error('Error loading mappings:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isConnected) return;

    try {
      setLoading(true);
      const results = await spotifyService.searchPlaylists(searchQuery);
      setSearchResults(results.playlists.items);
    } catch (error) {
      console.error('Error searching playlists:', error);
      setMessage({ type: 'error', text: 'Failed to search playlists' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlaylist = (playlist) => {
    if (!selectedCondition) {
      setMessage({ type: 'error', text: 'Please select a weather condition first' });
      return;
    }

    setMappings({
      ...mappings,
      [selectedCondition]: {
        id: playlist.id,
        name: playlist.name,
        image: playlist.images && playlist.images.length > 0 ? playlist.images[0].url : null
      }
    });

    setMessage({ type: 'success', text: `Playlist assigned to ${selectedCondition}` });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save all mappings
      const promises = Object.entries(mappings).map(([condition, playlist]) => {
        if (playlist.id) {
          return spotifyService.setWeatherPlaylistMapping(
            condition,
            playlist.id,
            playlist.name,
            playlist.image
          );
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setMessage({ type: 'success', text: 'Playlist mappings saved successfully!' });

      // Close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving mappings:', error);
      setMessage({ type: 'error', text: 'Failed to save mappings' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMapping = (condition) => {
    const newMappings = { ...mappings };
    delete newMappings[condition];
    setMappings(newMappings);
  };

  if (!isConnected) {
    return (
      <div className="playlist-mapper">
        <div className="mapper-header">
          <h2>Weather Playlist Mapper</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="not-connected">
          <p>Please connect your Spotify account first to map playlists to weather conditions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-mapper">
      <div className="mapper-header">
        <h2>Weather Playlist Mapper</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="mapper-content">
        {/* Weather Conditions Grid */}
        <div className="conditions-section">
          <h3>Weather Conditions</h3>
          <div className="conditions-grid">
            {WEATHER_CONDITIONS.map(condition => (
              <div
                key={condition.value}
                className={`condition-card ${selectedCondition === condition.value ? 'selected' : ''} ${mappings[condition.value]?.id ? 'mapped' : ''}`}
                onClick={() => setSelectedCondition(condition.value)}
              >
                <div className="condition-icon">{condition.icon}</div>
                <div className="condition-label">{condition.label}</div>
                {mappings[condition.value]?.id && (
                  <div className="condition-mapped">
                    <span>✓ Mapped</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Mappings */}
        {Object.keys(mappings).length > 0 && (
          <div className="mappings-section">
            <h3>Current Mappings</h3>
            <div className="mappings-list">
              {Object.entries(mappings).map(([condition, playlist]) => {
                if (!playlist.id) return null;
                const conditionInfo = WEATHER_CONDITIONS.find(c => c.value === condition);
                return (
                  <div key={condition} className="mapping-item">
                    <div className="mapping-info">
                      <span className="mapping-icon">{conditionInfo?.icon}</span>
                      <div className="mapping-details">
                        <div className="mapping-condition">{conditionInfo?.label}</div>
                        <div className="mapping-playlist">{playlist.name}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMapping(condition)}
                      className="remove-btn"
                      title="Remove mapping"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="search-section">
          <h3>
            Search Playlists
            {selectedCondition && (
              <span className="selected-indicator">
                {' '}for {WEATHER_CONDITIONS.find(c => c.value === selectedCondition)?.label}
              </span>
            )}
          </h3>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search for playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={!selectedCondition}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim() || !selectedCondition}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {!selectedCondition && (
            <p className="hint">Select a weather condition above to start searching for playlists</p>
          )}

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(playlist => (
                <div key={playlist.id} className="playlist-result">
                  {playlist.images && playlist.images.length > 0 && (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="playlist-image"
                    />
                  )}
                  <div className="playlist-info">
                    <div className="playlist-name">{playlist.name}</div>
                    <div className="playlist-owner">by {playlist.owner.display_name}</div>
                    <div className="playlist-tracks">{playlist.tracks.total} tracks</div>
                  </div>
                  <button
                    onClick={() => handleSelectPlaylist(playlist)}
                    className="select-btn"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mapper-footer">
        <button onClick={onClose} className="cancel-btn">Cancel</button>
        <button
          onClick={handleSave}
          className="save-btn"
          disabled={saving || Object.keys(mappings).length === 0}
        >
          {saving ? 'Saving...' : 'Save Mappings'}
        </button>
      </div>
    </div>
  );
}

export default PlaylistMapper;
