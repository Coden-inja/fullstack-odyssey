import React, { useMemo } from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { LevelDefinition } from '../types';
import { conceptById } from '../data/concepts';

interface LevelCompleteProps {
  level: LevelDefinition;
  isLast: boolean;
  onNext: () => void;
  onStay: () => void;
}

const CONFETTI = 36;

// The moment of reward: what you just built, the words you now own, and a true
// story from computing history instead of a generic "great job".
export const LevelComplete: React.FC<LevelCompleteProps> = ({ level, isLast, onNext, onStay }) => {
  const fact = useMemo(() => level.facts[Math.floor(Math.random() * level.facts.length)], [level]);
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI }, (_, i) => ({
        angle: (360 / CONFETTI) * i + Math.random() * 8,
        dist: 120 + Math.random() * 160,
        delay: Math.random() * 120,
        hue: i % 4
      })),
    []
  );

  return (
    <div className="lc-backdrop" onMouseDown={(e) => e.stopPropagation()}>
      <div className="lc-burst" aria-hidden>
        {pieces.map((p, i) => (
          <i
            key={i}
            className={`lc-bit hue-${p.hue}`}
            style={
              {
                '--a': `${p.angle}deg`,
                '--d': `${p.dist}px`,
                animationDelay: `${p.delay}ms`
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="lc-card" role="dialog" aria-label={`Level ${level.levelNumber} cleared`}>
        <div className="lc-badge">
          <CheckCircle2 size={28} />
        </div>
        <div className="lc-eyebrow">Level {level.levelNumber} cleared</div>
        <h2 className="lc-title">{level.title}</h2>

        <ul className="lc-done">
          {level.goals.map((g, i) => (
            <li key={i} style={{ animationDelay: `${250 + i * 90}ms` }}>
              <CheckCircle2 size={13} /> {g.label}
            </li>
          ))}
        </ul>

        <div className="lc-concepts">
          <span className="lc-label">Words you can now use</span>
          <div className="lc-chips">
            {level.introduces.map((id) => (
              <span key={id} className="chip" title={conceptById(id)?.definition}>
                {conceptById(id)?.term}
              </span>
            ))}
          </div>
        </div>

        <div className="lc-fact">
          <Sparkles size={13} />
          <p>{fact}</p>
        </div>

        <div className="lc-actions">
          <button className="btn btn-ghost" onClick={onStay}>
            Keep experimenting
          </button>
          {!isLast ? (
            <button className="btn btn-primary" onClick={onNext} autoFocus>
              Next level <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onStay} autoFocus>
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
