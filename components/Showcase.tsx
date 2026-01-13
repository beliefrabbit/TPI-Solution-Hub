import React, { useMemo, useState } from 'react';
import { CaseStudy, Tag, CategoryType } from '../types';
import { ArrowUpRight, X, Layers, Database, Mic, Search, Sparkles } from 'lucide-react';

interface ShowcaseProps {
  cases: CaseStudy[];
  tags: Tag[];
  activeCategory: CategoryType | 'ALL';
  activeTagId: string | null;
  onCategoryChange: (cat: CategoryType | 'ALL') => void;
  onTagSelect: (id: string | null) => void;
}

const Showcase: React.FC<ShowcaseProps> = ({ cases, tags }) => {
  
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  
  // New Filter State
  const [aiQuery, setAiQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Split tags by category
  const industryTags = useMemo(() => tags.filter(t => t.type === CategoryType.INDUSTRY), [tags]);
  const businessTags = useMemo(() => tags.filter(t => t.type === CategoryType.BUSINESS), [tags]);
  const trendTags = useMemo(() => tags.filter(t => t.type === CategoryType.TREND), [tags]);

  const toggleTag = (id: string) => {
    if (selectedTags.includes(id)) {
      setSelectedTags(selectedTags.filter(t => t !== id));
    } else {
      setSelectedTags([...selectedTags, id]);
    }
  };

  const isTagSelected = (id: string) => selectedTags.includes(id);

  const resetCategoryTags = (categoryTags: Tag[]) => {
    const categoryTagIds = categoryTags.map(t => t.id);
    setSelectedTags(selectedTags.filter(id => !categoryTagIds.includes(id)));
  };

  // Advanced Filtering Logic
  const filteredCases = useMemo(() => {
    let result = cases;

    // 1. AI Text Filter (Fuzzy simulation)
    if (aiQuery.trim()) {
      const q = aiQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        (c.solutionDescription && c.solutionDescription.toLowerCase().includes(q))
      );
    }

    // 2. Tag Filter (Intersection: Show case if it has ANY of the selected tags)
    // If no tags selected, show all (filtered by text)
    if (selectedTags.length > 0) {
      result = result.filter(c => 
        c.tagIds.some(tagId => selectedTags.includes(tagId))
      );
    }

    return result;
  }, [cases, aiQuery, selectedTags]);

  const getTagName = (id: string) => tags.find(t => t.id === id)?.name || id;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-20 relative z-20 mt-4">
      
      {/* AI COMMAND CENTER */}
      <div className="relative z-30 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Background Glow */}
        <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="glass-panel rounded-2xl p-4 md:p-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,243,255,0.1)] relative overflow-hidden">
          
          {/* Animated decorative lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-pulse"></div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            
            {/* AI Visualizer */}
            <div className="flex flex-col items-center justify-center w-full md:w-1/4 h-[54px] bg-black/20 rounded-xl border border-white/5 relative group flex-shrink-0">
              <div className="flex items-center gap-1 h-12">
                 {[...Array(5)].map((_, i) => (
                   <div 
                      key={i} 
                      className="w-2 bg-cyan-400 rounded-full animate-float"
                      style={{ 
                        height: '40%', 
                        animationDuration: `${0.8 + Math.random()}s`,
                        animationDelay: `${i * 0.1}s`
                      }}
                   ></div>
                 ))}
              </div>
              <span className="text-[10px] font-mono text-cyan-400 mt-2 tracking-widest uppercase flex items-center gap-2">
                <Sparkles size={10} /> AI 代理啟用
              </span>
              <div className="absolute inset-x-0 top-2 bottom-0 bg-gradient-to-t from-cyan-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            </div>

            {/* Input Area */}
            <div className="flex-1 w-full">
               <div className="relative group">
                 <input 
                    type="text" 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="例如：'AI 金融詐欺防範' 或 'ESG 製造'"
                    className="w-full bg-[#05050a] border border-slate-700 rounded-lg h-[54px] pl-12 pr-4 text-white placeholder-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                 />
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
                 {aiQuery && (
                   <button onClick={() => setAiQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                     <X size={18} />
                   </button>
                 )}
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3-COLUMN CATEGORY MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-20">
        
        {/* Column 1: Industry */}
        <div className="bg-[#0a0a12]/80 border-t-2 border-cyan-600 p-4 rounded-b-xl backdrop-blur-sm">
           <h4 className="text-cyan-400 font-mono font-bold tracking-widest mb-4 flex justify-between items-center">
             01 // 產業別
             <button
               onClick={() => resetCategoryTags(industryTags)}
               className="text-[10px] bg-cyan-900/30 hover:bg-cyan-800/50 px-2 py-0.5 rounded text-cyan-200 transition-colors cursor-pointer"
               title="重置此分類的選項"
             >
               重置
             </button>
           </h4>
           <div className="flex flex-wrap gap-2">
             {industryTags.map(tag => (
               <button
                 key={tag.id}
                 onClick={() => toggleTag(tag.id)}
                 className={`px-3 py-1.5 rounded-sm text-xs font-mono transition-all border ${
                   isTagSelected(tag.id)
                   ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.5)]'
                   : 'bg-black/40 text-slate-400 border-white/10 hover:border-cyan-500/50 hover:text-white'
                 }`}
               >
                 {tag.name}
               </button>
             ))}
           </div>
        </div>

        {/* Column 2: Business */}
        <div className="bg-[#0a0a12]/80 border-t-2 border-purple-600 p-4 rounded-b-xl backdrop-blur-sm">
           <h4 className="text-purple-400 font-mono font-bold tracking-widest mb-4 flex justify-between items-center">
             02 // 業務別
             <button
               onClick={() => resetCategoryTags(businessTags)}
               className="text-[10px] bg-purple-900/30 hover:bg-purple-800/50 px-2 py-0.5 rounded text-purple-200 transition-colors cursor-pointer"
               title="重置此分類的選項"
             >
               重置
             </button>
           </h4>
           <div className="flex flex-wrap gap-2">
             {businessTags.map(tag => (
               <button
                 key={tag.id}
                 onClick={() => toggleTag(tag.id)}
                 className={`px-3 py-1.5 rounded-sm text-xs font-mono transition-all border ${
                   isTagSelected(tag.id)
                   ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                   : 'bg-black/40 text-slate-400 border-white/10 hover:border-purple-500/50 hover:text-white'
                 }`}
               >
                 {tag.name}
               </button>
             ))}
           </div>
        </div>

        {/* Column 3: Trends */}
        <div className="bg-[#0a0a12]/80 border-t-2 border-green-500 p-4 rounded-b-xl backdrop-blur-sm">
           <h4 className="text-green-400 font-mono font-bold tracking-widest mb-4 flex justify-between items-center">
             03 // 趨勢科技
             <button
               onClick={() => resetCategoryTags(trendTags)}
               className="text-[10px] bg-green-900/30 hover:bg-green-800/50 px-2 py-0.5 rounded text-green-200 transition-colors cursor-pointer"
               title="重置此分類的選項"
             >
               重置
             </button>
           </h4>
           <div className="flex flex-wrap gap-2">
             {trendTags.map(tag => (
               <button
                 key={tag.id}
                 onClick={() => toggleTag(tag.id)}
                 className={`px-3 py-1.5 rounded-sm text-xs font-mono transition-all border ${
                   isTagSelected(tag.id)
                   ? 'bg-green-600 text-white border-green-500 shadow-[0_0_10px_rgba(22,163,74,0.5)]'
                   : 'bg-black/40 text-slate-400 border-white/10 hover:border-green-500/50 hover:text-white'
                 }`}
               >
                 {tag.name}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCases.length > 0 ? (
          filteredCases.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedCase(item)}
              className="group relative bg-[#0a0a12] border border-white/5 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-500 cursor-pointer flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,243,255,0.2)]"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Image Container */}
              <div className="relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent z-10 opacity-80"></div>
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0"
                />
                <div className="absolute top-0 right-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="bg-cyan-500 text-black px-3 py-1 font-mono text-xs font-bold rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                      存取
                   </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col relative z-20">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors font-mono">
                    {item.title}
                  </h3>
                  <div className="w-8 h-0.5 bg-cyan-900 rounded-full mb-4 transform origin-left group-hover:scale-x-[3] group-hover:bg-cyan-400 transition-all duration-500"></div>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-white/5">
                  {item.tagIds.slice(0, 6).map(tid => (
                    <span key={tid} className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-white/5 border border-white/5 rounded text-slate-500 group-hover:border-cyan-500/30 group-hover:text-cyan-200 transition-colors">
                      {getTagName(tid)}
                    </span>
                  ))}
                  {item.tagIds.length > 6 && <span className="text-[10px] text-slate-600">+{item.tagIds.length - 6}</span>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center border border-white/5 rounded-2xl bg-black/20">
            <p className="text-slate-600 text-xl font-mono animate-pulse">掃描中... 未找到資料。</p>
            <button onClick={() => {setAiQuery(''); setSelectedTags([])}} className="mt-4 text-cyan-400 hover:text-white underline font-mono text-sm">
              重置參數
            </button>
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Level 2) */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedCase(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#05050a] border border-cyan-500/20 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCase(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
            >
              <X size={24} />
            </button>

            {/* Left Side: Images */}
            <div className="w-full md:w-1/2 h-[40vh] md:h-auto overflow-y-auto bg-black relative">
               <div className="sticky top-0 z-10 p-2 pointer-events-none">
                 <span className="bg-black/70 backdrop-blur text-white text-xs px-2 py-1 font-mono border border-white/10">圖 1.0：概覽</span>
               </div>
               <img src={selectedCase.imageUrl} className="w-full object-cover mb-1 opacity-90" alt="Main" />
               
               {selectedCase.solutionImageUrl && (
                 <>
                  <div className="sticky top-0 z-10 p-2 pointer-events-none mt-4">
                    <span className="bg-cyan-900/70 backdrop-blur text-cyan-100 text-xs px-2 py-1 font-mono border border-cyan-500/30">圖 2.0：解決方案架構</span>
                  </div>
                  <img src={selectedCase.solutionImageUrl} className="w-full object-cover border-t border-cyan-500/20" alt="Solution" />
                 </>
               )}
            </div>

            {/* Right Side: Information */}
            <div className="w-full md:w-1/2 overflow-y-auto p-8 md:p-12 bg-gradient-to-br from-[#0a0a15] to-[#020204]">
              
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCase.tagIds.map(tid => (
                    <span key={tid} className="px-3 py-1 bg-white/5 border border-white/10 text-cyan-400 text-xs font-mono rounded-full">
                      {getTagName(tid)}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white font-mono leading-tight mb-2">
                  {selectedCase.title}
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"></div>
              </div>

              {/* Layer 1: Challenge/Overview */}
              <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Layers size={16} /> 案例概覽
                </h3>
                <p className="text-lg text-slate-300 leading-relaxed font-light border-l-2 border-slate-700 pl-6">
                  {selectedCase.description}
                </p>
              </div>

              {/* Layer 2: Solution Details */}
              {(selectedCase.solutionDescription || selectedCase.solutionImageUrl) && (
                <div className="p-6 bg-cyan-900/10 border border-cyan-500/10 rounded-xl animate-in slide-in-from-bottom-4 duration-500 delay-200">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Database size={16} /> 解決方案架構
                  </h3>
                  <p className="text-slate-300 leading-relaxed font-mono text-sm">
                    {selectedCase.solutionDescription || "此記錄的技術解決方案詳情尚未解密。"}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Showcase;
