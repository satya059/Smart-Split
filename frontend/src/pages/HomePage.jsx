import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomePage() {
    const { user } = useAuth();

    return (
        <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Hero Section */}
            <section style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                        {/* Logo */}
                        <div className="flex-center mb-6 animate-slideUp">
                            <svg width="80" height="80" viewBox="0 0 32 32" fill="none">
                                <defs>
                                    <linearGradient id="logo-gradient-home" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="50%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#d946ef" />
                                    </linearGradient>
                                </defs>
                                <circle cx="16" cy="16" r="15" stroke="url(#logo-gradient-home)" strokeWidth="2" fill="none" />
                                <path d="M10 16h12M16 10v12" stroke="url(#logo-gradient-home)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>

                        {/* Heading */}
                        <h1 className="animate-slideUp" style={{
                            fontSize: '3.5rem',
                            marginBottom: 'var(--space-4)',
                            lineHeight: '1.2'
                        }}>
                            Expense Splitting<br />Made Simple
                        </h1>

                        {/* Subheading */}
                        <p className="text-lg text-muted animate-slideUp" style={{
                            marginBottom: 'var(--space-8)',
                            maxWidth: '600px',
                            margin: '0 auto var(--space-8)'
                        }}>
                            Track shared expenses, split bills fairly, and settle up with friends.
                            No more awkward money conversations.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex-center gap-4 animate-slideUp" style={{ marginBottom: 'var(--space-12)' }}>
                            {user ? (
                                <Link to="/" className="btn btn-primary btn-lg">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="btn btn-primary btn-lg">
                                        Get Started Free
                                    </Link>
                                    <Link to="/login" className="btn btn-secondary btn-lg">
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-3" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div className="animate-fadeIn">
                                <div className="text-xl font-bold text-primary">Equal</div>
                                <div className="text-sm text-muted">Split Mode</div>
                            </div>
                            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                                <div className="text-xl font-bold text-success">Custom</div>
                                <div className="text-sm text-muted">Amounts</div>
                            </div>
                            <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                                <div className="text-xl font-bold text-warning">Percentage</div>
                                <div className="text-sm text-muted">Based Split</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: 'var(--space-16) 0', background: 'rgba(255,255,255,0.02)' }}>
                <div className="container">
                    <h2 className="text-center mb-8">Powerful Features</h2>

                    <div className="grid grid-3">
                        {/* Feature 1 */}
                        <div className="card">
                            <div className="flex-center mb-4">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h4 className="text-center mb-2">Group Management</h4>
                            <p className="text-muted text-center text-sm">
                                Create groups for trips, roommates, or any shared expenses. Add up to 4 participants per group.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card">
                            <div className="flex-center mb-4">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success-500)" strokeWidth="1.5">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h4 className="text-center mb-2">Smart Splitting</h4>
                            <p className="text-muted text-center text-sm">
                                Split expenses equally, by custom amounts, or by percentage. Handles remainders automatically.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card">
                            <div className="flex-center mb-4">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--warning-500)" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <h4 className="text-center mb-2">Settlement Suggestions</h4>
                            <p className="text-muted text-center text-sm">
                                Get optimal settlement suggestions that minimize the number of transactions needed.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="card">
                            <div className="flex-center mb-4">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="1.5">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <h4 className="text-center mb-2">Expense Tracking</h4>
                            <p className="text-muted text-center text-sm">
                                Track all expenses with descriptions, dates, and categories. Filter and search easily.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="card">
                            <div className="flex-center mb-4">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success-400)" strokeWidth="1.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </div>
                            <h4 className="text-center mb-2">Real-time Balances</h4>
                            <p className="text-muted text-center text-sm">
                                See who owes what at a glance. Color-coded balances make it crystal clear.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="card">
                            <div className="flex-center mb-4">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--warning-400)" strokeWidth="1.5">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h4 className="text-center mb-2">Beautiful UI</h4>
                            <p className="text-muted text-center text-sm">
                                Premium dark theme with smooth animations and glassmorphism effects.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: 'var(--space-8) 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center'
            }}>
                <div className="container">
                    <div className="flex-center gap-2 mb-3">
                        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <defs>
                                <linearGradient id="logo-gradient-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                            <circle cx="16" cy="16" r="15" stroke="url(#logo-gradient-footer)" strokeWidth="2" fill="none" />
                            <path d="M10 16h12M16 10v12" stroke="url(#logo-gradient-footer)" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span className="font-semibold">SplitMint</span>
                    </div>
                    <p className="text-muted text-sm">
                        © 2026 SplitMint. Built with React, Node.js, and Prisma.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;
