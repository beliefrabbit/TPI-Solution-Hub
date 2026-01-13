import React, { useState, useEffect, useRef } from 'react';
import { Tag, CaseStudy, CategoryType } from '../types';
import { storageService } from '../services/storage';
import { Trash2, Plus, Download, X, Edit2, Upload, Save, RotateCcw, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'tags'>('cases');
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Case Form States
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  
  const [caseForm, setCaseForm] = useState({
    title: '',
    description: '', // Layer 1
    imageUrl: '',    // Layer 1
    solutionDescription: '', // Layer 2
    solutionImageUrl: '',    // Layer 2
    tagIds: [] as string[],
    client: '',      // 客戶名稱
    launchDate: ''   // 案例上線日期
  });
  
  // Image upload refs
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const solutionImageInputRef = useRef<HTMLInputElement>(null);
  
  // Import/Export states
  const [duplicateCases, setDuplicateCases] = useState<Array<{existing: CaseStudy, imported: any, action: 'skip' | 'replace' | 'rename'}>>([]);
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any[]>([]);
  
  // Tag Form States
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState<CategoryType>(CategoryType.INDUSTRY);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCases(storageService.getAllCases());
    setTags(storageService.getAllTags());
  };

  const handleEditClick = (c: CaseStudy) => {
    setEditingCaseId(c.id);
    setCaseForm({
      title: c.title,
      description: c.description,
      imageUrl: c.imageUrl,
      solutionDescription: c.solutionDescription || '',
      solutionImageUrl: c.solutionImageUrl || '',
      tagIds: c.tagIds,
      client: c.client || '',
      launchDate: c.launchDate || ''
    });
    setIsEditingCase(true);
  };

  const resetCaseForm = () => {
    setCaseForm({
      title: '',
      description: '',
      imageUrl: '',
      solutionDescription: '',
      solutionImageUrl: '',
      tagIds: [],
      client: '',
      launchDate: ''
    });
    setEditingCaseId(null);
    setIsEditingCase(false);
  };
  
  // Handle image upload
  const handleImageUpload = (file: File, type: 'cover' | 'solution') => {
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'cover') {
        setCaseForm({...caseForm, imageUrl: result});
      } else {
        setCaseForm({...caseForm, solutionImageUrl: result});
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseForm.title || !caseForm.imageUrl) return;
    
    const payload = {
      title: caseForm.title,
      description: caseForm.description,
      imageUrl: caseForm.imageUrl,
      solutionDescription: caseForm.solutionDescription,
      solutionImageUrl: caseForm.solutionImageUrl,
      tagIds: caseForm.tagIds,
      client: caseForm.client,
      launchDate: caseForm.launchDate
    };

    if (editingCaseId) {
      storageService.updateCase(editingCaseId, payload);
    } else {
      storageService.addCase(payload);
    }
    
    resetCaseForm();
    refreshData();
  };

  const handleDeleteCase = (id: string) => {
    if(confirm('確認刪除此案例？警告：刪除後無法復原。')) {
      storageService.deleteCase(id);
      refreshData();
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) return;

    storageService.addTag({
      name: newTagName,
      type: newTagType
    });
    
    setNewTagName('');
    setIsAddingTag(false);
    refreshData();
  };

  const handleDeleteTag = (id: string) => {
    if(confirm('確認刪除標籤?')) {
      storageService.deleteTag(id);
      refreshData();
    }
  };

  const toggleTagSelection = (tagId: string) => {
    if (caseForm.tagIds.includes(tagId)) {
      setCaseForm({...caseForm, tagIds: caseForm.tagIds.filter(id => id !== tagId)});
    } else {
      setCaseForm({...caseForm, tagIds: [...caseForm.tagIds, tagId]});
    }
  };
  
  // Excel Export
  const handleExportExcel = () => {
    const allCases = storageService.getAllCases();
    const allTags = storageService.getAllTags();
    
    const worksheetData = allCases.map(caseItem => {
      const tagNames = caseItem.tagIds.map(tid => {
        const tag = allTags.find(t => t.id === tid);
        return tag ? tag.name : tid;
      }).join(', ');
      
      return {
        '案例標題': caseItem.title,
        '客戶': caseItem.client || '',
        '上線日期': caseItem.launchDate || '',
        '建立日期': new Date(caseItem.dateAdded).toLocaleDateString('zh-TW'),
        '簡要說明': caseItem.description,
        '標籤': tagNames,
        '封面圖片URL': caseItem.imageUrl,
        '解決方案說明': caseItem.solutionDescription || '',
        '解決方案圖片URL': caseItem.solutionImageUrl || ''
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '案例資料');
    
    XLSX.writeFile(workbook, `TPI_Solution_Hub_案例資料_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  // Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // Check for duplicates
        const existingCases = storageService.getAllCases();
        const duplicates: Array<{existing: CaseStudy, imported: any, action: 'skip' | 'replace' | 'rename'}> = [];
        
        jsonData.forEach((row: any) => {
          const title = row['案例標題'] || row['標題'] || '';
          const existing = existingCases.find(c => c.title === title);
          if (existing) {
            duplicates.push({
              existing,
              imported: row,
              action: 'skip'
            });
          }
        });
        
        // Save all import data for processing
        setPendingImportData(jsonData);
        
        if (duplicates.length > 0) {
          setDuplicateCases(duplicates);
          setShowDuplicateCheck(true);
        } else {
          processImportData(jsonData);
          setPendingImportData([]);
        }
      } catch (error) {
        alert('匯入失敗：檔案格式錯誤');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };
  
  const processImportData = (jsonData: any[]) => {
    const allTags = storageService.getAllTags();
    
    jsonData.forEach((row: any) => {
      const title = row['案例標題'] || row['標題'] || '';
      if (!title) return;
      
      // Find or create tags
      const tagNames = (row['標籤'] || '').split(',').map((t: string) => t.trim()).filter(Boolean);
      const tagIds: string[] = [];
      
      tagNames.forEach((tagName: string) => {
        let tag = allTags.find(t => t.name === tagName);
        if (!tag) {
          // Create new tag if doesn't exist
          tag = storageService.addTag({
            name: tagName,
            type: CategoryType.INDUSTRY // Default type
          });
        }
        tagIds.push(tag.id);
      });
      
      storageService.addCase({
        title,
        description: row['簡要說明'] || row['說明'] || '',
        imageUrl: row['封面圖片URL'] || row['圖片URL'] || '',
        solutionDescription: row['解決方案說明'] || '',
        solutionImageUrl: row['解決方案圖片URL'] || '',
        tagIds,
        client: row['客戶'] || '',
        launchDate: row['上線日期'] || ''
      });
    });
    
    refreshData();
    alert(`成功匯入 ${jsonData.length} 筆案例`);
  };
  
  const handleDuplicateAction = () => {
    const allTags = storageService.getAllTags();
    const existingCases = storageService.getAllCases();
    const duplicateTitles = new Set(duplicateCases.map(d => d.imported['案例標題'] || d.imported['標題']));
    
    // Process all import data
    pendingImportData.forEach((imported: any) => {
      const title = imported['案例標題'] || imported['標題'] || '';
      if (!title) return;
      
      const isDuplicate = duplicateTitles.has(title);
      if (isDuplicate) {
        // Handle duplicate based on action
        const dup = duplicateCases.find(d => (d.imported['案例標題'] || d.imported['標題']) === title);
        if (!dup || dup.action === 'skip') return;
        
        const tagNames = (imported['標籤'] || '').split(',').map((t: string) => t.trim()).filter(Boolean);
        const tagIds: string[] = [];
        
        tagNames.forEach((tagName: string) => {
          let tag = allTags.find(t => t.name === tagName);
          if (!tag) {
            tag = storageService.addTag({
              name: tagName,
              type: CategoryType.INDUSTRY
            });
          }
          tagIds.push(tag.id);
        });
        
        if (dup.action === 'replace') {
          storageService.updateCase(dup.existing.id, {
            title: imported['案例標題'] || imported['標題'] || dup.existing.title,
            description: imported['簡要說明'] || imported['說明'] || dup.existing.description,
            imageUrl: imported['封面圖片URL'] || imported['圖片URL'] || dup.existing.imageUrl,
            solutionDescription: imported['解決方案說明'] || dup.existing.solutionDescription,
            solutionImageUrl: imported['解決方案圖片URL'] || dup.existing.solutionImageUrl,
            tagIds,
            client: imported['客戶'] || dup.existing.client,
            launchDate: imported['上線日期'] || dup.existing.launchDate
          });
        } else if (dup.action === 'rename') {
          storageService.addCase({
            title: `${imported['案例標題'] || imported['標題']} (匯入)`,
            description: imported['簡要說明'] || imported['說明'] || '',
            imageUrl: imported['封面圖片URL'] || imported['圖片URL'] || '',
            solutionDescription: imported['解決方案說明'] || '',
            solutionImageUrl: imported['解決方案圖片URL'] || '',
            tagIds,
            client: imported['客戶'] || '',
            launchDate: imported['上線日期'] || ''
          });
        }
      } else {
        // Process non-duplicate cases
        const tagNames = (imported['標籤'] || '').split(',').map((t: string) => t.trim()).filter(Boolean);
        const tagIds: string[] = [];
        
        tagNames.forEach((tagName: string) => {
          let tag = allTags.find(t => t.name === tagName);
          if (!tag) {
            tag = storageService.addTag({
              name: tagName,
              type: CategoryType.INDUSTRY
            });
          }
          tagIds.push(tag.id);
        });
        
        storageService.addCase({
          title,
          description: imported['簡要說明'] || imported['說明'] || '',
          imageUrl: imported['封面圖片URL'] || imported['圖片URL'] || '',
          solutionDescription: imported['解決方案說明'] || '',
          solutionImageUrl: imported['解決方案圖片URL'] || '',
          tagIds,
          client: imported['客戶'] || '',
          launchDate: imported['上線日期'] || ''
        });
      }
    });
    
    setShowDuplicateCheck(false);
    setDuplicateCases([]);
    setPendingImportData([]);
    refreshData();
    alert('處理完成');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#05050a] border border-cyan-900/50 w-full max-w-6xl h-[90vh] rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.1)] flex flex-col overflow-hidden relative">
        
        {/* Decorative Lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-3">
            <span className="text-cyan-400">///</span> 管理控制台
          </h2>
          <div className="flex gap-4">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded text-sm transition-colors text-green-400 font-mono"
              title="匯出 Excel 檔案"
            >
              <FileSpreadsheet size={16} /> 匯出 Excel
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-sm transition-colors text-purple-400 font-mono cursor-pointer">
              <Upload size={16} /> 匯入 Excel
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
            <button 
              onClick={storageService.exportData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded text-sm transition-colors text-cyan-400 font-mono"
              title="匯出 JSON 檔案"
            >
              <Download size={16} /> 匯出 JSON
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-[#0a0a15]">
          <button 
            className={`px-8 py-4 font-mono font-bold tracking-wider ${activeTab === 'cases' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-slate-500 hover:text-white'}`}
            onClick={() => setActiveTab('cases')}
          >
            案例資料庫
          </button>
          <button 
            className={`px-8 py-4 font-mono font-bold tracking-wider ${activeTab === 'tags' ? 'text-purple-400 border-b-2 border-purple-400 bg-white/5' : 'text-slate-500 hover:text-white'}`}
            onClick={() => setActiveTab('tags')}
          >
            標籤分類
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#020205]">
          
          {/* Duplicate Check Area */}
          {showDuplicateCheck && duplicateCases.length > 0 && (
            <div className="mb-6 p-6 bg-yellow-900/20 border-2 border-yellow-500/50 rounded-xl animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-yellow-400" size={24} />
                <h3 className="text-xl font-bold text-yellow-400 font-mono">發現重複案例</h3>
              </div>
              <p className="text-slate-300 mb-4 text-sm">
                匯入的檔案中有 {duplicateCases.length} 個案例與現有案例名稱重複。請選擇處理方式：
              </p>
              
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {duplicateCases.map((dup, idx) => (
                  <div key={idx} className="bg-black/40 p-4 rounded border border-yellow-500/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-white font-mono font-bold mb-1">案例：{dup.imported['案例標題'] || dup.imported['標題']}</p>
                        <p className="text-slate-400 text-xs">現有案例建立於：{new Date(dup.existing.dateAdded).toLocaleDateString('zh-TW')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const updated = [...duplicateCases];
                            updated[idx].action = 'skip';
                            setDuplicateCases(updated);
                          }}
                          className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                            dup.action === 'skip' 
                              ? 'bg-yellow-600 text-white' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          跳過
                        </button>
                        <button
                          onClick={() => {
                            const updated = [...duplicateCases];
                            updated[idx].action = 'replace';
                            setDuplicateCases(updated);
                          }}
                          className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                            dup.action === 'replace' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          取代
                        </button>
                        <button
                          onClick={() => {
                            const updated = [...duplicateCases];
                            updated[idx].action = 'rename';
                            setDuplicateCases(updated);
                          }}
                          className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                            dup.action === 'rename' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          重新命名
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateCheck(false);
                    setDuplicateCases([]);
                  }}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-mono text-sm transition-colors"
                >
                  取消匯入
                </button>
                <button
                  onClick={handleDuplicateAction}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-mono text-sm transition-colors flex items-center gap-2"
                >
                  <Save size={16} /> 確認處理
                </button>
              </div>
            </div>
          )}
          
          {/* CASES TAB */}
          {activeTab === 'cases' && (
            <>
              {!isEditingCase && (
                <div className="flex justify-end mb-6">
                  <button 
                    onClick={() => { resetCaseForm(); setIsEditingCase(true); }}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-mono font-bold tracking-wider"
                  >
                    <Plus size={18} /> 建立項目
                  </button>
                </div>
              )}

              {isEditingCase && (
                <form onSubmit={handleSaveCase} className="mb-8 p-8 bg-white/5 rounded-xl border border-cyan-500/30 animate-in slide-in-from-top-4">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-cyan-400 font-mono">
                      {editingCaseId ? '編輯安全記錄' : '新增安全記錄'}
                    </h3>
                    <button type="button" onClick={resetCaseForm} className="text-slate-500 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Layer 1 Info */}
                    <div className="space-y-4">
                      <h4 className="text-white font-mono border-l-4 border-cyan-500 pl-3">層級 1：預覽</h4>
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">標題</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                          value={caseForm.title}
                          onChange={e => setCaseForm({...caseForm, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">封面圖片</label>
                        <div className="flex gap-2 mb-2">
                          <input 
                            type="url" 
                            placeholder="或輸入圖片網址 https://..."
                            className="flex-1 bg-black/50 border border-slate-700 rounded p-3 text-cyan-300 font-mono text-sm focus:border-cyan-400 focus:outline-none"
                            value={caseForm.imageUrl}
                            onChange={e => setCaseForm({...caseForm, imageUrl: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => coverImageInputRef.current?.click()}
                            className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded text-cyan-400 text-sm font-mono flex items-center gap-2 transition-colors"
                          >
                            <Upload size={16} /> 上傳
                          </button>
                          <input
                            ref={coverImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'cover');
                            }}
                          />
                        </div>
                        {caseForm.imageUrl && (
                          <div className="mt-2 w-full h-32 rounded border border-white/10 overflow-hidden">
                            <img src={caseForm.imageUrl} alt="預覽" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">簡短說明</label>
                        <textarea 
                          required
                          rows={4}
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-cyan-400 focus:outline-none"
                          value={caseForm.description}
                          onChange={e => setCaseForm({...caseForm, description: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Layer 2 Info */}
                    <div className="space-y-4">
                      <h4 className="text-white font-mono border-l-4 border-purple-500 pl-3">層級 2：深入分析（解決方案）</h4>
                      <div>
                         <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">解決方案圖表/圖片</label>
                        <div className="flex gap-2 mb-2">
                          <input 
                            type="url" 
                            placeholder="或輸入圖片網址 https://..."
                            className="flex-1 bg-black/50 border border-slate-700 rounded p-3 text-purple-300 font-mono text-sm focus:border-purple-400 focus:outline-none"
                            value={caseForm.solutionImageUrl}
                            onChange={e => setCaseForm({...caseForm, solutionImageUrl: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => solutionImageInputRef.current?.click()}
                            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-purple-400 text-sm font-mono flex items-center gap-2 transition-colors"
                          >
                            <Upload size={16} /> 上傳
                          </button>
                          <input
                            ref={solutionImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'solution');
                            }}
                          />
                        </div>
                        {caseForm.solutionImageUrl && (
                          <div className="mt-2 w-full h-32 rounded border border-white/10 overflow-hidden">
                            <img src={caseForm.solutionImageUrl} alt="預覽" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                       <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">詳細解決方案說明</label>
                        <textarea 
                          rows={6}
                          placeholder="技術細節、架構、成果..."
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-purple-400 focus:outline-none"
                          value={caseForm.solutionDescription}
                          onChange={e => setCaseForm({...caseForm, solutionDescription: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Admin-only fields */}
                    <div className="md:col-span-2 mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-white font-mono border-l-4 border-yellow-500 pl-3 mb-4">後台管理欄位（不顯示在前台）</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">客戶名稱</label>
                          <input 
                            type="text" 
                            placeholder="輸入客戶名稱"
                            className="w-full bg-black/50 border border-slate-700 rounded p-3 text-yellow-300 font-mono text-sm focus:border-yellow-400 focus:outline-none"
                            value={caseForm.client}
                            onChange={e => setCaseForm({...caseForm, client: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">案例上線日期</label>
                          <input 
                            type="date" 
                            className="w-full bg-black/50 border border-slate-700 rounded p-3 text-yellow-300 font-mono text-sm focus:border-yellow-400 focus:outline-none"
                            value={caseForm.launchDate}
                            onChange={e => setCaseForm({...caseForm, launchDate: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="md:col-span-2 mt-4 pt-4 border-t border-white/10">
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-3">系統標籤</label>
                      <div className="flex flex-wrap gap-2 p-4 bg-black/30 rounded border border-white/5">
                        {tags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTagSelection(tag.id)}
                            className={`px-3 py-1.5 rounded-sm font-mono text-xs transition-all border ${
                              caseForm.tagIds.includes(tag.id) 
                              ? 'bg-cyan-900/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                              : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                            }`}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-8">
                    <button type="button" onClick={resetCaseForm} className="px-6 py-2 text-slate-400 hover:text-white font-mono">取消操作</button>
                    <button type="submit" className="flex items-center gap-2 px-8 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-sm text-white font-bold tracking-wide shadow-lg shadow-cyan-900/50">
                      <Save size={18} /> 儲存記錄
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4">
                {cases.map(item => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded border border-white/10 hover:border-cyan-500/50 transition-all group">
                    <div className="w-full md:w-48 h-32 relative overflow-hidden rounded border border-white/5">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-white font-mono">{item.title}</h4>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-400">建立：{new Date(item.dateAdded).toLocaleDateString('zh-TW')}</span>
                      </div>
                      {(item.client || item.launchDate) && (
                        <div className="flex gap-3 mb-2 text-xs text-yellow-400/70 font-mono">
                          {item.client && <span>客戶：{item.client}</span>}
                          {item.launchDate && <span>上線：{item.launchDate}</span>}
                        </div>
                      )}
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2 border-l-2 border-cyan-800 pl-3">{item.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.tagIds.map(tid => {
                          const tag = tags.find(t => t.id === tid);
                          return tag ? (
                            <span key={tid} className="text-[10px] font-mono px-2 py-0.5 bg-black/40 border border-white/10 rounded text-slate-300">
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 border-l border-white/10 pl-4 justify-center">
                       <button 
                        onClick={() => handleEditClick(item)}
                        className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors flex items-center gap-2"
                        title="編輯"
                      >
                        <Edit2 size={18} /> <span className="text-xs font-mono hidden md:inline">編輯</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteCase(item.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors flex items-center gap-2"
                        title="刪除"
                      >
                        <Trash2 size={18} /> <span className="text-xs font-mono hidden md:inline">刪除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TAGS TAB - Keeping mostly same structure but better style */}
          {activeTab === 'tags' && (
             <>
             <div className="flex justify-end mb-6">
                <button 
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-sm shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all font-mono"
                >
                  <Plus size={18} /> 新增標籤
                </button>
              </div>

              {isAddingTag && (
                <form onSubmit={handleAddTag} className="mb-8 p-6 bg-white/5 rounded border border-purple-500/30 flex flex-col md:flex-row gap-4 items-end animate-in fade-in">
                  <div className="flex-1 w-full">
                    <label className="block text-slate-400 text-xs uppercase mb-1">標籤名稱</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-black/50 border border-slate-700 rounded p-2 text-white focus:border-purple-400 focus:outline-none"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-slate-400 text-xs uppercase mb-1">分類</label>
                    <select 
                      className="w-full bg-black/50 border border-slate-700 rounded p-2 text-white focus:border-purple-400 focus:outline-none"
                      value={newTagType}
                      onChange={e => setNewTagType(e.target.value as CategoryType)}
                    >
                      <option value={CategoryType.INDUSTRY}>{CategoryType.INDUSTRY}</option>
                      <option value={CategoryType.BUSINESS}>{CategoryType.BUSINESS}</option>
                      <option value={CategoryType.TREND}>{CategoryType.TREND}</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsAddingTag(false)} className="px-4 py-2 text-slate-400 hover:text-white">取消</button>
                    <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white whitespace-nowrap">儲存標籤</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tags.map(tag => (
                  <div key={tag.id} className="flex justify-between items-center bg-[#0a0a15] p-3 rounded border border-white/5 hover:border-white/20 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-white font-mono">{tag.name}</span>
                      <span className={`text-[10px] uppercase tracking-wide mt-1 ${
                        tag.type === CategoryType.INDUSTRY ? 'text-blue-400' :
                        tag.type === CategoryType.BUSINESS ? 'text-green-400' :
                        'text-purple-400'
                      }`}>
                        {tag.type}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
             </>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
