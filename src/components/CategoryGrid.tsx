import {
  Bike,
  BookOpen,
  Compass,
  Bed,
  Laptop,
  Dumbbell,
  MoreHorizontal,
} from 'lucide-react';
import { CATEGORIES } from '../data/campusData';

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onSeeAll: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
  onSeeAll,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Bike':
        return <Bike className="w-5 h-5 text-slate-800" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-slate-800" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-slate-800" />;
      case 'Bed':
        return <Bed className="w-5 h-5 text-slate-800" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-slate-800" />;
      case 'Dumbbell':
        return <Dumbbell className="w-5 h-5 text-slate-800" />;
      case 'MoreHorizontal':
        return <MoreHorizontal className="w-5 h-5 text-slate-800" />;
      default:
        return <Compass className="w-5 h-5 text-slate-800" />;
    }
  };

  return (
    <section className="px-4 py-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-black tracking-wider text-slate-800 uppercase">
          LPU Campus Categories
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-bold text-slate-900 hover:underline"
        >
          See All ({CATEGORIES.length})
        </button>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'All' : cat.name)}
              className={`relative bg-white border rounded-xl p-2.5 flex flex-col items-center text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm'
                  : 'border-gray-200/80 hover:border-gray-300 hover:shadow-2xs'
              }`}
            >
              {/* Optional Top-Right Tag (e.g. ₹10/D on Lab & Drafters) */}
              {cat.tag && (
                <div className="absolute -top-1.5 right-2 bg-[#fbbf24] text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-xs shadow-2xs">
                  {cat.tag}
                </div>
              )}

              {/* Icon Container */}
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1.5 border border-gray-100">
                {getIcon(cat.iconName)}
              </div>

              {/* Title & Sub */}
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {cat.name}
              </span>
              <span className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5 truncate max-w-full">
                {cat.sub}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
