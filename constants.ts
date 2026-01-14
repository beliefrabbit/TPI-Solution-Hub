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
  { id: 't10', name: '數位通路', type: CategoryType.BUSINESS },
  { id: 't11', name: '產品創新', type: CategoryType.BUSINESS },
  { id: 't12', name: '智慧製造', type: CategoryType.BUSINESS },
  { id: 't13', name: '內容創意', type: CategoryType.BUSINESS },
  { id: 't20', name: 'IFHIR', type: CategoryType.BUSINESS },
  { id: 't21', name: '醫護團隊', type: CategoryType.BUSINESS },
  // Trends
  { id: 't14', name: 'AI應用', type: CategoryType.TREND },
  { id: 't15', name: 'APIM', type: CategoryType.TREND },
  { id: 't16', name: 'AI治理中台', type: CategoryType.TREND },
  { id: 't17', name: 'ESG', type: CategoryType.TREND },
  { id: 't18', name: '資安', type: CategoryType.TREND },
  { id: 't19', name: '主權AI', type: CategoryType.TREND },
  { id: 't22', name: '可信任AI', type: CategoryType.TREND },
  { id: 't9', name: '提升生產力', type: CategoryType.TREND },
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
  },
  {
    id: 'c6',
    title: '智慧製造品質檢測系統',
    description: '運用 AI 視覺檢測技術，產品不良率降低 85%，檢測速度提升 10 倍。',
    imageUrl: 'https://picsum.photos/id/1015/800/600',
    solutionImageUrl: 'https://picsum.photos/id/1018/800/600',
    solutionDescription: '整合工業相機與深度學習模型，實現即時瑕疵檢測。系統支援多種產品類型，可自動學習新產品的檢測標準。結合邊緣運算設備，確保低延遲檢測響應。',
    tagIds: ['t5', 't12', 't14', 't9'],
    dateAdded: Date.now() - 50000
  },
  {
    id: 'c7',
    title: '金融機構 API 管理平台',
    description: '建置統一 API 閘道器，整合 50+ 金融服務 API，提升開發效率 300%。',
    imageUrl: 'https://picsum.photos/id/1035/800/600',
    solutionImageUrl: 'https://picsum.photos/id/1036/800/600',
    solutionDescription: '採用微服務架構，提供 API 版本管理、流量控制、安全認證等功能。支援 OAuth 2.0 與 API Key 雙重認證機制，並提供完整的 API 監控與分析儀表板。',
    tagIds: ['t1', 't10', 't15', 't18'],
    dateAdded: Date.now() - 60000
  },
  {
    id: 'c8',
    title: '醫療健康數據平台',
    description: '整合 FHIR 標準，建立跨院醫療數據交換平台，提升病歷調閱效率 90%。',
    imageUrl: 'https://picsum.photos/id/1037/800/600',
    solutionImageUrl: 'https://picsum.photos/id/1038/800/600',
    solutionDescription: '基於 HL7 FHIR R4 標準建置醫療數據平台，支援結構化病歷、檢驗報告、影像資料的交換。採用區塊鏈技術確保數據完整性與不可篡改性，符合個資法與醫療法規要求。',
    tagIds: ['t2', 't20', 't21', 't18'],
    dateAdded: Date.now() - 70000
  },
  {
    id: 'c9',
    title: '可信任 AI 模型治理平台',
    description: '建立 AI 模型全生命週期管理系統，確保模型可解釋性與公平性。',
    imageUrl: 'https://picsum.photos/id/1039/800/600',
    solutionImageUrl: 'https://picsum.photos/id/1040/800/600',
    solutionDescription: '提供模型版本控制、性能監控、偏見檢測、可解釋性分析等功能。整合 MLOps 流程，自動化模型訓練、部署與更新。支援多種 AI 框架，並提供模型公平性評估報告。',
    tagIds: ['t16', 't22', 't14', 't8'],
    dateAdded: Date.now() - 80000
  },
  {
    id: 'c10',
    title: '政府數位服務整合平台',
    description: '整合跨部門數位服務，提供一站式便民服務入口，服務滿意度提升 95%。',
    imageUrl: 'https://picsum.photos/id/1041/800/600',
    solutionImageUrl: 'https://picsum.photos/id/1042/800/600',
    solutionDescription: '採用 API Gateway 整合各政府部門服務 API，提供統一的身份認證與授權機制。建置服務編排引擎，支援跨部門業務流程自動化。提供行動 App 與 Web 雙平台，並支援多種支付方式。',
    tagIds: ['t3', 't10', 't19', 't7'],
    dateAdded: Date.now() - 90000
  },
  {
    id: 'c11',
    title: '企業數位轉型顧問服務',
    description: '協助傳統製造業導入數位化流程，生產效率提升 60%，成本降低 25%。',
    imageUrl: 'https://picsum.photos/id/1043/800/600',
    solutionImageUrl: 'https://picsum.photos/id/1044/800/600',
    solutionDescription: '進行數位成熟度評估，制定數位轉型路線圖。導入 IoT 感測器監控生產線，建立數據中台整合各系統數據。運用 AI 預測維護需求，減少設備故障時間。提供員工數位技能培訓計畫。',
    tagIds: ['t5', 't7', 't12', 't9'],
    dateAdded: Date.now() - 100000
  },
  {
    id: 'c12',
    title: '智慧城市交通管理系統',
    description: '整合交通數據與 AI 演算法，優化交通流量，減少壅塞時間 40%。',
    imageUrl: 'https://picsum.photos/id/1045/800/600',
    solutionImageUrl: 'https://picsum.photos/id/1046/800/600',
    solutionDescription: '整合路口監視器、車流感測器、公車 GPS 等多源數據。運用機器學習預測交通流量，動態調整號誌時相。提供即時路況資訊給用路人，並優化公車路線規劃。支援緊急車輛優先通行功能。',
    tagIds: ['t3', 't7', 't14', 't15'],
    dateAdded: Date.now() - 110000
  }
];
