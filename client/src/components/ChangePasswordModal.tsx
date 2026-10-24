import React, { useState } from 'react';
import api from '../utils/api';
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, X, UserCircle, Mail } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'STUDENT' | 'FACULTY_ADMIN' | 'FACULTY' | 'ADMIN';
  initialIdentifier?: string;
  isLoggedIn?: boolean;
  userRole?: string;
  userName?: string;
  userIdentifier?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'STUDENT',
  initialIdentifier = '',
  isLoggedIn = false,
  userRole,
  userName,
  userIdentifier
}) => {
  const isStudentRole = (userRole ? userRole === 'STUDENT' : initialRole === 'STUDENT');

  const [roleType, setRoleType] = useState<'STUDENT' | 'FACULTY_ADMIN'>(
    isStudentRole ? 'STUDENT' : 'FACULTY_ADMIN'
  );
  const [identifier, setIdentifier] = useState(initialIdentifier || userIdentifier || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Synchronize initial values when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRoleType(isStudentRole ? 'STUDENT' : 'FACULTY_ADMIN');
      setIdentifier(initialIdentifier || userIdentifier || '');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialRole, initialIdentifier, userIdentifier, isStudentRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!isLoggedIn && !identifier.trim()) {
      setError(roleType === 'STUDENT' ? 'Register number is required' : 'Email address is required');
      return;
    }
    if (!oldPassword) {
      setError('Current (old) password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    if (oldPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      if (isLoggedIn) {
        // Authenticated password change
        const response = await api.post('/auth/change-password', {
          currentPassword: oldPassword,
          newPassword
        });
        setSuccess(response.data.message || 'Password changed successfully!');
      } else {
        // Public password change from login screen
        const response = await api.post('/auth/change-password-public', {
          identifier: identifier.trim(),
          currentPassword: oldPassword,
          newPassword,
          isStudent: roleType === 'STUDENT'
        });
        setSuccess(response.data.message || 'Password changed successfully! You can now log in.');
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-100 dark:border-gray-700 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Update your account password for enhanced security
            </p>
          </div>
        </div>

        {/* Logged in Badge or Role Toggle */}
        {isLoggedIn ? (
          <div className="mb-5 p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-300">
              Account: <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">{userName || userIdentifier}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 font-mono font-medium">
              {userRole || (isStudentRole ? 'STUDENT' : 'FACULTY')}
            </span>
          </div>
        ) : (
          <div className="flex mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setRoleType('STUDENT');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                roleType === 'STUDENT'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleType('FACULTY_ADMIN');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                roleType === 'FACULTY_ADMIN'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Faculty / Admin
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier (if not logged in) */}
          {!isLoggedIn && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {roleType === 'STUDENT' ? 'Register Number' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  {roleType === 'STUDENT' ? <UserCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type={roleType === 'STUDENT' ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleType === 'STUDENT' ? 'e.g. 8115U23CS001' : 'e.g. faculty@example.com'}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Old Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Current / Old Password
            </label>
            <div className="relative">
              <input
                type={showOldPass ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 pr-10 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {roleType === 'STUDENT' && (
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Default password for students is the last 7 chars of your register number (e.g. <span className="font-mono text-indigo-600 dark:text-indigo-400">23CS001</span>).
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full px-3 py-2 pr-10 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 pr-10 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
