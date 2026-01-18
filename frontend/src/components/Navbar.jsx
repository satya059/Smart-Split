import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="navbar-brand">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <defs>
                            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#d946ef" />
                            </linearGradient>
                        </defs>
                        <circle cx="16" cy="16" r="15" stroke="url(#logo-gradient)" strokeWidth="2" fill="none" />
                        <path d="M10 16h12M16 10v12" stroke="url(#logo-gradient)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>SplitMint</span>
                </Link>

                <div className="navbar-menu">
                    {user && (
                        <>
                            <span className="text-muted text-sm">
                                Hey, <strong className="text-primary">{user.name}</strong>
                            </span>
                            <button onClick={logout} className="btn btn-ghost btn-sm">
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
