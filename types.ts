export enum CategoryType {
  INDUSTRY = '產業別',
  BUSINESS = '業務別',
  TREND = '趨勢科技'
}

export interface Tag {
  id: string;
  name: string;
  type: CategoryType;
}

export interface CaseStudy {
  id: string;
  title: string;              // 項目名稱
  description: string;        // 摘要概述 (First layer description)
  imageUrl: string;           // First layer image
  
  // New Fields for Second Layer
  solutionImageUrl?: string; 
  solutionDescription?: string;

  tagIds: string[];
  dateAdded: number;
  
  // Admin-only fields (not displayed in showcase)
  client?: string;           // 客戶名稱
  launchDate?: string;        // 案例上線日期 (YYYY-MM-DD format)
  highlights?: string;        // 亮點
  features?: string;          // 建置功能
}

export interface TechDomain {
  id: string;
  name: string;        // 技術名稱，如 "JAVA"
  count: number;       // 人數，如 4
}

export interface AppState {
  cases: CaseStudy[];
  tags: Tag[];
  techDomains: TechDomain[];
}
