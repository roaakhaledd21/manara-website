import { useState, useEffect } from 'react'
import {
  Search, Bell, SlidersHorizontal, TrendingUp, Zap, Clock,
  ChevronUp, ChevronDown, MessageSquare, Share2, Flag, Award, BadgeCheck,
  X, Send, Check, AlertTriangle,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { api, getUser } from '../lib/api'

// Detect Arabic so flagged claims / AI reasoning render right-to-left.
const isArabic = (s = '') => /[؀-ۿ]/.test(s)

// Short "Xh ago" / "Xd ago" label from an ISO timestamp.
const relativeTime = (iso) => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// Map a backend community post (GET /community item) — which wraps a flagged
// verification — into the post-card shape the feed JSX already renders. Votes
// and comments have no backend, so they start empty and live only on the client.
const communityToPost = (cp) => {
  const v = cp.verification || {}
  const score = Math.round(Number(v.credibility_score ?? 0))
  return {
    id: cp.id,
    tag: 'WARNING',
    tagColor: 'bg-red-100 text-red-600',
    author: `@${cp.user?.userName || 'unknown'}`,
    time: relativeTime(cp.created_at),
    votes: 0,
    userVote: null,
    title: v.content || '(no content)',
    body: v.ai_reasoning || '',
    misinfoRate: Math.max(0, Math.min(100, 100 - score)),
    keywords: Array.isArray(v.keywords) ? v.keywords : [],
    comments: [],
    commentCount: 0,
    reported: false,
  }
}

// Map a backend card (GET /cards item) to the shape this page's "Shared
// Investigations" cards already expect, so the existing JSX stays untouched.
const cardToInvestigation = (card, currentUserId) => ({
  id: card.id,
  tag: 'VERIFICATION',
  idNum: `#${card.id}`,
  title: card.title,
  desc: card.description,
  confidence: card.progress ?? 0,
  status: card.status,
  creator_id: card.creator_id,
  // `members` is rendered as a count in the JSX.
  members: Array.isArray(card.members) ? card.members.length : 0,
  joined:
    card.creator_id === currentUserId ||
    (Array.isArray(card.members) && card.members.some(m => m.id === currentUserId)),
})

function Community() {
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showCollabModal, setShowCollabModal] = useState(false)
  const [showCommentsFor, setShowCommentsFor] = useState(null)
  const [commentInputs, setCommentInputs] = useState({})
  const [showShareFor, setShowShareFor] = useState(null)
  const [copiedShare, setCopiedShare] = useState(false)
  const [reportedPosts, setReportedPosts] = useState([])
  const [collabForm, setCollabForm] = useState({ title: '', type: 'public', desc: '' })
  const [collabSubmitted, setCollabSubmitted] = useState(false)
  const [showAllTrends, setShowAllTrends] = useState(false)
  const [editingInv, setEditingInv] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', type: 'public', desc: '' })

  // ===== Shared Investigations — wired to /cards =====
  const currentUser = getUser()
  const currentUserId = currentUser?.id
  // Raw cards from GET /cards (source of truth for both the grid and "My Investigations").
  const [cards, setCards] = useState([])
  const [cardError, setCardError] = useState('') // small toast for 403/422/etc.

  const showCardError = (msg) => {
    setCardError(msg)
    setTimeout(() => setCardError(''), 3000)
  }

  const loadCards = () => {
    api.get('/cards')
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch((err) => { showCardError(err?.message || 'Could not load investigations.') })
  }

  useEffect(loadCards, [])

  // Replace one card in local state with the fresh copy returned by the API.
  const upsertCard = (card) =>
    setCards(prev => {
      const exists = prev.some(c => c.id === card.id)
      return exists ? prev.map(c => (c.id === card.id ? card : c)) : [card, ...prev]
    })

  const investigations = cards.map(c => cardToInvestigation(c, currentUserId))

  // "My Investigations" sidebar — only cards the current user created (creator-only
  // edit/delete per the doc). Mapped to the shape the existing sidebar JSX expects.
  // NOTE: the backend card model has no public/private `type`, so we display a static
  // placeholder; the value is not sent to the API on edit.
  const myInvestigations = cards
    .filter(c => c.creator_id === currentUserId)
    .map(c => ({
      id: c.id,
      title: c.title,
      type: 'public',
      desc: c.description || 'No description provided.',
      createdAt: '',
      status: c.status === 'closed' ? 'Closed' : 'Active',
    }))

  // ===== Community Feed — wired to GET /community (published misinfo warnings) =====
  // Each item is a verification flagged as high-misinformation and published to the
  // community. Votes/comments are client-only (no backend support for them yet).
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState('')

  useEffect(() => {
    api.get('/community')
      .then(data => setPosts((Array.isArray(data) ? data : []).map(communityToPost)))
      .catch(err => setPostsError(err?.message || 'Could not load the community feed.'))
      .finally(() => setPostsLoading(false))
  }, [])

  const trends = [
    { title: '#GasPriceHoax2024', meta: '4.2k active discussions • Viral on X', badge: null },
    { title: 'AI-Generated Health Scams', meta: '1.8k active discussions • TikTok Origin', badge: { icon: Zap, label: 'High Velocity' } },
    { title: 'Fake Satellite Footage: Mars', meta: '500 active discussions • Reddit Leak', badge: { icon: Clock, label: 'Emerging' } },
    { title: '#VaccineMisinformation2024', meta: '3.1k active discussions • Facebook Origin', badge: { icon: Zap, label: 'High Velocity' } },
    { title: 'Deepfake World Leaders', meta: '2.8k active discussions • YouTube Spread', badge: null },
    { title: 'Climate Data Manipulation', meta: '1.2k active discussions • Academic Journals', badge: { icon: Clock, label: 'Emerging' } },
    { title: '#ElectionFraudClaims', meta: '5.6k active discussions • Twitter/X', badge: { icon: Zap, label: 'High Velocity' } },
    { title: 'AI-Generated News Articles', meta: '900 active discussions • Multiple Sources', badge: { icon: Clock, label: 'Emerging' } },
  ]

  const contributors = [
    { name: 'Elena Sokolov', meta: '98.2% Accuracy • Level 50', rank: '#1', verified: true },
    { name: 'Marcus Chen', meta: '96.5% Accuracy • Level 48', rank: '#2' },
    { name: 'Sarah J. Miller', meta: '94.1% Accuracy • Level 44', rank: '#3' },
  ]

  // التصويت
  const handleVote = (postId, dir) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return { ...p }
      if (p.userVote === dir) return { ...p, votes: p.votes + (dir === 'up' ? -1 : 1), userVote: null }
      const diff = dir === 'up' ? (p.userVote === 'down' ? 2 : 1) : (p.userVote === 'up' ? -2 : -1)
      return { ...p, votes: p.votes + diff, userVote: dir }
    }))
  }

  // Join / leave a case — POST or DELETE /cards/{id}/members.
  const handleJoin = async (id) => {
    if (!currentUserId) { showCardError('Please log in to join a case.'); return }
    const inv = investigations.find(i => i.id === id)
    // Creators manage their own cases from "My Investigations", not via Join/Leave.
    if (inv?.creator_id === currentUserId) return
    try {
      const updated = inv?.joined
        ? await api.del(`/cards/${id}/members/${currentUserId}`)
        : await api.post(`/cards/${id}/members`, { user_id: currentUserId })
      if (updated && updated.id) upsertCard(updated)
      else loadCards()
    } catch (err) {
      // 403 → card is closed and no longer accepts members.
      showCardError(err?.message || 'Action failed, please try again.')
    }
  }

  // إضافة تعليق
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')

  const handleDeleteComment = (postId, commentId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      return { ...p, comments: p.comments.filter(c => c.id !== commentId), commentCount: p.commentCount - 1 }
    }))
  }

  const handleStartEditComment = (comment) => {
    setEditingComment(comment.id)
    setEditCommentText(comment.text)
  }

  const handleSaveEditComment = (postId, commentId) => {
    if (!editCommentText.trim()) return
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      return { ...p, comments: p.comments.map(c => c.id === commentId ? { ...c, text: editCommentText, edited: true } : c) }
    }))
    setEditingComment(null)
  }

  const handleAddComment = (postId) => {
    const text = (commentInputs[postId] || '').trim()
    if (!text) return
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const newComment = { id: Date.now(), author: '@you', time: 'just now', text }
      return { ...p, comments: [...p.comments, newComment], commentCount: p.commentCount + 1 }
    }))
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
  }

  // Share
  const handleShare = (postId) => {
    setShowShareFor(postId)
    navigator.clipboard?.writeText(`https://manara.app/post/${postId}`).catch(() => {})
    setCopiedShare(false)
  }

  const handleCopyLink = (postId) => {
    navigator.clipboard?.writeText(`https://manara.app/post/${postId}`)
    setCopiedShare(true)
    setTimeout(() => { setCopiedShare(false); setShowShareFor(null) }, 1500)
  }

  // Report
  const handleReport = (postId) => {
    setReportedPosts(prev => [...prev, postId])
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reported: true } : p))
  }

  // فلترة المنشورات
  const filteredPosts = posts.filter(p => {
    const matchFilter = filter === 'All' || p.tag === filter
    const matchSearch = searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  const filteredInvestigations = investigations.filter(inv =>
    searchQuery === '' ||
    inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Delete investigation — DELETE /cards/{id} (creator only, 204).
  const handleDeleteInv = async (id) => {
    try {
      await api.del(`/cards/${id}`)
      setCards(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      showCardError(err?.message || 'Could not delete investigation.')
    }
  }

  const handleStartEdit = (inv) => {
    setEditingInv(inv.id)
    setEditForm({ title: inv.title, type: inv.type, desc: inv.desc === 'No description provided.' ? '' : inv.desc })
  }

  // Update investigation — PUT /cards/{id} (creator only). `type` is not sent
  // because the backend card model has no public/private visibility field.
  const handleSaveEdit = async (id) => {
    if (!editForm.title.trim()) return
    try {
      const updated = await api.put(`/cards/${id}`, {
        title: editForm.title,
        description: editForm.desc,
      })
      if (updated && updated.id) upsertCard(updated)
      setEditingInv(null)
    } catch (err) {
      showCardError(err?.message || 'Could not update investigation.')
    }
  }

  // Create investigation — POST /cards. The modal's public/private `type` is omitted
  // (unsupported by the backend); `status` defaults to "open".
  const handleCollabSubmit = async () => {
    if (!collabForm.title.trim()) return
    try {
      const created = await api.post('/cards', {
        title: collabForm.title,
        description: collabForm.desc,
        status: 'open',
      })
      if (created && created.id) upsertCard(created)
      setCollabSubmitted(true)
      setTimeout(() => {
        setShowCollabModal(false)
        setCollabSubmitted(false)
        setCollabForm({ title: '', type: 'public', desc: '' })
      }, 1500)
    } catch (err) {
      showCardError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Could not create investigation.'))
    }
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
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search investigations, posts, keywords..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">

            {/* Header + Filter */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">Shared Investigations</h1>
                <p className="text-gray-500">Ongoing collaborative fact-checks across global sectors.</p>
              </div>
              <div className="relative mt-2">
                <button onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="p-2 text-gray-600 hover:text-blue-600 transition">
                  <SlidersHorizontal size={22} />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 w-44 p-2">
                    {['All', 'WARNING'].map(f => (
                      <button key={f} onClick={() => { setFilter(f); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition ${filter === f ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Investigations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {filteredInvestigations.map((inv) => (
                <div key={inv.id} className="bg-blue-600 rounded-3xl p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded tracking-wide">{inv.tag}</span>
                    <span className="text-xs text-blue-200">ID: {inv.idNum}</span>
                  </div>
                  <h3 className="text-2xl font-bold leading-snug mb-4">{inv.title}</h3>
                  <p className="text-blue-100 text-sm leading-relaxed mb-6">{inv.desc}</p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-blue-100">Confidence Index</span>
                    <span className="font-semibold">{inv.confidence}% Verified</span>
                  </div>
                  <div className="w-full h-1.5 bg-blue-900/40 rounded-full mb-6 overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${inv.confidence}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white rounded-full px-3 py-1 gap-1">
                      {[...Array(Math.min(inv.members, 3))].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-blue-200 border-2 border-white -ml-1 first:ml-0" />
                      ))}
                      <span className="text-blue-600 text-xs font-bold ml-1">+{inv.members}</span>
                    </div>
                    <button onClick={() => handleJoin(inv.id)}
                      className={`font-semibold text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2 ${inv.joined ? 'bg-white text-blue-600' : 'bg-blue-500/40 hover:bg-blue-500/60 text-white'}`}>
                      {inv.joined ? <><Check size={16} /> Joined</> : 'Join Case'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Community Feed */}
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="text-gray-900" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Community Feed</h2>
              {searchQuery && (
                <span className="text-sm text-gray-400 ml-1">
                  — {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{searchQuery}"
                </span>
              )}
              {filter !== 'All' && (
                <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  {filter}
                  <button onClick={() => setFilter('All')} className="ml-1 hover:text-blue-800"><X size={11} /></button>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-5">
              {filteredPosts.map((post) => (
                <div key={`${post.id}-${post.votes}-${post.userVote}`} className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex gap-4">
                    {/* Votes */}
                    <div className="flex flex-col items-center text-gray-400 shrink-0 gap-1">
                      <button onClick={() => handleVote(post.id, 'up')}
                        className={`p-1 rounded-lg transition ${post.userVote === 'up' ? 'text-blue-600 bg-blue-50' : 'hover:text-blue-600 hover:bg-blue-50'}`}>
                        <ChevronUp size={20} />
                      </button>
                      <span className={`text-sm font-bold ${post.userVote === 'up' ? 'text-blue-600' : post.userVote === 'down' ? 'text-red-500' : 'text-gray-700'}`}>
                        {post.votes}
                      </span>
                      <button onClick={() => handleVote(post.id, 'down')}
                        className={`p-1 rounded-lg transition ${post.userVote === 'down' ? 'text-red-500 bg-red-50' : 'hover:text-red-500 hover:bg-red-50'}`}>
                        <ChevronDown size={20} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm mb-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${post.tagColor}`}>
                          {post.tag === 'WARNING' && <AlertTriangle size={11} />}{post.tag}
                        </span>
                        {typeof post.misinfoRate === 'number' && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-600">
                            {post.misinfoRate}% Misinformation
                          </span>
                        )}
                        <span className="text-gray-500">Posted by <span className="text-gray-700 font-medium">{post.author}</span> • {post.time}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2" dir={isArabic(post.title) ? 'rtl' : 'ltr'}>{post.title}</h3>
                      {post.body && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4" dir={isArabic(post.body) ? 'rtl' : 'ltr'}>{post.body}</p>
                      )}
                      {post.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.keywords.map((k, i) => (
                            <span key={i} className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full" dir={isArabic(k) ? 'rtl' : 'ltr'}>{k}</span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-6 text-gray-500 text-sm mb-4">
                        <button onClick={() => setShowCommentsFor(showCommentsFor === post.id ? null : post.id)}
                          className="flex items-center gap-1.5 hover:text-blue-600 transition">
                          <MessageSquare size={16} /> {post.commentCount} Comments
                        </button>
                        <div className="relative">
                          <button onClick={() => handleShare(post.id)}
                            className="flex items-center gap-1.5 hover:text-blue-600 transition">
                            <Share2 size={16} /> Share
                          </button>
                          {showShareFor === post.id && (
                            <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-3 w-52">
                              <p className="text-xs text-gray-500 mb-2">Share this post</p>
                              <button onClick={() => handleCopyLink(post.id)}
                                className="w-full flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition">
                                {copiedShare ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Copy Link</>}
                              </button>
                              <button onClick={() => setShowShareFor(null)}
                                className="w-full text-xs text-gray-400 hover:text-gray-600 mt-1 py-1">Cancel</button>
                            </div>
                          )}
                        </div>
                        {!post.reported ? (
                          <button onClick={() => handleReport(post.id)}
                            className="flex items-center gap-1.5 hover:text-red-500 transition">
                            <Flag size={16} /> Report
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-400 text-xs">
                            <Check size={14} /> Reported
                          </span>
                        )}
                      </div>

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <div className="flex flex-col gap-3 mb-3">
                          {post.comments.map(c => (
                            <div key={c.id} className="bg-indigo-50/60 border-l-2 border-indigo-200 rounded-lg p-4 group">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-200" />
                                  <span className="font-bold text-sm text-gray-800">{c.author}</span>
                                  <span className="text-xs text-gray-400">{c.time}</span>
                                  {c.edited && <span className="text-xs text-gray-400 italic">(edited)</span>}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => handleStartEditComment(c)}
                                    className="text-xs text-blue-500 hover:text-blue-700 px-2 py-0.5 rounded hover:bg-blue-50 transition">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteComment(post.id, c.id)}
                                    className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition">
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {editingComment === c.id ? (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    value={editCommentText}
                                    onChange={e => setEditCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveEditComment(post.id, c.id)}
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveEditComment(post.id, c.id)}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition">Save</button>
                                  <button onClick={() => setEditingComment(null)}
                                    className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                </div>
                              ) : (
                                <p className="text-gray-600 text-sm leading-relaxed">{c.text}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment input */}
                      {showCommentsFor === post.id && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            value={commentInputs[post.id] || ''}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                            placeholder="Write a comment..."
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-400 bg-gray-50"
                          />
                          <button onClick={() => handleAddComment(post.id)}
                            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition">
                            <Send size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {postsLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading community feed...</span>
                </div>
              )}
              {!postsLoading && postsError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 text-sm">
                  {postsError}
                </div>
              )}
              {!postsLoading && !postsError && filteredPosts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  {posts.length === 0 ? 'No community warnings have been published yet.' : 'No posts match this filter.'}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">

            {/* Trending Misinfo */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 text-white px-5 py-3 flex items-center gap-2">
                <TrendingUp size={18} />
                <span className="font-bold">Trending Misinfo</span>
              </div>
              <div className="p-5 flex flex-col gap-5">
                {(showAllTrends ? trends : trends.slice(0, 3)).map((t, i, arr) => (
                  <div key={i} className={i < arr.length - 1 ? 'pb-4 border-b border-gray-100' : ''}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 text-sm">{t.title}</p>
                      {t.badge && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                          <t.badge.icon size={13} /> {t.badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.meta}</p>
                  </div>
                ))}
                <button
                  onClick={() => setShowAllTrends(!showAllTrends)}
                  className="bg-blue-600 hover:bg-blue-700 transition text-white font-bold text-xs tracking-wide py-3 rounded-xl">
                  {showAllTrends ? 'SHOW LESS' : 'VIEW ALL TRENDS'}
                </button>
              </div>
            </div>

            {/* Elite Contributors */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 text-white px-5 py-3 flex items-center gap-2">
                <Award size={18} />
                <span className="font-bold">Elite Contributors</span>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {contributors.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      {c.verified && (
                        <BadgeCheck className="absolute -bottom-1 -right-1 text-blue-600 bg-white rounded-full" size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.meta}</p>
                    </div>
                    <span className="text-blue-600 font-bold text-sm">{c.rank}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start an Investigation */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-3">Start an Investigation</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Found a suspicious narrative? Create a private or public collaborative workspace.
              </p>
              <button onClick={() => setShowCollabModal(true)}
                className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition">
                Initiate Collaboration
              </button>
            </div>

            {/* My Investigations */}
            {myInvestigations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-blue-600 text-white px-5 py-3 flex items-center justify-between">
                  <span className="font-bold">My Investigations</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{myInvestigations.length}</span>
                </div>
                <div className="p-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
                  {myInvestigations.map(inv => (
                    <div key={inv.id} className="border border-gray-100 rounded-xl p-4">
                      {editingInv === inv.id ? (
                        // Edit mode
                        <div className="flex flex-col gap-2">
                          <input
                            value={editForm.title}
                            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                          />
                          <div className="flex gap-2">
                            {['public', 'private'].map(t => (
                              <button key={t} onClick={() => setEditForm(prev => ({ ...prev, type: t }))}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${editForm.type === t ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
                                {t}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={editForm.desc}
                            onChange={e => setEditForm(prev => ({ ...prev, desc: e.target.value }))}
                            placeholder="Description..."
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(inv.id)}
                              className="flex-1 bg-blue-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-blue-700 transition">
                              Save
                            </button>
                            <button onClick={() => setEditingInv(null)}
                              className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-bold text-gray-900 text-sm leading-snug">{inv.title}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${inv.type === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {inv.type}
                            </span>
                          </div>
                          {inv.desc && inv.desc !== 'No description provided.' && (
                            <p className="text-xs text-gray-500 mb-2 leading-relaxed">{inv.desc}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                            <span>{inv.createdAt}</span>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              {inv.status}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                            <button onClick={() => handleStartEdit(inv)}
                              className="flex-1 text-xs text-blue-600 border border-blue-200 py-1.5 rounded-lg hover:bg-blue-50 transition font-medium">
                              ✏️ Edit
                            </button>
                            <button onClick={() => handleDeleteInv(inv.id)}
                              className="flex-1 text-xs text-red-500 border border-red-200 py-1.5 rounded-lg hover:bg-red-50 transition font-medium">
                              🗑️ Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Collaboration Modal */}
        {showCollabModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowCollabModal(false)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              {collabSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Investigation Created!</h3>
                  <p className="text-gray-500 text-sm">Your workspace is being set up...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Start an Investigation</h3>
                    <button onClick={() => setShowCollabModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={22} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Investigation Title *</label>
                      <input
                        value={collabForm.title}
                        onChange={e => setCollabForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Arctic Climate Data Manipulation"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Workspace Type</label>
                      <div className="flex gap-3">
                        {['public', 'private'].map(t => (
                          <button key={t} onClick={() => setCollabForm(prev => ({ ...prev, type: t }))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition capitalize ${collabForm.type === t ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <textarea
                        value={collabForm.desc}
                        onChange={e => setCollabForm(prev => ({ ...prev, desc: e.target.value }))}
                        placeholder="Describe what you're investigating..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    <button onClick={handleCollabSubmit}
                      disabled={!collabForm.title.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition text-white font-bold py-3 rounded-xl">
                      Create Investigation
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action feedback toast (403 closed-case, validation errors, etc.) */}
        {cardError && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
            {cardError}
          </div>
        )}

      </main>
    </div>
  )
}

export default Community












// import {
//   Search, Bell, SlidersHorizontal, TrendingUp, Zap, Clock,
//   ChevronUp, ChevronDown, MessageSquare, Share2, Flag, Award, BadgeCheck,
// } from 'lucide-react'
// import Sidebar from '../components/Sidebar'

// function Community() {

//   const investigations = [
//     { tag: 'VERIFICATION', id: '#88219-M', title: 'Climate Data Manipulation: Arctic Core', desc: 'Analyzing discrepancies between reported satellite thermal maps and...', confidence: 42 },
//     { tag: 'VERIFICATION', id: '#88219-M', title: 'Climate Data Manipulation: Arctic Core', desc: 'Analyzing discrepancies between reported satellite thermal maps and...', confidence: 82 },
//   ]

//   const trends = [
//     { title: '#GasPriceHoax2024', meta: '4.2k active discussions • Viral on X', badge: null },
//     { title: 'AI-Generated Health Scams', meta: '1.8k active discussions • TikTok Origin', badge: { icon: Zap, label: 'High Velocity' } },
//     { title: 'Fake Satellite Footage: Mars', meta: '500 active discussions • Reddit Leak', badge: { icon: Clock, label: 'Emerging' } },
//   ]

//   const contributors = [
//     { name: 'Elena Sokolov', meta: '98.2% Accuracy • Level 50', rank: '#1', verified: true },
//     { name: 'Marcus Chen', meta: '96.5% Accuracy • Level 48', rank: '#2', verified: false },
//     { name: 'Sarah J. Miller', meta: '94.1% Accuracy • Level 44', rank: '#3', verified: false },
//   ]

//   return (
//     <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">

//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main */}
//       <main className="flex-1 px-8 py-6">

//         {/* Topbar */}
//         <div className="flex items-center justify-between gap-6 mb-8">
//           <div className="relative flex-1 max-w-3xl mx-auto">
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

//         {/* Content grid: left (main) + right (sidebar widgets) */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//           {/* LEFT — spans 2 cols */}
//           <div className="lg:col-span-2">

//             {/* Header */}
//             <div className="flex items-start justify-between mb-6">
//               <div>
//                 <h1 className="text-4xl font-bold text-gray-900 mb-1">Shared Investigations</h1>
//                 <p className="text-gray-500">Ongoing collaborative fact-checks across global sectors.</p>
//               </div>
//               <button className="p-2 text-gray-600 hover:text-blue-600 transition mt-2">
//                 <SlidersHorizontal size={22} />
//               </button>
//             </div>

//             {/* Investigation cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
//               {investigations.map((inv, i) => (
//                 <div key={i} className="bg-blue-600 rounded-3xl p-6 text-white">
//                   <div className="flex items-center justify-between mb-6">
//                     <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded tracking-wide">{inv.tag}</span>
//                     <span className="text-xs text-blue-200">ID: {inv.id}</span>
//                   </div>
//                   <h3 className="text-2xl font-bold leading-snug mb-4">{inv.title}</h3>
//                   <p className="text-blue-100 text-sm leading-relaxed mb-6">{inv.desc}</p>

//                   <div className="flex items-center justify-between text-sm mb-2">
//                     <span className="text-blue-100">Confidence Index</span>
//                     <span className="font-semibold">{inv.confidence}% Verified</span>
//                   </div>
//                   <div className="w-full h-1.5 bg-blue-900/40 rounded-full mb-6 overflow-hidden">
//                     <div className="h-full bg-white rounded-full" style={{ width: `${inv.confidence}%` }} />
//                   </div>

//                   <div className="flex items-center justify-between">
//                     {/* Avatars */}
//                     <div className="flex items-center bg-white rounded-full p-1 pr-2">
//                       <div className="w-7 h-7 rounded-full bg-blue-200 border-2 border-white" />
//                       <div className="w-7 h-7 rounded-full bg-pink-200 border-2 border-white -ml-2" />
//                       <span className="text-blue-600 text-xs font-bold ml-1">+5</span>
//                     </div>
//                     <button className="bg-blue-500/40 hover:bg-blue-500/60 transition text-white font-semibold text-sm px-6 py-2.5 rounded-xl">
//                       Join Case
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Community Feed */}
//             <div className="flex items-center gap-2 mb-5">
//               <MessageSquare className="text-gray-900" size={24} />
//               <h2 className="text-2xl font-bold text-gray-900">Community Feed</h2>
//             </div>

//             <div className="flex flex-col gap-5">

//               {/* Post 1 */}
//               <div className="bg-white border border-gray-200 rounded-2xl p-6">
//                 <div className="flex gap-4">
//                   {/* Votes */}
//                   <div className="flex flex-col items-center text-gray-400 shrink-0">
//                     <button className="hover:text-blue-600 transition"><ChevronUp size={20} /></button>
//                     <span className="text-sm font-bold text-gray-700">156</span>
//                     <button className="hover:text-blue-600 transition"><ChevronDown size={20} /></button>
//                   </div>
//                   {/* Body */}
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 text-sm mb-2">
//                       <span className="bg-indigo-50 text-indigo-500 text-xs font-bold px-2 py-0.5 rounded">DEBATE</span>
//                       <span className="text-gray-500">Posted by <span className="text-gray-700">@osint_specialist</span> • 4h ago</span>
//                     </div>
//                     <h3 className="font-bold text-gray-900 mb-2">Metadata mismatch in the latest leaked diplomat papers. Possible fabrication by AI?</h3>
//                     <p className="text-gray-600 text-sm leading-relaxed mb-4">
//                       The EXIF data points to a location in the Pacific, yet the shadows suggest an Eastern European sun angle. Looking for forensic imaging experts to verify.
//                     </p>
//                     <div className="flex items-center gap-6 text-gray-500 text-sm mb-4">
//                       <span className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition"><MessageSquare size={16} /> 48 Comments</span>
//                       <span className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition"><Share2 size={16} /> Share</span>
//                       <span className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition"><Flag size={16} /> Report</span>
//                     </div>
//                     {/* Nested comment */}
//                     <div className="bg-indigo-50/60 border-l-2 border-indigo-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-1.5">
//                         <div className="w-6 h-6 rounded-full bg-blue-200" />
//                         <span className="font-bold text-sm text-gray-800">@shadow_analyst</span>
//                         <span className="text-xs text-gray-400">2h ago</span>
//                       </div>
//                       <p className="text-gray-600 text-sm leading-relaxed">
//                         I ran the luminance levels through the ELA engine. There is a distinct noise pattern shift around the text block. Definitely tampered.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Post 2 */}
//               <div className="bg-white border border-gray-200 rounded-2xl p-6">
//                 <div className="flex gap-4">
//                   <div className="flex flex-col items-center text-gray-400 shrink-0">
//                     <button className="hover:text-blue-600 transition"><ChevronUp size={20} /></button>
//                     <span className="text-sm font-bold text-gray-700">82</span>
//                     <button className="hover:text-blue-600 transition"><ChevronDown size={20} /></button>
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 text-sm mb-2">
//                       <span className="bg-blue-50 text-blue-500 text-xs font-bold px-2 py-0.5 rounded">EVIDENCE</span>
//                       <span className="text-gray-500">Posted by <span className="text-gray-700">@fact_miner</span> • 8h ago</span>
//                     </div>
//                     <h3 className="font-bold text-gray-900 mb-4">New evidence link for the Arctic Core investigation: Raw Buoy Data ID #442.</h3>
//                     <div className="flex items-center gap-6 text-gray-500 text-sm">
//                       <span className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition"><MessageSquare size={16} /> 12 Comments</span>
//                       <span className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition"><Share2 size={16} /> Share</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//             </div>
//           </div>

//           {/* RIGHT — sidebar widgets */}
//           <div className="flex flex-col gap-6">

//             {/* Trending Misinfo */}
//             <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
//               <div className="bg-blue-600 text-white px-5 py-3 flex items-center gap-2">
//                 <TrendingUp size={18} />
//                 <span className="font-bold">Trending Misinfo</span>
//               </div>
//               <div className="p-5 flex flex-col gap-5">
//                 {trends.map((t, i) => (
//                   <div key={i} className={i < trends.length - 1 ? 'pb-5 border-b border-gray-100' : ''}>
//                     <div className="flex items-start justify-between gap-2">
//                       <p className="font-bold text-gray-900 text-sm">{t.title}</p>
//                       {t.badge && (
//                         <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
//                           <t.badge.icon size={13} /> {t.badge.label}
//                         </span>
//                       )}
//                     </div>
//                     <p className="text-xs text-gray-500 mt-1">{t.meta}</p>
//                   </div>
//                 ))}
//                 <button className="bg-blue-600 hover:bg-blue-700 transition text-white font-bold text-xs tracking-wide py-3 rounded-xl">
//                   VIEW ALL TRENDS
//                 </button>
//               </div>
//             </div>

//             {/* Elite Contributors */}
//             <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
//               <div className="bg-blue-600 text-white px-5 py-3 flex items-center gap-2">
//                 <Award size={18} />
//                 <span className="font-bold">Elite Contributors</span>
//               </div>
//               <div className="p-5 flex flex-col gap-4">
//                 {contributors.map((c, i) => (
//                   <div key={i} className="flex items-center gap-3">
//                     <div className="relative">
//                       <div className="w-10 h-10 rounded-full bg-gray-200" />
//                       {c.verified && (
//                         <BadgeCheck className="absolute -bottom-1 -right-1 text-blue-600 bg-white rounded-full" size={16} />
//                       )}
//                     </div>
//                     <div className="flex-1">
//                       <p className="font-bold text-gray-900 text-sm">{c.name}</p>
//                       <p className="text-xs text-gray-500">{c.meta}</p>
//                     </div>
//                     <span className="text-blue-600 font-bold text-sm">{c.rank}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Start an Investigation */}
//             <div className="bg-blue-600 rounded-2xl p-6 text-white">
//               <h3 className="text-xl font-bold mb-3">Start an Investigation</h3>
//               <p className="text-blue-100 text-sm leading-relaxed mb-6">
//                 Found a suspicious narrative? Create a private or public collaborative workspace.
//               </p>
//               <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition">
//                 Initiate Collaboration
//               </button>
//             </div>

//           </div>
//         </div>

//       </main>
//     </div>
//   )
// }

// export default Community