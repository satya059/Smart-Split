import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

function GroupPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('expenses');

    // Modals
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showParticipantModal, setShowParticipantModal] = useState(false);

    // Expense form
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        amount: '',
        payerId: '',
        splitMode: 'equal',
        participantIds: [],
        customAmounts: {},
        percentages: {}
    });

    // Participant form
    const [participantName, setParticipantName] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterParticipant, setFilterParticipant] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');

    // MintSense AI
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [showAiPanel, setShowAiPanel] = useState(false);

    useEffect(() => {
        loadGroup();
    }, [id]);

    const loadGroup = async () => {
        try {
            const data = await api.getGroup(id);
            setGroup(data);
            if (data.participants?.length > 0 && !expenseForm.payerId) {
                setExpenseForm(prev => ({
                    ...prev,
                    payerId: data.participants[0].id,
                    participantIds: data.participants.map(p => p.id)
                }));
            }
        } catch (error) {
            console.error('Failed to load group:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();

        const expenseData = {
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount),
            payerId: expenseForm.payerId,
            splitMode: expenseForm.splitMode,
            participantIds: expenseForm.participantIds
        };

        if (expenseForm.splitMode === 'custom') {
            expenseData.amounts = expenseForm.participantIds.map(
                pid => parseFloat(expenseForm.customAmounts[pid]) || 0
            );
        } else if (expenseForm.splitMode === 'percentage') {
            expenseData.percentages = expenseForm.participantIds.map(
                pid => parseFloat(expenseForm.percentages[pid]) || 0
            );
        }

        try {
            await api.createExpense(id, expenseData);
            setShowExpenseModal(false);
            resetExpenseForm();
            loadGroup();
        } catch (error) {
            console.error('Failed to add expense:', error);
            alert(error.message);
        }
    };

    const resetExpenseForm = () => {
        setExpenseForm({
            description: '',
            amount: '',
            payerId: group?.participants?.[0]?.id || '',
            splitMode: 'equal',
            participantIds: group?.participants?.map(p => p.id) || [],
            customAmounts: {},
            percentages: {}
        });
    };

    const handleAddParticipant = async (e) => {
        e.preventDefault();
        if (!participantName.trim()) return;

        try {
            await api.addParticipant(id, participantName);
            setParticipantName('');
            setShowParticipantModal(false);
            loadGroup();
        } catch (error) {
            console.error('Failed to add participant:', error);
            alert(error.message);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!confirm('Delete this expense?')) return;
        try {
            await api.deleteExpense(expenseId);
            loadGroup();
        } catch (error) {
            console.error('Failed to delete expense:', error);
        }
    };

    const handleDeleteParticipant = async (participantId) => {
        if (!confirm('Remove this participant? Their paid expenses will be deleted.')) return;
        try {
            await api.deleteParticipant(participantId);
            loadGroup();
        } catch (error) {
            console.error('Failed to delete participant:', error);
            alert(error.message);
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm('Delete this group and all its data? This cannot be undone.')) return;
        try {
            await api.deleteGroup(id);
            navigate('/');
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    const toggleParticipant = (pid) => {
        setExpenseForm(prev => {
            const ids = prev.participantIds.includes(pid)
                ? prev.participantIds.filter(id => id !== pid)
                : [...prev.participantIds, pid];
            return { ...prev, participantIds: ids };
        });
    };

    // MintSense AI - Parse natural language expense
    const handleAiParse = async () => {
        if (!aiInput.trim()) return;

        setAiLoading(true);
        try {
            const result = await api.parseExpense(aiInput, id);

            if (result.success && result.data) {
                const { amount, description, participantNames, category } = result.data;

                // Find participant IDs from names
                const matchedIds = group.participants
                    .filter(p => participantNames?.some(name =>
                        p.name.toLowerCase().includes(name.toLowerCase())
                    ))
                    .map(p => p.id);

                // Pre-fill the expense form
                setExpenseForm({
                    ...expenseForm,
                    amount: amount || '',
                    description: description || aiInput,
                    participantIds: matchedIds.length > 0 ? matchedIds : group.participants.map(p => p.id),
                    splitMode: 'equal'
                });

                setShowExpenseModal(true);
                setAiInput('');
            } else {
                alert('Could not parse expense. Please try again or add manually.');
            }
        } catch (error) {
            console.error('AI parse error:', error);
            alert('AI service error. Please add expense manually.');
        } finally {
            setAiLoading(false);
        }
    };

    // MintSense AI - Generate group summary
    const handleGetAiSummary = async () => {
        setAiLoading(true);
        try {
            const result = await api.getGroupSummary(id);
            setAiSummary(result.summary);
            setShowAiPanel(true);
        } catch (error) {
            console.error('AI summary error:', error);
            setAiSummary('Unable to generate summary. Please try again.');
            setShowAiPanel(true);
        } finally {
            setAiLoading(false);
        }
    };

    // Filter expenses
    const filteredExpenses = group?.expenses?.filter(exp => {
        if (searchTerm && !exp.description.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (filterParticipant && !exp.splits.some(s => s.participantId === filterParticipant)) {
            return false;
        }
        if (dateFrom && new Date(exp.expenseDate) < new Date(dateFrom)) {
            return false;
        }
        if (dateTo && new Date(exp.expenseDate) > new Date(dateTo)) {
            return false;
        }
        if (amountMin && exp.amount < parseFloat(amountMin)) {
            return false;
        }
        if (amountMax && exp.amount > parseFloat(amountMax)) {
            return false;
        }
        return true;
    }) || [];

    if (loading) {
        return (
            <div className="page flex-center">
                <div className="loader"></div>
            </div>
        );
    }

    if (!group) {
        return null;
    }

    const { summary, settlements } = group;

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="flex-between mb-6">
                    <div>
                        <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm mb-2">
                            ← Back to Dashboard
                        </button>
                        <h1>{group.name}</h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn btn-secondary" onClick={() => setShowParticipantModal(true)}>
                            Add Person
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                            Add Expense
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-4 mb-6">
                    <div className="card-stat">
                        <div className="stat-label">Total Spent</div>
                        <div className="stat-value">₹{(summary?.totalSpent || 0).toLocaleString()}</div>
                    </div>
                    <div className="card-stat success">
                        <div className="stat-label">Participants</div>
                        <div className="stat-value">{group.participants?.length || 0}</div>
                    </div>
                    <div className="card-stat warning">
                        <div className="stat-label">Expenses</div>
                        <div className="stat-value">{summary?.expenseCount || 0}</div>
                    </div>
                    <div className="card-stat">
                        <div className="stat-label">Settlements</div>
                        <div className="stat-value">{settlements?.length || 0}</div>
                    </div>
                </div>

                {/* MintSense AI Panel */}
                <div className="card mb-6" style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                    <div className="flex align-center gap-3 mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="2">
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                            <circle cx="8" cy="14" r="2" />
                            <circle cx="16" cy="14" r="2" />
                        </svg>
                        <h4 style={{ margin: 0 }}>MintSense AI</h4>
                        <span className="badge" style={{ fontSize: '0.7rem' }}>Beta</span>
                    </div>

                    {/* Natural Language Input */}
                    <div className="flex gap-3 mb-4">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Try: 'Split 500 rupees dinner with Alice and Bob'"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleAiParse}
                            disabled={aiLoading || !aiInput.trim()}
                        >
                            {aiLoading ? 'Parsing...' : 'Smart Add'}
                        </button>
                    </div>

                    {/* AI Actions */}
                    <div className="flex gap-3">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleGetAiSummary}
                            disabled={aiLoading}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Generate AI Summary
                        </button>
                        {showAiPanel && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowAiPanel(false)}
                            >
                                Hide Summary
                            </button>
                        )}
                    </div>

                    {/* AI Summary Display */}
                    {showAiPanel && aiSummary && (
                        <div className="mt-4" style={{
                            padding: 'var(--space-4)',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '3px solid var(--primary-500)'
                        }}>
                            <p style={{ margin: 0, lineHeight: 1.6 }}>{aiSummary}</p>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="split-tabs mb-6" style={{ maxWidth: '400px' }}>
                    <button
                        className={`split-tab ${activeTab === 'expenses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expenses')}
                    >
                        Expenses
                    </button>
                    <button
                        className={`split-tab ${activeTab === 'balances' ? 'active' : ''}`}
                        onClick={() => setActiveTab('balances')}
                    >
                        Balances
                    </button>
                    <button
                        className={`split-tab ${activeTab === 'settle' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settle')}
                    >
                        Settle Up
                    </button>
                </div>

                {/* Expenses Tab */}
                {activeTab === 'expenses' && (
                    <div className="animate-fadeIn">
                        {/* Filters */}
                        <div className="card mb-4">
                            <h5 className="mb-4">Filters</h5>
                            <div className="grid grid-2 gap-4">
                                {/* Search */}
                                <div className="form-group">
                                    <label className="form-label">Search</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search expenses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Participant Filter */}
                                <div className="form-group">
                                    <label className="form-label">Participant</label>
                                    <select
                                        className="form-select"
                                        value={filterParticipant}
                                        onChange={(e) => setFilterParticipant(e.target.value)}
                                    >
                                        <option value="">All participants</option>
                                        {group.participants?.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date From */}
                                <div className="form-group">
                                    <label className="form-label">Date From</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                {/* Date To */}
                                <div className="form-group">
                                    <label className="form-label">Date To</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>

                                {/* Amount Min */}
                                <div className="form-group">
                                    <label className="form-label">Min Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        value={amountMin}
                                        onChange={(e) => setAmountMin(e.target.value)}
                                    />
                                </div>

                                {/* Amount Max */}
                                <div className="form-group">
                                    <label className="form-label">Max Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="∞"
                                        min="0"
                                        step="0.01"
                                        value={amountMax}
                                        onChange={(e) => setAmountMax(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            {(searchTerm || filterParticipant || dateFrom || dateTo || amountMin || amountMax) && (
                                <button
                                    className="btn btn-ghost btn-sm mt-4"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterParticipant('');
                                        setDateFrom('');
                                        setDateTo('');
                                        setAmountMin('');
                                        setAmountMax('');
                                    }}
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>

                        {filteredExpenses.length === 0 ? (
                            <div className="empty-state card">
                                <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                                <h3>No expenses yet</h3>
                                <p>Add your first expense to start tracking</p>
                                <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                                    Add Expense
                                </button>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Paid By</th>
                                            <th>Amount</th>
                                            <th>Split</th>
                                            <th>Date</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map((expense) => (
                                            <tr key={expense.id}>
                                                <td>
                                                    <strong>{expense.description}</strong>
                                                    <div className="text-xs text-muted">{expense.category}</div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                                        <div
                                                            className="avatar avatar-sm"
                                                            style={{ background: expense.payer?.color }}
                                                        >
                                                            {expense.payer?.name?.charAt(0)}
                                                        </div>
                                                        {expense.payer?.name}
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong className="text-success">₹{expense.amount.toLocaleString()}</strong>
                                                </td>
                                                <td>
                                                    <span className="badge badge-primary">{expense.splitMode}</span>
                                                </td>
                                                <td className="text-muted text-sm">
                                                    {new Date(expense.expenseDate).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-ghost btn-sm text-danger"
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Balances Tab */}
                {activeTab === 'balances' && (
                    <div className="animate-fadeIn">
                        <div className="grid grid-2">
                            {/* Participant Balances */}
                            <div className="card">
                                <h4 className="mb-4">Individual Balances</h4>
                                <div className="flex flex-col gap-3">
                                    {summary?.balances?.map((balance) => (
                                        <div key={balance.participantId} className="flex-between" style={{
                                            padding: 'var(--space-3)',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 'var(--radius-md)'
                                        }}>
                                            <div className="flex gap-3" style={{ alignItems: 'center' }}>
                                                <div
                                                    className="avatar"
                                                    style={{ background: balance.color }}
                                                >
                                                    {balance.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{balance.name}</div>
                                                    <div className="text-xs text-muted">
                                                        Paid ₹{balance.totalPaid.toLocaleString()} • Owes ₹{balance.totalOwed.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`font-semibold ${balance.netBalance > 0 ? 'balance-positive' :
                                                balance.netBalance < 0 ? 'balance-negative' : 'balance-neutral'
                                                }`}>
                                                {balance.netBalance >= 0 ? '+' : ''}₹{balance.netBalance.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Participants List */}
                            <div className="card">
                                <div className="flex-between mb-4">
                                    <h4>Participants ({group.participants?.length}/4)</h4>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {group.participants?.map((p) => (
                                        <div key={p.id} className="flex-between" style={{
                                            padding: 'var(--space-3)',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 'var(--radius-md)'
                                        }}>
                                            <div className="flex gap-3" style={{ alignItems: 'center' }}>
                                                <div className="avatar" style={{ background: p.color }}>
                                                    {p.name?.charAt(0)}
                                                </div>
                                                <span>{p.name}</span>
                                                {p.isRegisteredUser && (
                                                    <span className="badge badge-success">You</span>
                                                )}
                                            </div>
                                            {!p.isRegisteredUser && group.participants.length > 1 && (
                                                <button
                                                    className="btn btn-ghost btn-sm text-danger"
                                                    onClick={() => handleDeleteParticipant(p.id)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settle Tab */}
                {activeTab === 'settle' && (
                    <div className="animate-fadeIn">
                        <div className="card" style={{ maxWidth: '600px' }}>
                            <h4 className="mb-4">Settlement Suggestions</h4>
                            <p className="text-muted mb-6">
                                Minimum transactions needed to settle all debts
                            </p>

                            {settlements?.length === 0 ? (
                                <div className="text-center" style={{ padding: 'var(--space-8)' }}>
                                    <svg style={{ marginBottom: 'var(--space-4)' }} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success-500)" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9 12l2 2 4-4" />
                                    </svg>
                                    <h4>All settled up!</h4>
                                    <p className="text-muted">No pending settlements</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {settlements?.map((s, i) => (
                                        <div key={i} className="flex-between" style={{
                                            padding: 'var(--space-4)',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid rgba(255,255,255,0.08)'
                                        }}>
                                            <div className="flex gap-3" style={{ alignItems: 'center' }}>
                                                <div className="avatar" style={{ background: s.from?.color }}>
                                                    {s.from?.name?.charAt(0)}
                                                </div>
                                                <span className="font-medium">{s.from?.name}</span>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2">
                                                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className="avatar" style={{ background: s.to?.color }}>
                                                    {s.to?.name?.charAt(0)}
                                                </div>
                                                <span className="font-medium">{s.to?.name}</span>
                                            </div>
                                            <div className="text-success font-semibold text-lg">
                                                ₹{s.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="card mt-6" style={{
                            maxWidth: '600px',
                            borderColor: 'rgba(239, 68, 68, 0.3)'
                        }}>
                            <h4 className="text-danger mb-2">Danger Zone</h4>
                            <p className="text-muted mb-4">
                                Permanently delete this group and all associated data.
                            </p>
                            <button className="btn btn-danger" onClick={handleDeleteGroup}>
                                Delete Group
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Expense Modal */}
            {showExpenseModal && (
                <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h3>Add Expense</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowExpenseModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAddExpense}>
                            <div className="modal-body">
                                <div className="form-group mb-4">
                                    <label className="form-label">Description</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="What was this for?"
                                        value={expenseForm.description}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-2 mb-4">
                                    <div className="form-group">
                                        <label className="form-label">Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            min="0.01"
                                            step="0.01"
                                            value={expenseForm.amount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Paid by</label>
                                        <select
                                            className="form-select"
                                            value={expenseForm.payerId}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, payerId: e.target.value })}
                                            required
                                        >
                                            {group.participants?.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group mb-4">
                                    <label className="form-label">Split Type</label>
                                    <div className="split-tabs">
                                        {['equal', 'custom', 'percentage'].map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                className={`split-tab ${expenseForm.splitMode === mode ? 'active' : ''}`}
                                                onClick={() => setExpenseForm({ ...expenseForm, splitMode: mode })}
                                            >
                                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Split among</label>
                                    <div className="flex flex-col gap-2 mt-2">
                                        {group.participants?.map(p => (
                                            <div key={p.id} className="flex-between" style={{
                                                padding: 'var(--space-2) var(--space-3)',
                                                background: expenseForm.participantIds.includes(p.id)
                                                    ? 'rgba(99, 102, 241, 0.15)'
                                                    : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer'
                                            }} onClick={() => toggleParticipant(p.id)}>
                                                <div className="flex gap-3" style={{ alignItems: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={expenseForm.participantIds.includes(p.id)}
                                                        onChange={() => toggleParticipant(p.id)}
                                                        style={{ accentColor: 'var(--primary-500)' }}
                                                    />
                                                    <div className="avatar avatar-sm" style={{ background: p.color }}>
                                                        {p.name?.charAt(0)}
                                                    </div>
                                                    <span>{p.name}</span>
                                                </div>

                                                {expenseForm.splitMode === 'custom' && expenseForm.participantIds.includes(p.id) && (
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="Amount"
                                                        min="0"
                                                        step="0.01"
                                                        style={{ width: '100px', padding: 'var(--space-1) var(--space-2)' }}
                                                        value={expenseForm.customAmounts[p.id] || ''}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            setExpenseForm({
                                                                ...expenseForm,
                                                                customAmounts: { ...expenseForm.customAmounts, [p.id]: e.target.value }
                                                            });
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                )}

                                                {expenseForm.splitMode === 'percentage' && expenseForm.participantIds.includes(p.id) && (
                                                    <div className="flex gap-1" style={{ alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            placeholder="%"
                                                            min="0"
                                                            max="100"
                                                            style={{ width: '70px', padding: 'var(--space-1) var(--space-2)' }}
                                                            value={expenseForm.percentages[p.id] || ''}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                setExpenseForm({
                                                                    ...expenseForm,
                                                                    percentages: { ...expenseForm.percentages, [p.id]: e.target.value }
                                                                });
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className="text-muted">%</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Participant Modal */}
            {showParticipantModal && (
                <div className="modal-overlay" onClick={() => setShowParticipantModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Participant</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowParticipantModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAddParticipant}>
                            <div className="modal-body">
                                {group.participants?.length >= 4 ? (
                                    <div className="badge badge-warning w-full" style={{
                                        padding: 'var(--space-3) var(--space-4)',
                                        justifyContent: 'center',
                                        textTransform: 'none'
                                    }}>
                                        Maximum 4 participants allowed per group
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Participant name"
                                            value={participantName}
                                            onChange={(e) => setParticipantName(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowParticipantModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={group.participants?.length >= 4}
                                >
                                    Add Participant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupPage;
