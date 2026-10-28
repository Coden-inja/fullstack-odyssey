import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import './landing.css';

// The front door: one card per game. Each card opens a page that is only about that game.

const TrainArt: React.FC = () => (
  <svg viewBox="0 0 320 180" className="card-art" aria-hidden>
    <rect width="320" height="180" fill="#1f3b57" />
    <circle cx="262" cy="42" r="20" fill="#fbbf24" opacity="0.9" />
    {/* platform + rails */}
    <rect y="150" width="320" height="30" fill="#2b2620" />
    <rect y="146" width="320" height="4" fill="#8a7a5c" />
    {Array.from({ length: 16 }, (_, i) => (
      <rect key={i} x={i * 21} y="156" width="12" height="4" fill="#5c5040" />
    ))}
    {/* the engine, front-on */}
    <rect x="96" y="40" width="128" height="104" rx="22" fill="#c2410c" />
    <rect x="96" y="96" width="128" height="10" fill="#fde68a" />
    <rect x="112" y="54" width="96" height="34" rx="8" fill="#0f172a" />
    <rect x="116" y="58" width="40" height="26" rx="5" fill="#38bdf8" opacity="0.55" />
    <rect x="164" y="58" width="40" height="26" rx="5" fill="#38bdf8" opacity="0.55" />
    <circle cx="124" cy="122" r="9" fill="#fef3c7" />
    <circle cx="196" cy="122" r="9" fill="#fef3c7" />
    <rect x="146" y="114" width="28" height="16" rx="3" fill="#7c2d12" />
    <text x="160" y="126" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fde68a" fontFamily="monospace">
      10:00
    </text>
    {/* headlight beam */}
    <path d="M160 40 L130 0 L190 0 Z" fill="#fde68a" opacity="0.18" />
  </svg>
);

const MithaiArt: React.FC = () => (
  <svg viewBox="0 0 320 180" className="card-art" aria-hidden>
    <rect width="320" height="180" fill="#4a1d3a" />
    {/* diyas */}
    {[40, 280].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy="150" rx="22" ry="8" fill="#b45309" />
        <path d={`M${x - 4} 140 Q${x} 118 ${x + 4} 140 Z`} fill="#fbbf24" />
      </g>
    ))}
    {/* the box */}
    <rect x="70" y="58" width="180" height="96" rx="8" fill="#f59e0b" />
    <rect x="70" y="58" width="180" height="96" rx="8" fill="none" stroke="#fde68a" strokeWidth="3" strokeDasharray="2 6" />
    <rect x="60" y="44" width="200" height="24" rx="6" fill="#dc2626" />
    <text x="160" y="61" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fde68a" fontFamily="serif">
      SHARMA SWEETS
    </text>
    {/* kaju katli diamonds */}
    {Array.from({ length: 3 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => {
        const x = 98 + c * 31;
        const y = 84 + r * 24;
        return <path key={`${r}-${c}`} d={`M${x} ${y - 10} L${x + 13} ${y} L${x} ${y + 10} L${x - 13} ${y} Z`} fill="#fef3c7" stroke="#e5d5a8" />;
      })
    )}
    <text x="160" y="172" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fca5a5" fontFamily="monospace">
      only 1 box left
    </text>
  </svg>
);

const GAMES = [
  {
    href: '/tatkal',
    art: <TrainArt />,
    eyebrow: 'Game 1 · 8 levels',
    title: 'The Tatkal Rush',
    pitch: 'Raj needs a berth to Mumbai. At 10:00 AM lakhs of people press Book at once. Wire up servers, load balancers, caches and queues until the site survives.',
    tags: ['load balancing', 'sessions', 'caching', 'queues', 'sharding'],
    ready: true
  },
  {
    href: '/mithai',
    art: <MithaiArt />,
    eyebrow: 'Game 2 · coming soon',
    title: 'Sharma Sweets, Behind the Screen',
    pitch: 'Ginni put her family’s Chandni Chowk shop online before Diwali. Watch a real request travel through DevTools, a server terminal and a real PostgreSQL.',
    tags: ['HTTP', 'APIs', 'SQL', 'indexes', 'race conditions'],
    ready: false
  }
];

export const Landing: React.FC = () => (
  <div className="land">
    <header className="land-head">
      <div className="land-brand">
        <Compass size={20} /> Fullstack Odyssey
      </div>
      <h1>
        Learn how real backends work by building one, <em>breaking it</em>, and fixing it.
      </h1>
      <p>Each game is a story from everyday India, a working system you wire up yourself, and the exact moment it falls over.</p>
    </header>
    <main className="land-grid">
      {GAMES.map((g) => {
        const Card = g.ready ? 'a' : 'div';
        return (
        <Card key={g.href} className={`land-card ${g.ready ? '' : 'is-soon'}`} {...(g.ready ? { href: g.href } : {})}>
          <div className="land-art">{g.art}</div>
          <div className="land-body">
            <div className="land-eyebrow">{g.eyebrow}</div>
            <h2>{g.title}</h2>
            <p>{g.pitch}</p>
            <div className="land-tags">
              {g.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <span className="land-cta">
              {g.ready ? (
                <>
                  Play <ArrowRight size={14} />
                </>
              ) : (
                'Coming soon'
              )}
            </span>
          </div>
        </Card>
        );
      })}
    </main>
    <footer className="land-foot">Grounded in allahabadi.dev, backendengineer.in and the engineers on YouTube who explain this best.</footer>
  </div>
);
