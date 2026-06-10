import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/somecomponants/logo.png'
import cardBg from '../assets/background/card-bg.png'
import { authApi, setToken, setUser } from '../lib/api'

function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNext = async () => {
    if (!displayName) { setError('اسم العرض مطلوب'); return }
    if (!email) { setError('البريد الإلكتروني مطلوب'); return }
    if (!password) { setError('كلمة المرور مطلوبة'); return }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    if (password !== confirmPassword) { setError('كلمة المرور وتأكيدها غير متطابقتين'); return }
    if (!privacyChecked) { setError('يجب الموافقة على سياسة الخصوصية'); return }

    setLoading(true)
    setError('')

    try {
      // POST /register → { user, token }.
      // The backend needs both `userName` (unique handle) and `name`. The form only
      // collects a single "display name", so per the integration doc we map it to both.
      const { token, user } = await authApi.register({
        userName: displayName,
        name: displayName,
        email,
        password,
        password_confirmation: confirmPassword,
      })
      setToken(token)
      setUser(user)
      navigate('/register-step2')
    } catch (err) {
      // 422 → surface the first field-level validation message (e.g. duplicate userName/email).
      const firstFieldError = err?.errors && Object.values(err.errors)[0]?.[0]
      setError(firstFieldError || err?.message || 'تعذّر إنشاء الحساب، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        backgroundImage: 'radial-gradient(circle, #c0c0c0 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        backgroundColor: '#ffffffff',
      }}
    >
      <div className="rounded-3xl flex w-full max-w-5xl overflow-hidden">

        {/* يسار - البطاقة الزرقاء */}
        <div className="w-[45%] relative min-h-full">
          <img
            src={cardBg}
            alt="card"
            className="w-full h-full object-fill"
          />

          <div className="absolute inset-0 p-10 flex flex-col justify-between rounded-3xl text-white" dir="rtl">
            <div className="mt-12">
              <h2 className="text-5xl font-bold leading-tight mb-6 text-right">
                الثقة<br />والشفافية أولاً
              </h2>
              <div className="text-5xl font-bold mb-3 text-center">"</div>
              <p className="font-bold text-center mb-8">قراءة السياسات لا تستغرق أكثر من دقيقة 😊</p>
              <ul className="space-y-5 text-sm leading-relaxed">
                <li>1. نحن نحمي بياناتك الشخصية ولا نشاركها أبداً بدون موافقتك.</li>
                <li>2. يتم الحفاظ على سرية نشاطك واستخدامه فقط لتحسين دقة التحقق.</li>
                <li>3. لا نقوم بتخزين أو إساءة استخدام البيانات الحساسة بيانات التحقيق.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="w-6 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full self-center"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full self-center"></div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                  />
                  أوافق على سياسة الخصوصية.
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  أتعهد بعدم نشر معلومات مضللة عن قصد.
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* يمين - الفورم */}
        <div className="w-[55%] p-12 flex flex-col justify-center" dir="rtl">
          <div className="mb-10">
            <img src={logo} alt="Manara" className="h-8" />
          </div>

          <h1 className="text-4xl font-bold mb-3">كن مدقق حقائق 🔍</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            أنشئ حسابك وانضم إلى طريقة جديدة للتحقيق<br />في الحقيقة وراء الأخبار.
          </p>

          <label className="text-sm text-gray-700 mb-1 block">اسم العرض</label>
          <input
            type="text"
            placeholder="لست مضطراً لكتابة اسمك الشخصي"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm outline-none focus:border-blue-400 bg-gray-50 w-full"
          />

          <label className="text-sm text-gray-700 mb-1 block">البريد الالكتروني</label>
          <input
            type="email"
            placeholder="Example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm outline-none focus:border-blue-400 bg-gray-50 w-full"
          />

          <label className="text-sm text-gray-700 mb-1 block">كلمة المرور</label>
          <div className="relative mb-5">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {showPassword
                  ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
            </button>
          </div>

          <label className="text-sm text-gray-700 mb-1 block">تأكيد كلمة المرور</label>
          <div className="relative mb-5">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50"
            />
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {showConfirm
                  ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
          )}

          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full bg-[#2563EB] text-white py-4 rounded-xl font-semibold text-sm hover:bg-blue-700 transition mb-4 disabled:opacity-50"
          >
            {loading ? 'جاري التسجيل...' : 'الخطوة التالية'}
          </button>

          <p className="text-center text-sm text-gray-500">
            هل لديك حساب بالفعل؟{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-blue-600 font-medium cursor-pointer"
            >
              تسجيل الدخول
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Register