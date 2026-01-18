import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GroupPage from './pages/GroupPage';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loader"></div>
            </div>
        );
    }

    return user ? children : <Navigate to="/home" />;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loader"></div>
            </div>
        );
    }

    return !user ? children : <Navigate to="/dashboard" />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/home" element={
                <PublicRoute>
                    <HomePage />
                </PublicRoute>
            } />
            <Route path="/login" element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <RegisterPage />
                </PublicRoute>
            } />
            <Route path="/dashboard" element={
                <PrivateRoute>
                    <>
                        <Navbar />
                        <DashboardPage />
                    </>
                </PrivateRoute>
            } />
            <Route path="/group/:id" element={
                <PrivateRoute>
                    <>
                        <Navbar />
                        <GroupPage />
                    </>
                </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

