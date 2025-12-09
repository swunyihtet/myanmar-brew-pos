import { cn } from '@/lib/utils';
import { Category } from '@/types/pos';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryList({ categories, selectedCategory, onSelectCategory }: CategoryListProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-card border-b border-border">
      <button
        onClick={() => onSelectCategory('all')}
        className={cn(
          'category-pill',
          selectedCategory === 'all' && 'category-pill-active'
        )}
      >
        🌟 All
      </button>
      <button
        onClick={() => onSelectCategory('popular')}
        className={cn(
          'category-pill',
          selectedCategory === 'popular' && 'category-pill-active'
        )}
      >
        🔥 Popular
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            'category-pill',
            selectedCategory === category.id && 'category-pill-active'
          )}
        >
          {category.icon} {category.name}
        </button>
      ))}
    </div>
  );
}
