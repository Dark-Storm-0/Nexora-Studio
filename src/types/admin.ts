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
  topAdHtml: string;
  bottomAdHtml: string;
  toolEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
}
