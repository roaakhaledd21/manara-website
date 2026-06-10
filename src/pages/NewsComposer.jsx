// import { useState, useRef, useCallback } from 'react'
// import {
//   Search, Bell, Bold, Italic, List, Link2, Quote, Tag, X,
//   BookOpen, ShieldCheck, BarChart3, UserPlus, Scale, AlertTriangle,
//   FolderOpen, Eye, Lightbulb, CheckCircle2, AlertCircle, RefreshCw,
// } from 'lucide-react'
// import Sidebar from '../components/Sidebar'

// // كلمات محمّلة مع بدائل مقترحة
// const LOADED_WORDS = [
//   { word: 'outrageous',    alts: ['concerning', 'controversial', 'troubling'] },
//   { word: 'massive',       alts: ['significant', 'large-scale', 'substantial'] },
//   { word: 'absolutely',    alts: ['clearly', 'notably', 'evidently'] },
//   { word: 'terrible',      alts: ['problematic', 'serious', 'concerning'] },
//   { word: 'horrible',      alts: ['severe', 'serious', 'difficult'] },
//   { word: 'shocking',      alts: ['surprising', 'unexpected', 'notable'] },
//   { word: 'stunning',      alts: ['significant', 'notable', 'considerable'] },
//   { word: 'disgraceful',   alts: ['inappropriate', 'questionable', 'problematic'] },
//   { word: 'catastrophic',  alts: ['severe', 'serious', 'significant'] },
//   { word: 'devastating',   alts: ['damaging', 'harmful', 'serious'] },
//   { word: 'explosive',     alts: ['significant', 'impactful', 'notable'] },
//   { word: 'alarming',      alts: ['concerning', 'worrying', 'notable'] },
//   { word: 'incredible',    alts: ['notable', 'significant', 'considerable'] },
// ]

// const HEDGE_WORDS = ['allegedly', 'reportedly', 'claims', 'rumored', 'unconfirmed']

// function analyzeText(text) {
//   if (!text.trim()) return { score: 100, suggestions: [] }
//   const lower = text.toLowerCase()
//   const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
//   const suggestions = []
//   let penalty = 0

//   // فحص الكلمات المحمّلة مع اقتراح بديل
//   LOADED_WORDS.forEach(({ word, alts }) => {
//     const count = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
//     if (count > 0) {
//       penalty += count * 8
//       suggestions.push({
//         type: 'warning',
//         text: `"${word}" (×${count}) reduces credibility.`,
//         original: word,
//         alts,
//         replaceable: true,
//       })
//     }
//   })

//   // فحص التكرار
//   HEDGE_WORDS.forEach(word => {
//     const count = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
//     if (count > 1) {
//       penalty += (count - 1) * 5
//       suggestions.push({
//         type: 'warning',
//         text: `"${word}" used ${count} times — vary your language.`,
//         original: word,
//         alts: ['according to sources', 'as reported', 'based on available information'],
//         replaceable: true,
//       })
//     }
//   })

//   // جمل طويلة
//   sentences.forEach((s, i) => {
//     const wc = s.trim().split(/\s+/).length
//     if (wc > 40) {
//       penalty += 5
//       suggestions.push({ type: 'warning', text: `Sentence ${i + 1} is too long (${wc} words) — consider breaking it up.` })
//     }
//   })

//   // passive voice
//   if (lower.includes('was ') || lower.includes('were ') || lower.includes('has been ')) {
//     suggestions.push({ type: 'tip', text: 'Passive voice detected — active voice is stronger and clearer.' })
//   }

//   // لو ما في اقتباس
//   const words = text.trim().split(/\s+/).filter(Boolean)
//   if (words.length > 30 && !text.includes('"')) {
//     suggestions.push({ type: 'tip', text: 'No direct quotes found — consider adding a quote from an official source.' })
//   }

//   // لو في ادعاء
//   if (lower.includes('confirmed') || lower.includes('revealed') || lower.includes('stated')) {
//     suggestions.push({ type: 'tip', text: 'Claims detected — link to a verifiable source to increase credibility.' })
//   }

//   if (suggestions.length === 0) {
//     suggestions.push({ type: 'tip', text: '✓ Writing looks neutral and balanced. Great job!' })
//   }

//   return { score: Math.max(0, Math.min(100, 100 - penalty)), suggestions }
// }

// function NewsComposer() {
//   const [title, setTitle] = useState('')
//   const [tags, setTags] = useState(['project: alpha-trace', 'internal only'])
//   const [newTag, setNewTag] = useState('')
//   const [showTagInput, setShowTagInput] = useState(false)
//   const [wordCount, setWordCount] = useState(0)
//   const [charCount, setCharCount] = useState(0)
//   const [analysis, setAnalysis] = useState({ score: 100, suggestions: [] })
//   const editorRef = useRef(null)

//   const format = (command) => {
//     document.execCommand(command, false, null)
//     editorRef.current?.focus()
//   }

//   const insertLink = () => {
//     const url = prompt('Enter URL:')
//     if (url) document.execCommand('createLink', false, url)
//     editorRef.current?.focus()
//   }

//   const handleEditorInput = useCallback(() => {
//     const text = editorRef.current?.innerText.trim() || ''
//     setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
//     setCharCount(text.length)
//     setAnalysis(analyzeText(text))
//   }, [])

//   // تطبيق البديل في النص مباشرة
//   const applyReplacement = (original, replacement) => {
//     if (!editorRef.current) return
//     const html = editorRef.current.innerHTML
//     const regex = new RegExp(`\\b${original}\\b`, 'gi')
//     editorRef.current.innerHTML = html.replace(regex, `<mark style="background:#dbeafe;border-radius:3px;padding:1px 3px">${replacement}</mark>`)
//     // إزالة الـ mark بعد ثانية
//     setTimeout(() => {
//       if (editorRef.current) {
//         editorRef.current.innerHTML = editorRef.current.innerHTML.replace(/<\/?mark[^>]*>/gi, '')
//         handleEditorInput()
//       }
//     }, 1200)
//     handleEditorInput()
//   }

//   const addTag = () => {
//     const t = newTag.trim()
//     if (t && !tags.includes(t)) setTags([...tags, t])
//     setNewTag('')
//     setShowTagInput(false)
//   }

//   const removeTag = (tag) => setTags(tags.filter((t) => t !== tag))

//   const { score: neutralityScore, suggestions: writingSuggestions } = analysis

//   const citations = [
//     { source: 'SEC FILING 2024-A', match: '98% MATCH', desc: 'Direct evidence of capital diversion matching your "40% revenue" claim.' },
//     { source: 'REUTERS INTEL', match: '85% MATCH', desc: "Confirms John D. Vane's resignation date of March 12th." },
//   ]

//   const facts = [
//     { type: 'unverified', title: 'Unverified Claim', desc: '"Eastern Europe shell companies" – No direct links found.' },
//     { type: 'confirmed', title: 'Confirmed Data', desc: 'Cayman Islands registration for Nero-Tech confirmed via Global Financial Database.' },
//   ]

//   const readiness = [
//     { label: 'Transparency Score', icon: BarChart3, value: `${neutralityScore >= 90 ? 'A' : neutralityScore >= 80 ? 'A-' : neutralityScore >= 70 ? 'B+' : 'B'} (${neutralityScore}%)`, bg: 'bg-blue-100', color: 'text-blue-600' },
//     { label: 'Peer Review', icon: UserPlus, value: 'PENDING (2/3)', bg: 'bg-pink-100', color: 'text-pink-600', badge: true },
//     { label: 'Legal Check', icon: Scale, value: null, warn: true, bg: 'bg-red-100', color: 'text-red-600' },
//   ]

//   return (
//     <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">
//       <Sidebar />
//       <main className="flex-1 px-8 py-6">

//         <div className="flex items-center justify-between gap-6 mb-8">
//           <div className="relative flex-1 max-w-3xl mx-auto">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//             <input type="text" placeholder="Scan URL, keyword, or source..."
//               className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500" />
//           </div>
//           <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
//             <Bell size={22} />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
//           </button>
//         </div>

//         <h1 className="text-4xl font-bold text-gray-900 mb-2">News Composer</h1>
//         <p className="text-gray-500 mb-6">Create, analyze, and publish fact-based news reports with AI-assisted verification and source-backed evidence.</p>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//           {/* Editor */}
//           <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
//             <div className="bg-blue-600 rounded-xl px-4 py-3 flex items-center gap-4 text-white mb-6 flex-wrap">
//               <button onClick={() => format('bold')} className="hover:bg-blue-500 p-1.5 rounded transition"><Bold size={18} /></button>
//               <button onClick={() => format('italic')} className="hover:bg-blue-500 p-1.5 rounded transition"><Italic size={18} /></button>
//               <button onClick={() => format('insertUnorderedList')} className="hover:bg-blue-500 p-1.5 rounded transition"><List size={18} /></button>
//               <span className="w-px h-5 bg-blue-400" />
//               <button onClick={insertLink} className="hover:bg-blue-500 p-1.5 rounded transition"><Link2 size={18} /></button>
//               <button className="flex items-center gap-1 text-sm font-bold hover:bg-blue-500 px-2 py-1 rounded transition"><Quote size={16} /> CITE</button>
//               <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1 text-sm font-bold hover:bg-blue-500 px-2 py-1 rounded transition"><Tag size={16} /> TAG</button>
//               <span className="ml-auto flex items-center gap-3 text-sm font-semibold tracking-wide">
//                 <span>{wordCount.toLocaleString()} WORDS</span>
//                 <span className="text-blue-300">|</span>
//                 <span>{charCount.toLocaleString()} CHARS</span>
//               </span>
//             </div>

//             <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
//               placeholder="Enter Investigation Headline..."
//               className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 outline-none mb-4" />

//             <div className="flex items-center gap-2 flex-wrap mb-6">
//               {tags.map((tag, i) => (
//                 <span key={tag} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
//                   {i === 0 ? <FolderOpen size={13} /> : <Eye size={13} />}
//                   {tag}
//                   <button onClick={() => removeTag(tag)} className="hover:text-blue-200"><X size={12} /></button>
//                 </span>
//               ))}
//               {showTagInput ? (
//                 <input autoFocus value={newTag} onChange={(e) => setNewTag(e.target.value)}
//                   onKeyDown={(e) => e.key === 'Enter' && addTag()} onBlur={addTag}
//                   placeholder="new tag..." className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500" />
//               ) : (
//                 <button onClick={() => setShowTagInput(true)} className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:border-blue-400 hover:text-blue-500 transition">
//                   + Tag
//                 </button>
//               )}
//             </div>

//             <div ref={editorRef} contentEditable onInput={handleEditorInput} onKeyUp={handleEditorInput}
//               suppressContentEditableWarning
//               data-placeholder="Start writing... suggestions will update as you type."
//               className="min-h-[400px] outline-none text-gray-700 leading-relaxed text-[15px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300" />
//           </div>

//           {/* Right widgets */}
//           <div className="flex flex-col gap-5">

//             {/* Writing Suggestions */}
//             <div className="bg-white rounded-2xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2 font-bold text-gray-900">
//                   <Lightbulb size={18} className="text-yellow-500" /> Writing Suggestions
//                 </div>
//                 <span className="text-xs text-gray-400">{writingSuggestions.length} notes</span>
//               </div>
//               {writingSuggestions.length === 0 ? (
//                 <p className="text-sm text-gray-400">Start writing to see suggestions...</p>
//               ) : (
//                 <div className="flex flex-col gap-3">
//                   {writingSuggestions.map((s, i) => (
//                     <div key={i} className={`p-3 rounded-xl text-sm ${s.type === 'warning' ? 'bg-orange-50' : 'bg-blue-50'}`}>
//                       <div className="flex gap-2 mb-2">
//                         {s.type === 'warning'
//                           ? <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
//                           : <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
//                         }
//                         <p className={s.type === 'warning' ? 'text-orange-700' : 'text-blue-700'}>{s.text}</p>
//                       </div>
//                       {/* أزرار البدائل */}
//                       {s.replaceable && s.alts && (
//                         <div className="flex flex-wrap gap-1.5 mt-1 pl-6">
//                           <span className="text-xs text-gray-400 w-full mb-1 flex items-center gap-1">
//                             <RefreshCw size={11} /> Replace with:
//                           </span>
//                           {s.alts.map((alt) => (
//                             <button
//                               key={alt}
//                               onClick={() => applyReplacement(s.original, alt)}
//                               className="text-xs bg-white border border-blue-200 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition font-medium"
//                             >
//                               {alt}
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Neutrality Score */}
//             <div className="bg-white rounded-2xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="font-bold text-gray-900">Neutrality Score</span>
//                 <span className={`text-sm font-bold ${neutralityScore >= 80 ? 'text-green-600' : neutralityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
//                   {neutralityScore}% {neutralityScore >= 80 ? 'OPTIMAL' : neutralityScore >= 60 ? 'FAIR' : 'LOW'}
//                 </span>
//               </div>
//               <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
//                 <div
//                   className={`h-full rounded-full transition-all duration-500 ${neutralityScore >= 80 ? 'bg-green-500' : neutralityScore >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
//                   style={{ width: `${neutralityScore}%` }}
//                 />
//               </div>
//               <p className="text-xs text-gray-500">
//                 {neutralityScore === 100 ? 'Perfect neutrality — great writing!' :
//                  neutralityScore >= 80 ? 'Good neutrality. Remove loaded words to improve.' :
//                  'Neutrality needs improvement. Check suggestions above.'}
//               </p>
//             </div>

//             {/* Source Citation */}
//             <div className="bg-white rounded-2xl shadow-sm p-5">
//               <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
//                 <BookOpen size={18} className="text-blue-600" /> Source Citation Assistant
//               </div>
//               <div className="flex flex-col gap-3">
//                 {citations.map((c, i) => (
//                   <div key={i} className="border border-gray-100 rounded-xl p-4">
//                     <div className="flex items-center justify-between mb-1.5">
//                       <span className="font-bold text-sm text-gray-900">{c.source}</span>
//                       <span className="text-[10px] font-semibold text-gray-400">{c.match}</span>
//                     </div>
//                     <p className="text-xs text-gray-500 leading-relaxed mb-3">{c.desc}</p>
//                     <button className="text-[11px] font-bold text-blue-600 tracking-wide hover:underline">INSERT CITATION</button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Fact Validation */}
//             <div className="bg-white rounded-2xl shadow-sm p-5">
//               <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
//                 <ShieldCheck size={18} className="text-blue-600" /> Fact Validation
//               </div>
//               <div className="flex flex-col gap-4">
//                 {facts.map((f, i) => (
//                   <div key={i} className="flex gap-2.5">
//                     <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${f.type === 'confirmed' ? 'bg-green-500' : 'bg-red-500'}`} />
//                     <div>
//                       <p className="font-bold text-sm text-gray-900">{f.title}</p>
//                       <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Publishing Readiness */}
//             <div className="bg-white rounded-2xl shadow-sm p-5">
//               <p className="font-bold text-gray-900 mb-4">Publishing Readiness</p>
//               <div className="flex flex-col gap-4">
//                 {readiness.map((r) => {
//                   const Icon = r.icon
//                   return (
//                     <div key={r.label} className="flex items-center gap-3">
//                       <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center shrink-0`}>
//                         <Icon size={18} className={r.color} />
//                       </div>
//                       <span className="flex-1 font-medium text-sm text-gray-800">{r.label}</span>
//                       {r.warn ? (
//                         <AlertTriangle size={18} className="text-red-500" />
//                       ) : r.badge ? (
//                         <span className="text-[10px] font-bold text-gray-600 border border-gray-200 rounded px-2 py-1">{r.value}</span>
//                       ) : (
//                         <span className="font-bold text-sm text-gray-900">{r.value}</span>
//                       )}
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>

//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }

// export default NewsComposer











import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Search, Bell, Bold, Italic, List, Link2, Quote, Tag, X,
  BookOpen, ShieldCheck, BarChart3, UserPlus, Scale, AlertTriangle,
  FolderOpen, Eye, Lightbulb, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { api } from '../lib/api'

// ===== محرّك التحليل الذكي للمقال =====

// كلمات محمّلة مع بدائل مقترحة
const LOADED_WORDS = [
  { word: 'outrageous',    alts: ['concerning', 'controversial', 'troubling'] },
  { word: 'massive',       alts: ['significant', 'large-scale', 'substantial'] },
  { word: 'absolutely',    alts: ['clearly', 'notably', 'evidently'] },
  { word: 'terrible',      alts: ['problematic', 'serious', 'concerning'] },
  { word: 'horrible',      alts: ['severe', 'serious', 'difficult'] },
  { word: 'shocking',      alts: ['surprising', 'unexpected', 'notable'] },
  { word: 'stunning',      alts: ['significant', 'notable', 'considerable'] },
  { word: 'disgraceful',   alts: ['inappropriate', 'questionable', 'problematic'] },
  { word: 'catastrophic',  alts: ['severe', 'serious', 'significant'] },
  { word: 'devastating',   alts: ['damaging', 'harmful', 'serious'] },
  { word: 'explosive',     alts: ['significant', 'impactful', 'notable'] },
  { word: 'alarming',      alts: ['concerning', 'worrying', 'notable'] },
  { word: 'incredible',    alts: ['notable', 'significant', 'considerable'] },
]

const HEDGE_WORDS = ['allegedly', 'reportedly', 'claims', 'rumored', 'unconfirmed']

function analyzeText(text) {
  if (!text.trim()) return { score: 100, suggestions: [] }

  const lower = text.toLowerCase()
  const words = text.trim().split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  const suggestions = []
  let penalty = 0

  // 1. فحص الكلمات المحمّلة
  LOADED_WORDS.forEach(({ word, alts }) => {
    const count = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
    if (count > 0) {
      penalty += count * 8
      suggestions.push({
        type: 'warning',
        text: `"${word}" is a loaded word (×${count}) — weakens credibility.`,
        original: word, alts, replaceable: true,
      })
    }
  })

  // 2. فحص التكرار
  HEDGE_WORDS.forEach(word => {
    const count = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
    if (count > 1) {
      penalty += (count - 1) * 5
      suggestions.push({
        type: 'warning',
        text: `"${word}" repeated ${count} times — vary your language.`,
        original: word,
        alts: ['according to sources', 'as reported', 'based on available information'],
        replaceable: true,
      })
    }
  })

  // 3. فحص هيكل المقال — مقدمة
  if (words.length > 20 && sentences.length > 0) {
    const firstSentence = sentences[0].trim()
    const hasWho = /\b(who|what|when|where|why|how|official|minister|president|government|company|authority)\b/i.test(firstSentence)
    if (!hasWho) {
      suggestions.push({
        type: 'structure',
        text: 'Opening sentence lacks context — start with Who, What, When or Where for a strong news lead.',
      })
      penalty += 5
    }
  }

  // 4. فحص الاقتباسات المباشرة
  if (words.length > 50 && !text.includes('"')) {
    suggestions.push({
      type: 'structure',
      text: 'No direct quotes found — add at least one quote from an official or eyewitness to strengthen credibility.',
    })
    penalty += 8
  }

  // 5. فحص المصادر
  const hasSources = /according to|confirmed by|said|stated|announced|declared|told reporters/i.test(lower)
  if (words.length > 30 && !hasSources) {
    suggestions.push({
      type: 'structure',
      text: 'No source attribution found — attribute claims to a named source (e.g. "according to...", "officials said...").',
    })
    penalty += 10
  }

  // 6. فحص الجمل الطويلة
  sentences.forEach((s, i) => {
    const wc = s.trim().split(/\s+/).length
    if (wc > 45) {
      penalty += 5
      suggestions.push({
        type: 'warning',
        text: `Sentence ${i + 1} is too long (${wc} words) — split it into two shorter sentences for clarity.`,
      })
    }
  })

  // 7. فحص التوازن (جانبين للقصة)
  const hasBothSides = /however|on the other hand|critics|supporters|opponents|denied|confirmed|dispute|controversy/i.test(lower)
  if (words.length > 80 && !hasBothSides) {
    suggestions.push({
      type: 'structure',
      text: 'Article appears one-sided — include a counter-perspective or official response for balanced reporting.',
    })
    penalty += 7
  }

  // 8. فحص الخاتمة
  if (words.length > 100 && paragraphs.length < 2) {
    suggestions.push({
      type: 'structure',
      text: 'Article needs paragraph breaks — divide into clear sections: lead, body, and conclusion.',
    })
    penalty += 3
  }

  // 9. فحص الصوت المبني للمجهول
  if (/\bwas\b|\bwere\b|\bhas been\b|\bhave been\b/i.test(text)) {
    suggestions.push({
      type: 'tip',
      text: 'Passive voice detected — use active voice for stronger, clearer news writing.',
    })
    penalty += 3
  }

  // 10. فحص الأرقام والبيانات
  if (words.length > 60 && !/\d+%|\d+ (people|million|billion|thousand|cases|deaths|dollars)/i.test(text)) {
    suggestions.push({
      type: 'tip',
      text: 'No statistics found — adding verified numbers or data strengthens news credibility.',
    })
  }

  // 11. لو المقال ممتاز
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'tip',
      text: '✓ Article structure looks solid — well-sourced, balanced and clear. Ready for review.',
    })
  }

  const score = Math.max(0, Math.min(100, 100 - penalty))
  return { score, suggestions }
}

function NewsComposer() {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState(['project: alpha-trace', 'internal only'])
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [analysis, setAnalysis] = useState({ score: 100, suggestions: [] })
  const [content, setContent] = useState('')
  // Backend live analysis (POST /composer/analyze): neutrality, source_citations,
  // fact_validation, publishing_readiness. Null until the first response arrives.
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const editorRef = useRef(null)

  const format = (command) => {
    document.execCommand(command, false, null)
    editorRef.current?.focus()
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) document.execCommand('createLink', false, url)
    editorRef.current?.focus()
  }

  const handleEditorInput = useCallback(() => {
    const text = editorRef.current?.innerText.trim() || ''
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
    setCharCount(text.length)
    setAnalysis(analyzeText(text))
    setContent(text)
  }, [])

  // ===== Live AI analysis → POST /composer/analyze (debounced) =====
  // Feeds the Neutrality, Source Citation, Fact Validation and Publishing Readiness
  // widgets with real backend data. The client-side "Writing Suggestions" widget
  // (analyzeText) is kept as-is — it's an editorial helper the backend doesn't replace.
  useEffect(() => {
    let active = true
    const t = setTimeout(() => {
      if (!content.trim()) { if (active) setAiAnalysis(null); return }
      api.post('/composer/analyze', { title, content })
        .then(res => { if (active) setAiAnalysis(res) })
        .catch(() => { /* keep last analysis; non-blocking */ })
    }, 800)
    return () => { active = false; clearTimeout(t) }
  }, [title, content])

  // تطبيق البديل في النص مباشرة
  const applyReplacement = (original, replacement) => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const regex = new RegExp(`\\b${original}\\b`, 'gi')
    editorRef.current.innerHTML = html.replace(regex, `<mark style="background:#dbeafe;border-radius:3px;padding:1px 3px">${replacement}</mark>`)
    // إزالة الـ mark بعد ثانية
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = editorRef.current.innerHTML.replace(/<\/?mark[^>]*>/gi, '')
        handleEditorInput()
      }
    }, 1200)
    handleEditorInput()
  }

  const addTag = () => {
    const t = newTag.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setNewTag('')
    setShowTagInput(false)
  }

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag))

  const { suggestions: writingSuggestions } = analysis
  // Neutrality: prefer the backend score, fall back to the client estimate before
  // the first /composer/analyze response arrives.
  const neutralityScore = aiAnalysis?.neutrality?.score ?? analysis.score

  // Source Citation Assistant ← source_citations.detected_sources + recommended_citations
  const sc = aiAnalysis?.source_citations
  const citations = sc
    ? [
        ...(sc.detected_sources || []).map(s => ({
          source: (s.name || 'SOURCE').toUpperCase(),
          match: s.credibility_score != null ? `${s.credibility_score}% CRED` : (s.type || '').toUpperCase(),
          desc: `Detected ${s.type || 'source'} cited in the article.`,
        })),
        ...(sc.recommended_citations || []).map(c => ({
          source: 'SUGGESTED SOURCE',
          match: 'RECOMMENDED',
          desc: `${c.claim}${c.suggested_source_type ? ' — add a ' + c.suggested_source_type : ''}.`,
        })),
      ]
    : []

  // Fact Validation ← fact_validation.verified / questionable / unsupported claims
  const fv = aiAnalysis?.fact_validation
  const facts = fv
    ? [
        ...(fv.verified_claims || []).map(c => ({ type: 'confirmed', title: 'Verified Claim', desc: `${c.claim}${c.confidence != null ? ` (${c.confidence}% confidence)` : ''}.` })),
        ...(fv.questionable_claims || []).map(c => ({ type: 'unverified', title: 'Questionable Claim', desc: `${c.claim}${c.reason ? ' — ' + c.reason : ''}` })),
        ...(fv.unsupported_claims || []).map(c => ({ type: 'unverified', title: 'Unsupported Claim', desc: `${c.claim}${c.reason ? ' — ' + c.reason : ''}` })),
      ]
    : []

  // Publishing Readiness ← publishing_readiness.{transparency_score, peer_review, legal_check}
  const pr = aiAnalysis?.publishing_readiness
  const legalStatus = pr?.legal_check?.status
  const readiness = [
    { label: 'Transparency Score', icon: BarChart3, value: `${pr?.transparency_score ?? neutralityScore}%`, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Peer Review', icon: UserPlus, value: (pr?.peer_review?.status || 'pending').replace('_', ' ').toUpperCase(), bg: 'bg-pink-100', color: 'text-pink-600', badge: true },
    { label: 'Legal Check', icon: Scale, value: (legalStatus || 'clear').toUpperCase(), warn: legalStatus === 'warning' || legalStatus === 'flag', bg: 'bg-red-100', color: 'text-red-600' },
  ]

  // BACKEND NOTE: POST /reports (save the report + persist ai_feedback) is available,
  // but the current composer has no Save/Publish button to trigger it. A "Save Report"
  // affordance is needed in the UI to wire it; left out here to avoid changing the design.

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">
      <Sidebar />
      <main className="flex-1 px-8 py-6">

        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Scan URL, keyword, or source..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">News Composer</h1>
        <p className="text-gray-500 mb-6">Create, analyze, and publish fact-based news reports with AI-assisted verification and source-backed evidence.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Editor */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="bg-blue-600 rounded-xl px-4 py-3 flex items-center gap-4 text-white mb-6 flex-wrap">
              <button onClick={() => format('bold')} className="hover:bg-blue-500 p-1.5 rounded transition"><Bold size={18} /></button>
              <button onClick={() => format('italic')} className="hover:bg-blue-500 p-1.5 rounded transition"><Italic size={18} /></button>
              <button onClick={() => format('insertUnorderedList')} className="hover:bg-blue-500 p-1.5 rounded transition"><List size={18} /></button>
              <span className="w-px h-5 bg-blue-400" />
              <button onClick={insertLink} className="hover:bg-blue-500 p-1.5 rounded transition"><Link2 size={18} /></button>
              <button className="flex items-center gap-1 text-sm font-bold hover:bg-blue-500 px-2 py-1 rounded transition"><Quote size={16} /> CITE</button>
              <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1 text-sm font-bold hover:bg-blue-500 px-2 py-1 rounded transition"><Tag size={16} /> TAG</button>
              <span className="ml-auto flex items-center gap-3 text-sm font-semibold tracking-wide">
                <span>{wordCount.toLocaleString()} WORDS</span>
                <span className="text-blue-300">|</span>
                <span>{charCount.toLocaleString()} CHARS</span>
              </span>
            </div>

            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Investigation Headline..."
              className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 outline-none mb-4" />

            <div className="flex items-center gap-2 flex-wrap mb-6">
              {tags.map((tag, i) => (
                <span key={tag} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                  {i === 0 ? <FolderOpen size={13} /> : <Eye size={13} />}
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-blue-200"><X size={12} /></button>
                </span>
              ))}
              {showTagInput ? (
                <input autoFocus value={newTag} onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()} onBlur={addTag}
                  placeholder="new tag..." className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500" />
              ) : (
                <button onClick={() => setShowTagInput(true)} className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:border-blue-400 hover:text-blue-500 transition">
                  + Tag
                </button>
              )}
            </div>

            <div ref={editorRef} contentEditable onInput={handleEditorInput} onKeyUp={handleEditorInput}
              suppressContentEditableWarning
              data-placeholder="Start writing... suggestions will update as you type."
              className="min-h-[400px] outline-none text-gray-700 leading-relaxed text-[15px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300" />
          </div>

          {/* Right widgets */}
          <div className="flex flex-col gap-5">

            {/* Writing Suggestions */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <Lightbulb size={18} className="text-yellow-500" /> Writing Suggestions
                </div>
                <span className="text-xs text-gray-400">{writingSuggestions.length} notes</span>
              </div>
              {writingSuggestions.length === 0 ? (
                <p className="text-sm text-gray-400">Start writing to see suggestions...</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {writingSuggestions.map((s, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${s.type === 'warning' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                      <div className="flex gap-2 mb-2">
                        {s.type === 'warning'
                          ? <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                          : <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        }
                        <p className={s.type === 'warning' ? 'text-orange-700' : 'text-blue-700'}>{s.text}</p>
                      </div>
                      {/* أزرار البدائل */}
                      {s.replaceable && s.alts && (
                        <div className="flex flex-wrap gap-1.5 mt-1 pl-6">
                          <span className="text-xs text-gray-400 w-full mb-1 flex items-center gap-1">
                            <RefreshCw size={11} /> Replace with:
                          </span>
                          {s.alts.map((alt) => (
                            <button
                              key={alt}
                              onClick={() => applyReplacement(s.original, alt)}
                              className="text-xs bg-white border border-blue-200 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition font-medium"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Neutrality Score */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-900">Neutrality Score</span>
                <span className={`text-sm font-bold ${neutralityScore >= 80 ? 'text-green-600' : neutralityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {neutralityScore}% {neutralityScore >= 80 ? 'OPTIMAL' : neutralityScore >= 60 ? 'FAIR' : 'LOW'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${neutralityScore >= 80 ? 'bg-green-500' : neutralityScore >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                  style={{ width: `${neutralityScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {neutralityScore === 100 ? 'Perfect neutrality — great writing!' :
                 neutralityScore >= 80 ? 'Good neutrality. Remove loaded words to improve.' :
                 'Neutrality needs improvement. Check suggestions above.'}
              </p>
            </div>

            {/* Source Citation */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                <BookOpen size={18} className="text-blue-600" /> Source Citation Assistant
              </div>
              <div className="flex flex-col gap-3">
                {citations.length === 0 && (
                  <p className="text-sm text-gray-400">Start writing — cited & suggested sources will appear here.</p>
                )}
                {citations.map((c, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-gray-900">{c.source}</span>
                      <span className="text-[10px] font-semibold text-gray-400">{c.match}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{c.desc}</p>
                    <button className="text-[11px] font-bold text-blue-600 tracking-wide hover:underline">INSERT CITATION</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fact Validation */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                <ShieldCheck size={18} className="text-blue-600" /> Fact Validation
              </div>
              <div className="flex flex-col gap-4">
                {facts.length === 0 && (
                  <p className="text-sm text-gray-400">Fact validation results will appear here as you write.</p>
                )}
                {facts.map((f, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${f.type === 'confirmed' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{f.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Publishing Readiness */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="font-bold text-gray-900 mb-4">Publishing Readiness</p>
              <div className="flex flex-col gap-4">
                {readiness.map((r) => {
                  const Icon = r.icon
                  return (
                    <div key={r.label} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={r.color} />
                      </div>
                      <span className="flex-1 font-medium text-sm text-gray-800">{r.label}</span>
                      {r.warn ? (
                        <AlertTriangle size={18} className="text-red-500" />
                      ) : r.badge ? (
                        <span className="text-[10px] font-bold text-gray-600 border border-gray-200 rounded px-2 py-1">{r.value}</span>
                      ) : (
                        <span className="font-bold text-sm text-gray-900">{r.value}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default NewsComposer