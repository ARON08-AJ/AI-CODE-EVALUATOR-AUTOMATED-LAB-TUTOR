import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { LoginPage } from './pages/LoginPage';
import { FacultyStudentsPage } from './pages/FacultyStudentsPage';
import { FacultyStudentDetailPage } from './pages/faculty/FacultyStudentDetailPage';
import { FacultySubmissionDetailPage } from './pages/faculty/FacultySubmissionDetailPage';
import { FacultyLabsPage } from './pages/faculty/FacultyLabsPage';
import { FacultyLabFormPage } from './pages/faculty/FacultyLabFormPage';
import { FacultyLabDetailPage } from './pages/faculty/FacultyLabDetailPage';
import { StudentTopicsPage } from './pages/student/StudentTopicsPage';
import { StudentQuestionsPage } from './pages/student/StudentQuestionsPage';
import { StudentLabDetailPage } from './pages/student/StudentLabDetailPage';
import { StudentEditorPage } from './pages/student/StudentEditorPage';
import { SubmissionHistoryPage } from './pages/student/SubmissionHistoryPage';
import { SubmissionDetailPage } from './pages/student/SubmissionDetailPage';
import { SubmissionComparePage } from './pages/student/SubmissionComparePage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentLeaderboardPage } from './pages/student/StudentLeaderboardPage';
import { StudentAnnouncementsPage } from './pages/student/StudentAnnouncementsPage';
import { FacultyDashboardPage } from './pages/faculty/FacultyDashboardPage';
import { FacultyAnnouncementsPage } from './pages/faculty/FacultyAnnouncementsPage';
import { FacultyAnalyticsPage } from './pages/faculty/FacultyAnalyticsPage';
import { HomePage } from './pages/HomePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== allowedRole) return <Navigate to="/unauthorized" />;
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="wipro-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<div className="p-8 text-center dark:text-white">Unauthorized</div>} />
              
              <Route 
                path="/student/dashboard" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/leaderboard" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentLeaderboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/announcements" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentAnnouncementsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/topics" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentTopicsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/labs" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentTopicsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/topics/:id" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentQuestionsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/labs/:id" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentLabDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/labs/:id/editor" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentEditorPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/student/submissions" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <SubmissionHistoryPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/submissions/:id" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <SubmissionDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/submissions/:id/compare" 
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <SubmissionComparePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/students" 
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminStudentsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/faculty/dashboard" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/analytics" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyAnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/announcements" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyAnnouncementsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/students" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyStudentsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/students/:id" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyStudentDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/submissions/:id" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultySubmissionDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/labs" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyLabsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/labs/create" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyLabFormPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/labs/:id/edit" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyLabFormPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/labs/:id" 
                element={
                  <ProtectedRoute allowedRole="FACULTY">
                    <FacultyLabDetailPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
