import React, { useState, useEffect } from 'react';
import { MODULES, ModuleId, Category } from '../types';

interface LandingCatalogProps {
  onSelectModule: (id: ModuleId) => void;
}

export const LandingCatalog: React.FC<LandingCatalogProps> = ({ onSelectModule }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [completedModules, setCompletedModules] = useState<string[]>([]);

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

  return (
    <div className="catalog-container">
      {/* Hero Header */}
      <section className="catalog-hero">
        <div className="hero-pill">
          <span>⚡</span>
          <span>The True Fullstack 10 Curriculum</span>
        </div>
        <h1 className="hero-title">Learn the Systems Under the Wire.</h1>
        <p className="hero-subtitle">
          Interactive, full-screen visual labs designed for engineers. Step through in-memory state models 
          from the libuv event loop to SQL relational algebra and Git Merkle DAGs.
        </p>

        {/* Global Progress Bar */}
        <div style={{ maxWidth: 460, margin: '20px auto 28px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 18px', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            <span>Curriculum Mastery</span>
            <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>{completedModules.length} / {MODULES.length} Completed ({progressPercent}%)</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--indigo), var(--emerald))', transition: 'width 0.4s ease' }} />
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

      {/* 10 Modules Catalog Grid */}
      <div className="catalog-grid">
        {filteredModules.map((m) => {
          const isDone = completedModules.includes(m.id);
          return (
            <div 
              key={m.id} 
              className={`catalog-card ${isDone ? 'completed-card' : ''}`}
              onClick={() => onSelectModule(m.id)}
              style={isDone ? { borderColor: 'rgba(16, 185, 129, 0.4)' } : undefined}
            >
              <div className="card-top">
                <span className="card-number">{m.number}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {isDone && <span className="badge badge-emerald">✓ Completed</span>}
                  <span className="badge badge-indigo">{m.category}</span>
                </div>
              </div>

              <div className="card-icon">{m.icon}</div>
              <h2 className="card-title">{m.title}</h2>
              <div className="card-tagline">{m.tagline}</div>
              <p className="card-summary">{m.summary}</p>

              <div className="card-skills-row">
                {m.keySkills.slice(0, 4).map((skill, idx) => (
                  <span key={idx} className="skill-pill">{skill}</span>
                ))}
              </div>

              <div className="card-footer">
                <span className="badge">{m.estTime}</span>
                <button 
                  className={`btn ${isDone ? 'btn-success' : 'btn-primary'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModule(m.id);
                  }}
                >
                  {isDone ? 'Review Lab →' : 'Enter Lab →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
