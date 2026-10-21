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
          Interactive Fullstack Learning Curriculum
        </div>
        <h1 className="hero-title">Visual Systems Learning</h1>
        <p className="hero-subtitle">
          Step-by-step interactive labs that show you what actually happens under the hood. 
          Learn how servers, databases, browsers, and deployment pipelines work through guided levels.
        </p>

        {/* Global Progress Bar */}
        <div style={{ maxWidth: 440, margin: '20px auto 28px', background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 10, border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Your Learning Progress</span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{completedModules.length} of {MODULES.length} Completed ({progressPercent}%)</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.4s ease' }} />
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
            >
              <div className="card-top">
                <span className="card-number">Module {m.number}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {isDone && <span className="badge badge-success">Completed</span>}
                  <span className="badge badge-indigo">{m.category}</span>
                </div>
              </div>

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
                  {isDone ? 'Review Lab' : 'Start Lab'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
