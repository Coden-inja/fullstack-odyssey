import { CONCEPTS, conceptPattern } from '../data/concepts';
import { LevelDefinition } from '../types';

export interface ForwardReference {
  level: number;
  conceptId: string;
  introducedIn: number;
  match: string;
  context: string;
}

// Finds every term in `text` that the reader at `level` hasn't been taught yet
export function findForwardReferences(text: string, level: number): ForwardReference[] {
  const found: ForwardReference[] = [];
  for (const c of CONCEPTS) {
    if (c.level <= level) continue;
    const re = new RegExp(conceptPattern(c).source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      found.push({
        level,
        conceptId: c.id,
        introducedIn: c.level,
        match: m[0],
        context: text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, ' ')
      });
    }
  }
  return found;
}

// Every human-readable string a level shows: prose, goals, hints, quiz, sources, node titles
export function levelStrings(level: LevelDefinition): string[] {
  return [
    level.title,
    level.subtitle,
    level.inOneLine,
    level.storyNarrative,
    level.hiddenNote ?? '',
    ...level.goals.map((g) => g.label),
    ...level.solution.map((s) => s.text),
    ...level.sources.map((s) => `${s.name} ${s.title}`),
    ...level.facts,
    ...level.initialNodes.map((n) => n.title),
    level.quiz.question,
    ...level.quiz.options,
    level.quiz.explanation,
    level.quiz.referenceSource.title,
    level.quiz.referenceSource.chapterOrSection
  ];
}

export function lintCurriculum(levels: LevelDefinition[]): ForwardReference[] {
  return levels.flatMap((lvl) => levelStrings(lvl).flatMap((s) => findForwardReferences(s, lvl.levelNumber)));
}
