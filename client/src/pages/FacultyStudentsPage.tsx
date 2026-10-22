import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, Users, Plus, Upload, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppBackButton } from '../components/AppBackButton';
import { ThemeToggle } from '../components/ThemeToggle';

interface Student {
  id: string;
  name: string;
  email: string;
  registerNumber: string;
  department: string | null;
  year: number | null;
  section: string | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export const FacultyStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Panel State
  const [activePanel, setActivePanel] = useState<'LIST' | 'BULK' | 'SINGLE'>('LIST');

  // Bulk Enrollment State
  const [prefix, setPrefix] = useState('8115U23CS');
  const [startNum, setStartNum] = useState<number>(1);
  const [endNum, setEndNum] = useState<number>(5);
  const [preview, setPreview] = useState<{ registerNumber: string; status: 'NEW' | 'EXISTING' }[] | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<{ requested: number, created: number, skipped: number } | null>(null);

  // Single Enrollment State
  const [singleName, setSingleName] = useState('');
  const [singleRegNo, setSingleRegNo] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState('');
  const [singleSuccess, setSingleSuccess] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/faculty/students', { params: { search } });
      setStudents(res.data.students);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activePanel === 'LIST') fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, activePanel]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    setBulkResult(null);
    setBulkLoading(true);
    try {
      const res = await api.post('/faculty/students/bulk/preview', {
        prefix, start: Number(startNum), end: Number(endNum)
      });
      setPreview(res.data.preview);
    } catch (err: any) {
      setBulkError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Preview failed');
      setPreview(null);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCreateBulk = async () => {
    setBulkError('');
    setBulkLoading(true);
    try {
      const res = await api.post('/faculty/students/bulk', {
        prefix, start: Number(startNum), end: Number(endNum)
      });
      setBulkResult(res.data.summary);
      setPreview(null);
      fetchStudents(); // Refresh the list
    } catch (err: any) {
      setBulkError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Bulk creation failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError('');
    setSingleSuccess('');
    setSingleLoading(true);
    try {
      await api.post('/faculty/students', {
        name: singleName,
        registerNumber: singleRegNo
      });
      setSingleSuccess(`Student ${singleName} created successfully.`);
      setSingleName('');
      setSingleRegNo('');
      fetchStudents();
    } catch (err: any) {
      setSingleError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Student creation failed');
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <AppBackButton fallbackPath="/faculty/dashboard" label="Dashboard" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="mr-3 text-indigo-600" /> Student Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View, search, and enroll students.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setActivePanel(activePanel === 'SINGLE' ? 'LIST' : 'SINGLE'); setSingleError(''); setSingleSuccess(''); }}
              className={`flex items-center px-4 py-2 rounded-md font-medium ${activePanel === 'SINGLE' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <Plus className="w-4 h-4 mr-2" /> Single Enrollment
            </button>
            <button 
              onClick={() => { setActivePanel(activePanel === 'BULK' ? 'LIST' : 'BULK'); setBulkResult(null); setPreview(null); }}
              className={`flex items-center px-4 py-2 rounded-md font-medium ${activePanel === 'BULK' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              <Upload className="w-4 h-4 mr-2" /> Bulk Enrollment
            </button>
            <ThemeToggle />
          </div>
        </div>

        {activePanel === 'SINGLE' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Add Single Student</h2>
            <form onSubmit={handleCreateSingle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" required value={singleName} onChange={e => setSingleName(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Register Number</label>
                <input type="text" required value={singleRegNo} onChange={e => setSingleRegNo(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
              </div>
              
              {singleError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{singleError}</div>}
              {singleSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{singleSuccess}</div>}
              
              <div className="pt-4">
                <button type="submit" disabled={singleLoading} className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {singleLoading ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activePanel === 'BULK' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bulk Student Enrollment</h2>
            
            {bulkResult ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-green-900">Bulk Enrollment Complete</h3>
                <div className="mt-4 flex justify-center space-x-8 text-sm">
                  <div className="flex flex-col"><span className="text-gray-500 dark:text-gray-400">Requested</span><span className="text-xl font-semibold text-gray-900 dark:text-white">{bulkResult.requested}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500 dark:text-gray-400">Created</span><span className="text-xl font-semibold text-green-600">{bulkResult.created}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500 dark:text-gray-400">Skipped</span><span className="text-xl font-semibold text-orange-500">{bulkResult.skipped}</span></div>
                </div>
                <button onClick={() => { setBulkResult(null); setActivePanel('LIST'); }} className="mt-6 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-900">Back to Students</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <form onSubmit={handlePreview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Register Prefix</label>
                      <input type="text" required value={prefix} onChange={e => setPrefix(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm" placeholder="e.g. 8115U23CS" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Range</label>
                        <input type="number" min="0" required value={startNum} onChange={e => setStartNum(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Range</label>
                        <input type="number" min="0" required value={endNum} onChange={e => setEndNum(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                      </div>
                    </div>
                    {bulkError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{bulkError}</div>}
                    <button type="submit" disabled={bulkLoading} className="w-full flex justify-center items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 font-medium disabled:opacity-50">
                      {bulkLoading && !preview ? 'Generating...' : <><Play className="w-4 h-4 mr-2" /> Generate Preview</>}
                    </button>
                  </form>
                </div>
                
                <div>
                  {preview && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col h-[400px]">
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-medium text-gray-900 dark:text-white">Preview ({preview.length} accounts)</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">{preview.filter(p => p.status === 'NEW').length} New</span>
                      </div>
                      <div className="overflow-y-auto flex-1 p-0">
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100">
                            {preview.map((p, idx) => (
                              <tr key={idx} className={p.status === 'EXISTING' ? 'bg-orange-50/30' : ''}>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">{p.registerNumber}</td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {p.status === 'NEW' ? (
                                    <span className="inline-flex items-center text-green-600"><Plus className="w-3 h-3 mr-1"/> NEW</span>
                                  ) : (
                                    <span className="inline-flex items-center text-orange-600"><AlertTriangle className="w-3 h-3 mr-1"/> EXISTING (Skip)</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={handleCreateBulk} disabled={bulkLoading || preview.filter(p => p.status === 'NEW').length === 0} className="w-full flex justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50">
                          {bulkLoading ? 'Creating...' : `Create ${preview.filter(p => p.status === 'NEW').length} Students`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activePanel === 'LIST' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                  placeholder="Search students by name, register number, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Register No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dept/Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading students...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No students found.</td></tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-900">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/faculty/students/${student.id}`} className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 group">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{student.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {student.registerNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.department || '-'} {student.year ? `(Yr ${student.year})` : ''} {student.section ? `[${student.section}]` : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.mustChangePassword ? (
                            <span className="text-orange-600 text-xs font-medium">Pending Setup</span>
                          ) : (
                            <span className="text-green-600 text-xs font-medium">Active</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
