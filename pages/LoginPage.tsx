import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Spinner, Modal } from '../components/UI';

export const LoginPage = ({ onLogin, onNavigate, allowRegistrations = true }: { onLogin: (user: User) => void; onNavigate: (page: string) => void; allowRegistrations?: boolean }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const { ok, message } = await storageService.createPasswordResetOtp(forgotEmail.trim());
      if (ok) {
        setForgotStep('otp');
        setForgotSuccess('تم إرسال رمز التحقق إلى بريدك الإلكتروني. صلاحيته 10 دقائق.');
      } else {
        setForgotError(message || 'حدث خطأ');
      }
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setForgotError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('كلمة المرور غير مطابقة');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const { ok, message } = await storageService.resetPasswordWithOtp(forgotEmail.trim(), otp, newPassword);
      if (ok) {
        setForgotSuccess('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep('email');
          setOtp('');
          setNewPassword('');
          setConfirmPassword('');
          setForgotEmail('');
        }, 1500);
      } else {
        setForgotError(message || 'حدث خطأ');
      }
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 Login attempt started');
      const user = await storageService.login(email, password);
      if (user) {
        console.log('✅ Login successful, user:', user);
        onLogin(user);
      } else {
        console.log('❌ Login failed: Invalid credentials');
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error('❌ Login error caught:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالخادم';
      setError(`حدث خطأ أثناء الاتصال بالخادم: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="flex justify-center cursor-pointer mb-4" onClick={() => onNavigate('landing')}>
            <img 
              src="/assets/logo.png" 
              alt="المحامي" 
              className="w-12 h-12 rounded-lg shadow-lg hover:shadow-gold-500/50 transition object-contain"
            />
          </div>
          <button
            onClick={() => onNavigate('landing')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <span>←</span>
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">تسجيل الدخول</h2>
        {allowRegistrations && (
          <p className="mt-2 text-center text-sm text-gray-600">
            أو <button onClick={() => onNavigate('register')} className="font-medium text-primary-600 hover:text-primary-500">إنشاء حساب جديد</button>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">كلمة المرور</label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div className="mt-2 text-left">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setForgotStep('email'); setForgotEmail(email); setForgotError(''); setForgotSuccess(''); }}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
              >
                {loading ? <Spinner /> : 'دخول'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal isOpen={showForgotModal} onClose={() => { setShowForgotModal(false); setForgotStep('email'); setForgotError(''); setForgotSuccess(''); }}>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">إعادة تعيين كلمة المرور</h3>
          {forgotStep === 'email' ? (
            <form onSubmit={handleForgotSendOtp}>
              <p className="text-sm text-gray-600 mb-3">أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق.</p>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              {forgotError && <p className="text-red-500 text-sm mb-2">{forgotError}</p>}
              {forgotSuccess && <p className="text-green-600 text-sm mb-2">{forgotSuccess}</p>}
              <button type="submit" disabled={forgotLoading} className="w-full py-2 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50">
                {forgotLoading ? <Spinner /> : 'إرسال رمز التحقق'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotReset}>
              <p className="text-sm text-gray-600 mb-3">أدخل الرمز المرسل إلى {forgotEmail}</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="رمز التحقق (6 أرقام)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-center tracking-widest"
              />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              {forgotError && <p className="text-red-500 text-sm mb-2">{forgotError}</p>}
              {forgotSuccess && <p className="text-green-600 text-sm mb-2">{forgotSuccess}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setForgotStep('email')} className="flex-1 py-2 border border-gray-300 rounded-md">
                  رجوع
                </button>
                <button type="submit" disabled={forgotLoading} className="flex-1 py-2 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50">
                  {forgotLoading ? <Spinner /> : 'تعيين كلمة المرور'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};