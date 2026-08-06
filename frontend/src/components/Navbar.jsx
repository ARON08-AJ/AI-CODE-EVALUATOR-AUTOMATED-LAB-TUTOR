import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, LogOut, LayoutDashboard, Terminal, FileText, ExternalLink, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-lg text-white shadow-md shadow-sky-900/30 group-hover:scale-105 transition">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-base tracking-tight block">
              AI Code Evaluator
            </span>
            <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider block">
              Automated Lab Tutor
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2">
          <Link
            to={isStudent ? '/student-dashboard' : '/faculty-dashboard'}
            className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition ${
              location.pathname.includes('dashboard')
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          {isStudent && (
            <Link
              to="/workspace/1"
              className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition ${
                location.pathname.includes('workspace')
                  ? 'bg-slate-800 text-sky-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Coding Lab IDE
            </Link>
          )}

          {/* Swagger OpenAPI link */}
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 transition"
            title="Open Springdoc OpenAPI Swagger Documentation"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user.fullName}</div>
            <div className="flex items-center gap-1 justify-end">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isStudent ? 'bg-sky-400' : 'bg-indigo-400'}`}></span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">{user.role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
