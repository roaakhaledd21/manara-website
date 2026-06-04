
import { useState } from 'react'
import {
  Search, Bell, Settings2, ChevronDown, Bookmark, Share2,
  ShieldCheck, Play, X, Circle, Camera, Radio,
  ArrowUpRight, Wifi, Clock, LayoutGrid, Check, Timeline,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'

// TODO: BACKEND — كل البيانات دي تيجي من الـ API
const ALL_ARCHIVES = [
  {
    id: 1, badge: 'FALSE', badgeColor: 'bg-red-500',
    category: 'Politics', country: 'USA', dateGroup: 'Last Week', status: 'FALSE',
    title: 'Election Commission "Secretly Relocating" Over 50,000 Verified Ballots in Georgia',
    desc: 'Viral video clips claiming to show government officials moving boxes of "illegal ballots" under the...',
    reach: '1.2M+', method: 'False Context',
    result: 'Footage was actually from a 2018 legal storage move in an unrelated jurisdiction. Officials confirmed no ballots are stored in the shown location.',
    date: 'Oct 24, 2023', confidence: 98,
    platforms: [Play, X, Circle],
    timeline: [
      { date: 'Oct 20, 2023', event: 'Video first appeared on Twitter/X with false caption.' },
      { date: 'Oct 22, 2023', event: 'Fact-checkers flagged inconsistencies in metadata.' },
      { date: 'Oct 24, 2023', event: 'Officials confirmed footage was from 2018 legal move.' },
    ],
  },
  {
    id: 2, badge: 'MISLEADING', badgeColor: 'bg-orange-400',
    category: 'Health', country: 'Global', dateGroup: 'Last Week', status: 'MISLEADING',
    title: 'WHO Announces New Mandatory "Climate Lockdown" Protocols for 2025',
    desc: 'A widely shared infographic lists 12 cities allegedly signed up for "15-minute city" lockdowns starting...',
    reach: '450K+', method: 'Edited Media',
    result: 'Documents were doctored from an old public health strategy paper. The concept of "Climate Lockdowns" does not exist in WHO policy frameworks.',
    date: 'Oct 22, 2023', confidence: 85,
    platforms: [Camera, X],
    timeline: [
      { date: 'Oct 18, 2023', event: 'Infographic first shared on Facebook.' },
      { date: 'Oct 20, 2023', event: 'WHO issued official denial.' },
      { date: 'Oct 22, 2023', event: 'Source document identified as 2019 urban planning paper.' },
    ],
  },
  {
    id: 3, badge: 'FALSE', badgeColor: 'bg-red-500',
    category: 'Politics', country: 'USA', dateGroup: 'Last Month', status: 'FALSE',
    title: 'Pentagon Confirms Secret Underground Tunnel Network Beneath Washington D.C.',
    desc: 'A viral post claims declassified documents reveal a 200-mile tunnel system used for covert operations...',
    reach: '2.1M+', method: 'Fabricated Content',
    result: 'No such declassified documents exist. The claim originates from a known conspiracy forum with no verifiable sources.',
    date: 'Oct 20, 2023', confidence: 99,
    platforms: [X, Circle],
    timeline: [
      { date: 'Oct 15, 2023', event: 'Post published on conspiracy forum.' },
      { date: 'Oct 17, 2023', event: 'Pentagon press office denied the claim.' },
      { date: 'Oct 20, 2023', event: 'No evidence found after document review.' },
    ],
  },
  {
    id: 4, badge: 'MISLEADING', badgeColor: 'bg-orange-400',
    category: 'Science', country: 'Global', dateGroup: 'Last Month', status: 'MISLEADING',
    title: 'New Study Claims 5G Towers Directly Linked to Sudden Cardiac Events',
    desc: 'A widely circulated infographic attributes a rise in cardiac arrests to 5G infrastructure rollout...',
    reach: '890K+', method: 'Misrepresented Data',
    result: 'The cited study was retracted in 2022. No peer-reviewed evidence supports a link between 5G signals and cardiac events.',
    date: 'Oct 18, 2023', confidence: 91,
    platforms: [Camera, Radio, X],
    timeline: [
      { date: 'Oct 10, 2023', event: 'Infographic began circulating on TikTok.' },
      { date: 'Oct 14, 2023', event: 'Cited study confirmed retracted by journal.' },
      { date: 'Oct 18, 2023', event: 'Multiple health authorities issued corrections.' },
    ],
  },
  {
    id: 5, badge: 'FALSE', badgeColor: 'bg-red-500',
    category: 'Finance', country: 'UK', dateGroup: 'Last Month', status: 'FALSE',
    title: 'Bank of England Secretly Printing £500 Billion to Cover National Debt',
    desc: 'A viral infographic claims the central bank has been printing money covertly to service...',
    reach: '320K+', method: 'Fabricated Content',
    result: 'No such monetary operation was conducted. The Bank of England denied the claim.',
    date: 'Oct 15, 2023', confidence: 97,
    platforms: [Radio, X],
    timeline: [
      { date: 'Oct 12, 2023', event: 'Claim appeared in financial conspiracy newsletter.' },
      { date: 'Oct 15, 2023', event: 'Bank of England issued formal denial.' },
    ],
  },
  {
    id: 6, badge: 'MISLEADING', badgeColor: 'bg-orange-400',
    category: 'Health', country: 'USA', dateGroup: 'Last Week', status: 'MISLEADING',
    title: '"Miracle Cure" Suppressed by Pharma Giants Treats All Cancers in 72 Hours',
    desc: 'Posts across social media claim a natural compound has been suppressed by pharmaceutical companies...',
    reach: '1.5M+', method: 'False Context',
    result: 'The compound referenced exists but has only been tested in lab conditions. No clinical trials support the viral claims.',
    date: 'Oct 12, 2023', confidence: 88,
    platforms: [Camera, Circle, X],
    timeline: [
      { date: 'Oct 8, 2023', event: 'Post went viral on Facebook with 2M shares.' },
      { date: 'Oct 10, 2023', event: 'Researchers clarified compound is in early lab stage only.' },
      { date: 'Oct 12, 2023', event: 'FDA issued statement against the misleading claims.' },
    ],
  },
]

function MisinformationArchive() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [country, setCountry] = useState('All Countries')
  const [dateRange, setDateRange] = useState('All Dates')
  const [status, setStatus] = useState('All Status')
  const [openFilter, setOpenFilter] = useState(null)
  const [page, setPage] = useState(1)
  const [bookmarks, setBookmarks] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null) // popup
  const [popupMode, setPopupMode] = useState(null) // 'investigation' | 'timeline'

  const stats = [
    { icon: Settings2, label: 'TOTAL DEBUNKED', value: '14,282', badge: '+12%', badgeColor: 'text-green-600', bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: LayoutGrid, label: 'CATEGORIES', value: 'Politics', badge: '5 Active', badgeColor: 'text-orange-500', bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: Wifi, label: 'SOURCES TRACKED', value: '842', badge: 'Global', badgeColor: 'text-blue-600', bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: Clock, label: 'AVG VERIFICATION', value: '4.2 hrs', badge: '-14m', badgeColor: 'text-green-600', bg: 'bg-blue-50', color: 'text-blue-600' },
  ]

  const filters = [
    { key: 'cat', label: category, opts: ['All Categories', 'Politics', 'Health', 'Finance', 'Science'], setter: (v) => { setCategory(v); setPage(1) } },
    { key: 'cnt', label: country, opts: ['All Countries', 'USA', 'UK', 'Global'], setter: (v) => { setCountry(v); setPage(1) } },
    { key: 'date', label: dateRange, opts: ['All Dates', 'Last Week', 'Last Month'], setter: (v) => { setDateRange(v); setPage(1) } },
    { key: 'status', label: status, opts: ['All Status', 'FALSE', 'MISLEADING'], setter: (v) => { setStatus(v); setPage(1) } },
  ]

  // فلترة شاملة
  const q = searchQuery.toLowerCase()
  const filtered = ALL_ARCHIVES.filter(a => {
    const matchCat = category === 'All Categories' || a.category === category
    const matchCountry = country === 'All Countries' || a.country === country
    const matchDate = dateRange === 'All Dates' || a.dateGroup === dateRange
    const matchStatus = status === 'All Status' || a.status === status
    const matchSearch = q === '' ||
      a.title.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.method.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.result.toLowerCase().includes(q)
    return matchCat && matchCountry && matchDate && matchStatus && matchSearch
  })

  const ITEMS = 4
  const totalPages = Math.ceil(filtered.length / ITEMS)
  const paginated = filtered.slice((page - 1) * ITEMS, page * ITEMS)

  const handleClear = () => {
    setCategory('All Categories'); setCountry('All Countries')
    setDateRange('All Dates'); setStatus('All Status')
    setSearchQuery(''); setPage(1); setOpenFilter(null)
  }

  const toggleBookmark = (id) => {
    setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])
  }

  const handleShare = (id) => {
    navigator.clipboard?.writeText(`https://manara.app/archive/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const openPopup = (item, mode) => {
    setSelectedItem(item)
    setPopupMode(mode)
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">
      <Sidebar />
      <main className="flex-1 px-8 py-6">

        {/* Topbar */}
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
              placeholder="Search by title, category, country, method..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Misinformation Archive</h1>
        <p className="text-gray-500 mb-8 max-w-3xl">
          Explore previously debunked stories, misinformation campaigns, and verified fact-checking reports with real-time intelligence monitoring.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon size={20} className={s.color} />
                  </div>
                  <span className={`text-sm font-bold ${s.badgeColor} bg-gray-50 px-2 py-1 rounded-lg`}>{s.badge}</span>
                </div>
                <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition">
              <Settings2 size={16} /> Filters
            </button>
            {filters.map(f => (
              <div key={f.key} className="relative">
                <button
                  onClick={() => setOpenFilter(openFilter === f.key ? null : f.key)}
                  className={`flex items-center gap-2 text-sm border px-4 py-2 rounded-xl transition ${f.label !== f.opts[0] ? 'border-blue-400 text-blue-600 bg-blue-50 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {f.label} <ChevronDown size={15} />
                </button>
                {openFilter === f.key && (
                  <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48">
                    {f.opts.map(opt => (
                      <button key={opt} onClick={() => { f.setter(opt); setOpenFilter(null) }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${f.label === opt ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{filtered.length} results found</span>
            <div className="flex gap-3">
              <button onClick={handleClear} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Clear All</button>
              <button onClick={() => setOpenFilter(null)} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Apply Search</button>
            </div>
          </div>
        </div>

        {/* Archive cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-lg">No results found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {paginated.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className={`${a.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                    {a.badge === 'FALSE' ? <X size={12} /> : <ArrowUpRight size={12} />}
                    {a.badge}
                  </span>
                  <div className="flex items-center gap-3 text-gray-400">
                    <button onClick={() => toggleBookmark(a.id)}
                      className={`hover:text-blue-600 transition ${bookmarks.includes(a.id) ? 'text-blue-600' : ''}`}>
                      <Bookmark size={18} fill={bookmarks.includes(a.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => handleShare(a.id)}
                      className={`transition ${copiedId === a.id ? 'text-green-500' : 'hover:text-blue-600'}`}>
                      {copiedId === a.id ? <Check size={18} /> : <Share2 size={18} />}
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2">{a.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{a.desc}</p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[{ l: 'REACH', v: a.reach }, { l: 'COUNTRY', v: a.country }, { l: 'METHOD', v: a.method }].map(m => (
                    <div key={m.l}>
                      <p className="text-[10px] text-gray-400 tracking-wide">{m.l}</p>
                      <p className="text-sm font-semibold text-gray-800">{m.v}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-blue-600 font-semibold text-sm">
                      <ShieldCheck size={15} /> Verification Result
                    </span>
                    <span className="text-xs text-gray-400">{a.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{a.result}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${a.confidence}%` }} />
                    </div>
                    <span className="text-xs font-bold text-blue-600 shrink-0">{a.confidence}% Confidence</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] text-gray-400 tracking-wide font-semibold">DETECTED ON:</span>
                  <div className="flex items-center gap-2">
                    {a.platforms.map((Icon, j) => (
                      <div key={j} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <Icon size={14} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <button onClick={() => openPopup(a, 'timeline')}
                    className="text-blue-600 font-semibold text-sm hover:underline">
                    Evidence Timeline
                  </button>
                  <button onClick={() => openPopup(a, 'investigation')}
                    className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-semibold px-4 py-2 rounded-xl">
                    View Full Investigation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`h-3 rounded-full transition-all ${p === page ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400 w-3'}`} />
            ))}
          </div>
        )}

        {/* Popup */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedItem(null)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between p-7 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`${selectedItem.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {selectedItem.badge}
                  </span>
                  <h2 className="font-bold text-gray-900 text-lg leading-snug">
                    {popupMode === 'timeline' ? 'Evidence Timeline' : 'Full Investigation'}
                  </h2>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>

              <div className="p-7">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedItem.title}</h3>

                {popupMode === 'timeline' ? (
                  // Evidence Timeline
                  <div className="flex flex-col">
                    {selectedItem.timeline.map((t, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                          {i < selectedItem.timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[24px]" />}
                        </div>
                        <div className="pb-5">
                          <p className="text-xs font-bold text-blue-600 mb-1">{t.date}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{t.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Full Investigation
                  <div className="flex flex-col gap-5">
                    <p className="text-gray-600 leading-relaxed">{selectedItem.desc}</p>
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                      {[{ l: 'REACH', v: selectedItem.reach }, { l: 'COUNTRY', v: selectedItem.country }, { l: 'METHOD', v: selectedItem.method }].map(m => (
                        <div key={m.l}>
                          <p className="text-[10px] text-gray-400 tracking-wide mb-1">{m.l}</p>
                          <p className="font-bold text-gray-800">{m.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={16} className="text-blue-600" />
                        <span className="font-bold text-blue-700 text-sm">Verification Result</span>
                        <span className="ml-auto text-xs text-gray-400">{selectedItem.date}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{selectedItem.result}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedItem.confidence}%` }} />
                        </div>
                        <span className="text-sm font-bold text-blue-600">{selectedItem.confidence}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-3">Evidence Timeline</p>
                      {selectedItem.timeline.map((t, i) => (
                        <div key={i} className="flex gap-3 mb-3">
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                          <div>
                            <p className="text-xs font-bold text-blue-600">{t.date}</p>
                            <p className="text-sm text-gray-600">{t.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* TODO: BACKEND — محتوى إضافي */}
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
                      Full source documents and analyst notes available after backend integration.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default MisinformationArchive








// import { useState } from 'react'
// import {
//   Search, Bell, Settings2, ChevronDown, Bookmark, Share2,
//   ShieldCheck, Play, X, Circle, Camera, Radio,
//   ArrowUpRight, Wifi, Clock, LayoutGrid,
// } from 'lucide-react'
// import Sidebar from '../components/Sidebar'

// function MisinformationArchive() {
//   const [category, setCategory] = useState('All Categories')
//   const [country, setCountry] = useState('All Countries')
//   const [dateRange, setDateRange] = useState('All Dates')
//   const [status, setStatus] = useState('All Status')
//   const [search, setSearch] = useState('')
//   const [openFilter, setOpenFilter] = useState(null)
//   const [page, setPage] = useState(1)

//   const stats = [
//     { icon: Settings2, label: 'TOTAL DEBUNKED', value: '14,282', badge: '+12%', badgeColor: 'text-green-600', bg: 'bg-blue-50', color: 'text-blue-600' },
//     { icon: LayoutGrid, label: 'CATEGORIES', value: 'Politics', badge: '5 Active', badgeColor: 'text-orange-500', bg: 'bg-blue-50', color: 'text-blue-600' },
//     { icon: Wifi, label: 'SOURCES TRACKED', value: '842', badge: 'Global', badgeColor: 'text-blue-600', bg: 'bg-blue-50', color: 'text-blue-600' },
//     { icon: Clock, label: 'AVG VERIFICATION', value: '4.2 hrs', badge: '-14m', badgeColor: 'text-green-600', bg: 'bg-blue-50', color: 'text-blue-600' },
//   ]

//   const allArchives = [
//     {
//       badge: 'FALSE', badgeColor: 'bg-red-500',
//       category: 'Politics', country: 'USA', dateGroup: 'Last Week', status: 'FALSE',
//       title: 'Election Commission "Secretly Relocating" Over 50,000 Verified Ballots in Georgia',
//       desc: 'Viral video clips claiming to show government officials moving boxes of "illegal ballots" under the...',
//       reach: '1.2M+', method: 'False Context',
//       result: 'Footage was actually from a 2018 legal storage move in an unrelated jurisdiction. Officials confirmed no ballots are stored in the shown location.',
//       date: 'Oct 24, 2023', confidence: 98,
//       platforms: [Play, X, Circle],
//     },
//     {
//       badge: 'MISLEADING', badgeColor: 'bg-orange-400',
//       category: 'Health', country: 'Global', dateGroup: 'Last Week', status: 'MISLEADING',
//       title: 'WHO Announces New Mandatory "Climate Lockdown" Protocols for 2025',
//       desc: 'A widely shared infographic lists 12 cities allegedly signed up for "15-minute city" lockdowns starting...',
//       reach: '450K+', method: 'Edited Media',
//       result: 'Documents were doctored from an old public health strategy paper. The concept of "Climate Lockdowns" does not exist in WHO policy frameworks.',
//       date: 'Oct 22, 2023', confidence: 85,
//       platforms: [Camera, X],
//     },
//     {
//       badge: 'FALSE', badgeColor: 'bg-red-500',
//       category: 'Politics', country: 'USA', dateGroup: 'Last Month', status: 'FALSE',
//       title: 'Pentagon Confirms Secret Underground Tunnel Network Beneath Washington D.C.',
//       desc: 'A viral post claims declassified documents reveal a 200-mile tunnel system used for covert operations...',
//       reach: '2.1M+', method: 'Fabricated Content',
//       result: 'No such declassified documents exist. The claim originates from a known conspiracy forum with no verifiable sources.',
//       date: 'Oct 20, 2023', confidence: 99,
//       platforms: [X, Circle],
//     },
//     {
//       badge: 'MISLEADING', badgeColor: 'bg-orange-400',
//       category: 'Science', country: 'Global', dateGroup: 'Last Month', status: 'MISLEADING',
//       title: 'New Study Claims 5G Towers Directly Linked to Sudden Cardiac Events',
//       desc: 'A widely circulated infographic attributes a rise in cardiac arrests to 5G infrastructure rollout...',
//       reach: '890K+', method: 'Misrepresented Data',
//       result: 'The cited study was retracted in 2022. No peer-reviewed evidence supports a link between 5G signals and cardiac events.',
//       date: 'Oct 18, 2023', confidence: 91,
//       platforms: [Camera, Radio, X],
//     },
//     {
//       badge: 'FALSE', badgeColor: 'bg-red-500',
//       category: 'Finance', country: 'UK', dateGroup: 'Last Month', status: 'FALSE',
//       title: 'Bank of England Secretly Printing £500 Billion to Cover National Debt',
//       desc: 'A viral infographic claims the central bank has been printing money covertly to service...',
//       reach: '320K+', method: 'Fabricated Content',
//       result: 'No such monetary operation was conducted. The Bank of England denied the claim and no credible financial source corroborates it.',
//       date: 'Oct 15, 2023', confidence: 97,
//       platforms: [Radio, X],
//     },
//     {
//       badge: 'MISLEADING', badgeColor: 'bg-orange-400',
//       category: 'Health', country: 'USA', dateGroup: 'Last Week', status: 'MISLEADING',
//       title: '"Miracle Cure" Suppressed by Pharma Giants Treats All Cancers in 72 Hours',
//       desc: 'Posts across social media claim a natural compound has been suppressed by pharmaceutical companies...',
//       reach: '1.5M+', method: 'False Context',
//       result: 'The compound referenced exists but has only been tested in lab conditions. No clinical trials support the claims made in the viral posts.',
//       date: 'Oct 12, 2023', confidence: 88,
//       platforms: [Camera, Circle, X],
//     },
//   ]

//   // فلترة شاملة
//   const filtered = allArchives.filter((a) => {
//     const matchCat = category === 'All Categories' || a.category === category
//     const matchCountry = country === 'All Countries' || a.country === country
//     const matchDate = dateRange === 'All Dates' || a.dateGroup === dateRange
//     const matchStatus = status === 'All Status' || a.status === status
//     const matchSearch = search === '' ||
//       a.title.toLowerCase().includes(search.toLowerCase()) ||
//       a.desc.toLowerCase().includes(search.toLowerCase())
//     return matchCat && matchCountry && matchDate && matchStatus && matchSearch
//   })

//   const ITEMS_PER_PAGE = 4
//   const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
//   const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

//   const handleClear = () => {
//     setCategory('All Categories'); setCountry('All Countries')
//     setDateRange('All Dates'); setStatus('All Status')
//     setSearch(''); setPage(1); setOpenFilter(null)
//   }

//   const filters = [
//     { key: 'cat', label: category, opts: ['All Categories', 'Politics', 'Health', 'Finance', 'Science'], setter: (v) => { setCategory(v); setPage(1) } },
//     { key: 'cnt', label: country, opts: ['All Countries', 'USA', 'UK', 'Global'], setter: (v) => { setCountry(v); setPage(1) } },
//     { key: 'date', label: dateRange, opts: ['All Dates', 'Last Week', 'Last Month'], setter: (v) => { setDateRange(v); setPage(1) } },
//     { key: 'status', label: status, opts: ['All Status', 'FALSE', 'MISLEADING'], setter: (v) => { setStatus(v); setPage(1) } },
//   ]

//   return (
//     <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">
//       <Sidebar />
//       <main className="flex-1 px-8 py-6">

//         {/* Topbar */}
//         <div className="flex items-center justify-between gap-6 mb-8">
//           <div className="relative flex-1 max-w-3xl mx-auto">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => { setSearch(e.target.value); setPage(1) }}
//               placeholder="Scan URL, keyword, or source..."
//               className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500"
//             />
//           </div>
//           <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
//             <Bell size={22} />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
//           </button>
//         </div>

//         <h1 className="text-4xl font-bold text-gray-900 mb-2">Misinformation Archive</h1>
//         <p className="text-gray-500 mb-8 max-w-3xl">
//           Explore previously debunked stories, misinformation campaigns, and verified fact-checking reports with real-time intelligence monitoring.
//         </p>

//         {/* Stats */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
//           {stats.map((s, i) => {
//             const Icon = s.icon
//             return (
//               <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
//                     <Icon size={20} className={s.color} />
//                   </div>
//                   <span className={`text-sm font-bold ${s.badgeColor} bg-gray-50 px-2 py-1 rounded-lg`}>{s.badge}</span>
//                 </div>
//                 <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-1">{s.label}</p>
//                 <p className="text-3xl font-bold text-gray-900">{s.value}</p>
//               </div>
//             )
//           })}
//         </div>

//         {/* Filters */}
//         <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
//           <div className="flex items-center gap-3 flex-wrap mb-4">
//             <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition">
//               <Settings2 size={16} /> Filters
//             </button>
//             {filters.map((f) => (
//               <div key={f.key} className="relative">
//                 <button
//                   onClick={() => setOpenFilter(openFilter === f.key ? null : f.key)}
//                   className={`flex items-center gap-2 text-sm border px-4 py-2 rounded-xl transition ${
//                     f.label !== f.opts[0] ? 'border-blue-400 text-blue-600 bg-blue-50 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
//                   }`}
//                 >
//                   {f.label} <ChevronDown size={15} />
//                 </button>
//                 {openFilter === f.key && (
//                   <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44">
//                     {f.opts.map((opt) => (
//                       <button
//                         key={opt}
//                         onClick={() => { f.setter(opt); setOpenFilter(null) }}
//                         className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${f.label === opt ? 'font-bold text-blue-600' : 'text-gray-700'}`}
//                       >
//                         {opt}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-500">{filtered.length} results found</span>
//             <div className="flex gap-3">
//               <button onClick={handleClear} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Clear All</button>
//               <button onClick={() => setOpenFilter(null)} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Apply Search</button>
//             </div>
//           </div>
//         </div>

//         {/* Archive cards */}
//         {paginated.length === 0 ? (
//           <div className="text-center py-20 text-gray-400 text-lg">No results found.</div>
//         ) : (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//             {paginated.map((a, i) => (
//               <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
//                 <div className="flex items-center justify-between mb-3">
//                   <span className={`${a.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
//                     {a.badge === 'FALSE' ? <X size={12} /> : <ArrowUpRight size={12} />}
//                     {a.badge}
//                   </span>
//                   <div className="flex items-center gap-3 text-gray-400">
//                     <button className="hover:text-blue-600 transition"><Bookmark size={18} /></button>
//                     <button className="hover:text-blue-600 transition"><Share2 size={18} /></button>
//                   </div>
//                 </div>
//                 <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2">{a.title}</h3>
//                 <p className="text-gray-500 text-sm leading-relaxed mb-4">{a.desc}</p>
//                 <div className="grid grid-cols-3 gap-2 mb-4">
//                   {[{ l: 'REACH', v: a.reach }, { l: 'COUNTRY', v: a.country }, { l: 'METHOD', v: a.method }].map((m) => (
//                     <div key={m.l}>
//                       <p className="text-[10px] text-gray-400 tracking-wide">{m.l}</p>
//                       <p className="text-sm font-semibold text-gray-800">{m.v}</p>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="bg-gray-50 rounded-xl p-4 mb-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <span className="flex items-center gap-1.5 text-blue-600 font-semibold text-sm">
//                       <ShieldCheck size={15} /> Verification Result
//                     </span>
//                     <span className="text-xs text-gray-400">{a.date}</span>
//                   </div>
//                   <p className="text-sm text-gray-600 leading-relaxed mb-3">{a.result}</p>
//                   <div className="flex items-center gap-2">
//                     <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
//                       <div className="h-full bg-blue-600 rounded-full" style={{ width: `${a.confidence}%` }} />
//                     </div>
//                     <span className="text-xs font-bold text-blue-600 shrink-0">{a.confidence}% Confidence</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 mb-4">
//                   <span className="text-[10px] text-gray-400 tracking-wide font-semibold">DETECTED ON:</span>
//                   <div className="flex items-center gap-2">
//                     {a.platforms.map((Icon, j) => (
//                       <div key={j} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
//                         <Icon size={14} />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
//                   <button className="text-blue-600 font-semibold text-sm hover:underline">Evidence Timeline</button>
//                   <button className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-semibold px-4 py-2 rounded-xl">View Full Investigation</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex items-center justify-center gap-2 pb-6">
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
//               <button key={p} onClick={() => setPage(p)}
//                 className={`h-3 rounded-full transition-all ${p === page ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400 w-3'}`}
//               />
//             ))}
//           </div>
//         )}

//       </main>
//     </div>
//   )
// }

// export default MisinformationArchive