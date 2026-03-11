import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Search, Circle, Loader, CheckCircle } from 'lucide-react';
import { fetchQuestionsByCategory, fetchSolvedQuestions, fetchPracticeHistory } from '../../api/questions';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { QuestionsSkeletonList, FiltersSkeletonLoader } from '../components/SkeletonLoader';
import { DsaStrengthPanel } from '../components/practice/DsaStrengthPanel';
import { computeDsaStrength, DsaQuestionLite } from '../utils/dsaStrength';

interface QuestionsListPageProps {
  topic: string;
  onBack: () => void;
  onQuestionSelect: (questionId: string) => void;
}

interface Question {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  type?: string;
}

export const QuestionsListPage = ({ 
  topic, 
  onBack, 
  onQuestionSelect 
}: QuestionsListPageProps): React.ReactElement => {
  const { token } = useAuth();
  const [topicQuestions, setTopicQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;
  
  // Infinite scroll ref
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'coding' | 'mcq' | 'descriptive' | 'system-design'>('all');
  
  // Track solved questions
  const [solvedQuestionIds, setSolvedQuestionIds] = useState<Set<string>>(new Set());
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);

  // Load more questions
  const loadMoreQuestions = useCallback(async () => {
    if (!token || !hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const response = await fetchQuestionsByCategory(topic, token, {
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        limit: ITEMS_PER_PAGE,
        offset: offset + ITEMS_PER_PAGE,
      });
      
      if (response && response.data) {
        setTopicQuestions((prev: Question[]) => [...prev, ...response.data]);
        setOffset((prev: number) => prev + ITEMS_PER_PAGE);
        setHasMore(response.has_more);
        setTotalCount(response.total);
      }
    } catch (err) {
      console.error('Error loading more questions:', err);
      // Don't show error toast for pagination failures, just silently stop
    } finally {
      setLoadingMore(false);
    }
  }, [token, topic, offset, hasMore, loadingMore, difficultyFilter]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreQuestions();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMoreQuestions]);

  // Initial fetch
  useEffect(() => {
    const loadQuestions = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch questions
        const response = await fetchQuestionsByCategory(topic, token, {
          limit: ITEMS_PER_PAGE,
          offset: 0,
        });
        
        if (response && response.data) {
          setTopicQuestions(response.data);
          setHasMore(response.has_more);
          setTotalCount(response.total);
          setOffset(0);
        }
        
        // Fetch solved questions
        const solved = await fetchSolvedQuestions(topic, token);
        setSolvedQuestionIds(new Set(solved));

        try {
          const history = await fetchPracticeHistory(token, 200);
          setHistoryEntries(Array.isArray(history) ? history : []);
        } catch {
          setHistoryEntries([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch questions';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error loading questions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [topic, token]);

  // utility for highlighting occurrences of the query within a string
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-300 text-black px-0.5 rounded">{part}</span>
      ) : (
        part
      )
    );
  };

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return topicQuestions.filter((q: Question) => {
      const matchesSearch =
        query === '' ||
        q.title.toLowerCase().includes(query) ||
        (q.tags && q.tags.some((tag: string) => tag.toLowerCase().includes(query)));

      const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
      const matchesType = typeFilter === 'all' || q.type === typeFilter;

      return matchesSearch && matchesDifficulty && matchesType;
    });
  }, [topicQuestions, searchQuery, difficultyFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = totalCount || topicQuestions.length;
    const solved = solvedQuestionIds.size;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    
    return { total, solved, attempted: 0, percentage };
  }, [topicQuestions, totalCount, solvedQuestionIds]);

  const dsaStrength = useMemo(() => {
    if (!topicQuestions.length) return [];
    if (topic !== 'data-structures' && topic !== 'dsa') return [];
    const lite: DsaQuestionLite[] = topicQuestions.map((q) => ({
      id: q.id,
      title: q.title,
      tags: q.tags,
    }));
    const scoreByQuestion = new Map<string, number>();
    historyEntries.forEach((entry: any) => {
      const qid = entry?.question_id || entry?.questionId;
      if (!qid) return;
      const score = Number(entry?.score ?? 0);
      if (!Number.isNaN(score)) {
        const prev = scoreByQuestion.get(String(qid));
        if (prev === undefined || score > prev) {
          scoreByQuestion.set(String(qid), score);
        }
      }
    });
    return computeDsaStrength(lite, solvedQuestionIds, scoreByQuestion);
  }, [topicQuestions, topic, solvedQuestionIds, historyEntries]);

  const getTopicName = (topicId: string) => {
    const topicMap: Record<string, string> = {
      'reactjs': 'React.js',
      'react': 'React.js',
      'javascript': 'JavaScript',
      'js': 'JavaScript',
      'data-structures': 'Data Structures',
      'dsa': 'Data Structures',
      'algorithms': 'Algorithms',
      'algo': 'Algorithms',
      'system-design': 'System Design',
      'behavioral': 'Behavioral'
    };
    return topicMap[topicId] || topicId;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getTypeLabel = (type: string | undefined) => {
    const typeMap: Record<string, string> = {
      'coding': 'Code',
      'mcq': 'MCQ',
      'descriptive': 'Text',
      'system-design': 'Design'
    };
    return typeMap[type || ''] || type || 'Question';
  };

  const getStatusIcon = (question: Question) => {
    if (solvedQuestionIds.has(question.id)) {
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
    return <Circle className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
                {getTopicName(topic)} Interview Questions
              </h1>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-[var(--color-muted-foreground)]">
                  <span className="text-[var(--color-foreground)] font-semibold">{stats.total}</span> questions
                </span>
                <span className="text-[var(--color-muted-foreground)]">
                  <span className="text-emerald-400 font-semibold">{stats.solved}</span> solved
                </span>
                <span className="text-[var(--color-muted-foreground)]">
                  <span className="text-yellow-400 font-semibold">{stats.attempted}</span> attempted
                </span>
                <span className="text-[var(--color-muted-foreground)]">
                  <span className="text-indigo-400 font-semibold">{stats.percentage}%</span> completion
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {loading ? (
            <FiltersSkeletonLoader />
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search questions or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="coding">Coding</option>
                <option value="mcq">MCQ</option>
                <option value="descriptive">Descriptive</option>
                <option value="system-design">System Design</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <QuestionsSkeletonList count={6} />
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No questions found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div>
              <div className="space-y-3">
              {filteredQuestions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => onQuestionSelect(question.id)}
                  className="w-full text-left bg-slate-900 border border-slate-800 rounded-lg p-4 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {getStatusIcon(question)}
                    </div>

                    {/* Question Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-base font-semibold text-white mb-1">
                            #{index + 1} {highlightText(question.title, searchQuery)}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {getTypeLabel(question.type)}
                            </span>
                            {question.tags && question.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {question.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                                    {highlightText(tag, searchQuery)}
                                  </span>
                                ))}
                                {question.tags.length > 2 && (
                                  <span className="text-xs text-slate-500">+{question.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Infinite scroll sentinel & loading indicator */}
            <div ref={sentinelRef} className="py-8">
              {loadingMore ? (
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <Loader className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Loading more questions...</p>
                  </div>
                </div>
              ) : !hasMore ? (
                <div className="text-center">
                  <p className="text-slate-500 text-sm">🎉 You've loaded all {totalCount} questions!</p>
                </div>
              ) : null}
            </div>
          </div>

            {(topic === 'data-structures' || topic === 'dsa') && (
              <div className="lg:sticky lg:top-6 max-h-[calc(100vh-140px)] overflow-y-auto overscroll-auto scrollbar-none">
                <DsaStrengthPanel
                  items={dsaStrength}
                  totalSolved={solvedQuestionIds.size}
                  totalQuestions={totalCount || topicQuestions.length}
                />
              </div>
            )}
        </div>
        )}
      </div>
    </div>
  );
};
