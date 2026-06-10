import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/somecomponants/logo.png'
import cardBg from '../assets/background/card-bg.png'
import loginIcon from '../assets/somecomponants/login.png'
import loginImg from '../assets/background/loginimg.png'
import { authApi, setToken, setUser } from '../lib/api'

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email) { setError('البريد الإلكتروني مطلوب'); return }
    if (!password) { setError('كلمة المرور مطلوبة'); return }

    setLoading(true)
    setError('')

    try {
      // POST /login → { user, token }
      const { token, user } = await authApi.login(email, password)
      setToken(token)
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      // 422 → invalid credentials (per-field message), otherwise generic.
      const msg = err?.errors?.email?.[0] || err?.message
      setError(
        err?.status === 422
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : msg || 'تعذّر تسجيل الدخول، حاول مرة أخرى'
      )
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

        {/* يسار - الكارد الأزرق */}
        <div className="w-[45%] relative min-h-full">
          <img
            src={cardBg}
            alt="card"
            className="w-full h-full object-fill"
          />

          <div className="absolute inset-0 p-10 flex flex-col justify-between rounded-3xl text-white" dir="rtl">
            <div className="mt-12">
              <h2 className="text-5xl font-bold leading-tight mb-6 text-right">
                ماذا قال صحفيونا<br />عن منارة؟
              </h2>
              <div className="text-5xl font-bold mb-6 text-right">"</div>
              <p className="text-right text-sm leading-relaxed mb-6">
                أصبحت تحقيقاتنا أسرع وأكثر موثوقية بفضل<br />
                أدوات تتبع المصادر والتحقق التي توفرها منصة منارة.
              </p>
              <p className="text-right text-sm font-bold">
                سارة ميتشل،<br />
                صحفية استقصائية في شبكة الأخبار العالمية
              </p>
            </div>

            {/* البطاقة البيضاء */}
            <div className="relative">
              <img src={loginImg} alt="card" className="w-full" />
              <div className="absolute inset-0 p-2 flex gap-3 items-start flex-row-reverse pt-6 pr-4">
                <img src={loginIcon} alt="icon" className="w-12 h-12 rounded-xl flex-shrink-0 -mt-5" />
                <div className="text-right">
                  <p className="text-gray-800 font-bold text-sm mb-1">
                    تحقق من كل قصة بثقة<br />واكشف الحقيقة بشكل أسرع.
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    كن من أوائل الصحفيين والباحثين الذين يختبرون
                    طريقة أكثر ذكاءً لتتبع المعلومات المضللة والمصادر الموثوقة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* يمين - الفورم */}
        <div className="w-[55%] p-12 flex flex-col justify-center" dir="rtl">
          <div className="mb-8">
            <img src={logo} alt="Manara" className="h-8" />
          </div>

          <h1 className="text-4xl font-bold mb-3">أهلاً بك مجدداً 👋</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            واصل كشف الحقيقة وراء كل قصة باستخدام أدوات قوية<br />
            للتحقق والتتبع والتحقيق الموثوق.
          </p>

          <label className="text-sm text-gray-700 mb-1 block">البريد الالكتروني</label>
          <input
            type="email"
            placeholder="Example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm outline-none focus:border-blue-400 bg-gray-50 w-full"
          />

          <label className="text-sm text-gray-700 mb-1 block">كلمة المرور</label>
          <div className="relative mb-2">
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

          <div className="flex justify-start mb-6">
            <a href="#" className="text-blue-600 text-sm">هل نسيت كلمة المرور؟</a>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#2563EB] text-white py-4 rounded-xl font-semibold text-sm hover:bg-blue-700 transition mb-4 disabled:opacity-50"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-sm">Or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <button className="w-full border border-gray-200 py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition mb-6">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="text-center text-sm text-gray-500">
            ليس لديك حساب؟{' '}
            <span
              onClick={() => navigate('/register')}
              className="text-blue-600 font-medium cursor-pointer"
            >
              التسجيل
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login