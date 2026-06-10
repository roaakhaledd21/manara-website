import { useState, useEffect } from 'react'
import {
  Search, Bell, ArrowUpRight, Zap, Clock,
  Crosshair, Scale, Share2, AlertTriangle, Globe, TrendingUp,
} from 'lucide-react'
import mapBg from '../assets/background/container.png'
import Sidebar from '../components/Sidebar'
import { api } from '../lib/api'

// Build avatar initials from a display name ("John Doe" → "JD").
const initialsOf = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')

  // Community Feed widget — wired to GET /community (take first 2). See doc §2.
  const [allFeed, setAllFeed] = useState([])

  useEffect(() => {
    let active = true
    api.get('/community')
      .then(posts => {
        if (!active) return
        const mapped = (posts || []).slice(0, 2).map(p => ({
          initials: initialsOf(p.user?.name),
          author: `@${p.user?.userName ?? 'unknown'}`,
          text: p.verification?.content ?? '',
        }))
        setAllFeed(mapped)
      })
      .catch(() => { /* widget stays empty on failure; non-blocking */ })
    return () => { active = false }
  }, [])

  const stats = [
    { label: 'SCANNED_TOTAL', value: '124,892', change: '+12%', color: '#EC4899', changeColor: 'text-pink-500', up: true },
    { label: 'MISINFO_FLAGGED', value: '4,201', change: '+5.2%', color: '#EF4444', changeColor: 'text-red-500', up: true },
    { label: 'VERIFIED_NEUTRAL', value: '98,415', change: 'Stable', color: '#10B981', changeColor: 'text-gray-400', up: false },
    { label: 'PENDING_REVIEW', value: '22,276', change: '+28%', color: '#3B82F6', changeColor: 'text-blue-500', warn: true },
  ]

  const allTrends = [
    { title: 'Deepfake Currency Crisis', desc: 'Synthesized video of Central Bank official...', pct: '422%', tags: ['Manipulated Media', 'Finance'] },
    { title: 'AI Health Breakthrough', desc: 'Claims of incurable disease cure surfacing from', pct: '88%', tags: ['Unverified', 'Health'] },
    { title: 'Regional Conflict Video', desc: 'Misattributed footage from 2012 used for current', pct: '1,204%', tags: ['Out of Context', 'Geopolitics'] },
  ]

  // BACKEND GAP: the stat cards above, "Emerging Trends" and this "Activity Timeline"
  // have no endpoint yet (GET /dashboard/stats|trends|timeline are not implemented),
  // so they remain mocked per frontend_integration.md §2.
  const allTimeline = [
    { color: 'border-green-400', time: '08:42:01 UTC', text: 'ANALYST_K7 completed source trace for', highlight: '#GlobalSummitLeak', highlightColor: 'text-blue-600', result: 'Result: 94% Credibility - Trusted Source Found.', resultColor: 'bg-green-50 text-green-700' },
    { color: 'border-red-300', time: '08:15:44 UTC', text: 'Automated scan triggered by', highlight: 'Critical Misinform Velocity', highlightColor: 'text-red-500', suffix: 'in EU cluster.' },
    { color: 'border-blue-300', time: '07:50:12 UTC', text: 'Platform update:', highlight: 'Model v4.2.1 Deployment', highlightColor: 'text-green-600', suffix: 'complete. Bias detection sensitivity increased.' },
  ]

  // فلترة حسب السيرش
  const q = searchQuery.toLowerCase()
  const filteredTrends = q === '' ? allTrends : allTrends.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  )
  const filteredFeed = q === '' ? allFeed : allFeed.filter(f =>
    f.author.toLowerCase().includes(q) ||
    f.text.toLowerCase().includes(q)
  )
  const filteredTimeline = q === '' ? allTimeline : allTimeline.filter(t =>
    t.text.toLowerCase().includes(q) ||
    t.highlight.toLowerCase().includes(q) ||
    (t.suffix || '').toLowerCase().includes(q)
  )

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">
      <Sidebar />
      <main className="flex-1 px-8 py-6">

        {/* Topbar */}
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Scan URL, keyword, or source..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Intelligence Overview
          {searchQuery && <span className="text-base font-normal text-gray-400 ml-3">— results for "{searchQuery}"</span>}
        </h1>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border-2" style={{ borderColor: s.color }}>
              <p className="text-xs font-semibold text-gray-500 tracking-wide mb-2">{s.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                <span className={`text-sm font-bold flex items-center gap-1 ${s.changeColor}`}>
                  {s.change}
                  {s.up && <ArrowUpRight size={14} />}
                  {s.warn && <AlertTriangle size={14} />}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="bg-[#0a0e1a] rounded-3xl p-6 mb-8 relative overflow-hidden"
          style={{ backgroundImage: `url(${mapBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2 text-white">
              <Globe size={20} />
              <span className="font-bold text-lg">Geographical Density of Misinformation</span>
            </div>
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg text-xs">
              <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-red-500" /> CRITICAL</span>
              <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-yellow-400" /> ELEVATED</span>
              <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-green-500" /> NORMAL</span>
            </div>
          </div>
          <div className="h-80" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            {[
              { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH', color: 'text-red-400', bg: 'bg-red-500/30 text-red-300', pct: '78%' },
              { zone: 'EUROPE_ZONE', label: 'LOW', color: 'text-green-400', bg: 'bg-green-500/30 text-green-300', pct: '12%' },
              { zone: 'AFRICA_ZONE', label: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-500/30 text-yellow-300', pct: '44%' },
            ].map(z => (
              <div key={z.zone} className="bg-black/40 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 tracking-wide mb-1">{z.zone}</p>
                <div className="flex items-center justify-between">
                  <span className={`${z.color} font-bold`}>{z.label}</span>
                  <span className={`text-xs ${z.bg} px-2 py-0.5 rounded`}>{z.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Emerging Trends */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Zap size={18} className="text-blue-600" /> Emerging Trends
              </div>
              <span className="text-xs text-gray-400">Auto Refresh</span>
            </div>
            {filteredTrends.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No results found.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {filteredTrends.map((t) => (
                  <div key={t.title}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900">{t.title}</span>
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <TrendingUp size={12} /> {t.pct}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{t.desc}</p>
                    <div className="flex gap-2">
                      {t.tags.map((tag, i) => (
                        <span key={tag} className={`text-xs px-3 py-1 rounded ${i === 0 ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 font-bold text-gray-900 mb-5 pb-4 border-b border-gray-100">
              <Clock size={18} className="text-blue-600" /> Activity Timeline
            </div>
            {filteredTimeline.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No results found.</p>
            ) : (
              <div className="flex flex-col gap-5 text-sm">
                {filteredTimeline.map((t, i) => (
                  <div key={i} className={`border-l-2 ${t.color} pl-4`}>
                    <p className="text-xs text-gray-400 mb-1">{t.time}</p>
                    <p className="text-gray-900">
                      {t.text} <span className={`font-medium ${t.highlightColor}`}>{t.highlight}</span>
                      {t.suffix && ` ${t.suffix}`}
                    </p>
                    {t.result && (
                      <p className={`mt-2 text-xs px-3 py-2 rounded ${t.resultColor}`}>{t.result}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action + Community Feed */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="font-bold text-gray-900 mb-4">Quick Action</p>
              <div className="flex flex-col gap-2">
                {[{ label: 'Trace Source', icon: Crosshair }, { label: 'Analyze Bias', icon: Scale }, { label: 'Network Map', icon: Share2 }].map((a) => {
                  const Icon = a.icon
                  return (
                    <button key={a.label} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition">
                      <Icon size={18} className="text-gray-500" /> {a.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="font-bold text-gray-900 mb-4">Community Feed</p>
              {filteredFeed.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">No results found.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredFeed.map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">{f.initials}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{f.author}</p>
                        <p className="text-xs text-gray-500">{f.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Critical alert */}
        <div className="bg-red-100 border border-red-200 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AlertTriangle className="text-red-500 shrink-0" size={28} />
            <div>
              <p className="font-bold text-red-700 text-sm tracking-wide">CRITICAL_ALERT: MASS_COORDINATED_ASTROTURFING</p>
              <p className="text-red-600 text-sm">Unusually high cluster of synchronized posting detected regarding 'Energy Policy B-14'. Review recommended.</p>
            </div>
          </div>
          <button className="bg-white text-red-600 font-bold text-xs px-5 py-3 rounded-xl tracking-wide hover:bg-red-50 transition shrink-0">
            DEPLOY COUNTER-SCAN
          </button>
        </div>

      </main>
    </div>
  )
}

export default Dashboard


// import {
//   Search, Bell, ArrowUpRight, Zap, Clock,
//   Crosshair, Scale, Share2, AlertTriangle, Globe, TrendingUp,
// } from 'lucide-react'
// import mapBg from '../assets/background/Container.png'
// import Sidebar from '../components/Sidebar'

// function Dashboard() {



//   const stats = [
//     { label: 'SCANNED_TOTAL', value: '124,892', change: '+12%', color: '#EC4899', changeColor: 'text-pink-500', up: true },
//     { label: 'MISINFO_FLAGGED', value: '4,201', change: '+5.2%', color: '#EF4444', changeColor: 'text-red-500', up: true },
//     { label: 'VERIFIED_NEUTRAL', value: '98,415', change: 'Stable', color: '#10B981', changeColor: 'text-gray-400', up: false },
//     { label: 'PENDING_REVIEW', value: '22,276', change: '+28%', color: '#3B82F6', changeColor: 'text-blue-500', warn: true },
//   ]

//   const trends = [
//     { title: 'Deepfake Currency Crisis', desc: 'Synthesized video of Central Bank official...', pct: '422%', tags: ['Manipulated Media', 'Finance'] },
//     { title: 'AI Health Breakthrough', desc: 'Claims of incurable disease cure surfacing from', pct: '88%', tags: ['Unverified', 'Health'] },
//     { title: 'Regional Conflict Video', desc: 'Misattributed footage from 2012 used for current', pct: '1,204%', tags: ['Out of Context', 'Geopolitics'] },
//   ]

//   return (
//     <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">

//     {/* Sidebar */}
//       <Sidebar />

//       {/* Main */}
//       <main className="flex-1 px-8 py-6">

//         {/* Topbar */}
//         <div className="flex items-center justify-between gap-6 mb-8">
//           <div className="relative flex-1 max-w-2xl">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//             <input
//               type="text"
//               placeholder="Scan URL, keyword, or source..."
//               className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500"
//             />
//           </div>
//           <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
//             <Bell size={22} />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
//           </button>
//         </div>

//         <h1 className="text-3xl font-bold text-gray-900 mb-6">Intelligence Overview</h1>

//         {/* Stat cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
//           {stats.map((s) => (
//             <div
//               key={s.label}
//               className="bg-white rounded-2xl p-5 border-2"
//               style={{ borderColor: s.color }}
//             >
//               <p className="text-xs font-semibold text-gray-500 tracking-wide mb-2">{s.label}</p>
//               <div className="flex items-end justify-between">
//                 <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
//                 <span className={`text-sm font-bold flex items-center gap-1 ${s.changeColor}`}>
//                   {s.change}
//                   {s.up && <ArrowUpRight size={14} />}
//                   {s.warn && <AlertTriangle size={14} />}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Map section */}
//         <div
//           className="bg-[#0a0e1a] rounded-3xl p-6 mb-8 relative overflow-hidden"
//           style={{
//             backgroundImage: `url(${mapBg})`,
//             backgroundSize: 'cover',
//             backgroundPosition: 'center',
//             backgroundRepeat: 'no-repeat',
//           }}
//         >
//           <div className="flex items-center justify-between mb-4 relative z-10">
//             <div className="flex items-center gap-2 text-white">
//               <Globe size={20} />
//               <span className="font-bold text-lg">Geographical Density of Misinformation</span>
//             </div>
//             <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg text-xs">
//               <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-red-500" /> CRITICAL</span>
//               <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-yellow-400" /> ELEVATED</span>
//               <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-green-500" /> NORMAL</span>
//             </div>
//           </div>

//           {/* Spacer so the map image is visible */}
//           <div className="h-80" />

//           {/* Zone bars */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
//             <div className="bg-black/40 rounded-xl p-4">
//               <p className="text-[10px] text-gray-400 tracking-wide mb-1">MIDDLE EAST_ZONE, KOREA_ZONE</p>
//               <div className="flex items-center justify-between">
//                 <span className="text-red-400 font-bold">HIGH</span>
//                 <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded">78%</span>
//               </div>
//             </div>
//             <div className="bg-black/40 rounded-xl p-4">
//               <p className="text-[10px] text-gray-400 tracking-wide mb-1">EUROPE_ZONE</p>
//               <div className="flex items-center justify-between">
//                 <span className="text-green-400 font-bold">LOW</span>
//                 <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded">12%</span>
//               </div>
//             </div>
//             <div className="bg-black/40 rounded-xl p-4">
//               <p className="text-[10px] text-gray-400 tracking-wide mb-1">AFRICA_ZONE</p>
//               <div className="flex items-center justify-between">
//                 <span className="text-yellow-400 font-bold">MODERATE</span>
//                 <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded">44%</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bottom 3 columns */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

//           {/* Emerging Trends */}
//           <div className="bg-white rounded-2xl border border-gray-200 p-6">
//             <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
//               <div className="flex items-center gap-2 font-bold text-gray-900">
//                 <Zap size={18} className="text-blue-600" /> Emerging Trends
//               </div>
//               <span className="text-xs text-gray-400">Auto Refresh</span>
//             </div>
//             <div className="flex flex-col gap-5">
//               {trends.map((t) => (
//                 <div key={t.title}>
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="font-bold text-sm text-gray-900">{t.title}</span>
//                     <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
//                       <TrendingUp size={12} /> {t.pct}
//                     </span>
//                   </div>
//                   <p className="text-xs text-gray-500 mb-2">{t.desc}</p>
//                   <div className="flex gap-2">
//                     {t.tags.map((tag, i) => (
//                       <span
//                         key={tag}
//                         className={`text-xs px-3 py-1 rounded ${
//                           i === 0 ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'
//                         }`}
//                       >
//                         {tag}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Activity Timeline */}
//           <div className="bg-white rounded-2xl border border-gray-200 p-6">
//             <div className="flex items-center gap-2 font-bold text-gray-900 mb-5 pb-4 border-b border-gray-100">
//               <Clock size={18} className="text-blue-600" /> Activity Timeline
//             </div>
//             <div className="flex flex-col gap-5 text-sm">
//               <div className="border-l-2 border-green-400 pl-4">
//                 <p className="text-xs text-gray-400 mb-1">08:42:01 UTC</p>
//                 <p className="text-gray-900">ANALYST_K7 completed source trace for <span className="text-blue-600 font-medium">#GlobalSummitLeak</span>.</p>
//                 <p className="mt-2 bg-green-50 text-green-700 text-xs px-3 py-2 rounded">Result: 94% Credibility - Trusted Source Found.</p>
//               </div>
//               <div className="border-l-2 border-red-300 pl-4">
//                 <p className="text-xs text-gray-400 mb-1">08:15:44 UTC</p>
//                 <p className="text-gray-900">Automated scan triggered by <span className="text-red-500 font-medium">Critical Misinform Velocity</span> in EU cluster.</p>
//               </div>
//               <div className="border-l-2 border-blue-300 pl-4">
//                 <p className="text-xs text-gray-400 mb-1">07:50:12 UTC</p>
//                 <p className="text-gray-900">Platform update: <span className="text-green-600 font-medium">Model v4.2.1 Deployment</span> complete. Bias detection sensitivity increased.</p>
//               </div>
//             </div>
//           </div>

//           {/* Quick Action + Community Feed */}
//           <div className="flex flex-col gap-6">
//             <div className="bg-white rounded-2xl border border-gray-200 p-6">
//               <p className="font-bold text-gray-900 mb-4">Quick Action</p>
//               <div className="flex flex-col gap-2">
//                 {[
//                   { label: 'Trace Source', icon: Crosshair },
//                   { label: 'Analyze Bias', icon: Scale },
//                   { label: 'Network Map', icon: Share2 },
//                 ].map((a) => {
//                   const Icon = a.icon
//                   return (
//                     <button key={a.label} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition">
//                       <Icon size={18} className="text-gray-500" /> {a.label}
//                     </button>
//                   )
//                 })}
//               </div>
//             </div>

//             <div className="bg-white rounded-2xl border border-gray-200 p-6">
//               <p className="font-bold text-gray-900 mb-4">Community Feed</p>
//               <div className="flex flex-col gap-4">
//                 <div className="flex gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">JW</div>
//                   <div>
//                     <p className="text-sm font-semibold text-gray-900">@ReutersLab</p>
//                     <p className="text-xs text-gray-500">Confirmed fake: Image of burning building from current 'protests' is actually stock footage.</p>
//                   </div>
//                 </div>
//                 <div className="flex gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">MK</div>
//                   <div>
//                     <p className="text-sm font-semibold text-gray-900">@FactFirst</p>
//                     <p className="text-xs text-gray-500">Found a bot network promoting the same health claim script across 400 accounts.</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Critical alert bar */}
//         <div className="bg-red-100 border border-red-200 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
//           <div className="flex items-center gap-4">
//             <AlertTriangle className="text-red-500 shrink-0" size={28} />
//             <div>
//               <p className="font-bold text-red-700 text-sm tracking-wide">CRITICAL_ALERT: MASS_COORDINATED_ASTROTURFING</p>
//               <p className="text-red-600 text-sm">Unusually high cluster of synchronized posting detected regarding 'Energy Policy B-14'. Review recommended.</p>
//             </div>
//           </div>
//           <button className="bg-white text-red-600 font-bold text-xs px-5 py-3 rounded-xl tracking-wide hover:bg-red-50 transition shrink-0">
//             DEPLOY COUNTER-SCAN
//           </button>
//         </div>

//       </main>
//     </div>
//   )
// }

// export default Dashboard