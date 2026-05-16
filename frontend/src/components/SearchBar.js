// src/components/SearchBar.js
import React, { useRef, useEffect } from 'react';
import { Search, Mic, X, Loader } from 'lucide-react';
import '../Styling/components/SearchBarPremium.css';

const SearchBar = ({ 
  query, 
  setQuery, 
  isLoading, 
  onVoiceSearch, 
  placeholder = "Search medicines by name, brand, or company...",
  onKeyDown,
  onFocus,
  className = ""
}) => {
  const inputRef = useRef(null);

  // Focus on mount (for better UX)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`searchbar-premium-wrapper ${className}`}>
      <div className="searchbar-premium-container">
        {/* Search Icon */}
        <Search className="searchbar-premium-icon-left" />
        
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          placeholder={placeholder}
          className="searchbar-premium-input"
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* Right side icons */}
        <div className="searchbar-premium-icons-right">
          {/* Loading spinner */}
          {isLoading && (
            <Loader className="searchbar-premium-icon-loader" />
          )}
          
          {/* Clear button */}
          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="searchbar-premium-btn-clear"
              title="Clear search"
            >
              <X className="searchbar-premium-icon-clear" />
            </button>
          )}
          
          {/* Voice search button */}
          {onVoiceSearch && (
            <button
              onClick={onVoiceSearch}
              className="searchbar-premium-btn-voice"
              title="Voice search (Ctrl+Shift+V)"
            >
              <Mic className="searchbar-premium-icon-mic" />
            </button>
          )}
        </div>
      </div>
      
      {/* Search hints */}
      {query.length === 1 && (
        <div className="searchbar-premium-hint">
          <p>💡 Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;