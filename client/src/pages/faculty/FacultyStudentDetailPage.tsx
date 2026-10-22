import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { User, Code, CheckCircle, Clock } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AppBackButton } from '../../components/AppBackButton';

interface Lab {
  id: string;
  title: string;
  difficulty?: string;
}

interface Assignment {
  id: string;
  assignedAt: string;
  lab: Lab;
}

interface Submission {
  id: string;
  labId: string;
  status: string;
  language: string;
  createdAt: string;
  passedTests: number;
  totalTests: number;
  lab: Lab;
}

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  registerNumber: string;
  department: string | null;
  year: number | null;
  section: string | null;
  createdAt: string;
  assignments: Assignment[];
  submissions: Submission[];
}

export const FacultyStudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/faculty/students/${id}`);
        setStudent(res.data.student);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load student details');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return <div className="p-8 text-center dark:bg-gray-900 h-screen"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div></div>;

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 text-center flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || 'Student not found'}</p>
        <AppBackButton fallbackPath="/faculty/students" label="Back to Students" />
      </div>
    );
  }

  const acceptedSubmissions = student.submissions.filter(s => s.status === 'ACCEPTED').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <AppBackButton fallbackPath="/faculty/students" label="Back to Students" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                {student.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {student.registerNumber} &bull; {student.department || 'No Dept'}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{student.assignments.length}</p>
              </div>
              <Code className="w-8 h-8 text-indigo-100 dark:text-indigo-900/50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{student.submissions.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-100 dark:text-blue-900/50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{acceptedSubmissions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-100 dark:text-green-900/50" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assigned Labs</h2>
            </div>
            {student.assignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No labs assigned.</div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {student.assignments.map(assignment => {
                  // Check if this lab has an accepted submission
                  const hasAccepted = student.submissions.some(s => s.labId === assignment.lab.id && s.status === 'ACCEPTED');
                  return (
                    <li key={assignment.id} className="p-4 flex items-center justify-between">
                      <div>
                        <Link to={`/faculty/labs/${assignment.lab.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                          {assignment.lab.title}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</p>
                      </div>
                      {hasAccepted ? (
                        <span className="text-green-600 dark:text-green-400 text-xs font-semibold flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" /> Completed
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Pending</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Submissions</h2>
            </div>
            {student.submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No submissions yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                {student.submissions.map(sub => (
                  <li key={sub.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Link to={`/faculty/submissions/${sub.id}`} className="block">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {sub.lab.title}
                        </p>
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                          sub.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          sub.status === 'WRONG_ANSWER' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {sub.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span>{sub.language}</span>
                        <span>{new Date(sub.createdAt).toLocaleString()}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
