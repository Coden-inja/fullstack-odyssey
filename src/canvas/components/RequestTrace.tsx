import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, ArrowRight } from 'lucide-react';
import { Hop } from '../sim/engine';

interface RequestTraceProps {
  hops: Hop[];
  activeIndex: number; // -1 when the run has finished
  running: boolean;
  outcome?: string;
  waiting?: boolean; // step mode: paused after the current hop
  onNext?: () => void;
}

// The same hops the packets animate, as numbered sentences, revealed one by one
// so the order (request in, query, answer, response out) is never ambiguous.
export const RequestTrace: React.FC<RequestTraceProps> = ({ hops, activeIndex, running, outcome, waiting, onNext }) => {
  const [open, setOpen] = useState(true);
  const listRef = useRef<HTMLOListElement>(null);
  const shown = running ? hops.slice(0, activeIndex + 1) : hops;

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }, [shown.length]);

  if (!hops.length && !outcome) return null;

  return (
    <section className={`trace ${open ? '' : 'is-closed'}`} onMouseDown={(e) => e.stopPropagation()}>
      <button className="trace-head" onClick={() => setOpen((o) => !o)}>
        <span>Request trace</span>
        <span className="trace-count">{running ? `step ${activeIndex + 1} of ${hops.length}` : `${hops.length} steps`}</span>
        <ChevronDown size={14} className="trace-chevron" />
      </button>
      {open && (
        <ol className="trace-list" ref={listRef}>
          {shown.map((h, i) => {
            const isNow = running && i === activeIndex;
            return (
              <li key={i} className={`trace-step ${isNow ? 'is-now' : ''} ${h.isError ? 'is-error' : ''} kind-${h.kind}`}>
                <span className="trace-num">{isNow ? i + 1 : <Check size={10} />}</span>
                <span className="trace-text">{h.trace}</span>
              </li>
            );
          })}
          {!running && outcome && <li className="trace-outcome">{outcome}</li>}
        </ol>
      )}
      {waiting && onNext && (
        <div className="trace-next">
          <span>Read it, then continue</span>
          <button className="btn btn-primary btn-sm" onClick={onNext}>
            Next step <ArrowRight size={13} /> <kbd>Space</kbd>
          </button>
        </div>
      )}
    </section>
  );
};
