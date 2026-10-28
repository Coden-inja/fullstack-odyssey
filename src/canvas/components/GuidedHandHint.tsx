import React, { useEffect, useRef } from 'react';
import { X, Wand2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { SolutionStep } from '../types';

export interface ScreenPoint {
  x: number;
  y: number;
}

interface GuidedHandHintProps {
  steps: SolutionStep[];
  mode: 'hint' | 'autosolve';
  isDone: (step: SolutionStep) => boolean;
  locate: (step: SolutionStep) => { from: ScreenPoint; to?: ScreenPoint } | null; // viewport-relative px
  busy: boolean; // a request is still being animated
  levelComplete: boolean;
  onApplyStep: (step: SolutionStep) => void;
  onClose: () => void;
}

// Points at the first step that isn't done yet, using live port positions.
// Hint mode waits for you; auto-solve applies the steps itself, one at a time.
export const GuidedHandHint: React.FC<GuidedHandHintProps> = ({
  steps,
  mode,
  isDone,
  locate,
  busy,
  levelComplete,
  onApplyStep,
  onClose
}) => {
  const currentIdx = steps.findIndex((s) => !isDone(s));
  const current = currentIdx >= 0 ? steps[currentIdx] : null;
  const spot = current ? locate(current) : null;
  const clicks = useRef(0);

  useEffect(() => {
    if (mode !== 'autosolve' || !current || busy || levelComplete) return;
    if (current.kind === 'click' && clicks.current >= 4) return; // never loop forever
    const t = setTimeout(() => {
      if (current.kind === 'click') clicks.current += 1;
      onApplyStep(current);
    }, 1100);
    return () => clearTimeout(t);
  }, [mode, current, busy, levelComplete, onApplyStep]);

  const finished = levelComplete || !current;

  return (
    <>
      {spot && !finished && (
        <div className="hint-layer">
          {spot.to && (
            <svg className="hint-trail">
              <path
                d={`M ${spot.from.x} ${spot.from.y} Q ${(spot.from.x + spot.to.x) / 2} ${Math.min(spot.from.y, spot.to.y) - 50} ${spot.to.x} ${spot.to.y}`}
              />
            </svg>
          )}
          <div
            className={`hint-hand ${spot.to ? 'is-drag' : 'is-tap'}`}
            style={
              {
                '--fx': `${spot.from.x}px`,
                '--fy': `${spot.from.y}px`,
                '--tx': `${(spot.to ?? spot.from).x}px`,
                '--ty': `${(spot.to ?? spot.from).y}px`
              } as React.CSSProperties
            }
          >
            <span className="hint-ring" />
            <svg width="30" height="30" viewBox="0 0 24 24">
              <path
                d="M10 2a2 2 0 0 0-2 2v7.5l-1.5-1.5a1.5 1.5 0 0 0-2.12 2.12l4.24 4.24c1.17 1.17 2.76 1.84 4.42 1.84h3.96a5 5 0 0 0 4.9-4l.8-4.8a2 2 0 0 0-1.97-2.33h-4.33V4a2 2 0 0 0-2-2h-4.4z"
                fill="var(--c-brass)"
                stroke="var(--c-bg-card)"
                strokeWidth="1.4"
              />
            </svg>
          </div>
        </div>
      )}

      <div className="hint-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="hint-card-head">
          {mode === 'autosolve' ? <Wand2 size={13} /> : <Lightbulb size={13} />}
          <span>
            {finished ? 'Done' : mode === 'autosolve' ? `Solving: step ${currentIdx + 1} of ${steps.length}` : `Step ${currentIdx + 1} of ${steps.length}`}
          </span>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={13} />
          </button>
        </div>
        <p className="hint-card-text">
          {finished ? (
            <>
              <CheckCircle2 size={13} className="tone-ok" /> Every step is done.
            </>
          ) : (
            current!.text
          )}
        </p>
        {!finished && mode === 'hint' && (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onApplyStep(current!)}>
            Do this step for me
          </button>
        )}
      </div>
    </>
  );
};
