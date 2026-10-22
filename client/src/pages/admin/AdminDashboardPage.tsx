import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Users,
  UserPlus,
  LogOut,
  ShieldAlert,
  Edit2,
  KeyRound,
  FileCode,
  Activity,
  CheckCircle,
  RefreshCw,
  Brain
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string | null;
  registerNumber: string | null;
  createdAt: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  _count?: {
    createdLabs: number;
    createdExams: number;
  };
}

interface DashboardStats {
  totalFaculty: number;
  totalStudents: number;
  totalAdmins: number;
  totalLabs: number;
  totalSubmissions: number;
  totalAiFeedbacks: number;
}

interface ActivityData {
  recentSubmissions: Array<{
    id: string;
    status: string;
    language: string;
    passedTests: number;
    totalTests: number;
    createdAt: string;
    student: { name: string; registerNumber: string };
    lab: { title: string };
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    createdAt: string;
    isActive: boolean;
  }>;
}

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faculty' | 'activity'>('faculty');
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalFaculty: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalLabs: 0,
    totalSubmissions: 0,
    totalAiFeedbacks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Activity State
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Add Faculty Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    registerNumber: '',
    department: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Faculty State
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    registerNumber: '',
    department: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Password Reset State
  const [resetModalUser, setResetModalUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setFaculty(res.data.faculty);
      setStats(res.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await api.get('/admin/activity');
      setActivity(res.data);
    } catch (err: any) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') fetchActivity();
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      await api.post('/admin/faculty', formData);
      setFormSuccess('Faculty member added successfully.');
      setShowForm(false);
      setFormData({ name: '', email: '', registerNumber: '', department: '', password: '' });
      fetchDashboard();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to add faculty');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setFormError('');
    setFormSuccess('');
    setEditSubmitting(true);

    try {
      await api.put(`/admin/faculty/${editingFaculty.id}`, editFormData);
      setFormSuccess('Faculty member updated successfully.');
      setEditingFaculty(null);
      fetchDashboard();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update faculty');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (facultyId: string, currentStatus: boolean, facultyName: string) => {
    const message = currentStatus
      ? `Block Faculty?\n\n${facultyName} will no longer be able to log in or access protected Faculty resources.`
      : `Unblock Faculty?\n\n${facultyName} will be able to log in again.`;

    if (!window.confirm(message)) return;

    try {
      await api.patch(`/admin/faculty/${facultyId}/status`, { isActive: !currentStatus });
      fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to change faculty status');
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetLoading(true);
    setResetSuccessMessage('');

    try {
      const res = await api.post(`/admin/users/${resetModalUser.id}/reset-password`, {
        newPassword: newPasswordInput.trim() || undefined
      });
      setResetSuccessMessage(res.data.message || `Password reset to ${res.data.tempPassword}.`);
      setTimeout(() => {
        setResetModalUser(null);
        setNewPasswordInput('');
        setResetSuccessMessage('');
        fetchDashboard();
      }, 2500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center h-screen dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <ShieldAlert className="w-8 h-8 text-indigo-600 mr-2" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AutoLab Enterprise Administration</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Campus Oversight, User Governance & Academic Auditing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Global Campus Metrics Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" />
              Campus System Overview
            </h2>
            <button
              onClick={fetchDashboard}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-indigo-50 dark:bg-gray-750 p-4 rounded-xl border border-indigo-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Students <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-indigo-900 dark:text-white mt-1.5">{stats.totalStudents || 0}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Enrolled candidates</div>
            </div>

            <div className="bg-purple-50 dark:bg-gray-750 p-4 rounded-xl border border-purple-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-medium">
                Faculty <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-white mt-1.5">{stats.totalFaculty || 0}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Teaching staff</div>
            </div>

            <div className="bg-blue-50 dark:bg-gray-750 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
                Coding Labs <FileCode className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-white mt-1.5">{stats.totalLabs || 0}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Assignments ready</div>
            </div>

            <div className="bg-emerald-50 dark:bg-gray-750 p-4 rounded-xl border border-emerald-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Submissions <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-emerald-900 dark:text-white mt-1.5">{stats.totalSubmissions || 0}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Evaluated code runs</div>
            </div>

            <div className="bg-rose-50 dark:bg-gray-750 p-4 rounded-xl border border-rose-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                AI Feedback <Brain className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-rose-900 dark:text-white mt-1.5">{stats.totalAiFeedbacks || 0}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Tutor explanations</div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'faculty'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Faculty Directory
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Live University Activity
          </button>
        </div>

        {/* TAB 1: FACULTY DIRECTORY */}
        {activeTab === 'faculty' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Faculty & Staff Directory</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage credentials, permissions, and departmental assignments</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/admin/students')}
                  className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <Users className="w-4 h-4 mr-1.5" />
                  Manage Students
                </button>
                <button
                  onClick={() => { setShowForm(!showForm); setEditingFaculty(null); }}
                  className="flex items-center bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {showForm ? 'Cancel' : 'Add Faculty'}
                </button>
              </div>
            </div>

            {formError && <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">{formError}</div>}
            {formSuccess && <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-800">{formSuccess}</div>}

            {showForm && !editingFaculty && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Add New Faculty Member</h3>
                <form onSubmit={handleAddFaculty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Faculty ID / Employee Code</label>
                    <input
                      type="text"
                      value={formData.registerNumber}
                      onChange={(e) => setFormData({...formData, registerNumber: e.target.value})}
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g. Computer Science and Engineering"
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full md:w-1/2 p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Faculty Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editingFaculty && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Faculty Member</h3>
                  <button onClick={() => setEditingFaculty(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs">Cancel</button>
                </div>
                <form onSubmit={handleEditFaculty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Faculty ID</label>
                    <input
                      type="text"
                      value={editFormData.registerNumber}
                      onChange={(e) => setEditFormData({...editFormData, registerNumber: e.target.value})}
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                      className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {editSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {faculty.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No faculty members found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3 text-left">Faculty Member</th>
                      <th className="px-6 py-3 text-left">Email</th>
                      <th className="px-6 py-3 text-left">Department</th>
                      <th className="px-6 py-3 text-left">Contributions</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {faculty.map((f) => (
                      <tr key={f.id} className={!f.isActive ? 'opacity-60 bg-red-50/20' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 dark:text-white">{f.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{f.registerNumber || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">{f.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">{f.department || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{f._count?.createdLabs || 0}</span> labs /{' '}
                          <span className="font-semibold text-purple-600 dark:text-purple-400">{f._count?.createdExams || 0}</span> exams
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 inline-flex text-[11px] leading-5 font-semibold rounded-full ${
                            f.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {f.isActive ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setResetModalUser({ id: f.id, name: f.name, email: f.email });
                                setNewPasswordInput('password123');
                              }}
                              className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1 transition"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3 h-3" />
                              Reset Pass
                            </button>
                            <button
                              onClick={() => {
                                setEditingFaculty(f);
                                setShowForm(false);
                                setEditFormData({
                                  name: f.name,
                                  email: f.email,
                                  registerNumber: f.registerNumber || '',
                                  department: f.department || ''
                                });
                              }}
                              className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                              title="Edit Faculty Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(f.id, f.isActive, f.name)}
                              className={`px-2 py-1 text-xs font-semibold rounded transition ${
                                f.isActive
                                  ? 'text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/40'
                                  : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-950/40'
                              }`}
                            >
                              {f.isActive ? 'Block' : 'Unblock'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE UNIVERSITY ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live University Activity Stream</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-time audit log of code evaluations, lab submissions, and academic interactions</p>
              </div>
              <button
                onClick={fetchActivity}
                className="flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${activityLoading ? 'animate-spin' : ''}`} /> Refresh Stream
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Submissions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  Recent Code Submissions
                </h4>
                <div className="space-y-2.5">
                  {!activity?.recentSubmissions || activity.recentSubmissions.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">No recent code submissions.</div>
                  ) : (
                    activity.recentSubmissions.map((sub) => (
                      <div key={sub.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{sub.student.name}</div>
                          <div className="text-gray-500 text-[11px]">{sub.lab.title} ({sub.language})</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            sub.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}>
                            {sub.status} ({sub.passedTests}/{sub.totalTests})
                          </span>
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">
                            {new Date(sub.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Recent User Accounts
                </h4>
                <div className="space-y-2.5">
                  {!activity?.recentUsers || activity.recentUsers.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">No recent users.</div>
                  ) : (
                    activity.recentUsers.map((u) => (
                      <div key={u.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{u.name}</div>
                          <div className="text-gray-500 text-[11px]">{u.email} • {u.department || 'General'}</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                              : u.role === 'FACULTY'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}>
                            {u.role}
                          </span>
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">
                            {new Date(u.createdAt).toLocaleDateString()}
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
      </main>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Reset Password for {resetModalUser.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The user's password will be updated immediately. The account will be marked with a required password change upon their next login.
            </p>

            {resetSuccessMessage ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Temporary Password:
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter password (minimum 6 characters)"
                    className="w-full p-2.5 text-xs border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white font-mono"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setNewPasswordInput('password123')}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Use default 'password123'
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
