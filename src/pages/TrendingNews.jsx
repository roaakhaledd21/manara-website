import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Bell, Globe, ChevronDown, BarChart2, TrendingUp, TrendingDown, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'

// BACKEND GAP: the Trending/Live-Monitoring data below (regional density map points,
// zone stats, analyst briefs, keyword frequencies, trending topics, virality scores)
// has NO endpoint in frontend_integration.md (no GET /dashboard/trends or equivalent).
// The entire page is driven by the static DATA map until a trends endpoint exists.
// TODO: BACKEND — expose a regional trends endpoint to replace the DATA constant.
const REGIONS = ['Global Region', 'Middle East', 'Europe', 'Africa', 'Asia', 'Americas']
const TIME_RANGES = ['24h', '7d', '30d']

// إحداثيات المناطق على الخريطة (نسبة مئوية من عرض/ارتفاع الصورة)
const REGION_ZONES = {
  'Middle East': { x: 0.55, y: 0.38, w: 0.12, h: 0.15, label: 'MIDDLE EAST', topic: 'Conflict Media', mentions: '78k', growth: '+45%' },
  'Europe':      { x: 0.45, y: 0.18, w: 0.14, h: 0.18, label: 'EUROPE',      topic: 'AI Ethics',     mentions: '42k', growth: '+12%' },
  'Africa':      { x: 0.47, y: 0.45, w: 0.12, h: 0.22, label: 'AFRICA',      topic: 'Health Scams',  mentions: '31k', growth: '+28%' },
  'Asia':        { x: 0.65, y: 0.22, w: 0.20, h: 0.28, label: 'ASIA',        topic: 'Deepfakes',     mentions: '95k', growth: '+67%' },
  'Americas':    { x: 0.08, y: 0.15, w: 0.25, h: 0.45, label: 'AMERICAS',    topic: 'Election Fraud', mentions: '54k', growth: '+33%' },
  'Global Region': { x: 0.5, y: 0.4, w: 1, h: 1, label: 'GLOBAL', topic: 'Misinformation', mentions: '300k', growth: '+22%' },
}

// نقاط التلاعب على الخريطة حسب المنطقة (x%, y% من الخريطة، لون، حجم)
const BASE_POINTS = [
  // Middle East
  { x: 0.56, y: 0.35, type: 'critical', region: 'Middle East' },
  { x: 0.58, y: 0.40, type: 'critical', region: 'Middle East' },
  { x: 0.54, y: 0.42, type: 'elevated', region: 'Middle East' },
  { x: 0.60, y: 0.38, type: 'elevated', region: 'Middle East' },
  // Europe
  { x: 0.47, y: 0.22, type: 'elevated', region: 'Europe' },
  { x: 0.50, y: 0.20, type: 'normal',   region: 'Europe' },
  { x: 0.52, y: 0.25, type: 'elevated', region: 'Europe' },
  { x: 0.45, y: 0.28, type: 'normal',   region: 'Europe' },
  // Africa
  { x: 0.48, y: 0.50, type: 'elevated', region: 'Africa' },
  { x: 0.50, y: 0.55, type: 'critical', region: 'Africa' },
  { x: 0.52, y: 0.48, type: 'normal',   region: 'Africa' },
  // Asia
  { x: 0.68, y: 0.28, type: 'critical', region: 'Asia' },
  { x: 0.72, y: 0.32, type: 'critical', region: 'Asia' },
  { x: 0.75, y: 0.25, type: 'elevated', region: 'Asia' },
  { x: 0.78, y: 0.35, type: 'elevated', region: 'Asia' },
  { x: 0.70, y: 0.38, type: 'normal',   region: 'Asia' },
  // Americas
  { x: 0.18, y: 0.28, type: 'elevated', region: 'Americas' },
  { x: 0.22, y: 0.35, type: 'critical', region: 'Americas' },
  { x: 0.15, y: 0.38, type: 'normal',   region: 'Americas' },
  { x: 0.20, y: 0.50, type: 'normal',   region: 'Americas' },
]

const POINT_COLORS = {
  critical: '#EF4444',
  elevated: '#F59E0B',
  normal:   '#22C55E',
}

// بيانات كل منطقة × كل نطاق زمني
const DATA = {
  'Global Region': {
    '24h': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH',     color: 'text-red-400',    pct: '78%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '12%', pctBg: 'bg-green-500' },
        { zone: 'AFRICA_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '44%', pctBg: 'bg-yellow-500' },
      ],
      brief: '"In the last 6 hours, AI-related misinformation surged globally by 32%. Cross-platform propagation from decentralized nodes detected across 14 countries."',
      briefHighlights: ['AI-related misinformation', '32%', '14 countries'],
      keywords: [{ label: 'AI', value: 65 }, { label: 'REG', value: 45 }, { label: 'SEC', value: 72 }, { label: 'DATA', value: 88 }, { label: 'LAW', value: 55 }],
      topics: [{ rank: '01', title: 'Quantum Supremacy', count: '4.8k', up: true }, { rank: '02', title: 'Green Hydrogen', count: '1.2k', up: false }, { rank: '03', title: 'Digital Autonomy', count: '924', up: true }],
      fastKeywords: ['Web3', 'E-Privacy', 'Data Breach', 'Sustainability', 'Cybersecurity', 'Regulation'],
      activeKeyword: 'Cybersecurity',
      virality: [{ tag: '#AIRegulations', pct: 92, color: 'bg-blue-600' }, { tag: '#ClimateAccord', pct: 64, color: 'bg-blue-500' }, { tag: '#SpaceXLaunch', pct: 41, color: 'bg-blue-400' }],
    },
    '7d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'CRITICAL',  color: 'text-red-400',    pct: '85%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'ELEVATED',  color: 'text-yellow-400', pct: '34%', pctBg: 'bg-yellow-500' },
        { zone: 'AFRICA_ZONE',                  label: 'HIGH',      color: 'text-orange-400', pct: '61%', pctBg: 'bg-orange-500' },
      ],
      brief: '"Over the past 7 days, health misinformation dominated globally with a 58% spike. Bot networks active in 34% of viral shares."',
      briefHighlights: ['health misinformation', '58%', '34%'],
      keywords: [{ label: 'HEALTH', value: 90 }, { label: 'BIO', value: 60 }, { label: 'PHARMA', value: 75 }, { label: 'GOV', value: 40 }, { label: 'SOCIAL', value: 82 }],
      topics: [{ rank: '01', title: 'Vaccine Misinformation', count: '12.3k', up: true }, { rank: '02', title: 'Bio Lab Claims', count: '7.1k', up: true }, { rank: '03', title: 'WHO Credibility', count: '3.4k', up: false }],
      fastKeywords: ['Vaccine', 'Side Effects', 'WHO', 'Pharma', 'Health Policy', 'Immunity'],
      activeKeyword: 'Vaccine',
      virality: [{ tag: '#VaccineDebate', pct: 87, color: 'bg-blue-600' }, { tag: '#HealthFreedom', pct: 71, color: 'bg-blue-500' }, { tag: '#BigPharma', pct: 53, color: 'bg-blue-400' }],
    },
    '30d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'CRITICAL',  color: 'text-red-400',    pct: '93%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'HIGH',      color: 'text-orange-400', pct: '55%', pctBg: 'bg-orange-500' },
        { zone: 'AFRICA_ZONE',                  label: 'ELEVATED',  color: 'text-yellow-400', pct: '71%', pctBg: 'bg-yellow-500' },
      ],
      brief: '"This month, geopolitical deepfakes reached record levels globally. Conflict narratives increased by 120%. State-sponsored accounts identified in 22 countries."',
      briefHighlights: ['geopolitical deepfakes', '120%', '22 countries'],
      keywords: [{ label: 'WAR', value: 95 }, { label: 'DIPLO', value: 55 }, { label: 'MEDIA', value: 78 }, { label: 'INTEL', value: 62 }, { label: 'ECON', value: 70 }],
      topics: [{ rank: '01', title: 'Conflict Deepfakes', count: '31.2k', up: true }, { rank: '02', title: 'Election Interference', count: '18.7k', up: true }, { rank: '03', title: 'Sanctions Narrative', count: '9.1k', up: false }],
      fastKeywords: ['Deepfake', 'Geopolitics', 'Propaganda', 'Conflict', 'Elections', 'Diplomacy'],
      activeKeyword: 'Deepfake',
      virality: [{ tag: '#ConflictNews', pct: 95, color: 'bg-blue-600' }, { tag: '#ElectionWatch', pct: 78, color: 'bg-blue-500' }, { tag: '#Deepfakes2024', pct: 61, color: 'bg-blue-400' }],
    },
  },
  'Europe': {
    '24h': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH',     color: 'text-red-400',    pct: '52%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'CRITICAL', color: 'text-red-400',    pct: '88%', pctBg: 'bg-red-500' },
        { zone: 'AFRICA_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '18%', pctBg: 'bg-green-500' },
      ],
      brief: '"In the last 6 hours, AI regulation misinformation surged in Europe by 32%. Germany and France are the top sources, with 42k mentions across social platforms."',
      briefHighlights: ['AI regulation misinformation', '32%', '42k mentions'],
      keywords: [{ label: 'AI', value: 88 }, { label: 'REG', value: 75 }, { label: 'GDPR', value: 60 }, { label: 'TECH', value: 45 }, { label: 'LAW', value: 70 }],
      topics: [{ rank: '01', title: 'AI Ethics Debate', count: '8.2k', up: true }, { rank: '02', title: 'GDPR Violations', count: '3.1k', up: true }, { rank: '03', title: 'Digital Markets Act', count: '1.9k', up: false }],
      fastKeywords: ['AI Ethics', 'GDPR', 'Regulation', 'Digital Act', 'Privacy', 'Tech Law'],
      activeKeyword: 'AI Ethics',
      virality: [{ tag: '#AIRegEurope', pct: 88, color: 'bg-blue-600' }, { tag: '#GDPRDebate', pct: 61, color: 'bg-blue-500' }, { tag: '#EUTechLaw', pct: 44, color: 'bg-blue-400' }],
    },
    '7d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'MODERATE', color: 'text-yellow-400', pct: '41%', pctBg: 'bg-yellow-500' },
        { zone: 'EUROPE_ZONE',                  label: 'HIGH',     color: 'text-orange-400', pct: '74%', pctBg: 'bg-orange-500' },
        { zone: 'AFRICA_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '22%', pctBg: 'bg-green-500' },
      ],
      brief: '"Over the last 7 days, climate misinformation spread across European platforms by 47%. Coordinated campaigns traced to 3 Eastern European IP clusters."',
      briefHighlights: ['climate misinformation', '47%', '3 Eastern European IP clusters'],
      keywords: [{ label: 'CLIMATE', value: 92 }, { label: 'ENERGY', value: 68 }, { label: 'POLICY', value: 55 }, { label: 'MEDIA', value: 80 }, { label: 'GOV', value: 42 }],
      topics: [{ rank: '01', title: 'Climate Policy Hoax', count: '15.4k', up: true }, { rank: '02', title: 'Energy Crisis Claims', count: '9.7k', up: true }, { rank: '03', title: 'EU Budget Fraud', count: '4.2k', up: false }],
      fastKeywords: ['Climate', 'Green Deal', 'Energy', 'Carbon Tax', 'Renewables', 'EU Policy'],
      activeKeyword: 'Climate',
      virality: [{ tag: '#EUClimateHoax', pct: 84, color: 'bg-blue-600' }, { tag: '#GreenDealFake', pct: 67, color: 'bg-blue-500' }, { tag: '#EnergyCrisis', pct: 49, color: 'bg-blue-400' }],
    },
    '30d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH',     color: 'text-orange-400', pct: '63%', pctBg: 'bg-orange-500' },
        { zone: 'EUROPE_ZONE',                  label: 'CRITICAL', color: 'text-red-400',    pct: '91%', pctBg: 'bg-red-500' },
        { zone: 'AFRICA_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '38%', pctBg: 'bg-yellow-500' },
      ],
      brief: '"This month, election-related misinformation in Europe rose 89%. Deepfakes of political leaders circulated in 12 EU member states, affecting public opinion polls."',
      briefHighlights: ['election-related misinformation', '89%', '12 EU member states'],
      keywords: [{ label: 'ELECT', value: 95 }, { label: 'DEEP', value: 72 }, { label: 'PARTY', value: 58 }, { label: 'VOTE', value: 85 }, { label: 'MEDIA', value: 66 }],
      topics: [{ rank: '01', title: 'Election Deepfakes EU', count: '28.1k', up: true }, { rank: '02', title: 'Voter Suppression Claims', count: '14.3k', up: true }, { rank: '03', title: 'MEP Corruption Hoax', count: '7.6k', up: false }],
      fastKeywords: ['Elections', 'Deepfake', 'Voting', 'Parliament', 'Fraud', 'Democracy'],
      activeKeyword: 'Elections',
      virality: [{ tag: '#EUElectionFake', pct: 91, color: 'bg-blue-600' }, { tag: '#DeepfakeLeader', pct: 74, color: 'bg-blue-500' }, { tag: '#VoteManipulation', pct: 58, color: 'bg-blue-400' }],
    },
  },
  'Middle East': {
    '24h': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'CRITICAL', color: 'text-red-400',    pct: '94%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '15%', pctBg: 'bg-green-500' },
        { zone: 'AFRICA_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '39%', pctBg: 'bg-yellow-500' },
      ],
      brief: '"In the last 6 hours, conflict-related misinformation in the Middle East spiked 78%. Manipulated footage from Gaza circulating on Telegram with 31k shares."',
      briefHighlights: ['conflict-related misinformation', '78%', '31k shares'],
      keywords: [{ label: 'WAR', value: 95 }, { label: 'MEDIA', value: 72 }, { label: 'VIDEO', value: 85 }, { label: 'GOV', value: 48 }, { label: 'AID', value: 33 }],
      topics: [{ rank: '01', title: 'Manipulated War Footage', count: '18.7k', up: true }, { rank: '02', title: 'Ceasefire Hoax', count: '9.2k', up: true }, { rank: '03', title: 'Aid Convoy Claims', count: '4.1k', up: false }],
      fastKeywords: ['Conflict', 'Gaza', 'Ceasefire', 'Propaganda', 'Footage', 'Telegram'],
      activeKeyword: 'Conflict',
      virality: [{ tag: '#WarFakeNews', pct: 94, color: 'bg-blue-600' }, { tag: '#CeasefireHoax', pct: 76, color: 'bg-blue-500' }, { tag: '#ManipulatedVideo', pct: 61, color: 'bg-blue-400' }],
    },
    '7d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'CRITICAL', color: 'text-red-400',    pct: '89%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '28%', pctBg: 'bg-yellow-500' },
        { zone: 'AFRICA_ZONE',                  label: 'ELEVATED', color: 'text-orange-400', pct: '52%', pctBg: 'bg-orange-500' },
      ],
      brief: '"Over the past 7 days, sectarian misinformation rose 55% in the Middle East. Religious disinformation campaigns detected across 8 countries."',
      briefHighlights: ['sectarian misinformation', '55%', '8 countries'],
      keywords: [{ label: 'SECT', value: 88 }, { label: 'REL', value: 65 }, { label: 'POL', value: 72 }, { label: 'MEDIA', value: 58 }, { label: 'OIL', value: 40 }],
      topics: [{ rank: '01', title: 'Sectarian Propaganda', count: '22.4k', up: true }, { rank: '02', title: 'Oil Price Manipulation Claims', count: '11.8k', up: false }, { rank: '03', title: 'Government Collapse Rumors', count: '6.3k', up: true }],
      fastKeywords: ['Sectarian', 'Religion', 'Oil', 'Sanctions', 'Militia', 'Proxy War'],
      activeKeyword: 'Sectarian',
      virality: [{ tag: '#SectarianFake', pct: 86, color: 'bg-blue-600' }, { tag: '#OilHoax', pct: 62, color: 'bg-blue-500' }, { tag: '#GovCollapse', pct: 47, color: 'bg-blue-400' }],
    },
    '30d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'CRITICAL', color: 'text-red-400',    pct: '97%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'HIGH',     color: 'text-orange-400', pct: '44%', pctBg: 'bg-orange-500' },
        { zone: 'AFRICA_ZONE',                  label: 'ELEVATED', color: 'text-yellow-400', pct: '58%', pctBg: 'bg-yellow-500' },
      ],
      brief: '"This month, state-sponsored misinformation in the Middle East reached its highest level. Deepfake diplomats used in 6 countries to influence peace negotiations."',
      briefHighlights: ['state-sponsored misinformation', 'Deepfake diplomats', '6 countries'],
      keywords: [{ label: 'STATE', value: 90 }, { label: 'DIPLO', value: 75 }, { label: 'DEEP', value: 82 }, { label: 'PEACE', value: 44 }, { label: 'INTEL', value: 68 }],
      topics: [{ rank: '01', title: 'Deepfake Diplomats', count: '35.6k', up: true }, { rank: '02', title: 'Peace Deal Sabotage', count: '19.2k', up: true }, { rank: '03', title: 'Sanctions Evasion Claims', count: '8.7k', up: false }],
      fastKeywords: ['Deepfake', 'Diplomacy', 'State Actor', 'Intelligence', 'Influence Ops', 'PSYOP'],
      activeKeyword: 'Deepfake',
      virality: [{ tag: '#DeepfakeDiplomat', pct: 93, color: 'bg-blue-600' }, { tag: '#PeaceSabotage', pct: 77, color: 'bg-blue-500' }, { tag: '#StateActor', pct: 62, color: 'bg-blue-400' }],
    },
  },
  'Asia': {
    '24h': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH',     color: 'text-orange-400', pct: '67%', pctBg: 'bg-orange-500' },
        { zone: 'EUROPE_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '19%', pctBg: 'bg-green-500' },
        { zone: 'ASIA_ZONE',                    label: 'CRITICAL', color: 'text-red-400',    pct: '91%', pctBg: 'bg-red-500' },
      ],
      brief: '"In the last 6 hours, deepfake content in Asia surged 67% with 95k mentions. AI-generated political content detected across 9 Asian countries."',
      briefHighlights: ['deepfake content', '67%', '95k mentions'],
      keywords: [{ label: 'DEEP', value: 92 }, { label: 'AI', value: 78 }, { label: 'POL', value: 65 }, { label: 'TECH', value: 85 }, { label: 'ECON', value: 50 }],
      topics: [{ rank: '01', title: 'AI Political Deepfakes', count: '21.3k', up: true }, { rank: '02', title: 'Trade War Narratives', count: '12.7k', up: true }, { rank: '03', title: 'Tech Giant Manipulation', count: '7.4k', up: false }],
      fastKeywords: ['Deepfake', 'AI Content', 'Trade War', 'Tech Giants', 'Censorship', 'Influence'],
      activeKeyword: 'Deepfake',
      virality: [{ tag: '#AsiaDeepfake', pct: 91, color: 'bg-blue-600' }, { tag: '#TradeWarFake', pct: 70, color: 'bg-blue-500' }, { tag: '#TechManipulation', pct: 52, color: 'bg-blue-400' }],
    },
    '7d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'MODERATE', color: 'text-yellow-400', pct: '44%', pctBg: 'bg-yellow-500' },
        { zone: 'EUROPE_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '22%', pctBg: 'bg-green-500' },
        { zone: 'ASIA_ZONE',                    label: 'HIGH',     color: 'text-orange-400', pct: '79%', pctBg: 'bg-orange-500' },
      ],
      brief: '"Over the past 7 days, economic misinformation in Asia rose 43%. False currency collapse claims spread across 7 major markets causing temporary panic."',
      briefHighlights: ['economic misinformation', '43%', '7 major markets'],
      keywords: [{ label: 'ECON', value: 88 }, { label: 'FIN', value: 74 }, { label: 'TRADE', value: 62 }, { label: 'CURR', value: 80 }, { label: 'BANK', value: 55 }],
      topics: [{ rank: '01', title: 'Currency Collapse Hoax', count: '17.8k', up: true }, { rank: '02', title: 'Bank Run False Claims', count: '9.4k', up: true }, { rank: '03', title: 'IMF Bailout Rumors', count: '5.1k', up: false }],
      fastKeywords: ['Currency', 'Banking', 'IMF', 'Market Crash', 'Trade', 'Recession'],
      activeKeyword: 'Currency',
      virality: [{ tag: '#CurrencyHoax', pct: 85, color: 'bg-blue-600' }, { tag: '#BankRunFake', pct: 68, color: 'bg-blue-500' }, { tag: '#AsiaRecession', pct: 44, color: 'bg-blue-400' }],
    },
    '30d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH',     color: 'text-orange-400', pct: '71%', pctBg: 'bg-orange-500' },
        { zone: 'EUROPE_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '33%', pctBg: 'bg-yellow-500' },
        { zone: 'ASIA_ZONE',                    label: 'CRITICAL', color: 'text-red-400',    pct: '96%', pctBg: 'bg-red-500' },
      ],
      brief: '"This month, military misinformation across Asia increased 110%. Fabricated naval incident videos generated 154k mentions across 15 platforms."',
      briefHighlights: ['military misinformation', '110%', '154k mentions'],
      keywords: [{ label: 'MIL', value: 96 }, { label: 'NAVAL', value: 80 }, { label: 'TERR', value: 65 }, { label: 'INTEL', value: 72 }, { label: 'NUCL', value: 58 }],
      topics: [{ rank: '01', title: 'Naval Incident Fabrication', count: '42.1k', up: true }, { rank: '02', title: 'Nuclear Threat Hoax', count: '23.5k', up: true }, { rank: '03', title: 'Military AI Claims', count: '11.2k', up: false }],
      fastKeywords: ['Naval', 'Military', 'Nuclear', 'Fabricated', 'Incident', 'Territorial'],
      activeKeyword: 'Naval',
      virality: [{ tag: '#NavalFakeNews', pct: 96, color: 'bg-blue-600' }, { tag: '#NuclearHoax', pct: 79, color: 'bg-blue-500' }, { tag: '#MilFabrication', pct: 63, color: 'bg-blue-400' }],
    },
  },
  'Africa': {
    '24h': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'MODERATE', color: 'text-yellow-400', pct: '45%', pctBg: 'bg-yellow-500' },
        { zone: 'EUROPE_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '11%', pctBg: 'bg-green-500' },
        { zone: 'AFRICA_ZONE',                  label: 'HIGH',     color: 'text-orange-400', pct: '72%', pctBg: 'bg-orange-500' },
      ],
      brief: '"In the last 6 hours, health scam misinformation in Africa grew 28% with 31k mentions. Fake cure claims for 3 diseases spreading via WhatsApp groups."',
      briefHighlights: ['health scam misinformation', '28%', '31k mentions'],
      keywords: [{ label: 'HLTH', value: 82 }, { label: 'CURE', value: 90 }, { label: 'WHAP', value: 65 }, { label: 'GOV', value: 45 }, { label: 'AID', value: 55 }],
      topics: [{ rank: '01', title: 'Fake Cure Claims', count: '9.8k', up: true }, { rank: '02', title: 'Aid Diversion Rumors', count: '5.2k', up: true }, { rank: '03', title: 'Disease Outbreak Hoax', count: '3.1k', up: false }],
      fastKeywords: ['Fake Cure', 'WhatsApp', 'Disease', 'Aid', 'Health', 'Outbreak'],
      activeKeyword: 'Fake Cure',
      virality: [{ tag: '#FakeCureAfrica', pct: 83, color: 'bg-blue-600' }, { tag: '#AidHoax', pct: 61, color: 'bg-blue-500' }, { tag: '#OutbreakFake', pct: 42, color: 'bg-blue-400' }],
    },
    '7d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH',     color: 'text-orange-400', pct: '58%', pctBg: 'bg-orange-500' },
        { zone: 'EUROPE_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '17%', pctBg: 'bg-green-500' },
        { zone: 'AFRICA_ZONE',                  label: 'CRITICAL', color: 'text-red-400',    pct: '84%', pctBg: 'bg-red-500' },
      ],
      brief: '"Over 7 days, election misinformation in Africa surged 62% across 5 countries holding votes. Fabricated results shared 48 hours before polling closed."',
      briefHighlights: ['election misinformation', '62%', '5 countries'],
      keywords: [{ label: 'ELECT', value: 90 }, { label: 'VOTE', value: 75 }, { label: 'FRAUD', value: 82 }, { label: 'GOV', value: 55 }, { label: 'MEDIA', value: 65 }],
      topics: [{ rank: '01', title: 'Fabricated Election Results', count: '14.6k', up: true }, { rank: '02', title: 'Voter Intimidation Hoax', count: '8.3k', up: true }, { rank: '03', title: 'Coup Rumors', count: '4.7k', up: false }],
      fastKeywords: ['Election', 'Vote Fraud', 'Coup', 'Results', 'Intimidation', 'Democracy'],
      activeKeyword: 'Election',
      virality: [{ tag: '#ElectionFraudAfrica', pct: 88, color: 'bg-blue-600' }, { tag: '#CoupRumors', pct: 65, color: 'bg-blue-500' }, { tag: '#VoteFake', pct: 47, color: 'bg-blue-400' }],
    },
    '30d': {
      zoneStats: [
        { zone: 'MIDDLE EAST_ZONE, KOREA_ZONE', label: 'HIGH',     color: 'text-orange-400', pct: '62%', pctBg: 'bg-orange-500' },
        { zone: 'EUROPE_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '29%', pctBg: 'bg-yellow-500' },
        { zone: 'AFRICA_ZONE',                  label: 'CRITICAL', color: 'text-red-400',    pct: '88%', pctBg: 'bg-red-500' },
      ],
      brief: '"This month, economic collapse narratives in Africa reached 89k mentions. False IMF withdrawal claims triggered currency panic in 4 nations."',
      briefHighlights: ['economic collapse narratives', '89k mentions', '4 nations'],
      keywords: [{ label: 'ECON', value: 88 }, { label: 'IMF', value: 72 }, { label: 'CURR', value: 80 }, { label: 'DEBT', value: 65 }, { label: 'AID', value: 50 }],
      topics: [{ rank: '01', title: 'IMF Withdrawal Hoax', count: '26.3k', up: true }, { rank: '02', title: 'Currency Devaluation Fake', count: '15.7k', up: true }, { rank: '03', title: 'Debt Crisis Claims', count: '8.1k', up: false }],
      fastKeywords: ['IMF', 'Currency', 'Debt', 'Collapse', 'Aid', 'Sanctions'],
      activeKeyword: 'IMF',
      virality: [{ tag: '#IMFHoaxAfrica', pct: 87, color: 'bg-blue-600' }, { tag: '#CurrencyFake', pct: 70, color: 'bg-blue-500' }, { tag: '#DebtCrisis', pct: 51, color: 'bg-blue-400' }],
    },
  },
  'Americas': {
    '24h': {
      zoneStats: [
        { zone: 'AMERICAS_ZONE',                label: 'HIGH',     color: 'text-orange-400', pct: '69%', pctBg: 'bg-orange-500' },
        { zone: 'EUROPE_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '14%', pctBg: 'bg-green-500' },
        { zone: 'AFRICA_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '21%', pctBg: 'bg-green-500' },
      ],
      brief: '"In the last 6 hours, election fraud claims surged 33% across the Americas with 54k mentions. Bot networks active in 6 states spreading fabricated voting data."',
      briefHighlights: ['election fraud claims', '33%', '54k mentions'],
      keywords: [{ label: 'ELECT', value: 88 }, { label: 'VOTE', value: 75 }, { label: 'BOT', value: 65 }, { label: 'FRAUD', value: 90 }, { label: 'MEDIA', value: 55 }],
      topics: [{ rank: '01', title: 'Voting Machine Hack Claims', count: '12.4k', up: true }, { rank: '02', title: 'Ballot Stuffing Videos', count: '7.8k', up: true }, { rank: '03', title: 'Election Official Threats', count: '3.9k', up: false }],
      fastKeywords: ['Election', 'Ballot', 'Bot Network', 'Fraud', 'Voting', 'Swing State'],
      activeKeyword: 'Election',
      virality: [{ tag: '#ElectionFraud2024', pct: 90, color: 'bg-blue-600' }, { tag: '#BallotFake', pct: 72, color: 'bg-blue-500' }, { tag: '#VotingHack', pct: 55, color: 'bg-blue-400' }],
    },
    '7d': {
      zoneStats: [
        { zone: 'AMERICAS_ZONE',                label: 'CRITICAL', color: 'text-red-400',    pct: '82%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '31%', pctBg: 'bg-yellow-500' },
        { zone: 'AFRICA_ZONE',                  label: 'LOW',      color: 'text-green-400',  pct: '18%', pctBg: 'bg-green-500' },
      ],
      brief: '"Over 7 days, gun control misinformation dominated US platforms by 51%. Fabricated statistics from fake research institutes shared 2.1M times."',
      briefHighlights: ['gun control misinformation', '51%', '2.1M times'],
      keywords: [{ label: 'GUNS', value: 90 }, { label: 'LAW', value: 68 }, { label: 'POL', value: 75 }, { label: 'STATS', value: 82 }, { label: 'MEDIA', value: 60 }],
      topics: [{ rank: '01', title: 'Fake Gun Stats', count: '19.3k', up: true }, { rank: '02', title: 'Second Amendment Hoax', count: '11.2k', up: false }, { rank: '03', title: 'Police Data Fabrication', count: '6.4k', up: true }],
      fastKeywords: ['Gun Control', 'Second Amendment', 'Police', 'Statistics', 'Legislation', 'NRA'],
      activeKeyword: 'Gun Control',
      virality: [{ tag: '#GunStatsFake', pct: 86, color: 'bg-blue-600' }, { tag: '#2AFake', pct: 68, color: 'bg-blue-500' }, { tag: '#PoliceFabric', pct: 50, color: 'bg-blue-400' }],
    },
    '30d': {
      zoneStats: [
        { zone: 'AMERICAS_ZONE',                label: 'CRITICAL', color: 'text-red-400',    pct: '90%', pctBg: 'bg-red-500' },
        { zone: 'EUROPE_ZONE',                  label: 'MODERATE', color: 'text-yellow-400', pct: '37%', pctBg: 'bg-yellow-500' },
        { zone: 'AFRICA_ZONE',                  label: 'ELEVATED', color: 'text-orange-400', pct: '53%', pctBg: 'bg-orange-500' },
      ],
      brief: '"This month, immigration misinformation in the Americas reached 98k mentions. False border statistics shared across 8 countries, driving policy debates."',
      briefHighlights: ['immigration misinformation', '98k mentions', '8 countries'],
      keywords: [{ label: 'IMMIG', value: 94 }, { label: 'BORDER', value: 82 }, { label: 'POL', value: 70 }, { label: 'STATS', value: 78 }, { label: 'MEDIA', value: 62 }],
      topics: [{ rank: '01', title: 'Border Crisis Fabrication', count: '32.7k', up: true }, { rank: '02', title: 'Immigration Stats Hoax', count: '18.4k', up: true }, { rank: '03', title: 'Cartel Invasion Claims', count: '9.2k', up: false }],
      fastKeywords: ['Immigration', 'Border', 'Cartel', 'Statistics', 'Policy', 'Deportation'],
      activeKeyword: 'Immigration',
      virality: [{ tag: '#BorderCrisisFake', pct: 92, color: 'bg-blue-600' }, { tag: '#ImmigrationHoax', pct: 75, color: 'bg-blue-500' }, { tag: '#CartelFake', pct: 58, color: 'bg-blue-400' }],
    },
  },
}

function BarChart({ bars }) {
  const max = Math.max(...bars.map(b => b.value))
  const [hovered, setHovered] = useState(null)
  return (
    <div className="flex items-end gap-3 h-44 pt-4">
      {bars.map((b, i) => {
        const isMax = b.value === max
        const isHovered = hovered === i
        const heightPct = (b.value / max) * 100
        return (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end relative"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {/* Tooltip on hover */}
            {isHovered && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10">
                {b.value}%
              </div>
            )}
            <div
              className="w-full rounded-t-xl transition-all duration-500 cursor-pointer"
              style={{
                height: `${heightPct}%`,
                minHeight: '8px',
                background: isMax ? '#2563EB' : isHovered ? '#3B82F6' : '#BFDBFE',
                boxShadow: isMax ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
              }}
            />
            <span className="text-[11px] text-gray-400 font-medium tracking-wide">{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function MapCanvas({ timeRange, selectedRegion, onRegionClick, zoneStats = [] }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const animRef = useRef(null)
  const pulseRef = useRef(0)

  const multiplier = { '24h': 1, '7d': 1.4, '30d': 1.8 }[timeRange] || 1

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imgLoaded) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)

    // رسم overlay للمنطقة المختارة
    if (selectedRegion && selectedRegion !== 'Global Region') {
      const z = REGION_ZONES[selectedRegion]
      ctx.fillStyle = 'rgba(37, 99, 235, 0.15)'
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(z.x * W, z.y * H, z.w * W, z.h * H, 8)
      ctx.fill()
      ctx.stroke()
    }

    // رسم النقاط
    const pulse = Math.sin(pulseRef.current) * 0.3 + 0.7
    BASE_POINTS.forEach(p => {
      const px = p.x * W
      const py = p.y * H
      const r = (p.type === 'critical' ? 6 : p.type === 'elevated' ? 5 : 4) * multiplier
      const color = POINT_COLORS[p.type]
      const isActive = !selectedRegion || selectedRegion === 'Global Region' || p.region === selectedRegion

      // حلقة نابضة
      if (p.type === 'critical' && isActive) {
        ctx.beginPath()
        ctx.arc(px, py, r * (1.5 + pulse), 0, Math.PI * 2)
        ctx.fillStyle = color + '30'
        ctx.fill()
      }

      // النقطة الأساسية
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fillStyle = isActive ? color : color + '40'
      ctx.fill()
    })
  }, [imgLoaded, timeRange, selectedRegion, multiplier])

  useEffect(() => {
    const animate = () => {
      pulseRef.current += 0.05
      drawMap()
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [drawMap])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / rect.width
    const my = (e.clientY - rect.top) / rect.height

    // فحص أي منطقة فيها الماوس
    let found = null
    Object.entries(REGION_ZONES).forEach(([name, z]) => {
      if (name === 'Global Region') return
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        found = name
      }
    })
    setHoveredRegion(found)
    if (found) {
      const z = REGION_ZONES[found]
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        ...z,
        name: found,
      })
    } else {
      setTooltip(null)
    }
  }

  const handleClick = (e) => {
    if (hoveredRegion) onRegionClick(hoveredRegion)
  }

  const handleMouseLeave = () => {
    setTooltip(null)
    setHoveredRegion(null)
  }

  return (
    <div className="relative w-full" style={{ height: '340px' }}>
      <img
        ref={imgRef}
        src="/src/assets/background/Container.png"
        alt=""
        className="hidden"
        onLoad={() => setImgLoaded(true)}
      />
      <canvas
        ref={canvasRef}
        width={1200}
        height={340}
        className="w-full h-full rounded-2xl cursor-crosshair"
        style={{ display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-20 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-2xl min-w-[200px]"
          style={{ left: Math.min(tooltip.x + 16, 700), top: Math.max(tooltip.y - 80, 10) }}>
          <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-1">REGION FOCUS: {tooltip.label}</p>
          <p className="text-sm font-bold text-gray-900 mb-2">Top Topic: {tooltip.topic}</p>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">{tooltip.mentions}</p>
              <p className="text-xs text-gray-400">MENTIONS</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg ml-auto">{tooltip.growth}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/60 px-4 py-2 rounded-lg text-xs">
        <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-red-500" /> CRITICAL</span>
        <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-yellow-400" /> ELEVATED</span>
        <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-green-500" /> NORMAL</span>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-white font-bold text-lg">
        <Globe size={20} /> Geographical Density of Misinformation
      </div>

      {/* Zone bars — تتغير حسب المنطقة والوقت */}
      {zoneStats && zoneStats.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 rounded-b-2xl overflow-hidden">
          {zoneStats.map(z => (
            <div key={z.zone} className="bg-black/70 p-3">
              <p className="text-[9px] text-gray-400 tracking-wide mb-1">{z.zone}</p>
              <div className="flex items-center justify-between">
                <span className={`${z.color} font-bold text-sm`}>{z.label}</span>
                <span className={`text-xs text-white ${z.pctBg} px-2 py-0.5 rounded font-bold`}>{z.pct}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TrendingNews() {
  const [searchQuery, setSearchQuery] = useState('')
  const [region, setRegion] = useState('Global Region')
  const [timeRange, setTimeRange] = useState('24h')
  const [showRegionMenu, setShowRegionMenu] = useState(false)
  const [activeKeyword, setActiveKeyword] = useState('Cybersecurity')
  const [showReport, setShowReport] = useState(false)

  const d = (DATA[region] || DATA['Global Region'])[timeRange]

  const filteredTopics = searchQuery ? d.topics.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())) : d.topics
  const filteredKeywords = searchQuery ? d.fastKeywords.filter(k => k.toLowerCase().includes(searchQuery.toLowerCase())) : d.fastKeywords
  const filteredVirality = searchQuery ? d.virality.filter(v => v.tag.toLowerCase().includes(searchQuery.toLowerCase())) : d.virality

  const highlightText = (text, highlights) => {
    let parts = [{ text, highlight: false }]
    highlights.forEach(h => {
      parts = parts.flatMap(p => {
        if (p.highlight) return [p]
        const idx = p.text.toLowerCase().indexOf(h.toLowerCase())
        if (idx === -1) return [p]
        return [
          { text: p.text.slice(0, idx), highlight: false },
          { text: p.text.slice(idx, idx + h.length), highlight: true },
          { text: p.text.slice(idx + h.length), highlight: false },
        ]
      })
    })
    return parts
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]" dir="ltr">
      <Sidebar />
      <main className="flex-1 px-8 py-6">

        {/* Topbar */}
        <div className="flex items-center justify-between gap-6 mb-6">
          <div className="relative flex-1 max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics, keywords, hashtags..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-blue-600 transition">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-gray-500 tracking-widest">LIVE MONITORING</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">News Trends</h1>
            <p className="text-gray-500 text-sm mt-1">Track how information spreads across regions in real time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowRegionMenu(!showRegionMenu)}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition">
                <Globe size={16} /> {region} <ChevronDown size={15} />
              </button>
              {showRegionMenu && (
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48">
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => { setRegion(r); setShowRegionMenu(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${region === r ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
              {TIME_RANGES.map(t => (
                <button key={t} onClick={() => setTimeRange(t)}
                  className={`px-4 py-2.5 text-sm font-semibold transition ${timeRange === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="bg-[#0a0e1a] rounded-3xl mb-6 overflow-hidden">
          <MapCanvas
            timeRange={timeRange}
            selectedRegion={region}
            onRegionClick={(r) => setRegion(r)}
            zoneStats={d.zoneStats}
          />
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-5">
            {/* Analyst Brief */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                <span className="text-blue-600">✦</span> Analyst Brief
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {highlightText(d.brief, d.briefHighlights).map((part, i) =>
                  part.highlight
                    ? <span key={i} className={part.text.match(/\d+%/) ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>{part.text}</span>
                    : <span key={i}>{part.text}</span>
                )}
              </p>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-gray-900 text-sm">Keyword Freq</span>
                <BarChart2 size={18} className="text-gray-400" />
              </div>
              <BarChart bars={d.keywords} />
            </div>
          </div>

          {/* Trend Insights */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
            <p className="font-bold text-gray-900">Trend Insights Panel</p>

            <div>
              <p className="text-xs font-bold text-gray-500 tracking-wide mb-3">Top Trending Topics</p>
              <div className="flex flex-col gap-3">
                {filteredTopics.length === 0
                  ? <p className="text-sm text-gray-400">No results.</p>
                  : filteredTopics.map(t => (
                    <div key={t.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-6">{t.rank}</span>
                        <span className="text-sm font-medium text-gray-800">{t.title}</span>
                      </div>
                      <span className={`flex items-center gap-1 text-sm font-bold ${t.up ? 'text-green-600' : 'text-red-500'}`}>
                        {t.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {t.count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 tracking-wide mb-3">Fastest Growing Keywords</p>
              <div className="flex flex-wrap gap-2">
                {filteredKeywords.map(k => (
                  <button key={k} onClick={() => setActiveKeyword(activeKeyword === k ? null : k)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${activeKeyword === k ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-3">VIRALITY SCORE</p>
              <div className="flex flex-col gap-4">
                {filteredVirality.map(v => (
                  <div key={v.tag}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{v.tag}</span>
                      <span className="font-bold text-blue-600">{v.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${v.color} rounded-full transition-all duration-500`} style={{ width: `${v.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setShowReport(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold py-3 rounded-xl text-sm mt-auto">
              View Full Report
            </button>
          </div>
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowReport(false)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-7 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Full Report — {timeRange} | {region}</h2>
                <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
              </div>
              <div className="p-7 flex flex-col gap-6">
                <div className="bg-blue-50 rounded-2xl p-5">
                  <p className="font-bold text-blue-900 mb-2">Analyst Summary</p>
                  <p className="text-blue-800 text-sm leading-relaxed">{d.brief}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-3">Top Trending Topics</p>
                  {d.topics.map(t => (
                    <div key={t.rank} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400">{t.rank}</span>
                        <span className="font-medium text-gray-800">{t.title}</span>
                      </div>
                      <span className={`flex items-center gap-1 font-bold ${t.up ? 'text-green-600' : 'text-red-500'}`}>
                        {t.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {t.count}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-3">Virality Scores</p>
                  {d.virality.map(v => (
                    <div key={v.tag} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{v.tag}</span>
                        <span className="font-bold text-blue-600">{v.pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${v.color} rounded-full`} style={{ width: `${v.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
                  {/* TODO: BACKEND — detailed source analysis */}
                  Detailed source analysis available after backend integration.
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default TrendingNews