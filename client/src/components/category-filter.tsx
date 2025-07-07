import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const categories = [
    { value: "all", label: "All Events" },
    { value: "party", label: "🎉 Parties" },
    { value: "workshop", label: "🎓 Workshops" },
    { value: "meetup", label: "🤝 Meetups" },
    { value: "music", label: "🎵 Music" },
    { value: "sports", label: "⚽ Sports" },
    { value: "art", label: "🎨 Art" },
    { value: "food", label: "🍕 Food" },
    { value: "tech", label: "💻 Tech" },
  ];

  return (
    <div className="px-4 py-2">
      <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.value)}
            className={`category-chip whitespace-nowrap ${
              selectedCategory === category.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
