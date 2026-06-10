import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/somecomponants/logo.png'
import cardBg from '../assets/background/card-bg.png'
import imgSignup2 from '../assets/background/imgsignup2.png'

function RegisterStep2() {
  // BACKEND GAP: this profile-customization step (avatar upload, news-interest
  // category, geographic region, "show my name/photo" visibility) has NO documented
  // endpoint in frontend_integration.md — there is no `PUT /user`/`/profile`/avatar
  // upload route. The account is already created and authenticated in step 1, so this
  // screen only collects preferences locally and proceeds to the dashboard.
  // TODO: BACKEND — expose a profile-update endpoint to persist avatar + preferences.
  const navigate = useNavigate()
  const [fileName, setFileName] = useState('لم يتم اختيار أي ملف')
  const [preview, setPreview] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      setPreview(URL.createObjectURL(file))
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
      <div className="rounded-3xl  flex w-full max-w-5xl overflow-hidden">

        {/* يسار - الصورة الزرقاء */}
        <div className="w-[45%] relative">
          <img
            src={cardBg}
            alt="card"
            className="w-full h-full object-cover rounded-3xl"
          />

          {/* الكلام فوق الصورة */}
          <div className="absolute inset-0 p-10 flex flex-col justify-between rounded-3xl text-white" dir="rtl">
            <div className="mt-12">
              <h2 className="text-5xl font-bold leading-tight mb-6 text-rtght">
                نصائح<br />ذكية للتحقيق
              </h2>
              <div className="text-5xl font-bold mb-3 text-center">"</div>
              <p className="font-bold text-center mb-8">قراءة النصائح لا تستغرق أكثر من دقيقة 😊</p>
              <ul className="space-y-4 text-sm leading-relaxed">
                <li>1. تحقق دائما من المصدر الأصلي قبل المشاركة.</li>
                <li>2. قارن القصة عبر مصادر موثوقة.</li>
                <li>3. انتبه للعناوين المضللة والصور المعدلة.</li>
                <li>4. تحقق من التواريخ والمواقع والسياق بعناية.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full self-center"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full self-center"></div>
                <div className="w-6 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* صورة الأسفل مع النص */}
          <div className="absolute bottom-0 left-0 right-0 h-48 rounded-b-3xl overflow-hidden">
            <img
              src={imgSignup2}
              alt="team"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-white font-bold text-xl text-center leading-relaxed">
                فكر قبل أن تشارك، فالحقيقة تنتشر ببطء، لكنها تدوم لفترة أطول.
              </p>
            </div>
          </div>
        </div>

        {/* يمين - الفورم */}
        <div className="w-[55%] p-12 flex flex-col justify-center" dir="rtl">
          <div className="mb-8">
            <img src={logo} alt="Manara" className="h-8" />
          </div>

          <h1 className="text-4xl font-bold mb-2">كن مدقق حقائق 🔍</h1>
          <p className="text-gray-500 text-sm mb-6">قم بتخصيص حسابك قبل استخدامه!</p>

          <input
            type="file"
            accept="image/*"
            id="fileInput"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center gap-4 mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <svg width="28" height="28" fill="none" stroke="#aaa" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              )}
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm text-gray-500 mb-2">يرجى تحميل صورة مربعة، بحجم أقل من 100 كيلوبايت.</p>
              <div className="flex items-center justify-end gap-3">
                <span className="text-sm text-gray-400 truncate max-w-[140px]">{fileName}</span>
                <button
                  onClick={() => document.getElementById('fileInput').click()}
                  className="border border-blue-500 text-blue-500 text-sm px-4 py-1.5 rounded-lg hover:bg-blue-50 transition"
                >
                  اختر ملف
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-start mb-6">
            <button className="bg-[#2563EB] text-white text-sm px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              حفظ
            </button>
          </div>

          <label className="text-sm text-gray-700 mb-1 block">ما هي الأخبار التي تهمك؟</label>
          <div className="relative mb-5">
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 appearance-none text-gray-400">
              <option value="" disabled selected>على سبيل المثال، سياسي، رياضي، إلخ.</option>
              <option value="politics">سياسة</option>
              <option value="sports">رياضة</option>
              <option value="tech">تكنولوجيا</option>
              <option value="economy">اقتصاد</option>
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          <label className="text-sm text-gray-700 mb-1 block">ما هي المنطقة الجغرافية التي تهمك؟</label>
          <div className="relative mb-6">
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 appearance-none text-gray-400">
              <option value="" disabled selected>على سبيل المثال، الشرق الأوسط، أوروبا، إلخ.</option>
              <option value="middle-east">الشرق الأوسط</option>
              <option value="europe">أوروبا</option>
              <option value="america">أمريكا</option>
              <option value="asia">آسيا</option>
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer mb-8">
            <input type="checkbox" className="w-4 h-4 accent-blue-600" defaultChecked />
            أظهر اسمك وصورتك للمستخدمين الآخرين
          </label>

          <button
           onClick={() => navigate('/dashboard')}
            className="w-full bg-[#2563EB] text-white py-4 rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
          >
            انتهاء
          </button>
        </div>

      </div>
    </div>
  )
}

export default RegisterStep2