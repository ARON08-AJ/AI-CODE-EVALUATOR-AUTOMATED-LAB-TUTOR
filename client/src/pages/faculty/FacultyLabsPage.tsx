import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Search, BookOpen, Plus, CheckCircle, XCircle, Download } from 'lucide-react';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Tag {
  id: string;
  name: string;
}

interface Lab {
  id: string;
  title: string;
  difficulty: string;
  supportedLanguages: string;
  published: boolean;
  createdAt: string;
  tags?: Tag[];
}

export const FacultyLabsPage: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [published, setPublished] = useState('');
  const [tagId, setTagId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    api.get('/tags').then(res => setAllTags(res.data.tags)).catch(() => {});
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (difficulty) params.difficulty = difficulty;
      if (published) params.published = published;
      if (tagId) params.tagId = tagId;
      
      const res = await api.get('/faculty/labs', { params });
      setLabs(res.data.labs);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err.response?.status === 403) {
        setError("You don't have permission to access this page.");
      } else {
        setError('Unable to load labs. Please try again.');
      }
      console.error('Failed to fetch labs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLabs();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, difficulty, published, tagId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <AppBackButton fallbackPath="/faculty/dashboard" label="Dashboard" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <BookOpen className="mr-3 text-indigo-600 dark:text-indigo-400" /> Lab Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create, edit, and manage your programming labs.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              id="bulk-upload-input"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                  setLoading(true);
                  await api.post('/faculty/labs/bulk-import', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  alert('Bulk import successful!');
                  fetchLabs();
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Bulk import failed');
                } finally {
                  setLoading(false);
                  // Reset input
                  e.target.value = '';
                }
              }}
            />
            <label
              htmlFor="bulk-upload-input"
              className="cursor-pointer flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Import Labs
            </label>
            <input 
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              id="bulk-upload-test-cases-input"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                  setLoading(true);
                  const res = await api.post('/faculty/labs/test-cases/bulk-import', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  setImportResult(res.data.summary);
                  fetchLabs();
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Bulk import of test cases failed');
                } finally {
                  setLoading(false);
                  e.target.value = '';
                }
              }}
            />
            <label
              htmlFor="bulk-upload-test-cases-input"
              className="cursor-pointer flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Import Tests
            </label>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await api.get('/faculty/labs/export', { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'autolab_problems_export.xlsx');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Failed to export problems');
                }
              }}
              className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs font-medium whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Labs
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await api.get('/faculty/labs/test-cases/export', { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'autolab_testcases_export.xlsx');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Failed to export test cases');
                }
              }}
              className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs font-medium whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Tests
            </button>
            <Link 
              to="/faculty/labs/create"
              className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Lab
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                placeholder="Search labs by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="block w-full md:w-44 rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <select
              value={published}
              onChange={(e) => setPublished(e.target.value)}
              className="block w-full md:w-44 rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="block w-full md:w-44 rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Languages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading labs...</td></tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-red-500 dark:text-red-400 mb-2 font-medium">{error}</div>
                      <button 
                        onClick={fetchLabs}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900 transition"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : labs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No labs found.</td></tr>
                ) : (
                  labs.map((lab) => (
                    <tr key={lab.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{lab.title}</div>
                        {lab.tags && lab.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lab.tags.map(t => (
                              <span key={t.id} className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                                {t.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lab.difficulty === 'EASY' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          lab.difficulty === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                          {lab.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {lab.supportedLanguages}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab.published ? (
                          <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle className="w-4 h-4 mr-1" /> Published
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-500 dark:text-gray-400 font-medium">
                            <XCircle className="w-4 h-4 mr-1" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/faculty/labs/${lab.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Import Result</h2>
              <button onClick={() => setImportResult(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Rows</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{importResult.totalRows}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Imported</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{importResult.imported}</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Skipped</div>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{importResult.skipped}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Errors</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{importResult.errors}</div>
                </div>
              </div>
              
              {importResult.skipped > 0 && importResult.skippedDetails?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Skipped (Duplicates)</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg">
                    {importResult.skippedDetails.map((detail: string, i: number) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.errors > 0 && importResult.errorsDetails?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Errors</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                    {importResult.errorsDetails.map((detail: string, i: number) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
              <button
                onClick={() => setImportResult(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
