import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Edit, Trash2, CheckCircle, XCircle, Eye, EyeOff, Plus, Users, Search, UserPlus } from 'lucide-react';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  visibility: string;
}

interface Lab {
  id: string;
  title: string;
  description: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  difficulty: string;
  supportedLanguages: string;
  published: boolean;
  dueDate?: string | null;
  testCases: TestCase[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  registerNumber: string;
}

interface Assignment {
  id: string;
  studentId: string;
  student: Student;
  assignedAt: string;
}

export const FacultyLabDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'testcases' | 'assignments'>('overview');

  // Test case form state
  const [tcInput, setTcInput] = useState('');
  const [tcExpectedOutput, setTcExpectedOutput] = useState('');
  const [tcVisibility, setTcVisibility] = useState('PUBLIC');
  const [addingTc, setAddingTc] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [searchStudents, setSearchStudents] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [assignSummary, setAssignSummary] = useState<{requested: number, created: number, skipped: number} | null>(null);

  // Bulk Assignment State
  const [assignmentMode, setAssignmentMode] = useState<'INDIVIDUAL' | 'BULK'>('INDIVIDUAL');
  const [metadata, setMetadata] = useState<{departments: string[], years: number[], sections: string[]}>({departments: [], years: [], sections: []});
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  const fetchLab = async () => {
    try {
      const res = await api.get(`/faculty/labs/${id}`);
      setLab(res.data.lab);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load lab');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await api.get(`/faculty/labs/${id}/assignments`);
      setAssignments(res.data.assignments);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchLab();
    fetchAssignments();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'assignments' && metadata.departments.length === 0) {
      api.get('/faculty/students/metadata')
        .then(res => setMetadata(res.data))
        .catch(console.error);
    }
  }, [activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        if (assignmentMode === 'INDIVIDUAL' && searchStudents.trim().length > 0) {
          const res = await api.get('/faculty/students', { params: { search: searchStudents.trim() } });
          setSearchResults(res.data.students);
        } else if (assignmentMode === 'BULK') {
          const params: any = {};
          if (deptFilter) params.department = deptFilter;
          if (yearFilter) params.year = yearFilter;
          if (sectionFilter) params.section = sectionFilter;
          
          const res = await api.get('/faculty/students', { params });
          setSearchResults(res.data.students);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchStudents, assignmentMode, deptFilter, yearFilter, sectionFilter]);

  // Clear selections when changing bulk filters
  useEffect(() => {
    if (assignmentMode === 'BULK') {
      setSelectedStudents(new Set());
    }
  }, [deptFilter, yearFilter, sectionFilter, assignmentMode]);

  const handlePublishToggle = async () => {
    if (!lab) return;
    try {
      if (lab.published) {
        await api.patch(`/faculty/labs/${id}/unpublish`);
      } else {
        await api.patch(`/faculty/labs/${id}/publish`);
      }
      fetchLab();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to change publish status');
    }
  };

  const handleDeleteLab = async () => {
    if (!confirm('Are you sure you want to delete this lab? This action cannot be undone.')) return;
    try {
      await api.delete(`/faculty/labs/${id}`);
      navigate('/faculty/labs');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete lab');
    }
  };

  const handleAddTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTc(true);
    try {
      await api.post(`/faculty/labs/${id}/test-cases`, {
        input: tcInput,
        expectedOutput: tcExpectedOutput,
        visibility: tcVisibility
      });
      setTcInput('');
      setTcExpectedOutput('');
      setTcVisibility('PUBLIC');
      fetchLab();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add test case');
    } finally {
      setAddingTc(false);
    }
  };

  const handleDeleteTestCase = async (tcId: string) => {
    if (!confirm('Delete this test case?')) return;
    try {
      await api.delete(`/faculty/test-cases/${tcId}`);
      fetchLab();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete test case');
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.size === 0) return;
    setAssigning(true);
    setAssignSummary(null);
    try {
      const res = await api.post(`/faculty/labs/${id}/assign`, {
        studentIds: Array.from(selectedStudents),
        dueDate: dueDateInput ? new Date(dueDateInput).toISOString() : null
      });
      setAssignSummary(res.data.summary);
      setSelectedStudents(new Set());
      setSearchStudents('');
      fetchLab();
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign students');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateDeadline = async (newDueDate: string | null) => {
    try {
      await api.patch(`/faculty/labs/${id}/assignments/deadline`, {
        dueDate: newDueDate
      });
      fetchLab();
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update deadline');
    }
  };

  const handleUnassignStudent = async (studentId: string) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await api.delete(`/faculty/labs/${id}/assignments/${studentId}`);
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unassign student');
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const next = new Set(selectedStudents);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudents(next);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error || !lab) return <div className="p-8 text-center text-red-500">{error || 'Lab not found'}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
          <div className="flex items-center space-x-4">
            <AppBackButton fallbackPath="/faculty/labs" label="Labs" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                {lab.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lab.difficulty === 'EASY' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' :
                    lab.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                  }`}>
                    {lab.difficulty}
                </span>
                <span className="text-gray-500 dark:text-gray-400">{lab.supportedLanguages}</span>
                {lab.published ? (
                  <span className="flex items-center text-green-600 dark:text-green-400 font-medium text-xs">
                    <CheckCircle className="w-4 h-4 mr-1" /> Published
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500 dark:text-gray-400 font-medium text-xs">
                    <XCircle className="w-4 h-4 mr-1" /> Draft
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePublishToggle}
              className={`px-4 py-2 rounded-md font-medium text-xs ${lab.published ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-300'}`}
            >
              {lab.published ? 'Unpublish' : 'Publish'}
            </button>
            <Link 
              to={`/faculty/labs/${lab.id}/edit`}
              className="flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100 font-medium text-xs border border-indigo-100 dark:border-indigo-800"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Link>
            <button 
              onClick={handleDeleteLab}
              className="flex items-center px-4 py-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 font-medium text-xs border border-red-100 dark:border-red-800"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`${
                activeTab === 'testcases'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              Test Cases ({lab.testCases.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`${
                activeTab === 'assignments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Users className="w-4 h-4 mr-2" />
              Assignments ({assignments.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Problem Description</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {lab.description}
            </div>
            
            <h3 className="text-md font-bold text-gray-900 mt-6">Constraints</h3>
            <div className="bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-700 whitespace-pre-wrap">
              {lab.constraints}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="text-md font-bold text-gray-900 mb-2">Sample Input</h3>
                <div className="bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-700 whitespace-pre-wrap">
                  {lab.sampleInput}
                </div>
              </div>
              <div>
                <h3 className="text-md font-bold text-gray-900 mb-2">Sample Output</h3>
                <div className="bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-700 whitespace-pre-wrap">
                  {lab.sampleOutput}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testcases' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Add Test Case</h2>
                <form onSubmit={handleAddTestCase} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Input</label>
                    <textarea required rows={2} value={tcInput} onChange={e => setTcInput(e.target.value)} className="mt-1 block w-full font-mono rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Output</label>
                    <textarea required rows={2} value={tcExpectedOutput} onChange={e => setTcExpectedOutput(e.target.value)} className="mt-1 block w-full font-mono rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visibility</label>
                    <select value={tcVisibility} onChange={e => setTcVisibility(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                      <option value="PUBLIC">PUBLIC (Visible to students)</option>
                      <option value="HIDDEN">HIDDEN (Secret)</option>
                    </select>
                  </div>
                  <button type="submit" disabled={addingTc} className="w-full flex justify-center items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 font-medium">
                    <Plus className="w-4 h-4 mr-2" /> Add Test Case
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Test Cases ({lab.testCases.length})</h2>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {lab.testCases.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No test cases added yet.</div>
                  ) : (
                    lab.testCases.map((tc, idx) => (
                      <div key={tc.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-gray-700">Test Case #{idx + 1}</span>
                          <div className="flex items-center space-x-3">
                            {tc.visibility === 'PUBLIC' ? (
                              <span className="flex items-center text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded"><Eye className="w-3 h-3 mr-1" /> Public</span>
                            ) : (
                              <span className="flex items-center text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded"><EyeOff className="w-3 h-3 mr-1" /> Hidden</span>
                            )}
                            <button onClick={() => handleDeleteTestCase(tc.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="space-y-2 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold">Input</span>
                            <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 whitespace-pre-wrap">{tc.input}</div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold">Expected Output</span>
                            <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 whitespace-pre-wrap">{tc.expectedOutput}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Assign Students Panel */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-indigo-600" /> Assign Students
                </h2>
                
                {assignSummary && (
                  <div className="mb-4 p-4 bg-green-50 rounded-md border border-green-200">
                    <p className="text-sm font-bold text-green-800 mb-2">Assignment Complete</p>
                    <div className="flex space-x-4 text-sm text-green-700">
                      <span>Requested: {assignSummary.requested}</span>
                      <span>Created: {assignSummary.created}</span>
                      <span className="text-orange-600">Already Assigned: {assignSummary.skipped}</span>
                    </div>
                  </div>
                )}

                <div className="mb-4 p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Assignment Deadline (Optional)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="datetime-local"
                      value={dueDateInput}
                      onChange={(e) => setDueDateInput(e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    />
                    {dueDateInput && (
                      <button
                        type="button"
                        onClick={() => setDueDateInput('')}
                        className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no deadline.</p>
                </div>

                <div className="flex flex-col mb-4 space-y-3">
                  <div className="flex p-1 bg-gray-100 rounded-lg max-w-md">
                    <button
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${assignmentMode === 'INDIVIDUAL' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setAssignmentMode('INDIVIDUAL')}
                    >
                      Individual Students
                    </button>
                    <button
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${assignmentMode === 'BULK' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setAssignmentMode('BULK')}
                    >
                      Bulk Assignment
                    </button>
                  </div>

                  {assignmentMode === 'INDIVIDUAL' ? (
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full rounded-md border-0 py-2 pl-9 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                        placeholder="Search by name, register number..."
                        value={searchStudents}
                        onChange={(e) => setSearchStudents(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {metadata.departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                      >
                        <option value="">All Years</option>
                        {metadata.years.map(y => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                      <select
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                      >
                        <option value="">All Sections</option>
                        {metadata.sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {assignmentMode === 'BULK' && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 font-medium">Students Found: {searchResults.length}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          const allIds = searchResults.map(s => s.id);
                          setSelectedStudents(new Set(allIds));
                        }}
                        className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedStudents(new Set())}
                        className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-md h-64 overflow-y-auto mb-4 bg-gray-50">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {searchStudents.length === 0 ? 'Type to search students...' : 'No students found.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {searchResults.map(student => {
                        const isAssigned = assignments.some(a => a.studentId === student.id);
                        return (
                          <div key={student.id} className="p-3 flex items-center bg-white hover:bg-gray-50">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                              checked={selectedStudents.has(student.id) || isAssigned}
                              disabled={isAssigned}
                              onChange={() => toggleStudentSelection(student.id)}
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-500">
                                {student.registerNumber}
                                {(student as any).department && ` • ${(student as any).department}`}
                                {(student as any).year && ` • Yr ${(student as any).year}`}
                                {(student as any).section && ` • Sec ${(student as any).section}`}
                              </p>
                            </div>
                            {isAssigned && (
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Assigned</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedStudents.size} selected
                  </span>
                  <button
                    onClick={handleAssignStudents}
                    disabled={selectedStudents.size === 0 || assigning}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {assigning ? 'Assigning...' : 'Assign to Selected'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Assigned Students List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Current Assignments ({assignments.length})</h2>
                  <p className="text-xs text-gray-500">
                    Deadline: <span className="font-semibold text-gray-700">{lab?.dueDate ? new Date(lab.dueDate).toLocaleString() : 'No deadline'}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    const currentISO = lab?.dueDate ? new Date(lab.dueDate).toISOString().slice(0, 16) : '';
                    const inputVal = prompt('Enter deadline (YYYY-MM-DDTHH:MM) or leave blank to remove deadline:', currentISO);
                    if (inputVal !== null) {
                      handleUpdateDeadline(inputVal.trim() ? new Date(inputVal).toISOString() : null);
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold transition"
                >
                  {lab?.dueDate ? 'Change / Remove Deadline' : 'Set Deadline'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                {loadingAssignments ? (
                  <div className="p-8 text-center text-gray-500">Loading assignments...</div>
                ) : assignments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No students are currently assigned to this lab.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {assignments.map(assignment => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{assignment.student.name}</div>
                            <div className="text-xs text-gray-500">{assignment.student.registerNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleUnassignStudent(assignment.studentId)}
                              className="text-xs text-red-600 hover:text-red-900 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};
