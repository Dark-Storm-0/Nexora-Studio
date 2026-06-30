export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  isPopular: boolean;
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  instructions: string;
  active: boolean;
}

export interface SiteSettings {
  topAdHtml?: string;
  bottomAdHtml?: string;
  toolEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  // Adsterra Configuration
  adsterraPopunder?: string;
  adsterraSocialBar?: string;
  adsterraDirectLink?: string;
  adsterraBanner728x90?: string;
  adsterraBanner300x250?: string;
  // PopAds Configuration
  popadsPopunder?: string;
  // Monetag/PropellerAds Configuration
  monetagPopunder?: string;
  monetagVignette?: string;
  // Custom script injection
  customHeaderCode?: string;
  customFooterCode?: string;
}
