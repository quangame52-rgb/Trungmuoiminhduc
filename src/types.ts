export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  discountBadge?: string;
  promoText?: string;
  image: string;
  category: 'instant' | 'raw' | 'gift' | 'all';
  weight?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  note?: string;
  items?: CartItem[];
  productName?: string; // For backward compatibility
  productPrice?: number; // For backward compatibility
  totalAmount: number;
  paymentMethod: 'cod' | 'qr';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface SiteSettings {
  aboutUs: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  heroTitle: string;
  heroSubtitle: string;
  logo?: string;
  storyTitle?: string;
  storyContent?: string;
  storyImage?: string;
  storyImages?: string[];
  storyVideoUrl?: string;
  storyMediaType?: 'image' | 'video' | 'gallery';
  googleSheetUrl?: string;
  updatedAt: string;
}
