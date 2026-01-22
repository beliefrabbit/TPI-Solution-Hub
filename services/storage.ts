import { CaseStudy, Tag, AppState, TechDomain } from '../types';
import { INITIAL_CASES, INITIAL_TAGS } from '../constants';

const STORAGE_KEY = 'nexus_showcase_db_v2';

const saveState = (state: AppState) => {
  try {
    const dataStr = JSON.stringify(state);
    const sizeMB = new Blob([dataStr]).size / 1024 / 1024;
    
    // 檢查數據大小
    if (sizeMB > 4.5) {
      console.warn(`⚠️ 數據大小: ${sizeMB.toFixed(2)} MB，接近 localStorage 限制`);
    }
    
    localStorage.setItem(STORAGE_KEY, dataStr);
  } catch (error: any) {
    console.error('儲存失敗:', error);
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      throw new Error('localStorage 空間不足，請清除瀏覽器緩存或移除部分數據');
    }
    throw error;
  }
};

const loadState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const state = JSON.parse(stored);
    
    // 合併初始案例：找出 localStorage 中不存在的初始案例 ID，並添加它們
    const existingCaseIds = new Set(state.cases.map((c: CaseStudy) => c.id));
    const missingInitialCases = INITIAL_CASES.filter(c => !existingCaseIds.has(c.id));
    
    if (missingInitialCases.length > 0) {
      // 將缺失的初始案例添加到現有案例中
      state.cases = [...missingInitialCases, ...state.cases];
      // 保存更新後的狀態
      saveState(state);
    }
    
    // 合併初始標籤：確保所有初始標籤都存在
    const existingTagIds = new Set(state.tags.map((t: Tag) => t.id));
    const missingInitialTags = INITIAL_TAGS.filter(t => !existingTagIds.has(t.id));
    
    if (missingInitialTags.length > 0) {
      state.tags = [...state.tags, ...missingInitialTags];
      saveState(state);
    }
    
    return state;
  }
  return {
    cases: INITIAL_CASES,
    tags: INITIAL_TAGS,
    techDomains: []
  };
};

export const storageService = {
  getStats: () => {
    const state = loadState();
    // 計算不重複的客戶數量
    const uniqueClients = new Set(state.cases.map(c => c.client).filter(Boolean));
    const clientCount = uniqueClients.size;
    
    return {
      caseCount: clientCount, // 成功案例顯示客戶數量
      tagCount: (state.techDomains && state.techDomains.length > 0) ? state.techDomains.length : state.tags.length,
      scenarioCount: state.cases.length // 解決方案顯示成功案例數量（案例總數）
    };
  },

  getAllCases: (): CaseStudy[] => {
    return loadState().cases;
  },

  getAllTags: (): Tag[] => {
    return loadState().tags;
  },

  addCase: (newCase: Omit<CaseStudy, 'id' | 'dateAdded'>): CaseStudy => {
    const state = loadState();
    const caseItem: CaseStudy = {
      ...newCase,
      id: `c_${Date.now()}`,
      dateAdded: Date.now()
    };
    state.cases = [caseItem, ...state.cases];
    saveState(state);
    return caseItem;
  },

  updateCase: (id: string, updatedFields: Partial<CaseStudy>): CaseStudy | null => {
    const state = loadState();
    const index = state.cases.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    state.cases[index] = { ...state.cases[index], ...updatedFields };
    saveState(state);
    return state.cases[index];
  },

  deleteCase: (id: string) => {
    const state = loadState();
    state.cases = state.cases.filter(c => c.id !== id);
    saveState(state);
  },

  addTag: (newTag: Omit<Tag, 'id'>): Tag => {
    const state = loadState();
    const tag: Tag = {
      ...newTag,
      id: `t_${Date.now()}`
    };
    state.tags.push(tag);
    saveState(state);
    return tag;
  },

  deleteTag: (id: string) => {
    const state = loadState();
    state.tags = state.tags.filter(t => t.id !== id);
    // Also remove this tag from any cases
    state.cases = state.cases.map(c => ({
      ...c,
      tagIds: c.tagIds.filter(tid => tid !== id)
    }));
    saveState(state);
  },

  getAllTechDomains: (): TechDomain[] => {
    const state = loadState();
    return state.techDomains || [];
  },

  addTechDomain: (newTechDomain: Omit<TechDomain, 'id'>): TechDomain => {
    const state = loadState();
    if (!state.techDomains) state.techDomains = [];
    const techDomain: TechDomain = {
      ...newTechDomain,
      id: `tech_${Date.now()}`
    };
    state.techDomains.push(techDomain);
    saveState(state);
    return techDomain;
  },

  updateTechDomain: (id: string, updatedFields: Partial<TechDomain>): TechDomain | null => {
    const state = loadState();
    if (!state.techDomains) return null;
    const index = state.techDomains.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    state.techDomains[index] = { ...state.techDomains[index], ...updatedFields };
    saveState(state);
    return state.techDomains[index];
  },

  deleteTechDomain: (id: string) => {
    const state = loadState();
    if (!state.techDomains) return;
    state.techDomains = state.techDomains.filter(t => t.id !== id);
    saveState(state);
  },

  exportData: () => {
    const state = loadState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "success_story_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  // 清理沒有圖片的案例
  cleanCasesWithoutImages: () => {
    const state = loadState();
    const originalCount = state.cases.length;
    const casesWithoutImage = state.cases.filter(c => !c.imageUrl || c.imageUrl.trim() === '');
    
    state.cases = state.cases.filter(c => c.imageUrl && c.imageUrl.trim() !== '');
    saveState(state);
    
    return {
      deletedCount: originalCount - state.cases.length,
      remainingCount: state.cases.length,
      deletedCases: casesWithoutImage.map(c => ({ id: c.id, title: c.title }))
    };
  }
};
