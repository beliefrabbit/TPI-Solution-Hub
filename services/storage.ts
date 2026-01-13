import { CaseStudy, Tag, AppState } from '../types';
import { INITIAL_CASES, INITIAL_TAGS } from '../constants';

const STORAGE_KEY = 'nexus_showcase_db_v2';

const loadState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    cases: INITIAL_CASES,
    tags: INITIAL_TAGS
  };
};

const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const storageService = {
  getStats: () => {
    const state = loadState();
    return {
      caseCount: state.cases.length,
      tagCount: state.tags.length,
      scenarioCount: Math.floor(state.cases.length * 1.5) // Simulated metric
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

  exportData: () => {
    const state = loadState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "success_story_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};
