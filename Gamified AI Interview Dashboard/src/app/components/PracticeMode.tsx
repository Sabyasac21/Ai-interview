import React, { useState, useEffect } from 'react';
import { Topic, TopicCard } from './TopicCard';
import { Sparkles } from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';
import { QuestionsListPage } from '../pages/QuestionsListPage';
import { PracticeSessionPage } from '../pages/PracticeSessionPage';

interface PracticeModeProps {
  topics: Topic[];
  /** Called when the app should refresh category/topic data (e.g. after solving a question). */
  onTopicsRefresh?: () => void;
  /** If provided, auto-navigate to this question as a daily challenge */
  initialChallenge?: { questionId: string; topicId: string } | null;
  /** If provided, open the topic questions list directly */
  initialTopicId?: string | null;
  /** Called after the user completes the daily challenge */
  onChallengeConsumed?: () => void;
  /** Called after dashboard topic navigation is consumed */
  onInitialTopicConsumed?: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  topics,
  onTopicsRefresh,
  initialChallenge,
  initialTopicId,
  onChallengeConsumed,
  onInitialTopicConsumed,
}) => {
  const { setShowLayout } = useLayout();
  const [view, setView] = useState<'topics' | 'questions' | 'session'>('topics');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  // Control layout visibility based on current view
  useEffect(() => {
    if (view === 'questions' || view === 'session') {
      setShowLayout(false);
    } else {
      setShowLayout(true);
    }

    return () => {
      setShowLayout(true);
    };
  }, [view, setShowLayout]);

  // Auto-navigate to daily challenge if provided
  useEffect(() => {
    if (initialChallenge) {
      setSelectedTopic(initialChallenge.topicId);
      setSelectedQuestion(initialChallenge.questionId);
      setView('session');
    }
  }, [initialChallenge]);

  useEffect(() => {
    if (initialChallenge) return;
    if (!initialTopicId) return;

    setSelectedTopic(initialTopicId);
    setSelectedQuestion(null);
    setView('questions');
    if (onInitialTopicConsumed) onInitialTopicConsumed();
  }, [initialTopicId, initialChallenge, onInitialTopicConsumed]);

  const handleTopicStart = (topicId: string) => {
    setSelectedTopic(topicId);
    setView('questions');
    // also refresh counts when entering questions list
    if (onTopicsRefresh) onTopicsRefresh();
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestion(questionId);
    setView('session');
  };

  const handleBackToTopics = () => {
    setView('topics');
    setSelectedTopic(null);
    setSelectedQuestion(null);
    if (onChallengeConsumed) onChallengeConsumed();
    if (onTopicsRefresh) onTopicsRefresh();
  };

  const handleBackToQuestions = () => {
    setView('questions');
    setSelectedQuestion(null);
  };

  // when we switch back to the topics grid make sure the parent has an
  // opportunity to refresh counts; this covers the case where the user solved
  // questions but stayed in the practice flow without flipping tabs.
  useEffect(() => {
    if (view === 'topics' && onTopicsRefresh) {
      onTopicsRefresh();
    }
  }, [view, onTopicsRefresh]);

  if (view === 'session' && selectedQuestion) {
    const handleSessionSuccess = () => {
      if (initialChallenge) {
        if (onChallengeConsumed) onChallengeConsumed();
      }
      if (onTopicsRefresh) onTopicsRefresh();
    };

    return (
      <PracticeSessionPage
        questionId={selectedQuestion}
        onBack={handleBackToQuestions}
        onQuestionChange={setSelectedQuestion}
        onSolveSuccess={handleSessionSuccess}
      />
    );
  }

  if (view === 'questions' && selectedTopic) {
    return (
      <QuestionsListPage
        topic={selectedTopic}
        onBack={handleBackToTopics}
        onQuestionSelect={handleQuestionSelect}
      />
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2 flex items-center gap-3">
          Practice & Skills 
          <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400" />
        </h1>
        <p className="text-[var(--color-muted-foreground)] max-w-2xl">
          Master specific technical domains independently. Your performance in each section contributes to your overall profile strength.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <TopicCard 
            key={topic.id} 
            topic={topic} 
            onStart={handleTopicStart} 
          />
        ))}
      </div>
    </div>
  );
};
