import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page flex-center" style={{ minHeight: '100vh' }}>
            <div className="card animate-slideUp" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="text-center mb-8">
                    <div className="flex-center mb-4">
                        <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                            <defs>
                                <linearGradient id="logo-gradient-login" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                            <circle cx="16" cy="16" r="15" stroke="url(#logo-gradient-login)" strokeWidth="2" fill="none" />
                            <path d="M10 16h12M16 10v12" stroke="url(#logo-gradient-login)" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2>Welcome back</h2>
                    <p className="text-muted mt-2">Sign in to your SplitMint account</p>
                </div>

                {error && (
                    <div className="badge badge-danger w-full mb-4" style={{
                        padding: 'var(--space-3) var(--space-4)',
                        justifyContent: 'center',
                        textTransform: 'none',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-muted mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary font-medium">Create one</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
