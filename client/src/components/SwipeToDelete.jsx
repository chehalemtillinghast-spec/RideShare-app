import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const REVEAL_WIDTH = 72;

export default function SwipeToDelete({ children, onDelete, disabled }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startDragX = useRef(0);

  if (disabled) return children;

  function onPointerDown(e) {
    startX.current = e.clientX;
    startDragX.current = dragX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const delta = e.clientX - startX.current;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, startDragX.current + delta));
    setDragX(next);
  }

  function onPointerUp() {
    setDragging(false);
    setDragX((x) => (x < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0));
  }

  const revealed = Math.min(1, -dragX / REVEAL_WIDTH);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-destructive flex items-center justify-end">
        <div className="w-[72px] h-full flex items-center justify-center" style={{ opacity: revealed }}>
          <button onClick={onDelete} className="flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}
