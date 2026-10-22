import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { Save } from 'lucide-react';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

export const FacultyLabFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [supportedLanguages, setSupportedLanguages] = useState('C,C++,Java,Python');
  const [published, setPublished] = useState(false);
  const [topicId, setTopicId] = useState('');
  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([]);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [tagCreating, setTagCreating] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, tagsRes] = await Promise.all([
          api.get('/topics'),
          api.get('/tags')
        ]);
        setTopics(topicsRes.data.topics);
        setAllTags(tagsRes.data.tags);
        
        if (isEditing) {
          const res = await api.get(`/faculty/labs/${id}`);
          const lab = res.data.lab;
          setTitle(lab.title);
          setDescription(lab.description);
          setConstraints(lab.constraints);
          setSampleInput(lab.sampleInput);
          setSampleOutput(lab.sampleOutput);
          setDifficulty(lab.difficulty);
          setSupportedLanguages(lab.supportedLanguages);
          setPublished(lab.published);
          if (lab.topicId) setTopicId(lab.topicId);
          if (lab.tags) {
            setSelectedTagIds(lab.tags.map((t: any) => t.id));
          }
        }
      } catch (err: any) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      setTagCreating(true);
      const res = await api.post('/tags', { name: newTagName.trim() });
      const createdTag = res.data.tag;
      if (!allTags.some(t => t.id === createdTag.id)) {
        setAllTags(prev => [...prev, createdTag]);
      }
      if (!selectedTagIds.includes(createdTag.id)) {
        setSelectedTagIds(prev => [...prev, createdTag.id]);
      }
      setNewTagName('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create tag');
    } finally {
      setTagCreating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    const payload = {
      title,
      description,
      constraints,
      sampleInput,
      sampleOutput,
      difficulty,
      supportedLanguages,
      published,
      topicId: topicId || null,
      tagIds: selectedTagIds
    };

    try {
      if (isEditing) {
        await api.put(`/faculty/labs/${id}`, payload);
        navigate(`/faculty/labs/${id}`);
      } else {
        const res = await api.post('/faculty/labs', payload);
        navigate(`/faculty/labs/${res.data.lab.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save lab');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AppBackButton fallbackPath="/faculty/labs" label="Labs" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Lab' : 'Create New Lab'}
            </h1>
          </div>
          <ThemeToggle />
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          {error && <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea required rows={5} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Constraints</label>
              <textarea rows={2} value={constraints} onChange={e => setConstraints(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sample Input</label>
                <textarea rows={4} value={sampleInput} onChange={e => setSampleInput(e.target.value)} className="mt-1 block w-full font-mono rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sample Output</label>
                <textarea rows={4} value={sampleOutput} onChange={e => setSampleOutput(e.target.value)} className="mt-1 block w-full font-mono rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supported Languages</label>
                <input type="text" required value={supportedLanguages} onChange={e => setSupportedLanguages(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm" placeholder="e.g. C,C++,Java,Python" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topic</label>
                <select value={topicId} onChange={e => setTopicId(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                  <option value="">-- Select a Topic --</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Problem Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Problem Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {allTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag.name} {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Create new tag (e.g. Dynamic Programming)"
                  className="rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={tagCreating || !newTagName.trim()}
                  className="px-3 py-1.5 bg-gray-800 dark:bg-gray-600 text-white rounded-md text-sm hover:bg-gray-900 dark:hover:bg-gray-500 disabled:opacity-50"
                >
                  {tagCreating ? 'Adding...' : 'Add Tag'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Lab'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
