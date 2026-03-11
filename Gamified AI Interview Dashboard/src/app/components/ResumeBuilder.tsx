import React, { useMemo, useState, useEffect } from 'react';
import { Download, FileText, Sparkles, Target, RotateCcw, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { recordContribution } from '../utils/contributionTracker';

type ResumeData = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  targetRole: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
};

const defaultResumeData: ResumeData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  portfolio: '',
  targetRole: '',
  summary: '',
  skills: '',
  experience: '',
  education: '',
  projects: '',
};

const roleKeywordMap: Record<string, string[]> = {
  frontend: ['react', 'javascript', 'typescript', 'css', 'html', 'redux', 'frontend', 'ui', 'accessibility'],
  backend: ['node', 'python', 'java', 'api', 'database', 'sql', 'redis', 'backend', 'microservices'],
  fullstack: ['react', 'node', 'api', 'database', 'typescript', 'full stack', 'frontend', 'backend'],
  data: ['python', 'sql', 'pandas', 'machine learning', 'statistics', 'data analysis'],
  devops: ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'monitoring'],
};

const parseList = (value: string): string[] =>
  value
    .split(/\n|,/) 
    .map((item) => item.trim())
    .filter(Boolean);

const wordCount = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const hasNumberOrMetric = (text: string): boolean => /\d|%|x|k\b|m\b|million|ms|sec|hours?/i.test(text);

const getRoleKeywords = (targetRole: string): string[] => {
  const normalized = targetRole.toLowerCase();
  for (const [key, words] of Object.entries(roleKeywordMap)) {
    if (normalized.includes(key)) return words;
  }
  return ['communication', 'problem solving', 'teamwork', 'projects', 'impact'];
};

const getATSAnalysis = (data: ResumeData) => {
  let score = 0;
  const tips: string[] = [];

  const requiredFields = [
    data.fullName,
    data.email,
    data.phone,
    data.summary,
    data.skills,
    data.experience,
    data.education,
  ];
  const completedRequired = requiredFields.filter(Boolean).length;
  const completenessScore = Math.round((completedRequired / requiredFields.length) * 40);
  score += completenessScore;
  if (completedRequired < requiredFields.length) {
    tips.push('Complete all core resume sections (contact, summary, skills, experience, education).');
  }

  const skills = parseList(data.skills).map((s) => s.toLowerCase());
  const roleKeywords = getRoleKeywords(data.targetRole);
  const keywordMatches = roleKeywords.filter((k) => skills.some((s) => s.includes(k)));
  const keywordScore = Math.round((Math.min(keywordMatches.length, 6) / 6) * 20);
  score += keywordScore;
  if (keywordMatches.length < 4) {
    tips.push('Add more role-relevant keywords in Skills to improve ATS matching.');
  }

  const experienceLines = parseList(data.experience);
  const quantifiedLines = experienceLines.filter((line) => hasNumberOrMetric(line));
  const achievementScore = Math.round((Math.min(quantifiedLines.length, 4) / 4) * 20);
  score += achievementScore;
  if (quantifiedLines.length < 2) {
    tips.push('Use quantified achievements in Experience (for example, percentages, time saved, users impacted).');
  }

  const summaryWords = wordCount(data.summary);
  const skillsCount = parseList(data.skills).length;
  let formatScore = 0;
  if (summaryWords >= 30 && summaryWords <= 120) formatScore += 10;
  if (skillsCount >= 6) formatScore += 10;
  score += formatScore;
  if (summaryWords < 30) tips.push('Expand your professional summary to 30-120 words with role-specific strengths.');
  if (skillsCount < 6) tips.push('Add at least 6 well-targeted skills for stronger ATS relevance.');

  if (!data.projects.trim()) {
    tips.push('Add 1-2 projects with tech stack and outcomes to strengthen interview readiness.');
  }

  if (tips.length === 0) {
    tips.push('Strong resume baseline. Tailor each resume version to the exact job description before applying.');
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  return {
    score: boundedScore,
    tips,
    grade: boundedScore >= 85 ? 'Excellent' : boundedScore >= 70 ? 'Good' : boundedScore >= 55 ? 'Needs Improvement' : 'Weak',
  };
};

const normalizeImportedData = (raw: Partial<ResumeData>): ResumeData => ({
  ...defaultResumeData,
  ...Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, typeof value === 'string' ? value : ''])
  ),
});

const extractResumeDataFromText = (text: string): ResumeData => {
  const normalizedText = text.replace(/\r/g, '\n');
  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const data: ResumeData = { ...defaultResumeData };
  const socialNoise = /(linkedin|github|leetcode|scaler|portfolio|email|phone|gmail|http|www)/i;
  if (lines.length > 0) {
    const first = lines[0];
    const cleanedFirst = first
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
      .replace(/(\+?\d[\d\s\-()]{7,}\d)/g, '')
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const headerTokens = cleanedFirst.split(/\s+/).filter(Boolean);
    if (headerTokens.length >= 2) {
      data.fullName = headerTokens.slice(0, 2).join(' ');
      if (!data.location && headerTokens.length > 2) {
        const locationTokens: string[] = [];
        for (const token of headerTokens.slice(2)) {
          if (/\d|@/.test(token) || socialNoise.test(token)) break;
          locationTokens.push(token);
        }
        if (locationTokens.length > 0) {
          data.location = locationTokens.join(' ');
        }
      }
    } else {
      data.fullName = cleanedFirst;
    }
  }

  const emailMatch = normalizedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) data.email = emailMatch[0];

  const phoneMatch = normalizedText.match(/(\+?\d[\d\s\-()]{7,}\d)/);
  if (phoneMatch) data.phone = phoneMatch[0];

  const linkedinMatch = normalizedText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)]+/i);
  if (linkedinMatch) data.linkedin = linkedinMatch[0];

  const portfolioMatch = normalizedText.match(/https?:\/\/[^\s)]+/i);
  if (portfolioMatch) data.portfolio = portfolioMatch[0];

  if (data.linkedin && !/^https?:\/\//i.test(data.linkedin)) {
    data.linkedin = `https://${data.linkedin}`;
  }
  if (data.portfolio && !/^https?:\/\//i.test(data.portfolio)) {
    data.portfolio = `https://${data.portfolio}`;
  }

  const targetRoleMatch = normalizedText.match(
    /(frontend developer|backend developer|full stack developer|software engineer|data analyst|data scientist|devops engineer)/i
  );
  if (targetRoleMatch) {
    data.targetRole = targetRoleMatch[1];
  }

  const sectionLabels: Array<{ key: keyof ResumeData; labels: string[] }> = [
    { key: 'summary', labels: ['professional summary', 'summary', 'profile'] },
    { key: 'skills', labels: ['skills', 'technical skills', 'core skills'] },
    { key: 'experience', labels: ['experience', 'work experience', 'professional experience'] },
    { key: 'projects', labels: ['projects', 'project experience'] },
    { key: 'education', labels: ['education', 'academic background'] },
  ];

  const isHeadingLine = (line: string, labels: string[]) => {
    const compact = line.toLowerCase().replace(/[^a-z\s:]/g, '').trim();
    return labels.some((label) => compact === label || compact === `${label}:`);
  };

  const headingIndexes: Array<{ key: keyof ResumeData; idx: number }> = [];
  lines.forEach((line, idx) => {
    for (const section of sectionLabels) {
      if (isHeadingLine(line, section.labels)) {
        headingIndexes.push({ key: section.key, idx });
        break;
      }
    }
  });

  headingIndexes.sort((a, b) => a.idx - b.idx);
  headingIndexes.forEach((entry, i) => {
    const start = entry.idx + 1;
    const end = i < headingIndexes.length - 1 ? headingIndexes[i + 1].idx : lines.length;
    const content = lines.slice(start, end).join('\n').trim();
    if (content && !data[entry.key]) {
      data[entry.key] = content;
    }
  });

  const getInlineSection = (labels: string[]) => {
    for (const label of labels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, 'i');
      const match = normalizedText.match(re);
      if (match?.[1]) return match[1].trim();
    }
    return '';
  };

  const getLabeledSection = (labels: string[], stopLabels: string[]) => {
    for (const label of labels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const stop = stopLabels.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const re = new RegExp(
        `${escaped}\\s*:?\\s*([\\s\\S]{15,1200}?)(?=\\b(?:${stop})\\b\\s*:?|$)`,
        'i'
      );
      const match = normalizedText.match(re);
      if (match?.[1]) {
        return match[1].replace(/\s{2,}/g, ' ').trim();
      }
    }
    return '';
  };

  const compactText = normalizedText.replace(/\s+/g, ' ').trim();

  if (!data.summary) data.summary = getInlineSection(['professional summary', 'summary', 'profile']);
  if (!data.skills) data.skills = getInlineSection(['technical skills', 'skills']);
  if (!data.experience) data.experience = getInlineSection(['work experience', 'experience']);
  if (!data.projects) data.projects = getInlineSection(['projects']);
  if (!data.education) data.education = getInlineSection(['education']);

  if (!data.summary) {
    data.summary = getLabeledSection(
      ['professional summary', 'summary', 'profile', 'objective'],
      ['skills', 'technical skills', 'experience', 'work experience', 'projects', 'education', 'certifications', 'achievements']
    );
  }
  if (!data.experience) {
    data.experience = getLabeledSection(
      ['experience', 'work experience', 'professional experience', 'internship', 'internships'],
      ['projects', 'education', 'skills', 'technical skills', 'certifications', 'achievements']
    );
  }
  if (!data.projects) {
    data.projects = getLabeledSection(
      ['projects', 'project experience'],
      ['education', 'experience', 'skills', 'technical skills', 'certifications', 'achievements']
    );
  }
  if (!data.education) {
    data.education = getLabeledSection(
      ['education', 'academic background'],
      ['projects', 'experience', 'skills', 'technical skills', 'certifications', 'achievements']
    );
  }

  if (!data.projects) {
    const projectLines = lines.filter((line) =>
      /(project|portfolio|developed|built|implemented|deployed)/i.test(line) &&
      !/(linkedin|github|leetcode|scaler|http)/i.test(line)
    );
    if (projectLines.length > 0) {
      data.projects = projectLines.slice(0, 5).join('\n');
    }
  }

  if (!data.education) {
    const educationLines = lines.filter((line) =>
      /(b\.?tech|bachelor|master|university|college|cgpa|gpa|school|graduat)/i.test(line)
    );
    if (educationLines.length > 0) {
      data.education = educationLines.slice(0, 6).join('\n');
    }
  }

  if (!data.summary) {
    const compactSummaryMatch = compactText.match(
      /(professional summary|summary|profile|objective)\s*:?\s*(.{40,700}?)(?=\b(skills|technical skills|experience|projects|education|certifications|achievements)\b|$)/i
    );
    if (compactSummaryMatch?.[2]) {
      data.summary = compactSummaryMatch[2].replace(/\s{2,}/g, ' ').trim();
    }
  }

  if (!data.summary) {
    const summaryCandidates = lines
      .filter((line) =>
        line.length > 30 &&
        !/(linkedin|github|leetcode|scaler|http|skills|experience|projects|education)/i.test(line)
      )
      .slice(0, 3)
      .join(' ');
    data.summary = summaryCandidates.slice(0, 500);
  }

  if (!data.summary) {
    const sentenceCandidates = compactText
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) =>
        sentence.length >= 45 &&
        sentence.length <= 220 &&
        !/(linkedin|github|leetcode|http|@|btech|cgpa|gpa)/i.test(sentence)
      )
      .slice(0, 2)
      .join(' ');
    data.summary = sentenceCandidates.slice(0, 500);
  }

  if (!data.skills) {
    const skillKeywords = [
      'react', 'javascript', 'typescript', 'node', 'express', 'mongodb', 'sql', 'python',
      'java', 'c++', 'html', 'css', 'redux', 'next.js', 'aws', 'docker', 'kubernetes',
      'system design', 'data structures', 'algorithms', 'git'
    ];
    const lower = normalizedText.toLowerCase();
    const found = skillKeywords.filter((k) => lower.includes(k));
    if (found.length > 0) {
      data.skills = found.join(', ');
    }
  }

  if (!data.experience) {
    const experienceLines = lines.filter((line) =>
      (
        /\b(20\d{2}|19\d{2}|present)\b/i.test(line) ||
        /\b(intern|engineer|developer|associate|analyst|software)\b/i.test(line) ||
        /\b(implemented|developed|built|designed|optimized|improved|led)\b/i.test(line)
      ) &&
      !/(linkedin|github|leetcode|scaler|http|@)/i.test(line) &&
      line.length > 12
    );
    if (experienceLines.length > 0) {
      data.experience = experienceLines.slice(0, 8).join('\n');
    }
  }

  if (!data.location) {
    const locationLabeled = normalizedText.match(/(?:location|address)\s*:?\s*([A-Za-z\s,.-]{2,60})/i);
    if (locationLabeled?.[1]) {
      data.location = locationLabeled[1].replace(/\s{2,}/g, ' ').trim();
    }
  }

  if (!data.location) {
    const probableLocationLine = lines.find((line) =>
      !/\d|@|https?:\/\/|linkedin|github|leetcode|scaler/i.test(line) &&
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/.test(line) &&
      line.length <= 40
    );
    if (probableLocationLine) {
      data.location = probableLocationLine.replace(/\s{2,}/g, ' ').trim();
    }
  }

  return data;
};

const cleanPdfExtractedText = (text: string): string => {
  const lines = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^%PDF-/i.test(line))
    .filter((line) => !/^\d+\s+\d+\s+obj$/i.test(line))
    .filter((line) => !/^(endobj|stream|endstream|xref|trailer|startxref)$/i.test(line))
    .filter((line) => !/^<<.*>>$/i.test(line))
    .filter((line) => !/^\/[A-Za-z]/.test(line));

  return lines.join('\n');
};

const loadPdfJsLib = async (): Promise<any> => {
  const existing = (window as any).pdfjsLib;
  if (existing) return existing;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PDF parser'));
    document.head.appendChild(script);
  });

  return (window as any).pdfjsLib || null;
};

const extractTextFromPdfFallback = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoded = new TextDecoder('latin1').decode(bytes);

  const uriMatches = Array.from(decoded.matchAll(/\/URI\s*\(([^)]+)\)/g)).map((m) => m[1]);
  const literalMatches = Array.from(decoded.matchAll(/\(([^()]{2,200})\)/g))
    .map((m) => m[1])
    .map((s) => s.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\'))
    .filter((s) => /[A-Za-z]/.test(s))
    .filter((s) => !/^https?:\/\//i.test(s))
    .filter((s) => !/^(Chromium|Skia\/PDF|Normal|Type|Annot|Action)$/i.test(s));

  const merged = [...literalMatches, ...uriMatches].join('\n');
  return cleanPdfExtractedText(merged);
};

const extractLinksFromPdfRaw = async (file: File): Promise<string[]> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoded = new TextDecoder('latin1').decode(bytes);
  const links = Array.from(decoded.matchAll(/(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)>"]*)?/gi))
    .map((m) => m[0])
    .filter((url) => /(linkedin\.com|github\.com|leetcode\.com|vercel\.app|portfolio|scaler\.com)/i.test(url))
    .map((url) => (url.startsWith('http') ? url : `https://${url}`));

  return Array.from(new Set(links));
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const pdfjsLib = await loadPdfJsLib();
    if (!pdfjsLib) {
      return extractTextFromPdfFallback(file);
    }

    const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }

    const typedArray = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    const chunks: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = (content.items || [])
        .map((item: any) => item?.str || '')
        .filter(Boolean)
        .join(' ');
      chunks.push(pageText);
    }

    const merged = cleanPdfExtractedText(chunks.join('\n').trim());
    if (!merged) {
      return extractTextFromPdfFallback(file);
    }
    return merged;
  } catch (error) {
    console.warn('PDF parser unavailable, using fallback extraction.', error);
    return extractTextFromPdfFallback(file);
  }
};

export const ResumeBuilder: React.FC = () => {
  const { user } = useAuth();
  const storageKey = `resume_builder_${user?.id || user?.username || 'guest'}`;

  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [importStatus, setImportStatus] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setResumeData({ ...defaultResumeData, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load saved resume data', error);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(resumeData));
  }, [resumeData, storageKey]);

  const ats = useMemo(() => getATSAnalysis(resumeData), [resumeData]);

  const updateField = (field: keyof ResumeData, value: string) => {
    setResumeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(resumeData.fullName || 'resume').replace(/\s+/g, '_').toLowerCase()}_draft.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordContribution({ resume_actions_count: 1 });
  };

  const handleReset = () => {
    setResumeData(defaultResumeData);
    localStorage.removeItem(storageKey);
    setImportStatus('');
  };

  const handleImportFile = async (file: File) => {
    if (!file) return;
    try {
      const lowerName = file.name.toLowerCase();
      let imported: ResumeData;

      if (lowerName.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        imported = normalizeImportedData(parsed);
      } else if (lowerName.endsWith('.pdf')) {
        const text = await extractTextFromPdf(file);
        const links = await extractLinksFromPdfRaw(file);
        imported = extractResumeDataFromText([text, ...links].join('\n'));
        if (!imported.linkedin) {
          const linkedInFromLinks = links.find((url) => /linkedin\.com\/in\//i.test(url));
          if (linkedInFromLinks) imported.linkedin = linkedInFromLinks;
        }
        if (!imported.portfolio) {
          const portfolioFromLinks = links.find((url) => !/linkedin\.com|github\.com|leetcode\.com|scaler\.com/i.test(url));
          if (portfolioFromLinks) imported.portfolio = portfolioFromLinks;
        }
      } else {
        const text = await file.text();
        imported = extractResumeDataFromText(text);
      }

      setResumeData((prev) => ({ ...prev, ...imported }));
      setImportStatus(`Imported from ${file.name}`);
      recordContribution({ resume_actions_count: 1 });
    } catch (error) {
      console.error('Failed to import resume file:', error);
      setImportStatus('Failed to import file. Supported: JSON, TXT, MD, PDF.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-1">Resume Builder</h1>
          <p className="text-[var(--color-muted-foreground)]">Build your resume, review ATS score, and apply targeted improvements.</p>
        </div>
        <div className="flex gap-2">
          <label className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm inline-flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> Import Resume
            <input
              type="file"
              accept=".json,.txt,.md,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
          <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Draft
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
          {importStatus}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-800 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white inline-flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-400" /> Resume Content</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={resumeData.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Full Name" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            <input value={resumeData.targetRole} onChange={(e) => updateField('targetRole', e.target.value)} placeholder="Target Role (e.g. Frontend Developer)" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            <input value={resumeData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            <input value={resumeData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Phone" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            <input value={resumeData.location} onChange={(e) => updateField('location', e.target.value)} placeholder="Location" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            <input value={resumeData.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} placeholder="LinkedIn URL" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          </div>

          <textarea value={resumeData.summary} onChange={(e) => updateField('summary', e.target.value)} placeholder="Professional Summary" rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          <textarea value={resumeData.skills} onChange={(e) => updateField('skills', e.target.value)} placeholder="Skills (comma or newline separated)" rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          <textarea value={resumeData.experience} onChange={(e) => updateField('experience', e.target.value)} placeholder="Experience bullets (one per line, include metrics where possible)" rows={6} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          <textarea value={resumeData.projects} onChange={(e) => updateField('projects', e.target.value)} placeholder="Projects (one per line)" rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          <textarea value={resumeData.education} onChange={(e) => updateField('education', e.target.value)} placeholder="Education" rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white inline-flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-emerald-400" /> ATS Score</h2>
            <div className="text-4xl font-bold text-white mb-2">{ats.score}<span className="text-slate-400 text-lg">/100</span></div>
            <div className="text-sm text-emerald-300 mb-3">{ats.grade}</div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${ats.score}%` }} />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white inline-flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-indigo-400" /> Improvement Tips</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {ats.tips.map((tip, idx) => (
                <li key={idx} className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2">{tip}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Live Resume Snapshot</h2>
            <div className="text-sm text-slate-300 space-y-2">
              <p><span className="text-slate-400">Name:</span> {resumeData.fullName || '-'}</p>
              <p><span className="text-slate-400">Role:</span> {resumeData.targetRole || '-'}</p>
              <p><span className="text-slate-400">Skills:</span> {parseList(resumeData.skills).slice(0, 6).join(', ') || '-'}</p>
              <p><span className="text-slate-400">Summary Words:</span> {wordCount(resumeData.summary)}</p>
              <p><span className="text-slate-400">Experience Bullets:</span> {parseList(resumeData.experience).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
