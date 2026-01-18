import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(email, password, name);
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
                                <linearGradient id="logo-gradient-reg" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                            <circle cx="16" cy="16" r="15" stroke="url(#logo-gradient-reg)" strokeWidth="2" fill="none" />
                            <path d="M10 16h12M16 10v12" stroke="url(#logo-gradient-reg)" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2>Create Account</h2>
                    <p className="text-muted mt-2">Join SplitMint and start splitting expenses</p>
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
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-muted mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
