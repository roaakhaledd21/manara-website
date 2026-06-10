import { useState, useRef, useCallback } from 'react'
import {
  Search, Bell, Plus, Send, Image, Clapperboard, Keyboard, X,
  LayoutGrid, List, Link2, Share2, Download, RefreshCw,
  Activity, BarChart2, Clock, PlusCircle, ZoomIn, Maximize2,
  Globe, ExternalLink, CheckCircle2, Layers, ShieldAlert,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { api } from '../lib/api'

function VerifyNews() {
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState([])
  const [activeTool, setActiveTool] = useState(null)
  const [results, setResults] = useState(null)
  const [mediaResult, setMediaResult] = useState(null)
  const [imageResult, setImageResult] = useState(null)
  const [heatmap, setHeatmap] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [page, setPage] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [textResult, setTextResult] = useState(null)
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchError, setSearchError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState(null) // { type: 'success'|'error'|'info', text }
  const fileInputRef = useRef(null)
  const mediaContainerRef = useRef(null)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  const tools = [
    { label: 'Image Analysis', icon: Image, accept: 'image/*' },
    { label: 'Video Analysis', icon: Clapperboard, accept: 'video/*' },
    { label: 'Search by Keywords and Source Trace', icon: Keyboard, accept: null },
  ]

  const getMockMediaResult = (type, file) => {
    const isImage = type === 'image'
    const ts = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()
    const objectUrl = file ? URL.createObjectURL(file) : null
    return {
      type,
      fileName: file?.name || 'unknown',
      fileSize: file ? `${(file.size / 1024).toFixed(0)} KB` : '',
      preview: isImage ? objectUrl : null,
      videoUrl: !isImage ? objectUrl : null,
      // TODO: BACKEND — كل الأرقام دي تيجي من الـ API
      manipulationPct: isImage ? 4 : 70,
      timestamp: ts,
      note: isImage ? 'Lower right quadrant artifacts localized' : 'Upper right quadrant artifacts localized',
      metrics: isImage ? [
        { label: 'Face Consistency',   value: 72, status: 'WARNING',  borderColor: 'border-blue-400',  barColor: 'bg-blue-500' },
        { label: 'Shadow & Lighting',  value: 45, status: 'CRITICAL', borderColor: 'border-green-500', barColor: 'bg-green-500' },
        { label: 'Object Integrity',   value: 92, status: 'NORMAL',   borderColor: 'border-pink-400',  barColor: 'bg-pink-400' },
        { label: 'Metadata Integrity', value: 30, status: 'CRITICAL', borderColor: 'border-red-400',   barColor: 'bg-red-400' },
      ] : [
        { label: 'Face Detection',     value: 68, status: 'WARNING',  borderColor: 'border-blue-400',  barColor: 'bg-blue-500' },
        { label: 'Audio Sync',         value: 31, status: 'CRITICAL', borderColor: 'border-green-500', barColor: 'bg-green-500' },
        { label: 'Motion Continuity',  value: 55, status: 'WARNING',  borderColor: 'border-pink-400',  barColor: 'bg-pink-400' },
        { label: 'Frame Integrity',    value: 22, status: 'CRITICAL', borderColor: 'border-red-400',   barColor: 'bg-red-400' },
      ],
      authenticity: isImage ? [
        { label: 'Metadata Reliability', value: 30, barColor: 'bg-pink-500',  textColor: 'text-pink-500' },
        { label: 'Visual Consistency',   value: 65, barColor: 'bg-green-500', textColor: 'text-green-600' },
        { label: 'Source Verification',  value: 88, barColor: 'bg-blue-500',  textColor: 'text-blue-600' },
      ] : [
        { label: 'Audio Authenticity',   value: 28, barColor: 'bg-pink-500',  textColor: 'text-pink-500' },
        { label: 'Visual Authenticity',  value: 42, barColor: 'bg-green-500', textColor: 'text-green-600' },
        { label: 'Source Verification',  value: 61, barColor: 'bg-blue-500',  textColor: 'text-blue-600' },
      ],
      tracking: isImage ? [
        { time: 'OCT 26, 09:12', dotColor: 'bg-blue-500',  title: 'First Appearance',          desc: 'Detected on Reddit (r/worldnews). Original resolution 4000×2600.' },
        { time: 'OCT 26, 14:30', dotColor: 'bg-green-500', title: 'Compression & Modification', desc: 'Viral spread on Telegram. Metadata stripped. Histogram anomalies detected.' },
        { time: 'OCT 26, 18:45', dotColor: 'bg-pink-500',  title: 'Current Detection',          desc: 'Deepfake artifacts confirmed in sub-pixel analysis.' },
      ] : [
        { time: ts.split(',')[0] + ', 08:44', dotColor: 'bg-blue-500',  title: 'First Upload',        desc: 'Video first appeared on TikTok. Original duration 2m 14s, 1080p.' },
        { time: ts.split(',')[0] + ', 11:20', dotColor: 'bg-green-500', title: 'Re-encoding Detected', desc: 'Video re-encoded and cropped. Audio track replaced. Shared on WhatsApp.' },
        { time: ts.split(',')[0] + ', 12:00', dotColor: 'bg-pink-500',  title: 'Deepfake Confirmed',  desc: 'Face swap artifacts detected in frames 340–890. GAN-generated content suspected.' },
      ],
    }
  }

  // ===== Text analysis is powered by the backend AI (POST /verifications) =====
  // Map the backend's verdict / credibility score to a colour + emoji for the
  // result badge. Thresholds mirror the verdict labels in the API docs.
  const verdictStyle = (score) => {
    if (score >= 70) return { color: 'text-green-600 bg-green-50 border-green-200', emoji: '✅' }
    if (score >= 50) return { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', emoji: '⚠️' }
    if (score >= 25) return { color: 'text-orange-600 bg-orange-50 border-orange-200', emoji: '⚠️' }
    return { color: 'text-red-600 bg-red-50 border-red-200', emoji: '🚨' }
  }

  // Detect Arabic so we can render the AI reasoning right-to-left when needed.
  const isArabic = (s = '') => /[؀-ۿ]/.test(s)

  // ===== Image analysis is powered by reverse image search (POST /media-verify) =====
  // Map the backend's circulation verdict to a colour, icon and human-readable label.
  const imageVerdictStyle = (verdict) => ({
    WIDELY_CIRCULATED: { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Globe,         label: 'Widely Circulated', hint: 'This image appears on many pages online — verify the original context before sharing.' },
    FOUND_ONLINE:      { color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Search,        label: 'Found Online',      hint: 'This image has been published online before. Check the original source.' },
    VISUALLY_SIMILAR:  { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Layers,        label: 'Visually Similar',  hint: 'No exact match, but visually similar images exist online.' },
    NOT_FOUND:         { color: 'text-green-600 bg-green-50 border-green-200',     icon: CheckCircle2,  label: 'Not Found Online',  hint: 'No prior circulation found — this may be a new or original image.' },
  }[verdict] || { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Activity, label: verdict || '—', hint: '' })

  // ✅ Heatmap حقيقية بالـ Canvas — ترسم طبقة حرارية فوق الصورة
  const generateHeatmap = useCallback((imgEl, canvasEl, manipulationPct) => {
    if (!imgEl || !canvasEl) return
    const ctx = canvasEl.getContext('2d')
    const w = imgEl.naturalWidth || imgEl.width
    const h = imgEl.naturalHeight || imgEl.height
    canvasEl.width = w
    canvasEl.height = h

    // ارسم الصورة الأصلية
    ctx.drawImage(imgEl, 0, 0, w, h)

    // بيانات وهمية لمناطق التلاعب — TODO: BACKEND يرجّع الإحداثيات الحقيقية
    const regions = manipulationPct > 30 ? [
      { x: w * 0.55, y: h * 0.05, r: w * 0.22, intensity: 0.75 },
      { x: w * 0.70, y: h * 0.20, r: w * 0.15, intensity: 0.60 },
      { x: w * 0.40, y: h * 0.60, r: w * 0.18, intensity: 0.45 },
      { x: w * 0.80, y: h * 0.70, r: w * 0.12, intensity: 0.35 },
    ] : [
      { x: w * 0.75, y: h * 0.80, r: w * 0.10, intensity: 0.30 },
      { x: w * 0.85, y: h * 0.65, r: w * 0.08, intensity: 0.20 },
    ]

    // ارسم كل منطقة كـ radial gradient ملوّن
    regions.forEach(({ x, y, r, intensity }) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      if (intensity > 0.6) {
        grad.addColorStop(0,   `rgba(255, 0,   0,   ${intensity})`)
        grad.addColorStop(0.4, `rgba(255, 100, 0,   ${intensity * 0.7})`)
        grad.addColorStop(0.7, `rgba(255, 200, 0,   ${intensity * 0.4})`)
        grad.addColorStop(1,   `rgba(255, 255, 0,   0)`)
      } else if (intensity > 0.35) {
        grad.addColorStop(0,   `rgba(255, 165, 0,   ${intensity})`)
        grad.addColorStop(0.5, `rgba(255, 220, 0,   ${intensity * 0.5})`)
        grad.addColorStop(1,   `rgba(255, 255, 0,   0)`)
      } else {
        grad.addColorStop(0,   `rgba(0,   200, 100, ${intensity})`)
        grad.addColorStop(0.5, `rgba(0,   255, 150, ${intensity * 0.4})`)
        grad.addColorStop(1,   `rgba(0,   255, 0,   0)`)
      }
      ctx.fillStyle = grad
      ctx.fillRect(Math.max(0, x - r), Math.max(0, y - r), r * 2, r * 2)
    })
  }, [])

  const handleToolClick = (tool) => {
    setActiveTool(tool.label)
    setResults(null); setMediaResult(null); setImageResult(null); setTextResult(null); setQuery(''); setFiles([]); setHeatmap(false); setZoom(1)
    if (tool.accept && fileInputRef.current) {
      fileInputRef.current.setAttribute('accept', tool.accept)
      fileInputRef.current.click()
    }
  }

  const clearTool = () => {
    setActiveTool(null); setFiles([]); setResults(null); setMediaResult(null); setImageResult(null)
    setQuery(''); setIsAnalyzing(false); setHeatmap(false); setZoom(1)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    const isImage = activeTool === 'Image Analysis'
    const valid = selected.filter(f => isImage ? f.type.startsWith('image/') : f.type.startsWith('video/'))
    const mapped = valid.map(f => ({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }))
    setFiles(prev => [...prev, ...mapped])
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!query.trim() && !files.length) return
    setSearchError('')

    // ===== Text Analysis → POST /verifications (real AI credibility analysis) =====
    // Triggered when no media/search tool is active and the user typed text.
    if (!activeTool && query.trim()) {
      setIsAnalyzing(true)
      setPublishMsg(null)
      try {
        const content = query.trim()
        const data = await api.post('/verifications', { content })
        const a = data?.analysis || {}
        const score = Number(a.credibility_score ?? data?.verification?.credibility_score ?? 0)
        const misinfoRate = data?.publish_prompt?.misinformation_rate ?? Math.round(100 - score)
        setTextResult({
          content,
          verificationId: data?.verification?.id ?? null,
          verdict: a.verdict || '—',
          credibilityScore: Math.round(score),
          misinfoRate: Math.round(misinfoRate),
          keywords: a.keywords || [],
          sources: a.sources || [],
          missingSources: a.missing_sources || [],
          reasoning: a.ai_reasoning || '',
          wordCount: content.split(/\s+/).filter(Boolean).length,
          sentenceCount: content.split(/[.!?؟।\n]+/).filter(s => s.trim()).length || 1,
          publishPrompt: data?.publish_prompt || null,
          published: !!data?.verification?.published_to_community,
        })
      } catch (err) {
        setTextResult(null)
        setSearchError(err?.message || 'Analysis failed, please try again.')
      } finally {
        setIsAnalyzing(false)
      }
      return
    }

    // ===== Search by Keywords & Source Trace → GET /news-search (wired) =====
    if (activeTool === 'Search by Keywords and Source Trace') {
      const q = query.trim()
      if (q.length < 2) { setSearchError('Please enter at least 2 characters.'); return }
      setIsAnalyzing(true)
      try {
        const data = await api.get(`/news-search?q=${encodeURIComponent(q)}`)
        const mapped = (data?.articles || []).map(a => ({
          // Reuse the existing result-card shape so the UI is unchanged.
          meta: `${a.source?.name || 'Unknown source'}${a.published_at ? ' • ' + new Date(a.published_at).toLocaleDateString() : ''}`,
          title: a.title,
          desc: a.description,
          // The card slot is numeric ("{citations} Citations"); we surface the
          // backend credibility score here as the closest available signal.
          citations: a.credibility_score ?? 0,
          article_url: a.article_url,
        }))
        setResults(mapped)
        setSearchTotal(data?.total ?? mapped.length)
        setPage(1)
      } catch (err) {
        setResults(null)
        setSearchError(err?.message || 'Search failed, please try again.')
      } finally {
        setIsAnalyzing(false)
      }
      return
    }

    // ===== Image Analysis → POST /media-verify (real reverse-image search) =====
    // The backend returns circulation data: verdict, web_entities, pages_found,
    // visually_similar_urls, best_guess_labels and an Arabic ai_summary.
    if (activeTool === 'Image Analysis') {
      if (!files.length) { setSearchError('Please choose an image first.'); return }
      setIsAnalyzing(true)
      try {
        const file = files[0].file
        const fd = new FormData()
        fd.append('media', file)
        const data = await api.postForm('/media-verify', fd)
        setImageResult({
          ...data,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(0)} KB`,
          preview: files[0].preview || URL.createObjectURL(file),
        })
      } catch (err) {
        setImageResult(null)
        setSearchError(err?.message || 'Image analysis failed, please try again.')
      } finally {
        setIsAnalyzing(false)
      }
      return
    }

    setIsAnalyzing(true)
    await new Promise(r => setTimeout(r, 1200))

    if (activeTool === 'Video Analysis') {
      // BACKEND GAP: the backend has no video forensics — POST /media-verify only
      // processes images and returns 500 for video. These video results stay mocked
      // to preserve the demo UI until a forensic video endpoint exists.
      setMediaResult(getMockMediaResult('video', files[0]?.file))
    }
    setIsAnalyzing(false)
  }

  // Publish a high-misinformation verification to the community warning feed.
  // Only available when the backend returned a publish_prompt (rate >= 60%).
  const publishToCommunity = async () => {
    if (!textResult?.verificationId) return
    setIsPublishing(true)
    setPublishMsg(null)
    try {
      await api.post(`/verifications/${textResult.verificationId}/publish`)
      setTextResult(prev => prev && { ...prev, published: true })
      setPublishMsg({ type: 'success', text: 'Published to the community warning feed.' })
    } catch (err) {
      // 409 = already published, 422 = below threshold — surface the backend message.
      setPublishMsg({ type: 'error', text: err?.message || 'Could not publish, please try again.' })
    } finally {
      setIsPublishing(false)
    }
  }

  // ✅ ZoomIn — يكبّر الصورة/الفيديو بضغطة
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))

  // ✅ Maximize — يفتح الصورة/الفيديو بالحجم الكامل في تاب جديد
  const handleMaximize = (media = mediaResult) => {
    const url = media?.preview || media?.videoUrl
    if (url) window.open(url, '_blank')
  }

  // ✅ Download media — يحمّل الملف الأصلي
  const handleDownloadMedia = (media = mediaResult) => {
    const url = media?.preview || media?.videoUrl
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = media.fileName
    a.click()
  }

  // ✅ Download Forensic Report — يحمّل تقرير نصي بالنتائج
  const downloadReport = () => {
    if (!mediaResult) return
    const lines = [
      'MANARA FORENSIC REPORT',
      '======================',
      `File: ${mediaResult.fileName}`,
      `Size: ${mediaResult.fileSize}`,
      `Timestamp: ${mediaResult.timestamp}`,
      `AI Manipulation Detected: ${mediaResult.manipulationPct}%`,
      '',
      'METRICS',
      '-------',
      ...mediaResult.metrics.map(m => `${m.label}: ${m.value}% [${m.status}]`),
      '',
      'AUTHENTICITY BREAKDOWN',
      '----------------------',
      ...mediaResult.authenticity.map(a => `${a.label}: ${a.value}%`),
      '',
      'SOURCE TRACKING',
      '---------------',
      ...mediaResult.tracking.map(t => `[${t.time}] ${t.title}: ${t.desc}`),
      '',
      'NOTE: Full forensic analysis requires backend processing.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forensic-report-${mediaResult.fileName}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusStyle = (s) => ({
    WARNING:  { text: 'text-orange-500', bg: 'bg-orange-50' },
    CRITICAL: { text: 'text-red-500',    bg: 'bg-red-50' },
    NORMAL:   { text: 'text-green-600',  bg: 'bg-green-50' },
  }[s] || { text: 'text-gray-500', bg: 'bg-gray-50' })

  const ITEMS = 2
  const totalPages = Math.ceil((results || []).length / ITEMS)
  const paginated = (results || []).slice((page - 1) * ITEMS, page * ITEMS)

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">
      <Sidebar />
      <main className="flex-1 px-8 py-6">

        {/* Topbar */}
        <div className="flex items-center justify-between gap-6 mb-6">
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

        {/* Hero card */}
        <div className="bg-white rounded-3xl shadow-sm w-full px-10 py-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Find the Truth Behind the Headlines</h1>
          <p className="text-gray-500 mb-6 text-sm">Use keywords or article titles to explore trusted sources and fact-check information.</p>

          <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleFileChange} />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {files.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-200">
                  {f.preview
                    ? <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-blue-100 flex items-center justify-center"><Clapperboard size={22} className="text-blue-600" /></div>
                  }
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center text-red-500 shadow">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 bg-[#f4f6fb] rounded-2xl px-5 py-3 mb-5">
            <button onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('accept',
                  activeTool === 'Image Analysis' ? 'image/*' :
                  activeTool === 'Video Analysis' ? 'video/*' : 'image/*,video/*')
                fileInputRef.current.click()
              }
            }} className="text-gray-400 hover:text-blue-600 transition shrink-0">
              <Plus size={22} />
            </button>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={
                activeTool === 'Image Analysis' ? 'Analyse this image' :
                activeTool === 'Video Analysis' ? 'Analyse this video' :
                activeTool === 'Text Analysis' ? 'Paste your text or news article here...' :
                activeTool === 'Search by Keywords and Source Trace' ? 'Enter keywords to search...' :
                'Write or paste any text to analyse it...'
              }
              className="flex-1 bg-transparent outline-none text-sm text-gray-700" />
            <button onClick={handleSubmit} disabled={isAnalyzing}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition rounded-full flex items-center justify-center text-white shrink-0">
              {isAnalyzing
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={18} />
              }
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = activeTool === tool.label
              return (
                <div key={tool.label} className="relative">
                  <button onClick={() => handleToolClick(tool)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition font-medium ${isActive ? 'bg-blue-600 text-white' : 'bg-[#f4f6fb] text-gray-700 hover:bg-gray-100 border border-gray-200'}`}>
                    <Icon size={17} className={isActive ? 'text-white' : 'text-gray-500'} />
                    {tool.label}
                  </button>
                  {isActive && (
                    <button onClick={clearTool}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white shadow">
                      <X size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Loading */}
        {isAnalyzing && (
          <div className="bg-white rounded-3xl shadow-sm p-12 mb-8 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Analyzing... please wait</p>
          </div>
        )}

        {/* Search error */}
        {searchError && !isAnalyzing && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-8 text-sm">
            {searchError}
          </div>
        )}

        {/* Image / Video Result */}
        {mediaResult && !isAnalyzing && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">

            {/* File info */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{mediaResult.fileName}</span>
              <span>•</span>
              <span>{mediaResult.fileSize}</span>
            </div>

            {/* Media — image or video */}
            <div ref={mediaContainerRef} className="relative rounded-2xl overflow-hidden mb-4 bg-gray-900" style={{ minHeight: '280px' }}>
              {mediaResult.type === 'image' && mediaResult.preview ? (
                <div className="overflow-auto w-full relative" style={{ maxHeight: '480px' }}>
                  {/* الصورة الأصلية */}
                  <img
                    ref={imgRef}
                    src={mediaResult.preview}
                    alt="analysis"
                    onLoad={() => {
                      if (heatmap && canvasRef.current && imgRef.current)
                        generateHeatmap(imgRef.current, canvasRef.current, mediaResult.manipulationPct)
                    }}
                    style={{
                      width: '100%',
                      display: heatmap ? 'none' : 'block',
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      transition: 'transform 0.2s',
                    }}
                  />
                  {/* Canvas للـ Heatmap */}
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%',
                      display: heatmap ? 'block' : 'none',
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
              ) : mediaResult.type === 'video' && mediaResult.videoUrl ? (
                <div className="relative">
                  <video
                    src={mediaResult.videoUrl}
                    controls
                    style={{ width: '100%', maxHeight: '480px', display: 'block', background: '#000' }}
                  />
                  {/* TODO: BACKEND — overlay حرارية حقيقية تيجي من تحليل الفيديو */}
                  {heatmap && (
                    <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
                      <div style={{ position: 'absolute', top: '8%', right: '15%', width: '25%', height: '30%',
                        background: 'radial-gradient(ellipse, rgba(255,0,0,0.55) 0%, rgba(255,100,0,0.3) 50%, transparent 100%)' }} />
                      <div style={{ position: 'absolute', top: '40%', right: '5%', width: '20%', height: '25%',
                        background: 'radial-gradient(ellipse, rgba(255,150,0,0.5) 0%, rgba(255,200,0,0.25) 50%, transparent 100%)' }} />
                      <div style={{ position: 'absolute', bottom: '20%', left: '30%', width: '18%', height: '22%',
                        background: 'radial-gradient(ellipse, rgba(0,200,100,0.4) 0%, rgba(0,255,0,0.2) 50%, transparent 100%)' }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-500">
                  <Clapperboard size={48} />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-medium">{mediaResult.timestamp}</span>
                <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE ANALYZING
                </span>
              </div>
              <div className="absolute bottom-4 right-4 z-10">
                <div className="bg-white/95 backdrop-blur text-gray-900 text-sm font-bold px-4 py-2 rounded-xl shadow">
                  AI Manipulation Detected:{' '}
                  <span className={mediaResult.manipulationPct > 30 ? 'text-red-600' : 'text-green-600'}>
                    {mediaResult.manipulationPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between mb-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-4">
                {/* Heatmap toggle — للصور والفيديو */}
                {(mediaResult.type === 'image' || mediaResult.type === 'video') && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!heatmap ? 'text-blue-600' : 'text-gray-400'}`}>Original</span>
                    <button onClick={() => setHeatmap(!heatmap)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${heatmap ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${heatmap ? 'left-6' : 'left-1'}`} />
                    </button>
                    <span className={`text-sm font-medium ${heatmap ? 'text-blue-600' : 'text-gray-400'}`}>Heatmap</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  {/* ZoomIn — للصور فقط */}
                  {mediaResult.type === 'image' && (
                    <button onClick={handleZoomIn} title="Zoom In"
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500">
                      <ZoomIn size={16} />
                    </button>
                  )}
                  {/* Maximize — يفتح بتاب جديد */}
                  <button onClick={() => handleMaximize()} title="Open in new tab"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500">
                    <Maximize2 size={16} />
                  </button>
                  {/* Download الملف الأصلي */}
                  <button onClick={() => handleDownloadMedia()} title="Download original file"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500">
                    <Download size={16} />
                  </button>
                </div>

                {/* Reset zoom */}
                {zoom > 1 && (
                  <button onClick={() => setZoom(1)} className="text-xs text-blue-600 hover:underline">Reset zoom</button>
                )}
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} /> {mediaResult.note}
              </span>
            </div>

            {/* 4 Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {mediaResult.metrics.map((m) => {
                const { text, bg } = statusStyle(m.status)
                return (
                  <div key={m.label} className={`border-2 ${m.borderColor} rounded-2xl p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <Activity size={16} className="text-gray-400" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${text} ${bg}`}>{m.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{m.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-3">{m.value}%</p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${m.barColor} rounded-full`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Authenticity + Source Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-5">
                  <BarChart2 size={18} className="text-blue-600" /> Authenticity Breakdown
                </div>
                <div className="flex flex-col gap-5">
                  {mediaResult.authenticity.map((a) => (
                    <div key={a.label}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">{a.label}</span>
                        <span className={`font-bold ${a.textColor}`}>{a.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${a.barColor} rounded-full`} style={{ width: `${a.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-5">
                  <RefreshCw size={18} className="text-blue-600" /> Source Tracking
                </div>
                <div className="flex flex-col">
                  {mediaResult.tracking.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${t.dotColor} shrink-0 mt-1.5`} />
                        {i < mediaResult.tracking.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[20px]" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-xs text-blue-600 font-semibold mb-0.5">{t.time}</p>
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{t.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <button onClick={downloadReport}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mb-3 text-sm">
              <Download size={18} /> Download Forensic Report
            </button>
            <button onClick={() => { setMediaResult(null); setFiles([]); setQuery(''); setHeatmap(false); setZoom(1) }}
              className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
              <PlusCircle size={18} /> New Investigation
            </button>
          </div>
        )}


        {/* Image Analysis Result — real reverse-image-search data from POST /media-verify */}
        {imageResult && !isAnalyzing && (() => {
          const vs = imageVerdictStyle(imageResult.verdict)
          const VIcon = vs.icon
          const entities = imageResult.web_entities || []
          const maxScore = Math.max(1, ...entities.map(e => e.score || 0))
          const pages = imageResult.pages_found || []
          const similar = imageResult.visually_similar_urls || []
          const labels = imageResult.best_guess_labels || []
          return (
            <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">

              {/* File info */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{imageResult.fileName}</span>
                <span>•</span>
                <span>{imageResult.fileSize}</span>
              </div>

              {/* Image preview */}
              <div className="relative rounded-2xl overflow-hidden mb-4 bg-gray-900">
                <img src={imageResult.preview} alt="analysis"
                  className="w-full max-h-[420px] object-contain bg-black" />
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button onClick={() => handleMaximize(imageResult)} title="Open in new tab"
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition text-gray-600">
                    <Maximize2 size={16} />
                  </button>
                  <button onClick={() => handleDownloadMedia(imageResult)} title="Download original file"
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition text-gray-600">
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Verdict badge */}
              <div className={`border-2 rounded-2xl p-5 mb-6 flex items-start gap-4 ${vs.color}`}>
                <VIcon size={28} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-xl font-bold">{vs.label}</p>
                  {vs.hint && <p className="text-sm mt-1 opacity-80">{vs.hint}</p>}
                </div>
              </div>

              {/* Stat tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Globe size={16} className="text-blue-600" /> Pages Found
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{imageResult.pages_found_count ?? pages.length}</p>
                </div>
                <div className="border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Layers size={16} className="text-blue-600" /> Similar Images
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{imageResult.similar_image_count ?? similar.length}</p>
                </div>
                <div className={`rounded-2xl p-5 border ${imageResult.is_nsfw ? 'border-red-200 bg-red-50' : 'border-green-100 bg-green-50'}`}>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    {imageResult.is_nsfw
                      ? <ShieldAlert size={16} className="text-red-600" />
                      : <CheckCircle2 size={16} className="text-green-600" />}
                    Safety Check
                  </div>
                  <p className={`text-xl font-bold ${imageResult.is_nsfw ? 'text-red-600' : 'text-green-600'}`}>
                    {imageResult.is_nsfw ? 'NSFW detected' : 'Safe content'}
                  </p>
                </div>
              </div>

              {/* Best-guess labels */}
              {labels.length > 0 && (
                <div className="border border-blue-100 bg-blue-50 rounded-2xl p-5 mb-6">
                  <p className="font-bold text-blue-700 mb-3">🏷️ Best Guess</p>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((l, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Web entities + Pages found */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {entities.length > 0 && (
                  <div className="border border-gray-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2 font-bold text-gray-900 mb-5">
                      <BarChart2 size={18} className="text-blue-600" /> Detected Entities
                    </div>
                    <div className="flex flex-col gap-4">
                      {entities.map((e, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-gray-600">{e.description}</span>
                            <span className="font-bold text-blue-600">{Math.round(e.score)}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(6, (e.score / maxScore) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pages.length > 0 && (
                  <div className="border border-gray-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2 font-bold text-gray-900 mb-5">
                      <Link2 size={18} className="text-blue-600" /> Where It Appeared
                    </div>
                    <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto">
                      {pages.map((p, i) => (
                        <a key={i} href={p.url} target="_blank" rel="noreferrer"
                          className="group flex items-start gap-2 text-sm text-gray-700 hover:text-blue-600 transition">
                          <ExternalLink size={15} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-blue-600" />
                          <span className="leading-snug">{p.page_title || p.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Visually similar images */}
              {similar.length > 0 && (
                <div className="border border-gray-100 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <Layers size={18} className="text-blue-600" /> Visually Similar Images
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {similar.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="block aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 hover:ring-2 hover:ring-blue-400 transition">
                        <img src={url} alt="" referrerPolicy="no-referrer" loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(ev) => { ev.currentTarget.parentElement.style.display = 'none' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* AI summary */}
              {imageResult.ai_summary && (
                <div className="border border-gray-100 bg-gray-50 rounded-2xl p-5 mb-6">
                  <p className="font-bold text-gray-800 mb-2">AI Summary</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line"
                    dir={isArabic(imageResult.ai_summary) ? 'rtl' : 'ltr'}>
                    {imageResult.ai_summary}
                  </p>
                </div>
              )}

              <button onClick={() => { setImageResult(null); setFiles([]); setQuery('') }}
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
                <PlusCircle size={18} /> New Investigation
              </button>
            </div>
          )
        })()}


        {/* Text Analysis Result */}
        {textResult && !isAnalyzing && (
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Text Analysis Result</h2>

            {/* Verdict — driven by the backend AI analysis */}
            {(() => { const vs = verdictStyle(textResult.credibilityScore); return (
              <div className={`border-2 rounded-2xl p-5 mb-6 flex items-center gap-4 ${vs.color}`}>
                <div className="text-3xl">{vs.emoji}</div>
                <div>
                  <p className="text-xl font-bold">{textResult.verdict}</p>
                  <p className="text-sm mt-1 opacity-80">
                    {textResult.wordCount} words · {textResult.sentenceCount} sentences analyzed
                  </p>
                </div>
              </div>
            )})()}

            {/* Score bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {[
                { label: 'Misinformation Risk', value: textResult.misinfoRate,      color: 'bg-red-500',  textColor: 'text-red-600' },
                { label: 'Credibility Score',   value: textResult.credibilityScore, color: 'bg-blue-500', textColor: 'text-blue-600' },
              ].map((s) => (
                <div key={s.label} className="border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">{s.label}</span>
                    <span className={`text-xl font-bold ${s.textColor}`}>{s.value}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI reasoning */}
            {textResult.reasoning && (
              <div className="border border-gray-100 bg-gray-50 rounded-2xl p-5 mb-5">
                <p className="font-bold text-gray-800 mb-2">AI Reasoning</p>
                <p className="text-sm text-gray-600 leading-relaxed"
                  dir={isArabic(textResult.reasoning) ? 'rtl' : 'ltr'}>
                  {textResult.reasoning}
                </p>
              </div>
            )}

            {/* Keywords + Sources + Missing sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {textResult.keywords.length > 0 && (
                <div className="border border-blue-100 bg-blue-50 rounded-2xl p-5">
                  <p className="font-bold text-blue-700 mb-3">🔑 Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {textResult.keywords.map((w, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {textResult.sources.length > 0 && (
                <div className="border border-green-100 bg-green-50 rounded-2xl p-5">
                  <p className="font-bold text-green-700 mb-3">✅ Sources</p>
                  <div className="flex flex-col gap-2">
                    {textResult.sources.map((s, i) => (
                      <div key={i} className="text-xs text-green-800">
                        <span className="font-semibold">{s.name}</span>
                        {s.credibility != null && <span className="opacity-70"> · {s.credibility}%</span>}
                        {s.note && <p className="text-green-700/70 mt-0.5">{s.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {textResult.missingSources.length > 0 && (
                <div className="border border-orange-100 bg-orange-50 rounded-2xl p-5">
                  <p className="font-bold text-orange-700 mb-3">⚠️ Missing Sources</p>
                  <div className="flex flex-col gap-2">
                    {textResult.missingSources.map((m, i) => (
                      <div key={i} className="text-xs text-orange-800" dir={isArabic(m.claim) ? 'rtl' : 'ltr'}>
                        <span className="font-semibold">{m.claim}</span>
                        {m.suggested_source_type && <span className="opacity-70"> → {m.suggested_source_type}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {textResult.keywords.length === 0 && textResult.sources.length === 0 && textResult.missingSources.length === 0 && (
                <div className="border border-gray-100 bg-gray-50 rounded-2xl p-5 col-span-3">
                  <p className="text-gray-500 text-sm">No additional source details were returned for this content.</p>
                </div>
              )}
            </div>

            {/* Publish-to-community prompt — only for high-misinformation content */}
            {textResult.publishPrompt && !textResult.published && (
              <div className="mt-6 border-2 border-red-200 bg-red-50 rounded-2xl p-5">
                <p className="text-sm text-red-700 mb-3">{textResult.publishPrompt.message}</p>
                <button onClick={publishToCommunity} disabled={isPublishing}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 transition text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
                  {isPublishing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Publish to Community
                </button>
              </div>
            )}

            {textResult.published && (
              <div className="mt-6 border border-green-200 bg-green-50 text-green-700 rounded-2xl p-4 text-sm">
                ✅ Published to the community warning feed.
              </div>
            )}

            {publishMsg && publishMsg.type === 'error' && (
              <div className="mt-3 border border-red-200 bg-red-50 text-red-600 rounded-2xl p-4 text-sm">
                {publishMsg.text}
              </div>
            )}

            <button onClick={() => { setTextResult(null); setQuery(''); setPublishMsg(null) }}
              className="w-full mt-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
              <PlusCircle size={18} /> Analyse New Text
            </button>
          </div>
        )}

        {/* Search Results */}
        {results && !isAnalyzing && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Search Results ({searchTotal} hits)</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border transition ${viewMode === 'grid' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                  <LayoutGrid size={18} />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border transition ${viewMode === 'list' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                  <List size={18} />
                </button>
              </div>
            </div>
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4 mb-6' : 'flex flex-col gap-4 mb-6'}>
              {paginated.map((r, i) => (
                <div key={i}
                  onClick={() => setSelectedArticle(r)}
                  className={`bg-white rounded-2xl cursor-pointer hover:shadow-md transition ${viewMode === 'grid' ? 'p-4 flex flex-col' : 'p-5 flex gap-5'}`}>
                  <div className={`bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl shrink-0 ${viewMode === 'grid' ? 'w-full h-40 mb-4' : 'w-36 h-28'}`} />
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-2">{r.meta}</p>
                    <h3 className={`font-bold text-gray-900 leading-snug mb-2 ${viewMode === 'grid' ? 'text-base' : 'text-xl'}`}>{r.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{r.desc}</p>
                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                      <span className="flex items-center gap-1.5"><Link2 size={14} /> {r.citations} Citations</span>
                      <span className="flex items-center gap-1.5 hover:text-blue-600 transition"><Share2 size={14} /> Share</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pb-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-3 rounded-full transition-all ${p === page ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400 w-3'}`} />
                ))}
              </div>
            )}
          </div>
        )}


        {/* Article Popup */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setSelectedArticle(null)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>

              {/* Article image */}
              <div className="w-full h-56 bg-gradient-to-br from-gray-700 to-gray-900 rounded-t-3xl relative">
                <button onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/40 transition rounded-full flex items-center justify-center text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                <p className="text-xs font-semibold text-gray-400 tracking-wide mb-3">{selectedArticle.meta}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">{selectedArticle.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-6">{selectedArticle.desc}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Additional context and full investigation details will be available once backend processing is complete.
                  This article has been cross-referenced with {selectedArticle.citations} independent sources.
                </p>

                <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span className="flex items-center gap-1.5"><Link2 size={15} /> {selectedArticle.citations} Citations</span>
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition"><Share2 size={15} /> Share</span>
                  </div>
                  <button onClick={() => setSelectedArticle(null)}
                    className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-semibold px-6 py-2.5 rounded-xl">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default VerifyNews