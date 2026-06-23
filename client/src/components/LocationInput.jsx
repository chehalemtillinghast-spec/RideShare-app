import { useEffect, useRef, useState } from 'react';

let cachedPosition = null;
let positionPromise = null;

function getCurrentPosition() {
  if (cachedPosition) return Promise.resolve(cachedPosition);
  if (!positionPromise) {
    positionPromise = new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          cachedPosition = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          resolve(cachedPosition);
        },
        () => resolve(null),
        { timeout: 5000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }
  return positionPromise;
}

export default function LocationInput({ icon: Icon, iconClassName, value, onChange, placeholder, required }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function search(query) {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
      });
      if (pos) {
        const delta = 0.5;
        params.set('viewbox', `${pos.lon - delta},${pos.lat + delta},${pos.lon + delta},${pos.lat - delta}`);
        params.set('bounded', '0');
      }
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      setSuggestions(data);
      setOpen(true);
    } catch {
      // aborted or network error — leave existing suggestions as-is
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(e) {
    const text = e.target.value;
    onChange(text);
    clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(text), 400);
  }

  function selectSuggestion(s) {
    onChange(formatLabel(s));
    setSuggestions([]);
    setOpen(false);
  }

  function formatLabel(s) {
    const a = s.address || {};
    const primary = a.house_number ? `${a.house_number} ${a.road || ''}`.trim() : a.road || s.display_name.split(',')[0];
    const locality = a.city || a.town || a.village || a.hamlet || '';
    return locality && locality !== primary ? `${primary}, ${locality}` : primary;
  }

  return (
    <div className="relative" ref={containerRef}>
      <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${iconClassName}`} />
      <input
        required={required}
        value={value}
        onChange={onInputChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full h-[38px] pl-8 pr-3.5 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
      />
      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-[42px] z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <p className="px-3.5 py-2.5 text-xs text-muted-foreground">Searching...</p>
          )}
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => selectSuggestion(s)}
              className="w-full text-left px-3.5 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors border-b border-border last:border-0"
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
