// src/components/CategoryFilter.jsx
import React from 'react';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  const allCategories = ['all', ...categories];

  const getCategoryLabel = (category) => {
    switch (category.toLowerCase()) {
      case 'all': return 'Semua';
      case 'sayur': return 'Sayur';
      case 'buah': return 'Buah';
      case 'lauk': return 'Lauk';
      case 'bumbu': return 'Bumbu';
      case 'lainnya': return 'Lainnya 📦';
      default: return category;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {allCategories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeCategory.toLowerCase() === category.toLowerCase()
                ? 'bg-green-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getCategoryLabel(category)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
