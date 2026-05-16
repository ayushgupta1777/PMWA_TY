// src/services/searchService.js - FIXED TO HANDLE NEW DATA STRUCTURE
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class SearchService {
  constructor() {
    this.cache = new Map();
    this.preloadedMedicines = [];
    this.isPreloaded = false;
  }

  // Preload top medicines for instant search
  async preloadTopMedicines() {
    try {
      if (this.isPreloaded) return this.preloadedMedicines;
      
      const response = await axios.get(`${API_BASE_URL}/tablets/popular`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Handle response format - could be array or object with medicines property
      this.preloadedMedicines = Array.isArray(response.data) 
        ? response.data 
        : response.data.medicines || [];
      
      this.isPreloaded = true;
      
      // Cache in browser storage for offline capability
      localStorage.setItem('pharma_popular_medicines', JSON.stringify(this.preloadedMedicines));
      
      return this.preloadedMedicines;
    } catch (error) {
      console.error('Failed to preload medicines:', error);
      
      // Fallback to cached data
      const cached = localStorage.getItem('pharma_popular_medicines');
      if (cached) {
        this.preloadedMedicines = JSON.parse(cached);
        this.isPreloaded = true;
      }
      
      return this.preloadedMedicines;
    }
  }

  // Search medicines with caching
  async searchMedicines(query, options = {}) {
    if (!query || query.length < 2) return [];

    const cacheKey = `search_${query}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/tablets/search`, {
        params: {
          q: query,
          fuzzy: options.fuzzy || true,
          limit: options.limit || 10,
          ...options
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Extract results array from response
      let results = [];
      
      if (Array.isArray(response.data)) {
        results = response.data;
      } else if (response.data.results) {
        results = response.data.results;
      } else if (response.data.medicines) {
        results = response.data.medicines;
      }
      
      // Ensure each result has the correct structure
      const formattedResults = results.map(item => {
        // If item is already wrapped in {item: ...}, use it as is
        if (item.item) {
          return item;
        }
        // Otherwise wrap it
        return {
          item: item,
          score: 1.0,
          matches: []
        };
      });
      
      // Cache results for 5 minutes
      this.cache.set(cacheKey, formattedResults);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      
      return formattedResults;
    } catch (error) {
      console.error('Search failed:', error);
      
      // Fallback to preloaded search
      if (this.isPreloaded) {
        const localResults = this.searchInPreloaded(query);
        return localResults.map(item => ({
          item: item,
          score: 1.0,
          matches: []
        }));
      }
      
      return [];
    }
  }

  // Search in preloaded medicines (offline capability)
  searchInPreloaded(query) {
    if (!this.preloadedMedicines.length) return [];
    
    const queryLower = query.toLowerCase();
    return this.preloadedMedicines
      .filter(medicine => 
        medicine.name?.toLowerCase().includes(queryLower) ||
        medicine.brand?.toLowerCase().includes(queryLower) ||
        medicine.company?.toLowerCase().includes(queryLower)
      )
      .slice(0, 10);
  }

  // Get medicine by ID
  async getMedicine(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/tablets/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch medicine:', error);
      throw error;
    }
  }

  // Get suggestions for autocomplete
  async getSuggestions(query) {
    if (!query || query.length < 2) return [];

    try {
      const response = await axios.get(`${API_BASE_URL}/tablets/suggestions`, {
        params: { q: query, limit: 5 },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Handle different response formats
      return Array.isArray(response.data) 
        ? response.data 
        : response.data.suggestions || [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new SearchService();