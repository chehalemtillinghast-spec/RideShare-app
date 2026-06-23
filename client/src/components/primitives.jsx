import { BadgeCheck, Star, ChevronLeft } from 'lucide-react';

const SIZE_CLS = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const COLOR_CLS = {
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  teal: 'bg-[#2E8B7A] text-white',
};

export function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function Avatar({ name, size = 'md', color = 'primary' }) {
  return (
    <div className={`${SIZE_CLS[size]} ${COLOR_CLS[color]} rounded-full flex items-center justify-center font-bold shrink-0 select-none`}>
      {initials(name)}
    </div>
  );
}

export function Verified({ sm }) {
  return <BadgeCheck className={`${sm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#2E8B7A]`} strokeWidth={2.5} />;
}

export function Stars({ rating }) {
  if (rating == null) return null;
  const r = Number(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(r) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
      ))}
      <span className="text-[11px] text-muted-foreground ml-0.5">{r.toFixed(1)}</span>
    </div>
  );
}

export function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${on ? 'bg-[#2E8B7A]' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

export function BackButton({ onPress }) {
  return (
    <button onClick={onPress} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );
}
