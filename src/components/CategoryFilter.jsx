import React from 'react';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  const allCategories = ['all', ...categories];
  const maxPerRow = 4; // maksimal tombol per baris

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

  // Tentukan baris tombol
  const rows = [];
  for (let i = 0; i < allCategories.length; i += maxPerRow) {
    rows.push(allCategories.slice(i, i + maxPerRow));
  }

  return (
    <div className="mb-6 max-h-40 overflow-y-auto">
      {rows.map((row, idx) => (
        <div key={idx} className="flex gap-3 mb-2">
          {row.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeCategory.toLowerCase() === category.toLowerCase()
                  ? 'bg-green-600 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CategoryFilter;
