import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tag, CaseStudy, CategoryType, TechDomain } from '../types';
import { storageService } from '../services/storage';
import { Trash2, Plus, Download, X, Edit2, Upload, Save, RotateCcw, FileSpreadsheet, AlertTriangle, ChevronDown, ChevronUp, Users, Briefcase, Code, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'tags' | 'stats' | 'incomplete'>('cases');
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [techDomains, setTechDomains] = useState<TechDomain[]>([]);
  
  // Case Form States
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  
  const [caseForm, setCaseForm] = useState({
    title: '',              // 項目名稱
    description: '',         // 摘要概述 (Layer 1)
    imageUrl: '',           // Layer 1
    solutionDescription: '', // Layer 2
    solutionImageUrl: '',    // Layer 2
    tagIds: [] as string[],
    client: '',             // 客戶名稱
    launchDate: '',         // 案例上線日期
    highlights: '',         // 亮點
    features: ''            // 建置功能
  });
  
  // AI Image Generation states
  const [isGeneratingCoverImage, setIsGeneratingCoverImage] = useState(false);
  const [isGeneratingSolutionImage, setIsGeneratingSolutionImage] = useState(false);
  
  // Image upload refs
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const solutionImageInputRef = useRef<HTMLInputElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  
  // Import/Export states
  const [duplicateCases, setDuplicateCases] = useState<Array<{existing: CaseStudy, imported: any, action: 'skip' | 'replace' | 'rename'}>>([]);
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any[]>([]);
  
  // Tag Form States
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState<CategoryType>(CategoryType.INDUSTRY);
  
  // Case Search and Pagination States
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [currentCasePage, setCurrentCasePage] = useState(1);
  const casesPerPageAdmin = 10;
  
  // Tech Domain Form States
  const [isAddingTechDomain, setIsAddingTechDomain] = useState(false);
  const [isEditingTechDomain, setIsEditingTechDomain] = useState(false);
  const [editingTechDomainId, setEditingTechDomainId] = useState<string | null>(null);
  const [techDomainForm, setTechDomainForm] = useState({ name: '', count: 0 });
  const [expandedTechDomains, setExpandedTechDomains] = useState<Set<string>>(new Set());
  
  // Success notification state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  // Handle ESC key to close edit form and prevent body scroll when modal is open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditingCase) {
        resetCaseForm();
      }
    };
    
    if (isEditingCase) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isEditingCase]);

  const refreshData = () => {
    setCases(storageService.getAllCases());
    setTags(storageService.getAllTags());
    setTechDomains(storageService.getAllTechDomains());
  };

  // Filter incomplete cases (missing image or content)
  const incompleteCases = useMemo(() => {
    return cases.filter(c => {
      const hasNoImage = !c.imageUrl || c.imageUrl.trim() === '';
      const hasNoDescription = !c.description || c.description.trim() === '';
      const hasNoTitle = !c.title || c.title.trim() === '';
      return hasNoImage || hasNoDescription || hasNoTitle;
    });
  }, [cases]);

  // Filter and paginate cases for admin panel
  const filteredAdminCases = useMemo(() => {
    let result = cases;
    
    // Search filter (fuzzy match)
    if (caseSearchQuery.trim()) {
      const query = caseSearchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        (c.client && c.client.toLowerCase().includes(query)) ||
        (c.highlights && c.highlights.toLowerCase().includes(query)) ||
        (c.features && c.features.toLowerCase().includes(query)) ||
        c.tagIds.some(tid => {
          const tag = tags.find(t => t.id === tid);
          return tag && tag.name.toLowerCase().includes(query);
        })
      );
    }
    
    return result;
  }, [cases, caseSearchQuery, tags]);

  const adminTotalPages = Math.ceil(filteredAdminCases.length / casesPerPageAdmin);
  const adminStartIndex = (currentCasePage - 1) * casesPerPageAdmin;
  const adminEndIndex = adminStartIndex + casesPerPageAdmin;
  const paginatedAdminCases = filteredAdminCases.slice(adminStartIndex, adminEndIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentCasePage(1);
  }, [caseSearchQuery]);

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
      launchDate: c.launchDate || '',
      highlights: c.highlights || '',
      features: c.features || ''
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
      launchDate: '',
      highlights: '',
      features: ''
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
    
    // 檔案大小限制：20MB (20 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const confirmed = confirm(
        `圖片檔案較大 (${fileSizeMB} MB)，轉換為 base64 後可能會超過 localStorage 容量限制。\n\n` +
        `建議：\n` +
        `1. 使用圖片 URL（如 Google Drive 連結）\n` +
        `2. 壓縮圖片後再上傳\n\n` +
        `仍要繼續上傳嗎？`
      );
      if (!confirmed) {
        return;
      }
    }
    
    // 如果檔案超過 5MB，嘗試壓縮
    const COMPRESS_THRESHOLD = 5 * 1024 * 1024; // 5MB
    if (file.size > COMPRESS_THRESHOLD) {
      // 創建圖片並壓縮
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // 計算壓縮後的尺寸（最大寬度 1920px）
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          } else {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 繪製並壓縮（品質 0.85）
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        if (type === 'cover') {
          setCaseForm({...caseForm, imageUrl: compressedDataUrl});
        } else {
          setCaseForm({...caseForm, solutionImageUrl: compressedDataUrl});
        }
      };
      
      img.onerror = () => {
        // 如果壓縮失敗，使用原始方式
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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // 小檔案直接讀取
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
    }
  };

  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseForm.title) {
      alert('請填寫必填欄位：項目名稱');
      return;
    }
    
    const payload = {
      title: caseForm.title,
      description: caseForm.description,
      imageUrl: caseForm.imageUrl,
      solutionDescription: caseForm.solutionDescription,
      solutionImageUrl: caseForm.solutionImageUrl,
      tagIds: caseForm.tagIds,
      client: caseForm.client,
      launchDate: caseForm.launchDate,
      highlights: caseForm.highlights,
      features: caseForm.features
    };

    try {
      if (editingCaseId) {
        storageService.updateCase(editingCaseId, payload);
        setSuccessMessage('案例已成功更新！');
      } else {
        storageService.addCase(payload);
        setSuccessMessage('案例已成功新增！');
      }
      
      resetCaseForm();
      refreshData();
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('儲存失敗:', error);
      const errorMessage = error.message || '儲存失敗，請稍後再試';
      if (errorMessage.includes('空間不足')) {
        alert(`儲存失敗：${errorMessage}\n\n建議：\n1. 清除瀏覽器緩存\n2. 移除部分圖片數據\n3. 使用較小的圖片`);
      } else {
        alert(`儲存失敗：${errorMessage}`);
      }
    }
  };
  
  // AI Image Generation using Gemini API
  const generateImageWithAI = async (type: 'cover' | 'solution') => {
    const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert('請先設置 GEMINI_API_KEY 環境變數');
      return;
    }
    
    if (type === 'cover') {
      setIsGeneratingCoverImage(true);
    } else {
      setIsGeneratingSolutionImage(true);
    }
    
    try {
      // Build prompt based on case information
      const allTags = storageService.getAllTags();
      const industryTags = caseForm.tagIds
        .map(id => allTags.find(t => t.id === id && t.type === CategoryType.INDUSTRY))
        .filter(Boolean)
        .map(t => t!.name);
      
      const context = `
項目名稱：${caseForm.title}
客戶：${caseForm.client || '未指定'}
產業別：${industryTags.join('、') || '未指定'}
摘要概述：${caseForm.description}
亮點：${caseForm.highlights || '未指定'}
建置功能：${caseForm.features || '未指定'}
${type === 'solution' ? `解決方案說明：${caseForm.solutionDescription || '未指定'}` : ''}
      `.trim();
      
      const prompt = type === 'cover' 
        ? `請為以下案例生成一張專業的封面圖片提示詞（prompt），用於 AI 圖片生成服務（如 DALL-E、Midjourney、Stable Diffusion）。圖片應該體現案例的核心價值和技術特色。

要求：
1. 提示詞必須是英文
2. 描述要具體、詳細，包含視覺元素、風格、色彩、構圖等
3. 適合用於專業商業案例展示
4. 長度約 50-100 字

案例資訊：
${context}

請只輸出圖片生成提示詞，不要包含其他說明文字。`
        : `請為以下案例的解決方案圖表生成一張專業的技術架構圖提示詞（prompt），用於 AI 圖片生成服務（如 DALL-E、Midjourney、Stable Diffusion）。圖片應該呈現解決方案的技術架構和流程。

要求：
1. 提示詞必須是英文
2. 描述要具體、詳細，包含技術元素、架構圖風格、流程方向等
3. 適合用於專業技術文檔和簡報
4. 長度約 50-100 字

案例資訊：
${context}

請只輸出圖片生成提示詞，不要包含其他說明文字。`;
      
      // Call Gemini API to generate image prompt
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'API 請求失敗');
      }
      
      const data = await response.json();
      const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      if (!generatedPrompt) {
        throw new Error('未能生成圖片提示詞');
      }
      
      // Show the generated prompt and allow user to copy or use it
      const userConfirmed = confirm(
        `AI 已生成圖片提示詞：\n\n${generatedPrompt}\n\n點擊「確定」將提示詞複製到剪貼簿，然後您可以使用圖片生成服務（如 DALL-E、Midjourney）生成圖片後上傳。\n\n點擊「取消」僅查看提示詞。`
      );
      
      if (userConfirmed) {
        // Copy to clipboard
        navigator.clipboard.writeText(generatedPrompt).then(() => {
          alert('提示詞已複製到剪貼簿！\n\n請使用圖片生成服務生成圖片後，將圖片 URL 貼上到圖片欄位。');
        }).catch(() => {
          alert(`請手動複製以下提示詞：\n\n${generatedPrompt}`);
        });
      }
      
    } catch (error) {
      console.error('AI 生圖錯誤:', error);
      alert('AI 生圖失敗，請檢查 API 金鑰設置或稍後再試');
    } finally {
      if (type === 'cover') {
        setIsGeneratingCoverImage(false);
      } else {
        setIsGeneratingSolutionImage(false);
      }
    }
  };

  const handleDeleteCase = (id: string) => {
    const caseToDelete = cases.find(c => c.id === id);
    const caseTitle = caseToDelete ? caseToDelete.title : '此案例';
    
    if(confirm(`確認刪除「${caseTitle}」？\n\n警告：刪除後無法復原。`)) {
      try {
        // 先從 localStorage 刪除
        storageService.deleteCase(id);
        console.log('案例已從存儲中刪除，ID:', id);
        
        // 重新載入所有數據以確保狀態同步
        const allCases = storageService.getAllCases();
        const allTags = storageService.getAllTags();
        const allTechDomains = storageService.getAllTechDomains();
        
        // 更新所有狀態
        setCases(allCases);
        setTags(allTags);
        setTechDomains(allTechDomains);
        
        // 計算過濾後的案例
        const remainingFiltered = allCases.filter(c => {
          if (caseSearchQuery.trim()) {
            const query = caseSearchQuery.toLowerCase();
            return c.title.toLowerCase().includes(query) ||
                   c.description.toLowerCase().includes(query) ||
                   (c.client && c.client.toLowerCase().includes(query)) ||
                   (c.highlights && c.highlights.toLowerCase().includes(query)) ||
                   (c.features && c.features.toLowerCase().includes(query)) ||
                   c.tagIds.some(tid => {
                     const tag = allTags.find(t => t.id === tid);
                     return tag && tag.name.toLowerCase().includes(query);
                   });
          }
          return true;
        });
        
        // 調整分頁
        const maxPage = Math.ceil(remainingFiltered.length / casesPerPageAdmin);
        if (maxPage === 0) {
          setCurrentCasePage(1);
        } else if (currentCasePage > maxPage) {
          setCurrentCasePage(maxPage);
        }
        
        setSuccessMessage('案例已成功刪除！');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('刪除失敗:', error);
        alert('刪除失敗，請稍後再試');
        // 如果刪除失敗，重新載入數據
        refreshData();
      }
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) return;

    try {
      storageService.addTag({
        name: newTagName,
        type: newTagType
      });
      
      setNewTagName('');
      setIsAddingTag(false);
      refreshData();
      
      setSuccessMessage('標籤已成功新增！');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('新增標籤失敗:', error);
      alert('新增標籤失敗，請稍後再試');
    }
  };

  const handleDeleteTag = (id: string) => {
    if(confirm('確認刪除標籤?')) {
      storageService.deleteTag(id);
      refreshData();
    }
  };

  // Tech Domain Handlers
  const handleSaveTechDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techDomainForm.name || techDomainForm.count < 0) {
      alert('請填寫技術領域名稱和人員數量');
      return;
    }
    
    try {
      if (editingTechDomainId) {
        storageService.updateTechDomain(editingTechDomainId, techDomainForm);
        setSuccessMessage('技術領域已成功更新！');
      } else {
        storageService.addTechDomain(techDomainForm);
        setSuccessMessage('技術領域已成功新增！');
      }
      
      setTechDomainForm({ name: '', count: 0 });
      setEditingTechDomainId(null);
      setIsEditingTechDomain(false);
      setIsAddingTechDomain(false);
      refreshData();
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('儲存技術領域失敗:', error);
      alert('儲存失敗，請稍後再試');
    }
  };

  const handleEditTechDomain = (techDomain: TechDomain) => {
    setTechDomainForm({ name: techDomain.name, count: techDomain.count });
    setEditingTechDomainId(techDomain.id);
    setIsEditingTechDomain(true);
    setIsAddingTechDomain(true);
  };

  const handleDeleteTechDomain = (id: string) => {
    if(confirm('確認刪除此技術領域?')) {
      storageService.deleteTechDomain(id);
      refreshData();
    }
  };

  const toggleTechDomainExpand = (id: string) => {
    const newExpanded = new Set(expandedTechDomains);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTechDomains(newExpanded);
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
      // Extract industry tags
      const industryTags = caseItem.tagIds
        .map(tid => {
          const tag = allTags.find(t => t.id === tid);
          return tag && tag.type === CategoryType.INDUSTRY ? tag.name : null;
        })
        .filter(Boolean)
        .join(', ');
      
      // Extract all tags
      const allTagNames = caseItem.tagIds.map(tid => {
        const tag = allTags.find(t => t.id === tid);
        return tag ? tag.name : tid;
      }).join(', ');
      
      return {
        '產業別': industryTags || '',
        '客戶名稱': caseItem.client || '',
        '項目名稱': caseItem.title,
        '亮點': caseItem.highlights || '',
        '建置功能': caseItem.features || '',
        '摘要概述': caseItem.description,
        '標籤': allTagNames,
        '封面圖片URL': caseItem.imageUrl,
        '解決方案說明': caseItem.solutionDescription || '',
        '解決方案圖片URL': caseItem.solutionImageUrl || '',
        '上線日期': caseItem.launchDate || '',
        '建立日期': new Date(caseItem.dateAdded).toLocaleDateString('zh-TW')
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '案例資料');
    
    XLSX.writeFile(workbook, `TPI_Solution_Hub_案例資料_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Clean cases without images or with invalid images
  const handleCleanEmptyCases = () => {
    const allCases = storageService.getAllCases();
    
    // 檢查無法顯示圖片的案例
    const casesToRemove = allCases.filter(c => {
      // 沒有封面圖片
      if (!c.imageUrl || c.imageUrl.trim() === '') {
        return true;
      }
      
      // 格式無效（不是 http 或 data:image）
      if (!c.imageUrl.startsWith('http') && !c.imageUrl.startsWith('data:image')) {
        return true;
      }
      
      // base64 格式錯誤
      if (c.imageUrl.startsWith('data:image')) {
        const parts = c.imageUrl.split(',');
        if (parts.length !== 2 || !parts[1] || parts[1].length === 0) {
          return true;
        }
        // base64 圖片過大（超過 500KB）
        if (c.imageUrl.length > 500000) {
          return true;
        }
      }
      
      return false;
    });
    
    if (casesToRemove.length === 0) {
      alert('沒有需要清理的案例！所有案例都有有效的圖片。');
      return;
    }

    const caseTitles = casesToRemove.slice(0, 10).map(c => c.title).join('\n- ');
    const moreText = casesToRemove.length > 10 ? `\n... 還有 ${casesToRemove.length - 10} 個案例` : '';
    
    const confirmed = confirm(
      `找到 ${casesToRemove.length} 個無法顯示圖片的案例：\n\n- ${caseTitles}${moreText}\n\n確定要刪除這些案例嗎？此操作無法復原。`
    );

    if (confirmed) {
      casesToRemove.forEach(c => {
        storageService.deleteCase(c.id);
      });
      refreshData();
      alert(`清理完成！\n已刪除 ${casesToRemove.length} 個案例\n剩餘 ${allCases.length - casesToRemove.length} 個案例`);
    }
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
          const title = row['項目名稱'] || row['案例標題'] || row['標題'] || '';
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
      const title = row['項目名稱'] || row['案例標題'] || row['標題'] || '';
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
        description: row['摘要概述'] || row['簡要說明'] || row['說明'] || '',
        imageUrl: row['封面圖片URL'] || row['圖片URL'] || '',
        solutionDescription: row['解決方案說明'] || '',
        solutionImageUrl: row['解決方案圖片URL'] || '',
        tagIds,
        client: row['客戶名稱'] || row['客戶'] || '',
        launchDate: row['上線日期'] || '',
        highlights: row['亮點'] || '',
        features: row['建置功能'] || ''
      });
    });
    
    refreshData();
    alert(`成功匯入 ${jsonData.length} 筆案例`);
  };
  
  const handleDuplicateAction = () => {
    const allTags = storageService.getAllTags();
    const existingCases = storageService.getAllCases();
    const duplicateTitles = new Set(duplicateCases.map(d => d.imported['項目名稱'] || d.imported['案例標題'] || d.imported['標題']));
    
    // Process all import data
    pendingImportData.forEach((imported: any) => {
      const title = imported['項目名稱'] || imported['案例標題'] || imported['標題'] || '';
      if (!title) return;
      
      const isDuplicate = duplicateTitles.has(title);
      if (isDuplicate) {
        // Handle duplicate based on action
        const dup = duplicateCases.find(d => (d.imported['項目名稱'] || d.imported['案例標題'] || d.imported['標題']) === title);
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
            title: imported['項目名稱'] || imported['案例標題'] || imported['標題'] || dup.existing.title,
            description: imported['摘要概述'] || imported['簡要說明'] || imported['說明'] || dup.existing.description,
            imageUrl: imported['封面圖片URL'] || imported['圖片URL'] || dup.existing.imageUrl,
            solutionDescription: imported['解決方案說明'] || dup.existing.solutionDescription,
            solutionImageUrl: imported['解決方案圖片URL'] || dup.existing.solutionImageUrl,
            tagIds,
            client: imported['客戶名稱'] || imported['客戶'] || dup.existing.client,
            launchDate: imported['上線日期'] || dup.existing.launchDate,
            highlights: imported['亮點'] || dup.existing.highlights,
            features: imported['建置功能'] || dup.existing.features
          });
        } else if (dup.action === 'rename') {
          storageService.addCase({
            title: `${imported['項目名稱'] || imported['案例標題'] || imported['標題']} (匯入)`,
            description: imported['摘要概述'] || imported['簡要說明'] || imported['說明'] || '',
            imageUrl: imported['封面圖片URL'] || imported['圖片URL'] || '',
            solutionDescription: imported['解決方案說明'] || '',
            solutionImageUrl: imported['解決方案圖片URL'] || '',
            tagIds,
            client: imported['客戶名稱'] || imported['客戶'] || '',
            launchDate: imported['上線日期'] || '',
            highlights: imported['亮點'] || '',
            features: imported['建置功能'] || ''
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
          description: imported['摘要概述'] || imported['簡要說明'] || imported['說明'] || '',
          imageUrl: imported['封面圖片URL'] || imported['圖片URL'] || '',
          solutionDescription: imported['解決方案說明'] || '',
          solutionImageUrl: imported['解決方案圖片URL'] || '',
          tagIds,
          client: imported['客戶名稱'] || imported['客戶'] || '',
          launchDate: imported['上線日期'] || '',
          highlights: imported['亮點'] || '',
          features: imported['建置功能'] || ''
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
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-green-600/90 backdrop-blur-md border border-green-400/50 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.5)] p-4 flex items-center gap-3 min-w-[300px]">
            <CheckCircle className="text-white flex-shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-white font-mono font-bold text-sm">{successMessage}</p>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      
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
          <button 
            className={`px-8 py-4 font-mono font-bold tracking-wider ${activeTab === 'stats' ? 'text-green-400 border-b-2 border-green-400 bg-white/5' : 'text-slate-500 hover:text-white'}`}
            onClick={() => setActiveTab('stats')}
          >
            統計管理
          </button>
          <button 
            className={`px-8 py-4 font-mono font-bold tracking-wider ${activeTab === 'incomplete' ? 'text-red-400 border-b-2 border-red-400 bg-white/5' : 'text-slate-500 hover:text-white'}`}
            onClick={() => setActiveTab('incomplete')}
          >
            不完整案例
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
                        <p className="text-white font-mono font-bold mb-1">案例：{dup.imported['項目名稱'] || dup.imported['案例標題'] || dup.imported['標題']}</p>
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
                <>
                  {/* Search and Create Bar */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search Box */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input
                        type="text"
                        placeholder="搜尋案例（標題、描述、客戶、標籤等）..."
                        value={caseSearchQuery}
                        onChange={(e) => setCaseSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-slate-700 rounded-lg h-12 pl-12 pr-4 text-white placeholder-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                      />
                      {caseSearchQuery && (
                        <button
                          onClick={() => setCaseSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => { resetCaseForm(); setIsEditingCase(true); }}
                      className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-mono font-bold tracking-wider whitespace-nowrap"
                    >
                      <Plus size={18} /> 建立項目
                    </button>
                  </div>

                  {/* Search Results Info */}
                  {caseSearchQuery && (
                    <div className="mb-4 text-sm text-slate-400 font-mono">
                      找到 {filteredAdminCases.length} 個符合「{caseSearchQuery}」的案例
                    </div>
                  )}
                </>
              )}

              {isEditingCase && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
                  {/* Backdrop */}
                  <div 
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    onClick={resetCaseForm}
                  ></div>
                  
                  {/* Modal Content */}
                  <form 
                    ref={editFormRef}
                    onSubmit={handleSaveCase} 
                    className="relative w-full max-w-5xl max-h-[90vh] bg-[#05050a] border border-cyan-500/30 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-y-auto"
                    style={{ zIndex: 101 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button 
                      type="button"
                      onClick={resetCaseForm}
                      className="absolute top-4 right-4 z-[102] p-2 bg-black/70 hover:bg-red-500/20 text-white rounded-full backdrop-blur-md transition-all border-2 border-white/20 hover:border-red-400/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] group"
                      title="關閉 (ESC)"
                    >
                      <X size={19} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="p-8">
                      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="text-xl font-bold text-cyan-400 font-mono">
                          {editingCaseId ? '編輯安全記錄' : '新增安全記錄'}
                        </h3>
                      </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Layer 1 Info */}
                    <div className="space-y-4">
                      <h4 className="text-white font-mono border-l-4 border-cyan-500 pl-3">層級 1：預覽</h4>
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">項目名稱</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                          value={caseForm.title}
                          onChange={e => setCaseForm({...caseForm, title: e.target.value})}
                          placeholder="請輸入項目名稱..."
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">封面圖片</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <input 
                            type="url" 
                            placeholder="或輸入圖片網址 https://... (支援 Google Drive 連結)"
                            className="flex-1 min-w-[200px] bg-black/50 border border-slate-700 rounded p-3 text-cyan-300 font-mono text-sm focus:border-cyan-400 focus:outline-none"
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
                          <button
                            type="button"
                            onClick={() => generateImageWithAI('cover')}
                            disabled={isGeneratingCoverImage}
                            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-purple-400 text-sm font-mono flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingCoverImage ? '生成中...' : '🤖 AI生圖'}
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
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">摘要概述</label>
                        <textarea 
                          required
                          rows={4}
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-cyan-400 focus:outline-none"
                          value={caseForm.description}
                          onChange={e => setCaseForm({...caseForm, description: e.target.value})}
                          placeholder="請輸入案例的摘要概述..."
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">亮點</label>
                        <textarea 
                          rows={3}
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-cyan-400 focus:outline-none"
                          value={caseForm.highlights}
                          onChange={e => setCaseForm({...caseForm, highlights: e.target.value})}
                          placeholder="請輸入案例的亮點特色..."
                        />
                      </div>
                    </div>

                    {/* Layer 2 Info */}
                    <div className="space-y-4">
                      <h4 className="text-white font-mono border-l-4 border-purple-500 pl-3">層級 2：深入分析（解決方案）</h4>
                      <div>
                         <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">解決方案圖表/圖片</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <input 
                            type="url" 
                            placeholder="或輸入圖片網址 https://... (支援 Google Drive 連結)"
                            className="flex-1 min-w-[200px] bg-black/50 border border-slate-700 rounded p-3 text-purple-300 font-mono text-sm focus:border-purple-400 focus:outline-none"
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
                          <button
                            type="button"
                            onClick={() => generateImageWithAI('solution')}
                            disabled={isGeneratingSolutionImage}
                            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-purple-400 text-sm font-mono flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingSolutionImage ? '生成中...' : '🤖 AI生圖'}
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
                          <div className="mt-2 w-full h-64 md:h-80 rounded border border-white/10 overflow-hidden bg-black/30">
                            <img src={caseForm.solutionImageUrl} alt="預覽" className="w-full h-full object-contain" onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center h-full text-red-400 text-sm">圖片無法載入，請檢查網址</div>';
                              }
                            }} />
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
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">建置功能</label>
                        <textarea 
                          rows={3}
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-purple-400 focus:outline-none"
                          value={caseForm.features}
                          onChange={e => setCaseForm({...caseForm, features: e.target.value})}
                          placeholder="請輸入建置的功能特色..."
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
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {paginatedAdminCases.length > 0 ? (
                  paginatedAdminCases.map(item => (
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
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center border border-white/5 rounded-xl bg-black/20">
                    <p className="text-slate-600 text-lg font-mono">
                      {caseSearchQuery ? '未找到符合搜尋條件的案例' : '尚無案例資料'}
                    </p>
                    {caseSearchQuery && (
                      <button 
                        onClick={() => setCaseSearchQuery('')}
                        className="mt-4 text-cyan-400 hover:text-white underline font-mono text-sm"
                      >
                        清除搜尋條件
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination Controls for Admin Cases */}
              {!isEditingCase && filteredAdminCases.length > casesPerPageAdmin && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  {/* Page Info */}
                  <div className="text-slate-400 text-sm font-mono">
                    顯示第 {adminStartIndex + 1}-{Math.min(adminEndIndex, filteredAdminCases.length)} 個，共 {filteredAdminCases.length} 個案例
                  </div>
                  
                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    {/* First Page */}
                    <button
                      onClick={() => setCurrentCasePage(1)}
                      disabled={currentCasePage === 1}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="第一頁"
                    >
                      <ChevronsLeft size={20} />
                    </button>
                    
                    {/* Previous Page */}
                    <button
                      onClick={() => setCurrentCasePage(prev => Math.max(1, prev - 1))}
                      disabled={currentCasePage === 1}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="上一頁"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, adminTotalPages) }, (_, i) => {
                        let pageNum;
                        if (adminTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentCasePage <= 3) {
                          pageNum = i + 1;
                        } else if (currentCasePage >= adminTotalPages - 2) {
                          pageNum = adminTotalPages - 4 + i;
                        } else {
                          pageNum = currentCasePage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentCasePage(pageNum)}
                            className={`px-4 py-2 min-w-[44px] font-mono text-sm rounded-lg transition-all ${
                              currentCasePage === pageNum
                                ? 'bg-cyan-600 text-white border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                : 'bg-black/40 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next Page */}
                    <button
                      onClick={() => setCurrentCasePage(prev => Math.min(adminTotalPages, prev + 1))}
                      disabled={currentCasePage === adminTotalPages}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="下一頁"
                    >
                      <ChevronRight size={20} />
                    </button>
                    
                    {/* Last Page */}
                    <button
                      onClick={() => setCurrentCasePage(adminTotalPages)}
                      disabled={currentCasePage === adminTotalPages}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="最後一頁"
                    >
                      <ChevronsRight size={20} />
                    </button>
                  </div>
                </div>
              )}
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

          {/* INCOMPLETE CASES TAB */}
          {activeTab === 'incomplete' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-red-400 font-mono border-l-4 border-red-500 pl-3 mb-2">
                    不完整案例管理
                  </h3>
                  <p className="text-slate-400 text-sm font-mono">
                    以下案例缺少圖片、標題或描述內容
                  </p>
                </div>
                {incompleteCases.length > 0 && (
                  <button
                    onClick={() => {
                      const count = incompleteCases.length;
                      if (confirm(`確定要刪除所有 ${count} 個不完整案例嗎？\n\n此操作無法復原！`)) {
                        incompleteCases.forEach(c => {
                          storageService.deleteCase(c.id);
                        });
                        refreshData();
                        setSuccessMessage(`已成功刪除 ${count} 個不完整案例！`);
                        setShowSuccess(true);
                        setTimeout(() => {
                          setShowSuccess(false);
                        }, 3000);
                      }
                    }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all font-mono"
                  >
                    <Trash2 size={18} /> 一鍵刪除全部 ({incompleteCases.length})
                  </button>
                )}
              </div>

              {incompleteCases.length === 0 ? (
                <div className="text-center py-20 border border-white/5 rounded-xl bg-black/20">
                  <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
                  <p className="text-slate-400 text-lg font-mono mb-2">太好了！</p>
                  <p className="text-slate-600 text-sm font-mono">所有案例都完整，沒有缺少內容的案例</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incompleteCases.map(item => {
                    const missingItems = [];
                    if (!item.imageUrl || item.imageUrl.trim() === '') missingItems.push('封面圖片');
                    if (!item.title || item.title.trim() === '') missingItems.push('標題');
                    if (!item.description || item.description.trim() === '') missingItems.push('描述');

                    return (
                      <div 
                        key={item.id} 
                        className="bg-[#0a0a15] border border-red-500/30 rounded-xl overflow-hidden hover:border-red-500/50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row gap-4 p-4">
                          <div className="w-full md:w-48 h-32 relative overflow-hidden rounded border border-red-500/20 bg-black/50 flex items-center justify-center">
                            {item.imageUrl && item.imageUrl.trim() !== '' ? (
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center">
                                <AlertTriangle className="text-red-400 mx-auto mb-2" size={32} />
                                <p className="text-red-400 text-xs font-mono">缺少圖片</p>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-white font-mono mb-1">
                                  {item.title || <span className="text-red-400">(無標題)</span>}
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {missingItems.map((missing, idx) => (
                                    <span 
                                      key={idx}
                                      className="px-2 py-1 bg-red-900/30 border border-red-500/30 text-red-300 text-xs font-mono rounded"
                                    >
                                      缺少: {missing}
                                    </span>
                                  ))}
                                </div>
                                {item.client && (
                                  <p className="text-orange-400 text-sm font-mono mb-1">客戶: {item.client}</p>
                                )}
                                <p className="text-slate-400 text-xs font-mono mb-2">
                                  建立: {new Date(item.dateAdded).toLocaleDateString('zh-TW')}
                                </p>
                                {item.description && (
                                  <p className="text-slate-300 text-sm line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                                  title="編輯"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCase(item.id)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                  title="刪除"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Success Cases */}
                <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-950/20 border border-cyan-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <Briefcase className="text-cyan-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-slate-400 text-xs uppercase tracking-wider font-mono">成功案例</h3>
                      <p className="text-2xl font-bold text-white font-mono mt-1">{cases.length}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-mono">用戶 KEY: {cases.length > 0 ? cases[0].id : 'N/A'}</p>
                </div>

                {/* Solutions */}
                <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Code className="text-green-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-slate-400 text-xs uppercase tracking-wider font-mono">解決方案</h3>
                      <p className="text-2xl font-bold text-white font-mono mt-1">{cases.length}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-mono">總計案例數量</p>
                </div>

                {/* Tech Domains */}
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Users className="text-purple-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-slate-400 text-xs uppercase tracking-wider font-mono">技術領域</h3>
                      <p className="text-2xl font-bold text-white font-mono mt-1">{techDomains.length}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-mono">總計技術項目</p>
                </div>
              </div>

              {/* Tech Domains Management */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-400 font-mono border-l-4 border-green-500 pl-3">技術領域管理</h3>
                  <button 
                    onClick={() => {
                      setIsAddingTechDomain(true);
                      setIsEditingTechDomain(false);
                      setEditingTechDomainId(null);
                      setTechDomainForm({ name: '', count: 0 });
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all font-mono"
                  >
                    <Plus size={18} /> 新增技術領域
                  </button>
                </div>

                {/* Tech Domain Form */}
                {isAddingTechDomain && (
                  <form onSubmit={handleSaveTechDomain} className="mb-6 p-6 bg-white/5 rounded-xl border border-green-500/30 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-green-400 font-mono">
                        {isEditingTechDomain ? '編輯技術領域' : '新增技術領域'}
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingTechDomain(false);
                          setIsEditingTechDomain(false);
                          setEditingTechDomainId(null);
                          setTechDomainForm({ name: '', count: 0 });
                        }}
                        className="text-slate-500 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">技術名稱</label>
                        <input 
                          type="text" 
                          required
                          placeholder="例如：JAVA"
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 transition-all font-mono"
                          value={techDomainForm.name}
                          onChange={e => setTechDomainForm({...techDomainForm, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">人數</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          placeholder="例如：4"
                          className="w-full bg-black/50 border border-slate-700 rounded p-3 text-white focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 transition-all font-mono"
                          value={techDomainForm.count}
                          onChange={e => setTechDomainForm({...techDomainForm, count: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 mt-6">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingTechDomain(false);
                          setIsEditingTechDomain(false);
                          setEditingTechDomainId(null);
                          setTechDomainForm({ name: '', count: 0 });
                        }}
                        className="px-6 py-2 text-slate-400 hover:text-white font-mono"
                      >
                        取消
                      </button>
                      <button 
                        type="submit" 
                        className="flex items-center gap-2 px-8 py-2 bg-green-600 hover:bg-green-500 rounded-sm text-white font-bold tracking-wide shadow-lg shadow-green-900/50"
                      >
                        <Save size={18} /> 儲存
                      </button>
                    </div>
                  </form>
                )}

                {/* Tech Domains List */}
                <div className="space-y-3">
                  {techDomains.length === 0 ? (
                    <div className="text-center py-12 border border-white/5 rounded-xl bg-black/20">
                      <p className="text-slate-600 text-sm font-mono">尚無技術領域資料</p>
                    </div>
                  ) : (
                    techDomains.map(techDomain => (
                      <div 
                        key={techDomain.id} 
                        className="bg-[#0a0a15] border border-white/5 rounded-xl overflow-hidden hover:border-green-500/50 transition-all"
                      >
                        {/* Expandable Header */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => toggleTechDomainExpand(techDomain.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <Code className="text-green-400" size={20} />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white font-mono">{techDomain.name}</h4>
                              <p className="text-sm text-slate-400 font-mono">{techDomain.count} 人</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTechDomain(techDomain);
                              }}
                              className="p-2 text-green-400 hover:bg-green-500/10 rounded transition-colors"
                              title="編輯"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTechDomain(techDomain.id);
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              title="刪除"
                            >
                              <Trash2 size={18} />
                            </button>
                            {expandedTechDomains.has(techDomain.id) ? (
                              <ChevronUp className="text-slate-400" size={20} />
                            ) : (
                              <ChevronDown className="text-slate-400" size={20} />
                            )}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedTechDomains.has(techDomain.id) && (
                          <div className="px-4 pb-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-2">
                            <div className="bg-black/30 rounded-lg p-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400 font-mono">技術名稱：</span>
                                  <span className="text-white font-mono ml-2">{techDomain.name}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-mono">人數：</span>
                                  <span className="text-green-400 font-mono ml-2">{techDomain.count} 人</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
