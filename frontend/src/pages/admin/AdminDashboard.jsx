import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'localAdminUsers';
const defaultUsers = [];

const loadUsers = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultUsers));
const saveUsers = (users) => localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

const S = {
    page: { minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111' },
    header: { backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
    brand: { fontSize: 15, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    adminBadge: { fontSize: 12, color: '#888', backgroundColor: '#f0f0f0', padding: '4px 10px', borderRadius: 20 },
    signOutBtn: { fontSize: 13, color: '#555', border: '1px solid #ddd', backgroundColor: '#fff', borderRadius: 7, padding: '6px 14px', cursor: 'pointer' },
    main: { maxWidth: 1100, margin: '0 auto', padding: '28px 20px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
    statCard: { backgroundColor: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '18px 20px' },
    statLabel: { fontSize: 12, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { fontSize: 28, fontWeight: 700 },
    toolbar: { display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' },
    searchInput: { flex: 1, padding: '9px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', backgroundColor: '#fff' },
    btn: (color) => ({ padding: '9px 18px', backgroundColor: color || '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }),
    table: { width: '100%', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', borderCollapse: 'collapse' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#999', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: 0.4 },
    td: { padding: '13px 16px', fontSize: 14, borderBottom: '1px solid #f2f2f2', verticalAlign: 'middle' },
    statusBadge: (active) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: active ? '#f0fdf4' : '#fff7ed', color: active ? '#16a34a' : '#ea580c' }),
    actionBtn: (color) => ({ padding: '5px 12px', border: `1px solid ${color}`, color: color, backgroundColor: 'transparent', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modal: { backgroundColor: '#fff', borderRadius: 12, padding: '28px 28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 },
    input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    modalFooter: { display: 'flex', gap: 10, marginTop: 20 },
    cancelBtn: { flex: 1, padding: '10px 0', backgroundColor: '#f4f4f4', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#555' },
    submitBtn: (c) => ({ flex: 1, padding: '10px 0', backgroundColor: c || '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff' }),
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', storeName: '' });
    const [createError, setCreateError] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setUsers(loadUsers());
        } catch {
            setUsers([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (!adminToken) { navigate('/admin/login'); return; } fetchUsers(); }, [adminToken, navigate, fetchUsers]);

    const handleToggleStatus = async (user) => {
        try {
            setUsers(prev => {
                const next = prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u);
                saveUsers(next);
                return next;
            });
        } catch { alert('Failed to update status'); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreateLoading(true);
        try {
            const user = {
                id: Date.now(),
                username: newUser.username,
                storeName: newUser.storeName,
                isActive: true,
                passwordSet: false,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                _count: { products: 0, sales: 0 }
            };
            setUsers(prev => {
                const next = [user, ...prev];
                saveUsers(next);
                return next;
            });
            setShowCreate(false);
            setNewUser({ username: '', storeName: '' });
        } catch { setCreateError('Failed to create user'); }
        finally { setCreateLoading(false); }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            setUsers(prev => {
                const next = prev.filter(u => u.id !== deleteTarget.id);
                saveUsers(next);
                return next;
            });
            setDeleteTarget(null);
        } catch { alert('Failed to delete user'); }
        finally { setDeleteLoading(false); }
    };

    const filtered = users.filter(u => {
        if (!search) return true;
        const stName = u.storeName ? u.storeName.toLowerCase() : '';
        const usrName = u.username ? u.username.toLowerCase() : '';
        const s = search.toLowerCase();
        return stName.includes(s) || usrName.includes(s);
    });

    return (
        <div style={S.page}>
            <header style={S.header}>
                <span style={S.brand}>Mosa3id Admin</span>
                <div style={S.headerRight}>
                    <span style={S.adminBadge}>{adminUser.username}</span>
                    <button onClick={() => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); navigate('/admin/login'); }} style={S.signOutBtn}>Sign out</button>
                </div>
            </header>

            <main style={S.main}>
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Users</h2>
                    <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Manage store accounts registered on the platform.</p>
                </div>

                {/* Stats */}
                <div style={S.statsRow}>
                    {[
                        { label: 'Total Users', value: users.length, color: '#111' },
                        { label: 'Active', value: users.filter(u => u.isActive).length, color: '#16a34a' },
                        { label: 'Suspended', value: users.filter(u => !u.isActive).length, color: '#ea580c' },
                        { label: 'Not Set Up', value: users.filter(u => !u.passwordSet).length, color: '#9333ea' },
                    ].map(s => (
                        <div key={s.label} style={S.statCard}>
                            <div style={S.statLabel}>{s.label}</div>
                            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div style={S.toolbar}>
                    <input type="text" style={S.searchInput} placeholder="Search by store name..." value={search} onChange={e => setSearch(e.target.value)} />
                    <button onClick={fetchUsers} style={{ ...S.btn('#fff'), color: '#555', border: '1px solid #ddd' }}>↻ Refresh</button>
                    <button onClick={() => setShowCreate(true)} style={S.btn()}>+ New User</button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                {['Username', 'Store Name', 'Status', 'Products', 'Sales', 'Joined', 'Last Login', ''].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#999', padding: '32px 0' }}>Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#bbb', padding: '40px 0' }}>No users found.</td></tr>
                            ) : filtered.map(user => (
                                <tr key={user.id} style={{ transition: 'background 0.1s' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={S.td}>
                                        <div style={{ fontWeight: 600 }}>{user.username}</div>
                                        <div style={{ fontSize: 12, color: '#bbb' }}>#{user.id}</div>
                                    </td>
                                    <td style={{ ...S.td, color: user.storeName ? '#333' : '#ccc', fontStyle: user.storeName ? 'normal' : 'italic' }}>{user.storeName || 'Not set'}</td>
                                    <td style={S.td}><span style={S.statusBadge(user.isActive)}>{user.isActive ? 'Active' : 'Suspended'}</span></td>
                                    <td style={{ ...S.td, color: '#555' }}>{user._count?.products ?? 0}</td>
                                    <td style={{ ...S.td, color: '#555' }}>{user._count?.sales ?? 0}</td>
                                    <td style={{ ...S.td, color: '#999', fontSize: 13 }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td style={{ ...S.td, color: '#999', fontSize: 13 }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}</td>
                                    <td style={{ ...S.td }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleToggleStatus(user)} style={S.actionBtn(user.isActive ? '#ea580c' : '#16a34a')}>
                                                {user.isActive ? 'Suspend' : 'Activate'}
                                            </button>
                                            <button onClick={() => setDeleteTarget(user)} style={S.actionBtn('#dc2626')}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Create Modal */}
            {showCreate && (
                <div style={S.overlay} onClick={() => setShowCreate(false)}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Create New User</h3>
                        {createError && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 12px', borderRadius: 7, fontSize: 13, marginBottom: 16 }}>{createError}</div>}
                        <form onSubmit={handleCreateUser}>
                            <div style={{ marginBottom: 14 }}>
                                <label style={S.label}>Username *</label>
                                <input autoFocus required style={S.input} value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="e.g. storename" />
                                <p style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>The user will set their own password on first login.</p>
                            </div>
                            <div style={{ marginBottom: 6 }}>
                                <label style={S.label}>Store Name (optional)</label>
                                <input style={S.input} value={newUser.storeName} onChange={e => setNewUser({ ...newUser, storeName: e.target.value })} placeholder="e.g. Mohammed's Electronics" />
                            </div>
                            <div style={S.modalFooter}>
                                <button type="button" onClick={() => { setShowCreate(false); setCreateError(''); }} style={S.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={createLoading} style={S.submitBtn()}>{createLoading ? 'Creating...' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div style={S.overlay} onClick={() => setDeleteTarget(null)}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>Delete User "{deleteTarget.username}"?</h3>
                        <p style={{ fontSize: 14, color: '#555', marginBottom: 8, lineHeight: 1.5 }}>This will permanently delete this user and all their associated data — products, sales, customers, suppliers, and expenses.</p>
                        <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>This action cannot be undone.</p>
                        <div style={S.modalFooter}>
                            <button onClick={() => setDeleteTarget(null)} style={S.cancelBtn}>Cancel</button>
                            <button disabled={deleteLoading} onClick={handleDeleteUser} style={S.submitBtn('#dc2626')}>{deleteLoading ? 'Deleting...' : 'Yes, Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
