import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function DashboardPage() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const data = await api.getGroups();
            setGroups(data);
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setCreating(true);
        try {
            await api.createGroup(newGroupName);
            setNewGroupName('');
            setShowModal(false);
            loadGroups();
        } catch (error) {
            console.error('Failed to create group:', error);
        } finally {
            setCreating(false);
        }
    };

    const totalSpent = groups.reduce((sum, g) => sum + (g.totalSpent || 0), 0);
    const totalGroups = groups.length;

    if (loading) {
        return (
            <div className="page flex-center">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="flex-between mb-8">
                    <div>
                        <h1 className="mb-2">Dashboard</h1>
                        <p className="text-muted">Manage your expense groups and settlements</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                        New Group
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-3 mb-8">
                    <div className="card-stat">
                        <div className="stat-label">Total Groups</div>
                        <div className="stat-value">{totalGroups}</div>
                    </div>
                    <div className="card-stat success">
                        <div className="stat-label">Total Spent</div>
                        <div className="stat-value">₹{totalSpent.toLocaleString()}</div>
                    </div>
                    <div className="card-stat warning">
                        <div className="stat-label">Active Expenses</div>
                        <div className="stat-value">{groups.reduce((sum, g) => sum + (g.expenseCount || 0), 0)}</div>
                    </div>
                </div>

                {/* Groups List */}
                {groups.length === 0 ? (
                    <div className="empty-state card">
                        <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <h3>No groups yet</h3>
                        <p>Create your first group to start tracking shared expenses</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Create Group
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-2">
                        {groups.map((group) => (
                            <Link to={`/group/${group.id}`} key={group.id} className="card" style={{ textDecoration: 'none' }}>
                                <div className="flex-between mb-4">
                                    <h3 style={{ color: 'white' }}>{group.name}</h3>
                                    <span className="badge badge-primary">{group.currency}</span>
                                </div>

                                <div className="flex gap-4 mb-4">
                                    {group.participants?.slice(0, 4).map((p) => (
                                        <div
                                            key={p.id}
                                            className="avatar avatar-sm"
                                            style={{ background: p.color }}
                                            title={p.name}
                                        >
                                            {p.name.charAt(0)}
                                        </div>
                                    ))}
                                    {group.participants?.length > 4 && (
                                        <div className="avatar avatar-sm" style={{ background: 'var(--gray-600)' }}>
                                            +{group.participants.length - 4}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-between text-sm">
                                    <span className="text-muted">{group.participants?.length || 0} participants</span>
                                    <span className="text-success font-semibold">
                                        ₹{(group.totalSpent || 0).toLocaleString()}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Group</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Group Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Trip to Goa, Roommates"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardPage;
