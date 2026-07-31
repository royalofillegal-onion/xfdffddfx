import { Star } from 'lucide-react';

export function Rating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          className={
            star <= Math.round(value)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-stone-200 text-stone-200'
          }
        />
      ))}
      <span className="ml-1 text-xs text-stone-500 font-medium">{value.toFixed(1)}</span>
    </div>
  );
}
