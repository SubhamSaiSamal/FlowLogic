import { BookOpen, ChevronRight, ChevronDown, Search, Filter, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLearning } from '../contexts/LearningContext';

const CATEGORIES = ['all', 'fundamentals', 'data', 'algorithms', 'evaluation', 'advanced'] as const;
type Category = typeof CATEGORIES[number];

export function LearnMode() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const navigate = useNavigate();
  const { content, completedTopics, markTopicComplete } = useLearning();
  
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set([content.topics[0]?.id]));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const filteredTopics = useMemo(() => {
    return content.topics.filter(topic => {
      const matchesSearch = searchQuery === '' || 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [content.topics, searchQuery, selectedCategory]);

  const progressPercentage = content.topics.length > 0
    ? (completedTopics.size / content.topics.length) * 100
    : 0;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    content.topics.forEach(topic => {
      const cat = topic.category || 'fundamentals';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [content.topics]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className={`flex items-center gap-2 mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium">Learn Mode</span>
        </div>
        <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Machine Learning Fundamentals
        </h1>
        <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Comprehensive guide to machine learning concepts and algorithms
        </p>
      </div>

      {/* Progress Card */}
      <div className={`p-6 rounded-xl border mb-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Your Learning Progress
            </h3>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {completedTopics.size} of {content.topics.length} topics completed
            </p>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {Math.round(progressPercentage)}%
          </div>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? darkMode
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                {cat !== 'all' && categoryCounts[cat] && (
                  <span className={`ml-2 text-xs ${selectedCategory === cat ? 'opacity-90' : 'opacity-60'}`}>
                    ({categoryCounts[cat]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className={`p-12 rounded-xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No topics found matching your search.
            </p>
          </div>
        ) : (
          filteredTopics.map((topic, index) => (
            <TopicSection
              key={topic.id}
              topic={topic}
              index={index}
              expanded={expandedTopics.has(topic.id)}
              onToggle={() => toggleTopic(topic.id)}
              darkMode={darkMode}
              isCompleted={completedTopics.has(topic.id)}
              onComplete={() => markTopicComplete(topic.id)}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className={`mt-8 p-6 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ready to test your knowledge?</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/quiz')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Take Quiz
          </button>
          <button
            onClick={() => navigate('/visualize')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
          >
            Try Visualizer
          </button>
        </div>
      </div>
    </div>
  );
}

function TopicSection({
  topic,
  index,
  expanded,
  onToggle,
  darkMode,
  isCompleted,
  onComplete,
}: {
  topic: { id: string; title: string; summary: string; content: string; category?: string; estimatedTime?: number };
  index: number;
  expanded: boolean;
  onToggle: () => void;
  darkMode: boolean;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  // Format content: split by paragraphs and highlight key terms
  const paragraphs = topic.content.split('\n\n').filter(p => p.trim());

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${isCompleted ? darkMode ? 'border-green-500/30 bg-green-500/5' : 'border-green-500/30 bg-green-50/50' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-full p-6 flex items-center justify-between transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-start gap-4 flex-1 text-left">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${isCompleted ? 'bg-green-500' : darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {index + 1}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{topic.title}</h3>
              {isCompleted && (
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              )}
            </div>
            <p className={`text-sm mb-2 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {topic.summary}
            </p>
            <div className="flex items-center gap-4 text-xs">
              {topic.category && (
                <span className={`px-2 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  {topic.category}
                </span>
              )}
              {topic.estimatedTime && (
                <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  <Clock className="w-3 h-3" />
                  <span>{topic.estimatedTime} min</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className={`w-5 h-5 flex-shrink-0 ml-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
        ) : (
          <ChevronRight className={`w-5 h-5 flex-shrink-0 ml-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
        )}
      </button>
      
      {expanded && (
        <div className={`px-6 pb-6 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="pt-6 space-y-4">
            {paragraphs.map((para, i) => {
              // Format paragraphs: bold first part before colon
              const parts = para.split(':');
              if (parts.length > 1) {
                return (
                  <div key={i} className="space-y-2">
                    <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                      <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{parts[0]}:</strong>
                      {parts.slice(1).join(':')}
                    </p>
                  </div>
                );
              }
              return (
                <p key={i} className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                  {para}
                </p>
              );
            })}
            
            {!isCompleted && (
              <button
                onClick={onComplete}
                className={`mt-4 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${darkMode ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'}`}
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
