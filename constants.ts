import { CategoryType, Tag, CaseStudy } from './types';

export const INITIAL_TAGS: Tag[] = [
  // Industry
  { id: 't1', name: '金融', type: CategoryType.INDUSTRY },
  { id: 't2', name: '醫療', type: CategoryType.INDUSTRY },
  { id: 't3', name: '政府', type: CategoryType.INDUSTRY },
  { id: 't4', name: '零售', type: CategoryType.INDUSTRY },
  { id: 't5', name: '製造', type: CategoryType.INDUSTRY },
  // Business
  { id: 't6', name: '行銷', type: CategoryType.BUSINESS },
  { id: 't7', name: '營運流程', type: CategoryType.BUSINESS },
  { id: 't8', name: '經營管理', type: CategoryType.BUSINESS },
  { id: 't9', name: '生產力', type: CategoryType.BUSINESS },
  { id: 't10', name: '數位通路', type: CategoryType.BUSINESS },
  { id: 't11', name: '產品創新', type: CategoryType.BUSINESS },
  { id: 't12', name: '智慧製造', type: CategoryType.BUSINESS },
  { id: 't13', name: '內容創意', type: CategoryType.BUSINESS },
  // Trends
  { id: 't14', name: 'AI應用', type: CategoryType.TREND },
  { id: 't15', name: 'APIM', type: CategoryType.TREND },
  { id: 't16', name: 'AI治理中台', type: CategoryType.TREND },
  { id: 't17', name: 'ESG', type: CategoryType.TREND },
  { id: 't18', name: '資安', type: CategoryType.TREND },
  { id: 't19', name: '主權AI', type: CategoryType.TREND },
];

export const INITIAL_CASES: CaseStudy[] = [
  {
    id: 'c1',
    title: '智慧金融風控中台',
    description: '透過 AI 治理中台即時分析交易數據，阻詐成功率提升 400%。',
    imageUrl: 'https://picsum.photos/id/48/800/600',
    solutionImageUrl: 'https://picsum.photos/id/201/800/600',
    solutionDescription: '採用分散式運算架構，結合 Graph Neural Networks (GNN) 分析複雜的資金流向圖譜。系統部署於高安全性私有雲，符合金管會資安規範，並提供即時戰情儀表板供稽核人員使用。',
    tagIds: ['t1', 't8', 't16', 't14'],
    dateAdded: Date.now()
  },
  {
    id: 'c2',
    title: '遠距醫療影像辨識系統',
    description: '協助大型醫院導入 AI 影像輔助，縮短醫生診斷時間 30%。',
    imageUrl: 'https://picsum.photos/id/24/800/600',
    solutionImageUrl: 'https://picsum.photos/id/250/800/600',
    solutionDescription: '整合 DICOM 醫療影像標準，運用 Computer Vision 模型自動標記病徵。系統具備邊緣運算能力，可在救護車或偏鄉診所離線運作，待網路連線後自動同步至醫療中心資料庫。',
    tagIds: ['t2', 't11', 't14'],
    dateAdded: Date.now() - 10000
  },
  {
    id: 'c3',
    title: '全球供應鏈 ESG 戰情室',
    description: '整合全球 50+ 工廠數據，即時監控碳排放與能源消耗。',
    imageUrl: 'https://picsum.photos/id/20/800/600',
    solutionImageUrl: 'https://picsum.photos/id/119/800/600',
    solutionDescription: '透過 IoT 感測器即時蒐集水、電、氣消耗數據，並透過 Blockchain 技術確保碳足跡數據不可篡改。自動產出符合國際標準 (GRI, SASB) 的 ESG 報告。',
    tagIds: ['t5', 't7', 't17'],
    dateAdded: Date.now() - 20000
  },
  {
    id: 'c4',
    title: '主權 AI 對話機器人',
    description: '為政府單位建置本地化 LLM 模型，確保資料不落地。',
    imageUrl: 'https://picsum.photos/id/4/800/600',
    solutionImageUrl: 'https://picsum.photos/id/60/800/600',
    solutionDescription: '基於 Llama 3 架構進行本地微調 (Fine-tuning)，餵養政府公開數據與法規資料庫。建置 RAG (Retrieval-Augmented Generation) 機制，確保回答具有法源依據，且完全在內網環境運行。',
    tagIds: ['t3', 't10', 't19', 't18'],
    dateAdded: Date.now() - 30000
  },
  {
    id: 'c5',
    title: '零售全通路行銷自動化',
    description: '運用 GenAI 生成個人化行銷文案，點擊率提升 2.5 倍。',
    imageUrl: 'https://picsum.photos/id/6/800/600',
    solutionImageUrl: 'https://picsum.photos/id/96/800/600',
    solutionDescription: '串接 CDP 客戶數據平台，分析消費者畫像。利用生成式 AI 自動針對不同客群產出 EDM、Line 推播與廣告文案。具備 A/B Test 自動優化機制。',
    tagIds: ['t4', 't6', 't14', 't13'],
    dateAdded: Date.now() - 40000
  }
];
