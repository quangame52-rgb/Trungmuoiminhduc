import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { Product, SiteSettings, Order } from '../types';
import { 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Package, 
  Settings as SettingsIcon, 
  Info, 
  Phone as PhoneIcon, 
  Utensils,
  Play,
  Image as ImageIcon,
  Images as ImagesIcon,
  Video as VideoIcon,
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getDirectImageUrl } from '../utils';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const navigate = useNavigate();

  // Settings State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
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
    googleSheetUrl: 'https://script.google.com/macros/s/AKfycbyIHB2CDIFpShI7COLCV50ENHFS898NOuF3tjFYEWc7RjSMrmISLBNnPlOttRBk/exec',
    updatedAt: new Date().toISOString()
  });

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    discountPercent: 0,
    discountBadge: '',
    promoText: '',
    category: 'instant',
    weight: '',
    image: ''
  });

  useEffect(() => {
    // Fetch Products
    const qProds = query(collection(db, 'products'), orderBy('name'));
    const unsubProds = onSnapshot(qProds, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Admin: Error listening to products:", error);
      setLoading(false);
    });

    // Fetch Settings
    const unsubSettings = onSnapshot(doc(db, 'site_settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data() as SiteSettings);
      }
    }, (error) => {
      console.error("Admin: Error listening to settings:", error);
    });

    // Fetch Orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ords);
    }, (error) => {
      console.error("Admin: Error listening to orders:", error);
    });

    return () => {
      unsubProds();
      unsubSettings();
      unsubOrders();
    };
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('admin_auth');
    await signOut(auth);
    navigate('/login');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Lỗi upload ảnh!");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `site/logo_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setSiteSettings(prev => ({ ...prev, logo: url }));
    } catch (error) {
      console.error("Logo upload error:", error);
      alert("Lỗi upload logo!");
    } finally {
      setUploading(false);
    }
  };

  const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `site/story_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setSiteSettings(prev => ({ ...prev, storyImage: url }));
    } catch (error) {
      console.error("Story image upload error:", error);
      alert("Lỗi upload ảnh câu chuyện!");
    } finally {
      setUploading(false);
    }
  };

  const handleStoryGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `site/gallery_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newUrls.push(url);
      }
      setSiteSettings(prev => ({ 
        ...prev, 
        storyImages: [...(prev.storyImages || []), ...newUrls] 
      }));
    } catch (error) {
      console.error("Gallery upload error:", error);
      alert("Lỗi upload ảnh thư viện!");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setSiteSettings(prev => ({
      ...prev,
      storyImages: prev.storyImages?.filter((_, i) => i !== index)
    }));
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    const gdMatch = url.match(/(?:drive\.google\.com\/file\/d\/|id=)([\w-]+)/);
    if (gdMatch) return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    return url;
  };

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== undefined)
      );

      if (isEditing) {
        const { id, ...updateData } = cleanData as any;
        await updateDoc(doc(db, 'products', isEditing), {
          ...updateData,
          updatedAt: new Date().toISOString()
        });
        setIsEditing(null);
      } else {
        const { id, ...addData } = cleanData as any;
        await addDoc(collection(db, 'products'), {
          ...addData,
          updatedAt: new Date().toISOString()
        });
      }
      setFormData({ name: '', description: '', price: 0, originalPrice: 0, discountPercent: 0, discountBadge: '', promoText: '', category: 'instant', weight: '', image: '' });
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Lỗi lưu sản phẩm!");
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (!auth.currentUser) {
      console.error("Save settings failed: No authenticated user");
      alert("Bạn cần đăng nhập (Google hoặc Mật khẩu) để có quyền lưu thay đổi vào cơ sở dữ liệu.");
      return;
    }

    setSavingSettings(true);
    console.log("Saving settings...", siteSettings);

    try {
      await setDoc(doc(db, 'site_settings', 'main'), {
        ...siteSettings,
        updatedAt: new Date().toISOString()
      });
      console.log("Settings saved successfully");
      alert("Đã lưu cài đặt thành công!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      if (error.code === 'permission-denied') {
        alert("Lỗi: Bạn không có quyền ghi dữ liệu. Vui lòng đảm bảo bạn đã đăng nhập bằng tài khoản Google admin (quangame52@gmail.com).");
      } else {
        alert("Lỗi lưu cài đặt: " + error.message);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setIsEditing(product.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg text-white">
              <Package className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Minh Đức Admin</h1>
          </div>
          
          <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Sản phẩm
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Đơn hàng
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Cài đặt trang
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            {/* Form Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-lg font-bold mb-6 flex items-center">
                {isEditing ? <Edit2 className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                {isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tên sản phẩm *</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none h-24"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Giá gốc (VNĐ)</label>
                      <input 
                        type="number" 
                        value={formData.originalPrice || ''}
                        onChange={e => {
                          const originalPrice = Number(e.target.value);
                          const discountPercent = formData.discountPercent || 0;
                          const price = originalPrice > 0 ? originalPrice - (originalPrice * discountPercent / 100) : formData.price;
                          setFormData({...formData, originalPrice, price});
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                        placeholder="VD: 100000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Khuyến mãi (%)</label>
                      <input 
                        type="number" 
                        value={formData.discountPercent || ''}
                        onChange={e => {
                          const discountPercent = Number(e.target.value);
                          const originalPrice = formData.originalPrice || 0;
                          const price = originalPrice > 0 ? originalPrice - (originalPrice * discountPercent / 100) : formData.price;
                          setFormData({
                            ...formData, 
                            discountPercent, 
                            price, 
                            discountBadge: discountPercent > 0 ? `-${discountPercent}%` : formData.discountBadge
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                        placeholder="VD: 20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nhãn khuyến mãi</label>
                      <input 
                        type="text" 
                        value={formData.discountBadge || ''}
                        onChange={e => setFormData({...formData, discountBadge: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                        placeholder="VD: -20%, Hot"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Trọng lượng</label>
                      <input 
                        type="text" 
                        value={formData.weight}
                        onChange={e => setFormData({...formData, weight: e.target.value})}
                        placeholder="VD: 120g"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Chương trình tặng kèm</label>
                    <input 
                      type="text" 
                      value={formData.promoText || ''}
                      onChange={e => setFormData({...formData, promoText: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                      placeholder="VD: Mua 2 tặng 1 xốt chấm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Danh mục *</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                      required
                    >
                      <option value="instant">Trứng Ăn Liền</option>
                      <option value="raw">Lòng Đỏ (Làm bánh)</option>
                      <option value="gift">Quà Tặng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Hình ảnh *</label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                        {formData.image ? (
                          <img 
                            src={getDirectImageUrl(formData.image)} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Upload className="text-gray-400 w-8 h-8" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden" 
                          id="image-upload"
                        />
                        <label 
                          htmlFor="image-upload"
                          className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                          Chọn ảnh tải lên
                        </label>
                        <p className="text-xs text-gray-400 mt-2">Định dạng: JPG, PNG. Tối đa 5MB.</p>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                      placeholder="Hoặc nhập URL ảnh"
                      className="w-full px-4 py-2 mt-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button 
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {isEditing ? 'Cập nhật' : 'Thêm sản phẩm'}
                    </button>
                    {isEditing && (
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditing(null);
                          setFormData({ name: '', description: '', price: 0, originalPrice: 0, discountPercent: 0, discountBadge: '', promoText: '', category: 'instant', weight: '', image: '' });
                        }}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">Danh sách sản phẩm ({products.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Sản phẩm</th>
                      <th className="px-6 py-4 font-bold">Danh mục</th>
                      <th className="px-6 py-4 font-bold">Giá</th>
                      <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={getDirectImageUrl(product.image)} 
                              className="w-12 h-12 rounded-lg object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.weight || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {Number(product.price || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleEdit(product)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id!)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-2 text-red-600" />
              Quản lý đơn hàng
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 font-bold text-gray-600 text-sm">Mã ĐH</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Khách hàng</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Sản phẩm</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Tổng tiền</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Thanh toán</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Trạng thái</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Ngày đặt</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-mono text-sm font-bold text-gray-900">{order.orderCode}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                        {order.customerEmail && <div className="text-sm text-gray-500">{order.customerEmail}</div>}
                        <div className="text-xs text-gray-400 truncate max-w-[150px]" title={order.customerAddress}>{order.customerAddress}</div>
                      </td>
                      <td className="p-4">
                        {order.items ? (
                          <div className="space-y-1">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-medium text-gray-900">{order.productName}</div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-red-600">
                        {(order.totalAmount || order.productPrice || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.paymentMethod === 'qr' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.paymentMethod === 'qr' ? 'Chuyển khoản QR' : 'COD'}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={async (e) => {
                            try {
                              await updateDoc(doc(db, 'orders', order.id), { status: e.target.value });
                            } catch (error) {
                              console.error("Error updating order status:", error);
                              alert("Lỗi cập nhật trạng thái!");
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold outline-none border ${
                            order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="processing">Đang chuẩn bị</option>
                          <option value="shipped">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={async () => {
                            if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
                              await deleteDoc(doc(db, 'orders', order.id));
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Xóa đơn hàng"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        Chưa có đơn hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold mb-8 flex items-center">
              <SettingsIcon className="w-6 h-6 mr-2 text-red-600" />
              Cài đặt thông tin trang web
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Brand & Hero Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Thương hiệu & Hero
                  </h3>
                  
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Logo thương hiệu</label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                        {siteSettings.logo ? (
                          <img 
                            src={getDirectImageUrl(siteSettings.logo)} 
                            alt="Logo Preview" 
                            className="w-full h-full object-contain p-2" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.logo-preview-fallback');
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`logo-preview-fallback w-full h-full items-center justify-center ${siteSettings.logo ? 'hidden' : 'flex'}`}>
                          <Utensils className="text-gray-300 w-8 h-8" />
                        </div>
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden" 
                          id="logo-upload"
                        />
                        <label 
                          htmlFor="logo-upload"
                          className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer hover:bg-gray-200 transition-colors text-sm"
                        >
                          Thay đổi Logo
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSaveSettings()}
                          disabled={savingSettings || uploading}
                          className="ml-2 inline-block px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
                        >
                          {savingSettings ? 'Đang lưu...' : 'Lưu Logo'}
                        </button>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">PNG/SVG khuyên dùng</p>
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-bold leading-tight">
                            LƯU Ý GOOGLE DRIVE: Bạn phải chia sẻ tệp ở chế độ "Bất kỳ ai có đường liên kết đều có thể xem" thì logo mới hiện được.
                          </p>
                        </div>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={siteSettings.logo || ''}
                      onChange={e => setSiteSettings({...siteSettings, logo: e.target.value})}
                      placeholder="Hoặc nhập URL logo"
                      className="w-full px-4 py-2 mt-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề chính</label>
                    <input 
                      type="text" 
                      value={siteSettings.heroTitle}
                      onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề phụ</label>
                    <textarea 
                      value={siteSettings.heroSubtitle}
                      onChange={e => setSiteSettings({...siteSettings, heroSubtitle: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none h-24"
                    />
                  </div>
                </div>

                {/* Contact Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Thông tin liên hệ
                  </h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                    <input 
                      type="text" 
                      value={siteSettings.contactPhone}
                      onChange={e => setSiteSettings({...siteSettings, contactPhone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={siteSettings.contactEmail}
                      onChange={e => setSiteSettings({...siteSettings, contactEmail: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label>
                    <input 
                      type="text" 
                      value={siteSettings.contactAddress}
                      onChange={e => setSiteSettings({...siteSettings, contactAddress: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tích hợp Google Sheets */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  Tích hợp Google Sheets
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Google Apps Script Web App URL</label>
                    <input 
                      type="text" 
                      value={siteSettings.googleSheetUrl || ''}
                      onChange={e => setSiteSettings({...siteSettings, googleSheetUrl: e.target.value})}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-600/20 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Nhập URL Web App của Google Apps Script để tự động đồng bộ đơn hàng mới về Google Sheets.
                    </p>
                  </div>
                </div>
              </div>

              {/* About Us */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Về chúng tôi (Footer)</h3>
                <textarea 
                  value={siteSettings.aboutUs}
                  onChange={e => setSiteSettings({...siteSettings, aboutUs: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none h-24"
                  placeholder="Giới thiệu ngắn về công ty ở chân trang..."
                />
              </div>

              {/* Our Story Section */}
              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Phần: Câu chuyện của chúng tôi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề phần</label>
                      <input 
                        type="text" 
                        value={siteSettings.storyTitle || ''}
                        onChange={e => setSiteSettings({...siteSettings, storyTitle: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none"
                        placeholder="VD: Mang Hương Vị Truyền Thống..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nội dung câu chuyện</label>
                      <textarea 
                        value={siteSettings.storyContent || ''}
                        onChange={e => setSiteSettings({...siteSettings, storyContent: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none h-48"
                        placeholder="Kể về hành trình của Minh Đức..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Loại nội dung hiển thị</label>
                      <div className="flex space-x-2">
                        {[
                          { id: 'image', icon: <ImageIcon className="w-4 h-4 mr-2" />, label: '1 Ảnh' },
                          { id: 'gallery', icon: <ImagesIcon className="w-4 h-4 mr-2" />, label: 'Nhiều ảnh' },
                          { id: 'video', icon: <VideoIcon className="w-4 h-4 mr-2" />, label: 'Video' }
                        ].map(type => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSiteSettings({...siteSettings, storyMediaType: type.id as any})}
                            className={`flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-bold border transition-all ${
                              siteSettings.storyMediaType === type.id 
                                ? 'bg-red-600 border-red-600 text-white shadow-md' 
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {type.icon}
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {siteSettings.storyMediaType === 'image' && (
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh minh họa</label>
                        <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                          {siteSettings.storyImage ? (
                            <img 
                              src={getDirectImageUrl(siteSettings.storyImage)} 
                              alt="Story Preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Upload className="text-gray-400 w-12 h-12" />
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleStoryImageUpload}
                            className="hidden" 
                            id="story-image-upload"
                          />
                          <label 
                            htmlFor="story-image-upload"
                            className="flex-1 text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            Tải ảnh mới
                          </label>
                          <input 
                            type="text" 
                            value={siteSettings.storyImage || ''}
                            onChange={e => setSiteSettings({...siteSettings, storyImage: e.target.value})}
                            placeholder="Hoặc nhập URL ảnh"
                            className="flex-[2] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {siteSettings.storyMediaType === 'gallery' && (
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Thư viện ảnh</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(siteSettings.storyImages || []).map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                              <img src={getDirectImageUrl(img)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeGalleryImage(idx)}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <Plus className="w-6 h-6 text-gray-300" />
                            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Thêm ảnh</span>
                            <input type="file" multiple accept="image/*" onChange={handleStoryGalleryUpload} className="hidden" />
                          </label>
                        </div>
                        {uploading && <p className="text-xs text-red-600 animate-pulse font-bold">Đang tải ảnh lên...</p>}
                      </div>
                    )}

                    {siteSettings.storyMediaType === 'video' && (
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Video minh họa (Xem trước)</label>
                        <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
                          {siteSettings.storyVideoUrl ? (
                            isDirectVideo(siteSettings.storyVideoUrl) ? (
                              <video 
                                src={siteSettings.storyVideoUrl}
                                className="w-full h-full object-cover"
                                controls
                              ></video>
                            ) : (
                              <iframe 
                                src={getEmbedUrl(siteSettings.storyVideoUrl)}
                                className="w-full h-full border-0"
                                allowFullScreen
                              ></iframe>
                            )
                          ) : (
                            <VideoIcon className="text-gray-700 w-16 h-16" />
                          )}
                        </div>
                        <div>
                          <input 
                            type="text" 
                            value={siteSettings.storyVideoUrl || ''}
                            onChange={e => setSiteSettings({...siteSettings, storyVideoUrl: e.target.value})}
                            placeholder="Nhập URL Video (YouTube, Vimeo, Google Drive, hoặc link .mp4)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 outline-none text-sm"
                          />
                          <p className="text-[10px] text-gray-400 mt-2 italic">
                            Hỗ trợ: YouTube, Vimeo, Google Drive (link chia sẻ), hoặc link video trực tiếp (.mp4, .mov). <br/>
                            <span className="text-red-500 font-bold">Lưu ý lỗi 403 (Google Drive):</span> <br/>
                            1. Bạn phải chọn <span className="underline">"Bất kỳ ai có đường liên kết"</span>. <br/>
                            2. Quyền phải là <span className="underline">"Người xem"</span>. <br/>
                            3. Nếu vẫn lỗi, hãy thử mở link video trong tab ẩn danh, nếu tab ẩn danh không xem được thì trang web cũng không xem được.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={savingSettings || uploading}
                  className="bg-red-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center disabled:opacity-50"
                >
                  {savingSettings ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {savingSettings ? 'Đang lưu cài đặt...' : 'Lưu tất cả cài đặt'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
