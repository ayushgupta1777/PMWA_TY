// src/components/SearchResults.js
import React from 'react';
import { Plus, Package, AlertCircle } from 'lucide-react';
// Highlight matching text in search results
// Highlight matching text in search results
const HighlightText = ({ text, searchTerm, matches }) => {
  if (!searchTerm && !matches) return <span>{text}</span>;

  if (matches && matches.length > 0) {
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    
    if (index !== -1) {
      return (
        <span>
          {text.substring(0, index)}
          <mark className="bg-yellow-200 font-semibold px-1 rounded">
            {text.substring(index, index + searchTerm.length)}
          </mark>
          {text.substring(index + searchTerm.length)}
        </span>
      );
    }
  }

  if (searchTerm) {
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    
    if (index !== -1) {
      return (
        <span>
          {text.substring(0, index)}
          <mark className="bg-yellow-200 font-semibold px-1 rounded">
            {text.substring(index, index + searchTerm.length)}
          </mark>
          {text.substring(index + searchTerm.length)}
        </span>
      );
    }
  }

  return <span>{text}</span>;
};

const SearchResultItem = ({ result, searchTerm, onAddToCart, isSelected, onClick }) => {
  const { item: medicine, score, matches } = result;
  
  const nameMatch = matches?.find(m => m.key === 'name');
  const brandMatch = matches?.find(m => m.key === 'brand');
  const companyMatch = matches?.find(m => m.key === 'company');

  // ✅ Calculate pricing with defaults - SHOW TABLET PRICE
  const unitsPerPack = medicine.packaging?.unitsPerPack || 10;
  const packPrice = medicine.packaging?.packPrice || medicine.price || 0;
  const unitPrice = medicine.packaging?.unitPrice || (packPrice / unitsPerPack) || 0;
  
  // ✅ Calculate total availability in TABLETS (not strips)
  const totalAvailableTablets = (medicine.stock * unitsPerPack) + (medicine.looseUnits || 0);
  const inStock = totalAvailableTablets > 0;
  
  // ✅ Calculate discount percentage if buying full pack
  const packSavings = unitsPerPack > 0 ? (((unitPrice * unitsPerPack) - packPrice) / (unitPrice * unitsPerPack) * 100) : 0;

  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-50 border-blue-200' 
          : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Medicine name and brand */}
          <h3 className="font-semibold text-gray-800 text-lg">
            <HighlightText 
              text={medicine.name} 
              searchTerm={searchTerm}
              matches={nameMatch}
            />
            {medicine.brand && (
              <>
                {' - '}
                <span className="text-blue-600">
                  <HighlightText 
                    text={medicine.brand} 
                    searchTerm={searchTerm}
                    matches={brandMatch}
                  />
                </span>
              </>
            )}
          </h3>
          
          {/* Medicine details */}
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <span>
              <HighlightText 
                text={medicine.company} 
                searchTerm={searchTerm}
                matches={companyMatch}
              />
            </span>
            <span>•</span>
            <span className="font-medium">{medicine.strength}</span>
          </div>
          
          {/* ✅ Stock availability - SHOW IN TABLETS */}
          <div className={`mt-2 flex items-center gap-2 text-sm ${
            inStock ? 'text-green-600' : 'text-red-600'
          }`}>
            <Package className="w-4 h-4" />
            {inStock ? (
              <span>
                {totalAvailableTablets} {medicine.packaging?.unitType || 'Tablets'} available
                <span className="text-gray-500 ml-1">
                  ({medicine.stock} {medicine.packaging?.packType || 'strips'}{medicine.looseUnits > 0 ? ` + ${medicine.looseUnits} loose` : ''})
                </span>
              </span>
            ) : (
              <span className="font-semibold">Out of Stock</span>
            )}
          </div>
          
          {/* ✅ Packaging Info */}
          <div className="mt-2 bg-blue-50 rounded px-3 py-1.5 inline-block">
            <p className="text-xs text-blue-800">
              <span className="font-medium">Pack:</span> {unitsPerPack} {medicine.packaging?.unitType || 'tablets'} per {medicine.packaging?.packType?.toLowerCase() || 'strip'}
              {packSavings > 0 && (
                <span className="ml-2 text-green-700 font-semibold">
                  (Save {packSavings.toFixed(0)}% on full pack)
                </span>
              )}
            </p>
          </div>
          
          {/* Category */}
          <div className="mt-2">
            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {medicine.category}
            </span>
          </div>
          
          {/* Search relevance score (for debugging) */}
          {process.env.NODE_ENV === 'development' && score && (
            <div className="text-xs text-gray-400 mt-1">
              Match: {Math.round(score * 100)}%
            </div>
          )}
        </div>
        
        {/* ✅ Pricing and Add button - SHOW TABLET PRICE PROMINENTLY */}
        <div className="text-right ml-4 flex flex-col items-end">
          {/* Main Price: PER TABLET */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1">
              <p className="font-bold text-2xl text-green-600">
                ₹{unitPrice.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 font-medium">/tablet</p>
            </div>
          </div>

          {/* Pack Price Info */}
          <div className="mb-3 bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
            <div className="text-xs text-gray-600 mb-0.5">
              Full {medicine.packaging?.packType || 'Strip'}:
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-blue-600">
                ₹{packPrice.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500">
                ({unitsPerPack} tablets)
              </span>
            </div>
            {packSavings > 0 && (
              <div className="text-xs text-green-600 font-medium mt-0.5">
                Save ₹{((unitPrice * unitsPerPack) - packPrice).toFixed(2)}
              </div>
            )}
          </div>
          
          {/* Add to Cart Button */}
          {inStock ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(medicine);
              }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add 1 Tablet
            </button>
          ) : (
            <button
              disabled
              className="bg-gray-300 text-gray-500 px-4 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchResults = ({ 
  results, 
  searchTerm, 
  onAddToCart, 
  selectedIndex, 
  onResultClick,
  isVisible = true,
  className = ""
}) => {
  if (!isVisible || results.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg max-h-[600px] overflow-y-auto ${className}`}>
      {/* Results header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 sticky top-0 z-10">
        <p className="text-sm font-medium text-gray-700">
          {results.length} medicine{results.length !== 1 ? 's' : ''} found
          {searchTerm && (
            <span> for "<span className="font-semibold text-blue-700">{searchTerm}</span>"</span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          💊 Prices shown per tablet • Add to cart starts with 1 tablet
        </p>
      </div>
      
      {/* Results list */}
      <div>
        {results.map((result, index) => (
          <SearchResultItem
            key={result.item._id || result.item.id}
            result={result}
            searchTerm={searchTerm}
            onAddToCart={onAddToCart}
            isSelected={selectedIndex === index}
            onClick={() => onResultClick && onResultClick(index)}
          />
        ))}
      </div>
      
      {/* Keyboard navigation hint */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 sticky bottom-0">
        💡 Use ↑↓ arrows to navigate, Enter to add to cart, Esc to close
      </div>
    </div>
  );
};

export default SearchResults;