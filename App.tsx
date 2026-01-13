import React, { useState, useEffect } from 'react';
import ParticleHero from './components/ParticleHero';
import Showcase from './components/Showcase';
import AdminPanel from './components/AdminPanel';
import { storageService } from './services/storage';
import { CaseStudy, Tag, CategoryType } from './types';
import { Settings } from 'lucide-react';

const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [stats, setStats] = useState({ caseCount: 0, tagCount: 0, scenarioCount: 0 });
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Showcase State
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [isAdminOpen]); // Reload when admin closes in case of updates

  const loadData = () => {
    setStats(storageService.getStats());
    setCases(storageService.getAllCases());
    setTags(storageService.getAllTags());
  };

  return (
    <div className="min-h-screen font-sans selection:bg-cyan-500/30 selection:text-white pb-10">
      
      {/* Top Navigation / Branding */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-end items-center px-6 py-4 pointer-events-none mix-blend-difference">
        <div className="pointer-events-auto">
          <button 
            onClick={() => setIsAdminOpen(true)}
            className="group flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors rounded-full border border-transparent hover:border-white/10 hover:bg-black/50 backdrop-blur-md"
            title="存取終端"
          >
            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">管理</span>
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <ParticleHero />
        
        {/* Statistics Ticker (Positioned below SYSTEM ONLINE) */}
        <div className="relative z-30 -mt-48 mb-12 container mx-auto px-4 max-w-5xl">
          <div className="glass-panel rounded-full p-4 md:p-6 flex flex-wrap justify-around items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="text-center group cursor-default flex-1">
            <div className="text-3xl md:text-4xl font-mono font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors drop-shadow-lg">
              {stats.caseCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">成功案例</div>
          </div>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block"></div>
          <div className="text-center group cursor-default flex-1">
            <div className="text-3xl md:text-4xl font-mono font-bold text-white mb-1 group-hover:text-purple-400 transition-colors drop-shadow-lg">
              {stats.scenarioCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">解決方案</div>
          </div>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block"></div>
          <div className="text-center group cursor-default flex-1">
            <div className="text-3xl md:text-4xl font-mono font-bold text-white mb-1 group-hover:text-neon-green transition-colors drop-shadow-lg">
              {stats.tagCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">技術領域</div>
          </div>
          </div>
        </div>
      </div>

      {/* Main Showcase */}
      <Showcase 
        cases={cases}
        tags={tags}
        activeCategory={activeCategory}
        activeTagId={activeTagId}
        onCategoryChange={setActiveCategory}
        onTagSelect={setActiveTagId}
      />

      {/* Admin Panel Modal */}
      {isAdminOpen && (
        <AdminPanel onClose={() => setIsAdminOpen(false)} />
      )}

      {/* Footer */}
      <footer className="py-12 text-center border-t border-white/5 bg-black mt-20">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
        </div>
        <p className="text-slate-600 text-xs font-mono tracking-widest">TPI SOLUTION HUB PORTFOLIO // v2.0.45</p>
      </footer>

    </div>
  );
};

export default App;
