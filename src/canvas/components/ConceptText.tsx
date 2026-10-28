import React, { useMemo } from 'react';
import { Concept, conceptsUpTo } from '../data/concepts';

interface ConceptTextProps {
  text: string;
  level: number;
  newIds?: string[];
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Underlines the first mention of each concept the reader has met, with its
// definition on hover. Terms introduced by this level get the accent colour.
export const ConceptText: React.FC<ConceptTextProps> = ({ text, level, newIds = [] }) => {
  const parts = useMemo(() => {
    const concepts = conceptsUpTo(level);
    const lookup = new Map<string, Concept>();
    concepts.forEach((c) => [c.term, ...c.aliases].forEach((t) => lookup.set(t.toLowerCase(), c)));
    const alts = [...lookup.keys()].sort((a, b) => b.length - a.length).map(escape);
    if (!alts.length) return [text];
    const re = new RegExp(`(?<![\\w-])(${alts.join('|')})(?![\\w-])`, 'gi');

    const seen = new Set<string>();
    const out: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const c = lookup.get(m[0].toLowerCase());
      if (!c || seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(text.slice(last, m.index));
      out.push(
        <span
          key={m.index}
          className={`concept-term ${newIds.includes(c.id) ? 'is-new' : ''}`}
          title={`${c.term}: ${c.definition}`}
        >
          {m[0]}
        </span>
      );
      last = m.index + m[0].length;
    }
    out.push(text.slice(last));
    return out;
  }, [text, level, newIds]);

  return <>{parts}</>;
};
