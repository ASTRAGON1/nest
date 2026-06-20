import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await adminService.login(
                form.username,
                form.password
            );

            const token = response.data.access_token;

            localStorage.setItem('adminToken', token);
            localStorage.setItem('token', token);

            localStorage.setItem(
                'adminUser',
                JSON.stringify(response.data.user || { username: form.username })
            );

            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Left side - branding strip */}
            <div style={{ width: 360, backgroundColor: '#111', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', flexShrink: 0 }}>
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#555', textTransform: 'uppercase', marginBottom: 16 }}>Mosa3id</div>
                    <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: 0 }}>Admin<br />Control Panel</h1>
                </div>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0 }}>Manage store accounts, suspend users, and control platform access from one place.</p>
            </div>

            {/* Right side - login form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <div style={{ width: '100%', maxWidth: 360 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 6 }}>Sign in</h2>
                    <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>Enter your admin credentials to continue.</p>

                    {error && (
                        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>Username</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' }}
                                placeholder="admin"
                                required
                                autoFocus
                            />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' }}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '11px 0', backgroundColor: loading ? '#555' : '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
