import React, { useState } from 'react';
import { MODULES, ModuleId, Category } from '../types';

interface LandingCatalogProps {
  onSelectModule: (id: ModuleId) => void;
}

export const LandingCatalog: React.FC<LandingCatalogProps> = ({ onSelectModule }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const categories: Category[] = ['All', 'Runtime', 'Networking', 'Database', 'Security', 'Architecture', 'DevOps'];

  const filteredModules = activeCategory === 'All'
    ? MODULES
    : MODULES.filter(m => m.category === activeCategory);

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
        {filteredModules.map((m) => (
          <div 
            key={m.id} 
            className="catalog-card"
            onClick={() => onSelectModule(m.id)}
          >
            <div className="card-top">
              <span className="card-number">{m.number}</span>
              <span className="badge badge-indigo">{m.category}</span>
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
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectModule(m.id);
                }}
              >
                Enter Lab →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
