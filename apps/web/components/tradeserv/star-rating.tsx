import { Star } from 'lucide-react';

export function StarRating({ rating, size = 'sm', interactive = false, onChange }: {
  rating: number; size?: 'sm' | 'md'; interactive?: boolean; onChange?: (r: number) => void;
}) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={!interactive} onClick={() => onChange?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}>
          <Star className={`${sizeClass} ${star <= rating ? 'fill-accent-500 text-accent-500' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}
