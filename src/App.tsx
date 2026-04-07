import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Product, SiteSettings, CartItem } from './types';
import { PRODUCTS as INITIAL_PRODUCTS } from './constants';

// Pages
import Admin from './pages/Admin';
import Login from './pages/Login';

// Components
import { 
  Utensils, 
  ChevronRight, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram,
  Menu,
  X,
  ShoppingCart,
  CheckCircle2,
  Leaf,
  Clock,
  ShieldCheck,
  Settings,
  QrCode,
  Truck,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FEATURES } from './constants';
import { getDirectImageUrl } from './utils';

// --- Protected Route Component ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    const localAuth = localStorage.getItem('admin_auth') === 'true';
    setIsLocalAdmin(localAuth);

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Đang kiểm tra quyền...</div>;
  
  // Allow if either Firebase user is logged in OR local admin session exists
  if (!user && !isLocalAdmin) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

// --- Landing Page Component ---
const Landing = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    note: ''
  });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Fetch site settings
    const settingsRef = doc(db, 'site_settings', 'main');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data() as SiteSettings);
      } else {
        // Default settings if not configured
        setSiteSettings({
          aboutUs: 'Minh Đức tự hào mang đến dòng sản phẩm trứng muối ăn liền cao cấp, được chế biến từ những quả trứng vịt thả đồng tươi ngon nhất.',
          contactPhone: '0908 999 000',
          contactEmail: 'kinhdoanh@trungmuoiminhduc.vn',
          contactAddress: 'Khu Công Nghiệp Sóc Trăng, Phường 2, TP. Sóc Trăng',
          heroTitle: 'Minh Đức - Trứng Muối Ăn Liền Cao Cấp',
          heroSubtitle: 'Thưởng thức hương vị trứng muối bùi béo, chuẩn vị truyền thống. Tiện lợi, sạch sẽ, an toàn cho sức khỏe gia đình bạn.',
          logo: '',
          storyTitle: 'Hành Trình Gói Trọn Tinh Hoa Trứng Muối',
          storyContent: 'Bắt đầu từ niềm đam mê với ẩm thực truyền thống, Minh Đức đã không ngừng nghiên cứu và phát triển dòng sản phẩm trứng muối ăn liền. Chúng tôi kết hợp giữa bí quyết muối trứng gia truyền và công nghệ sản xuất hiện đại để tạo ra những quả trứng muối hoàn hảo nhất.\n\nMỗi quả trứng đều được tuyển chọn kỹ lưỡng, đảm bảo lòng đỏ to, đỏ rực và có độ bùi béo đặc trưng. Với Minh Đức, trứng muối không chỉ là một món ăn, mà còn là tâm huyết mang hương vị quê hương đến mọi gian bếp hiện đại.',
          storyImage: 'https://images.unsplash.com/photo-1587486914432-03d1fef21473?auto=format&fit=crop&q=80&w=1000',
          storyImages: [],
          storyVideoUrl: '',
          storyMediaType: 'image',
          updatedAt: new Date().toISOString()
        });
      }
    }, (error) => {
      console.error("Error listening to site settings:", error);
    });

    // Fetch products from Firestore
    const q = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProducts([]);
      } else {
        const prods = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        // Sort by name in memory to avoid missing products without name field
        prods.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        setProducts(prods);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to products:", error);
      setLoading(false);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribeSettings();
      unsubscribeProducts();
    };
  }, []);

  // Function to seed initial data if empty
  const seedData = async () => {
    const q = query(collection(db, 'products'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      for (const p of INITIAL_PRODUCTS) {
        await addDoc(collection(db, 'products'), {
          ...p,
          updatedAt: new Date().toISOString()
        });
      }
    }
  };

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'instant', name: 'Trứng Ăn Liền' },
    { id: 'raw', name: 'Lòng Đỏ (Làm bánh)' },
    { id: 'gift', name: 'Quà Tặng' },
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Leaf': return <Leaf className="w-8 h-8" />;
      case 'Utensils': return <Utensils className="w-8 h-8" />;
      case 'Clock': return <Clock className="w-8 h-8" />;
      case 'ShieldCheck': return <ShieldCheck className="w-8 h-8" />;
      default: return <CheckCircle2 className="w-8 h-8" />;
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    
    // Google Drive
    const gdMatch = url.match(/(?:drive\.google\.com\/file\/d\/|id=)([\w-]+)/);
    if (gdMatch) return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    
    return url;
  };

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) !== null;
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
      return;
    }
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    
    // Generate random order code: SPICEFOODS + 6 random chars
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    setOrderCode(`MINHDUC${randomStr}`);
    setShowPaymentOptions(true);
  };

  const saveOrder = async (paymentMethod: 'cod' | 'qr') => {
    if (cart.length === 0) return;
    
    try {
      const orderData = {
        orderCode,
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        customerEmail: orderForm.email,
        customerAddress: orderForm.address,
        note: orderForm.note,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: cartTotal,
        paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // Send to Google Sheets if configured
      const sheetUrl = siteSettings?.googleSheetUrl || 'https://script.google.com/macros/s/AKfycbyIHB2CDIFpShI7COLCV50ENHFS898NOuF3tjFYEWc7RjSMrmISLBNnPlOttRBk/exec';
      if (sheetUrl) {
        try {
          const orderInfo = `Khách hàng: ${orderForm.name}\nSản phẩm:\n${cart.map(item => `- ${item.quantity}x ${item.name} (${(item.price * item.quantity).toLocaleString('vi-VN')}đ)`).join('\n')}\nTổng tiền: ${cartTotal.toLocaleString('vi-VN')}đ`;
          
          const sheetPayload = {
            orderDate: new Date().toLocaleString('vi-VN'),
            orderCode: orderCode,
            orderInfo: orderInfo,
            phone: orderForm.phone,
            email: orderForm.email,
            address: orderForm.address,
            note: orderForm.note,
            paymentMethod: paymentMethod
          };

          fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(sheetPayload)
          }).catch(err => console.error("Error sending to Google Sheets:", err));
        } catch (sheetError) {
          console.error("Error preparing Google Sheets payload:", sheetError);
        }
      }
      
      alert(`Đặt hàng thành công! Mã đơn hàng của bạn là ${orderCode}. Chúng tôi sẽ liên hệ với bạn sớm nhất.`);
      setShowPaymentOptions(false);
      setOrderForm({ name: '', phone: '', email: '', address: '', note: '' });
      setCart([]);
      setIsCartOpen(false);
    } catch (error) {
      console.error("Error saving order:", error);
      alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau.');
    }
  };

  const handleConfirmCOD = () => {
    saveOrder('cod');
  };

  const handleConfirmQR = () => {
    saveOrder('qr');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-red-100 selection:text-red-600">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                {siteSettings?.logo ? (
                  <img 
                    src={getDirectImageUrl(siteSettings.logo)} 
                    alt="Minh Đức Logo" 
                    className="h-10 md:h-12 w-auto object-contain max-w-[150px] block"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                
                <div 
                  className={`logo-fallback w-10 h-10 bg-red-600 rounded-full flex items-center justify-center ${siteSettings?.logo ? 'hidden' : 'flex'}`}
                >
                  <Utensils className="text-white w-6 h-6" />
                </div>
              </div>

              <span className={`text-2xl font-bold tracking-tighter ${isScrolled ? 'text-red-600' : 'text-white'}`}>
                MINH ĐỨC
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {['Trang chủ', 'Sản phẩm', 'Về chúng tôi', 'Liên hệ'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className={`text-sm font-medium transition-colors hover:text-red-500 ${isScrolled ? 'text-gray-700' : 'text-white'}`}
                >
                  {item}
                </a>
              ))}
              <Link to="/login" className={`p-2 rounded-full transition-colors ${isScrolled ? 'text-gray-400 hover:text-red-600' : 'text-white/50 hover:text-white'}`}>
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => document.getElementById('sản-phẩm')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                Đặt hàng ngay
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-4">
               <Link to="/login" className={isScrolled ? 'text-gray-700' : 'text-white'}>
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={isScrolled ? 'text-gray-700' : 'text-white'}
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {['Trang chủ', 'Sản phẩm', 'Về chúng tôi', 'Liên hệ'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    className="block px-3 py-4 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      document.getElementById('sản-phẩm')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Đặt hàng ngay
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section id="trang-chủ" className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1920" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 bg-red-600 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Trứng Muối Ăn Liền - Minh Đức
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              {siteSettings?.heroTitle || 'Nâng Tầm Vị Ngon'} <br />
              <span className="text-red-500 italic font-serif">Bữa Cơm Gia Đình</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed">
              {siteSettings?.heroSubtitle || 'Thưởng thức hương vị trứng muối bùi béo, chuẩn vị truyền thống. Tiện lợi, sạch sẽ, an toàn cho sức khỏe gia đình bạn.'}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a href="#sản-phẩm" className="bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-all flex items-center justify-center group shadow-xl shadow-red-600/30">
                Xem sản phẩm
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#về-chúng-tôi" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all text-center">
                Về chúng tôi
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-orange-500 to-yellow-500 p-8 md:p-12 shadow-2xl shadow-orange-200"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1621841957884-1210fe19d66d?auto=format&fit=crop&q=80&w=800" 
                alt="Salted Egg Banner" 
                className="w-full h-full object-cover mix-blend-overlay opacity-40"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-orange-500"></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="lg:w-3/5 text-white text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
                  <Star className="w-4 h-4 text-yellow-300 fill-current" />
                  <span className="text-xs font-bold uppercase tracking-widest">Sản phẩm bán chạy nhất</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                  Trứng Muối <br />
                  <span className="text-yellow-300">Hoàng Kim</span> Minh Đức
                </h2>
                <p className="text-lg text-orange-50 mb-8 max-w-xl">
                  Lòng đỏ to tròn, đỏ rực, bùi béo tan ngay đầu lưỡi. Bí quyết cho món bánh trung thu, bánh bao và các món xốt hoàng kim thượng hạng.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-[10px] uppercase font-bold text-orange-100">Tự nhiên</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                    <div className="text-2xl font-bold">Tiệt trùng</div>
                    <div className="text-[10px] uppercase font-bold text-orange-100">Công nghệ cao</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                    <div className="text-2xl font-bold">Gia truyền</div>
                    <div className="text-[10px] uppercase font-bold text-orange-100">Hương vị chuẩn</div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-2/5 flex flex-col items-center">
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-4 bg-yellow-400 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1587486914432-03d1fef21473?auto=format&fit=crop&q=80&w=500" 
                    alt="Salted Egg Product" 
                    className="relative w-64 h-64 md:w-80 md:h-80 object-cover rounded-full border-8 border-white/30 shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-white text-orange-600 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-orange-500 rotate-12 group-hover:rotate-0 transition-transform">
                    <span className="text-[10px] font-bold uppercase">Chỉ từ</span>
                    <span className="text-xl font-black">9.000đ</span>
                  </div>
                </div>
                <button 
                  onClick={() => document.getElementById('sản-phẩm')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-12 bg-white text-orange-600 px-10 py-4 rounded-full font-black text-lg hover:bg-orange-50 transition-all shadow-xl shadow-orange-900/20"
                >
                  MUA NGAY BÂY GIỜ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section id="sản-phẩm" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Sản Phẩm Nổi Bật</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Khám phá trọn bộ trứng muối Minh Đức - Bí quyết cho những món ăn ngon chuẩn vị truyền thống ngay tại bếp nhà bạn.
            </p>
            {products.length === 0 && !loading && (
              <button 
                onClick={seedData}
                className="mt-8 text-red-600 font-bold hover:underline"
              >
                Nhấn để tải dữ liệu mẫu ban đầu
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -10 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden shrink-0">
                      <img 
                        src={getDirectImageUrl(product.image)} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer" 
                      />
                      {product.weight && <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm">{product.weight}</div>}
                      {product.discountBadge && <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">{product.discountBadge}</div>}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-red-600 transition-colors">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{product.description}</p>
                      
                      {product.promoText && product.promoText.trim() !== '' && (
                        <div className="mb-4 bg-red-50 text-red-700 text-xs font-bold px-3 py-2 rounded-lg border border-red-100 flex items-start">
                          <span className="mr-1.5 text-red-500">🎁</span>
                          <span>Khuyến mãi: {product.promoText}</span>
                        </div>
                      )}

                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Giá bán:</div>
                          <div className="text-xl font-black text-red-600">{Number(product.price).toLocaleString('vi-VN')}đ</div>
                          {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                            <div className="text-sm text-gray-400 line-through mt-0.5">Giá gốc: {Number(product.originalPrice).toLocaleString('vi-VN')}đ</div>
                          )}
                        </div>
                        <div className="flex items-center text-yellow-400 mb-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="ml-1 text-xs font-bold text-gray-400">5.0</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-red-50 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors mt-auto flex items-center justify-center"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* About Us */}
      <section id="về-chúng-tôi" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative w-full">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-50 rounded-full -z-10"></div>
              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-red-100 rounded-full -z-10"></div>
              
              <div className="relative z-10 w-full rounded-[3rem] overflow-hidden shadow-2xl bg-gray-100 aspect-video lg:aspect-[4/3]">
                {siteSettings?.storyMediaType === 'video' && siteSettings.storyVideoUrl ? (
                  isDirectVideo(siteSettings.storyVideoUrl) ? (
                    <video 
                      src={siteSettings.storyVideoUrl}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    ></video>
                  ) : (
                    <iframe 
                      src={getEmbedUrl(siteSettings.storyVideoUrl)}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )
                ) : siteSettings?.storyMediaType === 'gallery' && siteSettings.storyImages && siteSettings.storyImages.length > 0 ? (
                  <div className="w-full h-full relative group">
                    <div className="flex w-full h-full overflow-hidden">
                      {siteSettings.storyImages.map((img, idx) => (
                        <motion.img 
                          key={idx}
                          src={getDirectImageUrl(img)}
                          className="w-full h-full object-cover flex-shrink-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                    {/* Simple Gallery Overlay/Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                      {siteSettings.storyImages.map((_, idx) => (
                        <div key={idx} className="w-2 h-2 rounded-full bg-white/50"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <img 
                    src={getDirectImageUrl(siteSettings?.storyImage || "https://images.unsplash.com/photo-1587486914432-03d1fef21473?auto=format&fit=crop&q=80&w=1000")} 
                    alt="About Minh Đức" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>
            <div className="lg:w-1/2">
              <span className="text-red-600 font-bold tracking-widest uppercase text-sm mb-4 block">Câu chuyện của chúng tôi</span>
              <h2 className="text-4xl font-bold mb-8 leading-tight">
                {siteSettings?.storyTitle || 'Mang Hương Vị Truyền Thống Đến Mọi Gian Bếp'}
              </h2>
              <div className="text-gray-600 space-y-6 text-lg leading-relaxed">
                {siteSettings?.storyContent ? (
                  <div className="whitespace-pre-wrap">{siteSettings.storyContent}</div>
                ) : (
                  <>
                    <p>
                      Minh Đức ra đời với sứ mệnh mang đến những giải pháp thực phẩm tiện lợi, giúp việc chuẩn bị bữa ăn trở nên dễ dàng và thú vị hơn bao giờ hết. Chúng tôi tin rằng mỗi bữa cơm gia đình đều xứng đáng có được hương vị thơm ngon nhất.
                    </p>
                    <p>
                      Với quy trình sản xuất hiện đại và sự tuyển chọn kỹ lưỡng từ những nguyên liệu tự nhiên, các sản phẩm của Minh Đức luôn đảm bảo chất lượng và an toàn vệ sinh thực phẩm cho người tiêu dùng.
                    </p>
                  </>
                )}
              </div>
              <div className="mt-10 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-bold text-red-600 mb-1">10+</div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Năm kinh nghiệm</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600 mb-1">50+</div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Sản phẩm đa dạng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16">Tại sao nên chọn Minh Đức?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">{getIcon(feature.icon)}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer & Contact */}
      <section id="liên-hệ" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-600 rounded-[3rem] p-12 lg:p-20 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Đặt hàng ngay hôm nay!</h2>
                <p className="text-red-100 mb-10 text-lg max-w-xl">
                  Liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất về các sản phẩm trứng muối Minh Đức.
                </p>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-red-200 text-sm">Hotline</div>
                      <div className="font-bold text-xl">{siteSettings?.contactPhone || '0123 456 789'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-red-200 text-sm">Email</div>
                      <div className="font-bold text-xl">{siteSettings?.contactEmail || 'contact@spicefoods.vn'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-red-200 text-sm">Địa chỉ</div>
                      <div className="font-bold text-xl">{siteSettings?.contactAddress || 'TP. Hồ Chí Minh, Việt Nam'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] p-8 text-gray-900">
                {showPaymentOptions ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold">Thanh toán</h3>
                      <button onClick={() => setShowPaymentOptions(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-3 flex items-center text-lg">
                        <QrCode className="w-5 h-5 mr-2" />
                        Cách 1: Quét mã QR (Khuyên dùng)
                      </h4>
                      <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm">
                        <img 
                          src={`https://qr.sepay.vn/img?acc=109866606666&bank=VietinBank&amount=${cartTotal}&des=SEVQR+TKPSPF+${orderCode}&template=compact`} 
                          alt="QR Code" 
                          className="w-48 h-48 object-contain mb-4 border border-gray-100 rounded-lg"
                        />
                        <div className="text-center text-sm space-y-2 w-full">
                          <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Ngân hàng:</span>
                            <strong>VietinBank</strong>
                          </div>
                          <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Số tài khoản:</span>
                            <strong>109866606666</strong>
                          </div>
                          <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Số tiền:</span>
                            <strong className="text-red-600 text-base">{cartTotal.toLocaleString('vi-VN')}đ</strong>
                          </div>
                          <div className="flex justify-between pt-1">
                            <span className="text-gray-500">Nội dung:</span>
                            <strong className="text-blue-600">{orderCode}</strong>
                          </div>
                        </div>
                        <button 
                          onClick={handleConfirmQR}
                          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                        >
                          Tôi đã thanh toán
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center text-lg">
                        <Truck className="w-5 h-5 mr-2" />
                        Cách 2: Thanh toán khi nhận hàng (COD)
                      </h4>
                      <p className="text-sm text-gray-600 mb-5">
                        Bạn sẽ thanh toán bằng tiền mặt khi nhân viên giao hàng đến địa chỉ của bạn.
                      </p>
                      <button 
                        onClick={handleConfirmCOD}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg"
                      >
                        Xác nhận đặt hàng COD
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold mb-6">Thông tin đặt hàng</h3>
                    <form className="space-y-4" onSubmit={handleOrderSubmit}>
                      {/* Product Selection Display */}
                      <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Sản phẩm đã chọn</label>
                        {cart.length > 0 ? (
                          <div className="space-y-3">
                            {cart.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                <div className="flex items-center space-x-3">
                                  <img src={getDirectImageUrl(item.image)} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                  <div>
                                    <div className="font-bold text-sm text-gray-900">{item.name}</div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Đơn giá:</span>
                                      <span className="text-red-600 text-sm font-bold">{Number(item.price).toLocaleString('vi-VN')}đ</span>
                                      <span className="text-xs text-gray-500 ml-2">x {item.quantity}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-red-600">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</div>
                                  <button type="button" onClick={() => removeFromCart(item.id!)} className="text-xs text-gray-400 hover:text-red-600 mt-1">
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <span className="font-bold text-gray-700">Tổng cộng:</span>
                              <span className="font-black text-red-600 text-lg">{cartTotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-500 italic text-center">
                            Giỏ hàng của bạn đang trống
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2">Họ và tên <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          value={orderForm.name}
                          onChange={e => setOrderForm({...orderForm, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all" 
                          placeholder="Nhập tên của bạn" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                        <input 
                          type="tel" 
                          required
                          value={orderForm.phone}
                          onChange={e => setOrderForm({...orderForm, phone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all" 
                          placeholder="Nhập số điện thoại" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Email</label>
                        <input 
                          type="email" 
                          value={orderForm.email}
                          onChange={e => setOrderForm({...orderForm, email: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all" 
                          placeholder="Nhập địa chỉ email (không bắt buộc)" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Địa chỉ giao hàng <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          value={orderForm.address}
                          onChange={e => setOrderForm({...orderForm, address: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all" 
                          placeholder="Nhập địa chỉ chi tiết (Số nhà, đường, phường/xã...)" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Ghi chú (Tùy chọn)</label>
                        <textarea 
                          value={orderForm.note}
                          onChange={e => setOrderForm({...orderForm, note: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all h-24" 
                          placeholder="Ghi chú thêm cho đơn hàng..."
                        ></textarea>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                      >
                        Gửi yêu cầu đặt hàng
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 transition-all z-40 flex items-center justify-center group animate-in slide-in-from-bottom-10"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-red-600">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </button>
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <h2 className="text-2xl font-bold flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-3 text-red-600" />
                  Giỏ hàng của bạn
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingCart className="w-16 h-16 opacity-20" />
                    <p>Giỏ hàng đang trống</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Tiếp tục mua sắm
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                        <img src={getDirectImageUrl(item.image)} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                            <div className="text-red-600 font-bold mt-1">{Number(item.price).toLocaleString('vi-VN')}đ</div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                              <button 
                                onClick={() => updateQuantity(item.id!, -1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-red-600"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id!, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-red-600"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id!)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-white border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 font-medium">Tổng cộng:</span>
                    <span className="text-2xl font-black text-red-600">{cartTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      document.getElementById('liên-hệ')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    Tiến hành đặt hàng
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Bottom */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              {siteSettings?.logo ? (
                <img 
                  src={getDirectImageUrl(siteSettings.logo)} 
                  alt="Minh Đức Logo" 
                  className="h-8 w-auto object-contain max-w-[100px] block"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.footer-logo-fallback');
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`footer-logo-fallback w-8 h-8 bg-red-600 rounded-full flex items-center justify-center ${siteSettings?.logo ? 'hidden' : 'flex'}`}>
                <Utensils className="text-white w-5 h-5" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tighter text-red-600">
              SPICE FOODS
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2024 Minh Đức. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-red-600 transition-colors"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-red-600 transition-colors"><Instagram className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
