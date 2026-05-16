// src/hooks/useSearch.js - FIXED TO PREVENT RESULTS DISAPPEARING
import { useState, useEffect, useRef, useCallback } from 'react';
import searchService from '../services/searchService';

// Fuse.js-like implementation for frontend fuzzy search
class FuzzySearch {
  constructor(options = {}) {
    this.options = {
      threshold: 0.4,
      keys: ['name', 'brand', 'company'],
      includeMatches: true,
      ...options
    };
  }

  search(data, query) {
    if (!query || !data.length) return [];
    
    const results = data.map(item => {
      let score = 0;
      const matches = [];
      
      this.options.keys.forEach(key => {
        const fieldValue = item[key]?.toLowerCase() || '';
        const queryLower = query.toLowerCase();
        
        // Exact match
        if (fieldValue === queryLower) {
          score += 1.0;
          matches.push({ key, value: item[key] });
        }
        // Starts with
        else if (fieldValue.startsWith(queryLower)) {
          score += 0.8;
          matches.push({ key, value: item[key] });
        }
        // Contains
        else if (fieldValue.includes(queryLower)) {
          score += 0.6;
          matches.push({ key, value: item[key] });
        }
        // Fuzzy match (typo tolerance)
        else if (this.fuzzyMatch(fieldValue, queryLower)) {
          score += 0.4;
          matches.push({ key, value: item[key] });
        }
      });
      
      return { item, score, matches };
    })
    .filter(result => result.score > this.options.threshold)
    .sort((a, b) => b.score - a.score);
    
    return results;
  }
  
  fuzzyMatch(str1, str2) {
    if (Math.abs(str1.length - str2.length) > 3) return false;
    
    let matches = 0;
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    // Allow for some character differences
    return (matches / minLength) > 0.6;
  }
}

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  
  const debounceTimer = useRef(null);
  const fuzzySearch = useRef(new FuzzySearch());
  const preloadedMedicines = useRef([]);
  const abortControllerRef = useRef(null);

  // Preload popular medicines on mount
  useEffect(() => {
    const preload = async () => {
      try {
        const medicines = await searchService.preloadTopMedicines();
        preloadedMedicines.current = medicines;
      } catch (error) {
        console.error('Preload failed:', error);
      }
    };
    
    preload();
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery) => {
    // DON'T clear results if query is empty - let the component decide
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);

    try {
      // For immediate feedback, search preloaded data first
      if (preloadedMedicines.current.length > 0) {
        const localResults = fuzzySearch.current.search(
          preloadedMedicines.current, 
          searchQuery
        );
        
        if (localResults.length > 0) {
          setResults(localResults.slice(0, 10));
        }
      }

      // Then get comprehensive results from server
      const serverResults = await searchService.searchMedicines(searchQuery);

      // Ensure we always have an array
      const items = Array.isArray(serverResults)
        ? serverResults
        : serverResults.results || [];

      // Process server results
      const processedResults = items.map(item => ({
        item,
        score: 1.0,
        matches: []
      }));
      
      setResults(processedResults);
      
      // Get suggestions for autocomplete
      const suggestionResults = await searchService.getSuggestions(searchQuery);
      setSuggestions(suggestionResults);
      
    } catch (err) {
      // Only set error if it's not an abort error
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('Search error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle query changes with debouncing
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // IMPORTANT: Don't clear results immediately, wait for new search
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, performSearch]);

  // Voice search function
  const startVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian English for better pharma terms

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Voice search error:', event.error);
    };

    recognition.start();
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    suggestions,
    startVoiceSearch,
    clearResults: () => setResults([]),
    clearError: () => setError(null)
  };
};