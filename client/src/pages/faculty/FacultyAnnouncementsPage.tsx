import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Bell, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  roleVisibility: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export const FacultyAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    roleVisibility: 'STUDENT',
    published: false
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/faculty/announcements');
      setAnnouncements(res.data.announcements);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      roleVisibility: 'STUDENT',
      published: false
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      roleVisibility: announcement.roleVisibility,
      published: announcement.published
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent, shouldPublish?: boolean) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Content is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      ...formData,
      published: shouldPublish !== undefined ? shouldPublish : formData.published
    };

    try {
      if (editingAnnouncement) {
        await api.put(`/faculty/announcements/${editingAnnouncement.id}`, payload);
      } else {
        await api.post('/faculty/announcements', payload);
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    try {
      const endpoint = announcement.published 
        ? `/faculty/announcements/${announcement.id}/unpublish`
        : `/faculty/announcements/${announcement.id}/publish`;
      await api.patch(endpoint);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update publication state.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/faculty/announcements/${id}`);
      setDeletingId(null);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete announcement.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header Banner */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pb-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link 
                to="/faculty/dashboard" 
                className="p-2 rounded-lg bg-indigo-500/50 hover:bg-indigo-500 text-white transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-7 h-7 text-amber-300" /> Announcements Management
                </h1>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm mt-1">
                  Create and publish lab notices, assignment instructions, and updates for students.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <ThemeToggle />
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-indigo-700 dark:bg-gray-800 dark:text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-gray-700 transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Announcement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 space-y-6 pb-16">
        
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchAnnouncements}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg hover:bg-red-200 transition"
            >
              Retry
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Announcements Created</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You haven't created any announcements yet. Publish lab updates or notices to inform students.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create Your First Announcement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        announcement.published
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      }`}>
                        {announcement.published ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Published
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" /> Draft
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        Target: {announcement.roleVisibility}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">
                      {announcement.title}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTogglePublish(announcement)}
                      className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                        announcement.published
                          ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300'
                      }`}
                      title={announcement.published ? 'Unpublish' : 'Publish'}
                    >
                      {announcement.published ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 mr-1" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Publish
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(announcement)}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingId(announcement.id)}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed mb-4">
                  {announcement.content}
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-50 dark:border-gray-700/40 flex justify-between items-center">
                  <span>Created by {announcement.createdBy.name}</span>
                  <span>{new Date(announcement.createdAt).toLocaleString()}</span>
                </div>

                {/* Delete Confirmation Overlay */}
                {deletingId === announcement.id && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800 dark:text-red-300">
                      Are you sure you want to delete this announcement?
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-100 dark:border-gray-700 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleFormSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lab 5 Important Instructions"
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  maxLength={5000}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide complete announcement details for students..."
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.roleVisibility}
                  onChange={(e) => setFormData({ ...formData, roleVisibility: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="STUDENT">Students Only</option>
                  <option value="ALL">All Users (Students & Faculty)</option>
                  <option value="FACULTY">Faculty Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={(e) => handleFormSubmit(e as any, false)}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={(e) => handleFormSubmit(e as any, true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving...' : 'Publish Immediately'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
