import React, { useState, useEffect } from 'react';
import ParticleHero from './components/ParticleHero';
import Showcase from './components/Showcase';
import AdminPanel from './components/AdminPanel';
import { storageService } from './services/storage';
import { CaseStudy, Tag, CategoryType } from './types';
import { Settings, X, Database, Code, Users } from 'lucide-react';

const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [stats, setStats] = useState({ caseCount: 0, tagCount: 0, scenarioCount: 0 });
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showStatsModal, setShowStatsModal] = useState<string | null>(null);
  
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

  const getStatsDetails = (type: 'cases' | 'solutions' | 'tech') => {
    const techDomains = storageService.getAllTechDomains();
    const totalTechPeople = techDomains.reduce((sum, tech) => sum + tech.count, 0);
    
    switch(type) {
      case 'cases':
        return {
          title: '成功案例統計',
          items: [
            { label: '總案例數', value: stats.caseCount },
            { label: '客戶數量', value: new Set(cases.map(c => c.client).filter(Boolean)).size },
            { label: '產業別', value: new Set(cases.flatMap(c => c.tagIds.map(tid => {
              const tag = tags.find(t => t.id === tid && t.type === CategoryType.INDUSTRY);
              return tag?.name;
            }).filter(Boolean))).size },
            { label: '業務別', value: new Set(cases.flatMap(c => c.tagIds.map(tid => {
              const tag = tags.find(t => t.id === tid && t.type === CategoryType.BUSINESS);
              return tag?.name;
            }).filter(Boolean))).size },
            { label: '趨勢科技', value: new Set(cases.flatMap(c => c.tagIds.map(tid => {
              const tag = tags.find(t => t.id === tid && t.type === CategoryType.TREND);
              return tag?.name;
            }).filter(Boolean))).size }
          ],
          techList: undefined as { name: string; count: number }[] | undefined
        };
      case 'solutions':
        return {
          title: '解決方案統計',
          items: [
            { label: '總解決方案數', value: stats.scenarioCount },
            { label: '有解決方案說明', value: cases.filter(c => c.solutionDescription).length },
            { label: '有解決方案圖片', value: cases.filter(c => c.solutionImageUrl).length },
            { label: '平均標籤數', value: cases.length > 0 ? (cases.reduce((sum, c) => sum + c.tagIds.length, 0) / cases.length).toFixed(1) : 0 }
          ],
          techList: undefined as { name: string; count: number }[] | undefined
        };
      case 'tech':
        return {
          title: '技術領域統計',
          items: [
            { label: '技術領域總數', value: techDomains.length },
            { label: '總技術人員', value: totalTechPeople },
            { label: '平均每領域人數', value: techDomains.length > 0 ? (totalTechPeople / techDomains.length).toFixed(1) : 0 }
          ],
          techList: techDomains.map(tech => ({ name: tech.name, count: tech.count }))
        };
      default:
        return { title: '', items: [], techList: undefined as { name: string; count: number }[] | undefined };
    }
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
          <div className="text-center group cursor-pointer flex-1" onClick={() => setShowStatsModal('cases')}>
            <div className="text-3xl md:text-4xl font-mono font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors drop-shadow-lg">
              {stats.caseCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">成功案例</div>
          </div>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block"></div>
          <div className="text-center group cursor-pointer flex-1" onClick={() => setShowStatsModal('solutions')}>
            <div className="text-3xl md:text-4xl font-mono font-bold text-white mb-1 group-hover:text-purple-400 transition-colors drop-shadow-lg">
              {stats.scenarioCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">解決方案</div>
          </div>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block"></div>
          <div className="text-center group cursor-pointer flex-1" onClick={() => setShowStatsModal('tech')}>
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

      {/* Stats Detail Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => setShowStatsModal(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-[#05050a] border border-cyan-500/20 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                {showStatsModal === 'cases' && <Database className="text-cyan-400" size={24} />}
                {showStatsModal === 'solutions' && <Code className="text-purple-400" size={24} />}
                {showStatsModal === 'tech' && <Users className="text-green-400" size={24} />}
                <h3 className="text-xl font-bold text-white font-mono">
                  {getStatsDetails(showStatsModal as 'cases' | 'solutions' | 'tech').title}
                </h3>
              </div>
              <button 
                onClick={() => setShowStatsModal(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {getStatsDetails(showStatsModal as 'cases' | 'solutions' | 'tech').items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-black/30 border border-white/5 rounded-lg p-4 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="text-slate-400 text-xs uppercase tracking-wider font-mono mb-1">
                      {item.label}
                    </div>
                    <div className={`text-2xl font-bold font-mono ${
                      showStatsModal === 'cases' ? 'text-cyan-400' :
                      showStatsModal === 'solutions' ? 'text-purple-400' :
                      'text-green-400'
                    }`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech Domain List (only for tech stats) */}
              {showStatsModal === 'tech' && getStatsDetails('tech').techList && getStatsDetails('tech').techList.length > 0 && (
                <div className="bg-black/30 border border-white/5 rounded-lg p-6">
                  <div className="text-slate-400 text-xs uppercase tracking-wider font-mono mb-4">技術領域列表</div>
                  <div className="space-y-2">
                    {getStatsDetails('tech').techList.map((tech, idx) => (
                      <div 
                        key={idx}
                        className="flex justify-between items-center py-2 px-3 bg-black/20 rounded hover:bg-black/40 transition-colors"
                      >
                        <span className="text-white font-mono text-lg">{tech.name}</span>
                        <span className="text-green-400 font-mono text-lg font-bold">{tech.count} 人</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowStatsModal(null);
                    setIsAdminOpen(true);
                  }}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-sm transition-colors flex items-center gap-2"
                >
                  <Settings size={16} /> 前往管理後台
                </button>
              </div>
            </div>
          </div>
        </div>
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
