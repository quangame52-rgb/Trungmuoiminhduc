import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Utensils, ShieldCheck, AlertCircle, Lock } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple password check as requested
    if (password === '123456') {
      try {
        // Sign in anonymously to provide a Firebase Auth session for Firestore rules
        await signInAnonymously(auth);
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } catch (err: any) {
        console.error("Anonymous login error:", err);
        setError("Lỗi xác thực hệ thống. Vui lòng thử lại.");
        setLoading(false);
      }
    } else {
      setError("Mật khẩu không chính xác.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email === 'quangame52@gmail.com') {
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else {
        setError("Bạn không có quyền truy cập trang quản trị.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Lỗi đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-12 text-center">
        <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-600/20">
          <Utensils className="text-white w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">Admin Login</h1>
        <p className="text-gray-500 mb-8">Vui lòng nhập mật khẩu quản trị hoặc đăng nhập Google. <br/><span className="text-[10px] text-red-500 font-bold uppercase mt-2 block">Lưu ý: Cần đăng nhập Google để lưu thay đổi dữ liệu</span></p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
            <p className="text-left">{error}</p>
          </div>
        )}

        <form onSubmit={handlePasswordLogin} className="space-y-4 mb-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Mật khẩu quản trị"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600/20 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập với Mật khẩu"}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-bold">Hoặc</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" />
          <span>Tiếp tục với Google</span>
        </button>

        <div className="mt-10 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 uppercase tracking-widest font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Admin Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
