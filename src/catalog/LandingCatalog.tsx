import React, { useState, useEffect } from 'react';
import { MODULES, ModuleId, Category } from '../types';
import { Terminal, CheckCircle2, ArrowRight, Play, Sparkles, Layers, BookOpen, ShieldCheck } from 'lucide-react';

interface LandingCatalogProps {
  onSelectModule: (id: ModuleId) => void;
}

export const LandingCatalog: React.FC<LandingCatalogProps> = ({ onSelectModule }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [demoCommand, setDemoCommand] = useState('git commit -m "feat: user state machine"');
  const [demoOutput, setDemoOutput] = useState([
    { glyph: '→', text: 'Initializing fullstack learning engine...', color: '#a1a1aa' },
    { glyph: '✓', text: 'Loaded 10 interactive system simulators', color: '#4ade80' },
    { glyph: '→', text: 'Simulating Event Loop, SQL Joins, Git DAG & Edge Pipelines', color: '#38bdf8' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odyssey_completed_modules');
      if (saved) {
        setCompletedModules(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const categories: Category[] = ['All', 'Runtime', 'Networking', 'Database', 'Security', 'Architecture', 'DevOps'];

  const filteredModules = activeCategory === 'All'
    ? MODULES
    : MODULES.filter(m => m.category === activeCategory);

  const progressPercent = Math.round((completedModules.length / MODULES.length) * 100);

  // Assign distinct pastel bento styles to categories
  const getBentoClass = (cat: string) => {
    switch (cat) {
      case 'Runtime': return 'bento-mint';
      case 'Networking': return 'bento-peach';
      case 'Database': return 'bento-sand';
      case 'Security':
      case 'Architecture': return 'bento-purple';
      case 'DevOps': return 'bento-sky';
      default: return 'bento-mint';
    }
  };

  const handleRunDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoCommand.trim()) return;
    setDemoOutput(prev => [
      ...prev,
      { glyph: '$', text: demoCommand, color: '#f4f4f5' },
      { glyph: '✓', text: `Verified state transition: [${demoCommand}] executed successfully.`, color: '#4ade80' }
    ]);
    setDemoCommand('');
  };

  return (
    <div className="catalog-container">
      {/* Hero Header */}
      <section className="catalog-hero">
        <div className="hero-pill">
          <Sparkles size={13} style={{ color: '#7c3aed' }} />
          10 INTERACTIVE HANDS-ON LABS
        </div>

        <h1 className="hero-title">
          Master Fullstack Engineering Visually.
        </h1>

        <p className="hero-subtitle">
          Interactive step-by-step labs that show you how web servers, databases, and deployment pipelines actually work under the hood.
        </p>

        {/* Hero Showcase Bento Row: macOS Terminal + Verification Card (Creem-Style) */}
        <div className="hero-showcase-row">
          {/* macOS Terminal Window */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="terminal-title">
                <Terminal size={12} style={{ color: '#38bdf8' }} />
                RUNTIME ENGINE — ZSH 80x24
              </span>
              <div style={{ width: 40 }} />
            </div>

            <div className="terminal-body" style={{ minHeight: 150 }}>
              {demoOutput.map((line, idx) => (
                <div key={idx} className="terminal-line" style={{ color: line.color }}>
                  <span className="glyph">{line.glyph}</span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleRunDemo} className="terminal-prompt-row" style={{ margin: '0 12px 12px' }}>
              <span className="terminal-prompt-glyph">→</span>
              <input
                type="text"
                className="terminal-prompt-input"
                value={demoCommand}
                onChange={(e) => setDemoCommand(e.target.value)}
                placeholder="Try: git commit, EXPLAIN ANALYZE, or next()"
              />
              <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: 11 }}>
                Run
              </button>
            </form>
          </div>

          {/* Floating Verification Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              border: '1.5px solid var(--border-light)',
              padding: 24,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Graduated Course Syllabi
                  </span>
                </div>
                <span className="badge badge-indigo">10 Active Modules</span>
              </div>

              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Every Level Builds Onto The Next
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
                You start with basic primitive states (e.g. single commit, single call frame). 
                Each level solves a dilemma from the previous one. Explicit validation checks diff your work before advancing.
              </p>
            </div>

            {/* Global Progress Bar */}
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                <span style={{ color: '#0f172a' }}>Your Odyssey Progress</span>
                <span style={{ color: '#059669' }}>{completedModules.length} / {MODULES.length} Done ({progressPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#2563eb', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="catalog-filter-bar">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 10 Modules Creem-Style Bento Grid */}
      <div className="catalog-grid">
        {filteredModules.map((m) => {
          const isDone = completedModules.includes(m.id);
          const bentoTheme = getBentoClass(m.category);

          return (
            <div 
              key={m.id} 
              className={`bento-card ${bentoTheme}`}
              onClick={() => onSelectModule(m.id)}
            >
              {/* Card Header */}
              <div className="card-top">
                <span className="card-number">MODULE {m.number}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {isDone && (
                    <span className="bento-inner-pill" style={{ color: '#059669' }}>
                      <CheckCircle2 size={12} />
                      Completed
                    </span>
                  )}
                  <span className="bento-inner-pill">
                    {m.category}
                  </span>
                </div>
              </div>

              {/* Chunky Gasoek One Title */}
              <h2 className="card-title">{m.title}</h2>
              <div className="card-tagline">{m.tagline}</div>
              <p className="card-summary">{m.summary}</p>

              {/* White Floating Inner Card */}
              <div className="bento-inner-card">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: 8 }}>
                  Curriculum Milestones
                </div>
                <div className="card-skills-row" style={{ marginBottom: 0 }}>
                  {m.keySkills.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="skill-pill">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="card-footer" style={{ marginTop: 16 }}>
                <span className="bento-inner-pill" style={{ fontSize: 11 }}>
                  ⏱ {m.estTime}
                </span>

                <button 
                  className={`btn btn-pill ${isDone ? 'btn-success' : 'btn-primary'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModule(m.id);
                  }}
                  style={{ gap: 6 }}
                >
                  {isDone ? 'Review Lab' : 'Enter Lab'}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
