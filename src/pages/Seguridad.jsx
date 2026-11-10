import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSeguridadStats, getIpsBloqueadas, desbloquearIp } from '../services/api';

const Modal = ({ ip, onClose, onConfirm, loading, error }) => (
    <div onClick={e => e.target === e.currentTarget && onClose()}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(26,46,74,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dm-modal-bg" style={{ width: '420px', animation: 'fadeUp 0.2s ease' }}>
            <div className="dm-modal-title">Desbloquear IP</div>
            <div style={{ fontSize: '13.5px', color: 'var(--color-panel-text2)', lineHeight: 1.6 }}>
                ¿Estás seguro de que quieres desbloquear la IP{' '}
                <strong style={{ color: 'var(--color-panel-text)', fontFamily: "'IBM Plex Mono', monospace" }}>{ip}</strong>?
                <br />
                <span style={{ fontSize: '12px', color: 'var(--color-panel-text3)' }}>El usuario podrá volver a intentar iniciar sesión.</span>
            </div>
            {error && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '12px' }}>{error}</div>}
            <div className="dm-footer">
                <button className="dm-btn-cancel" onClick={onClose}>Cancelar</button>
                <button onClick={onConfirm} disabled={loading} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', background: '#1a7f5a', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Desbloqueando...' : 'Sí, desbloquear'}
                </button>
            </div>
        </div>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
);

const StatCard = ({ label, value, sub, iconColor, iconBg, icon }) => (
    <div style={{ background: 'var(--color-panel-surface)', border: '1px solid var(--color-panel-border)', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(26,46,74,0.07)', flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-panel-text3)', fontWeight: 500 }}>{label}</div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>{icon}</div>
        </div>
        <div style={{ fontSize: '30px', fontWeight: 700, color: 'var(--color-panel-text)', letterSpacing: '-1px', lineHeight: 1, marginBottom: '6px' }}>{value}</div>
        <div style={{ fontSize: '11.5px', color: 'var(--color-panel-text3)' }}>{sub}</div>
    </div>
);

const formatFecha = (iso) => {
    const d = new Date(iso); const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const tiempoDesde = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff/60)} hora${Math.floor(diff/60) > 1 ? 's' : ''}`;
    return `Hace ${Math.floor(diff/1440)} día${Math.floor(diff/1440) > 1 ? 's' : ''}`;
};

const Seguridad = () => {
    const [stats, setStats]               = useState(null);
    const [ips, setIps]                   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [modalIp, setModalIp]           = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError]               = useState('');
    const navigate = useNavigate();
    const token = sessionStorage.getItem('token');

    const fetchData = async () => {
        if (!token) { navigate('/'); return; }
        setLoading(true);
        try {
            const [statsData, ipsData] = await Promise.all([getSeguridadStats(token), getIpsBloqueadas(token)]);
            setStats(statsData); setIps(ipsData);
        } catch { navigate('/'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleDesbloquear = async () => {
        setError(''); setActionLoading(true);
        try { await desbloquearIp(token, modalIp); await fetchData(); setModalIp(null); }
        catch (err) { setError(err.message || 'Error al desbloquear la IP.'); }
        finally { setActionLoading(false); }
    };

    return (
        <Layout>
            {modalIp && <Modal ip={modalIp} onClose={() => { setModalIp(null); setError(''); }} onConfirm={handleDesbloquear} loading={actionLoading} error={error} />}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '64px', fontSize: '13px' }} className="panel-text-secondary">Cargando datos de seguridad...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* STAT CARDS */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <StatCard label="Usuarios del panel" value={stats?.totalUsuarios ?? 0} sub="Cuentas registradas" iconColor="#1d6fa4" iconBg="#e8f2f9"
                            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
                        <StatCard label="Intentos fallidos hoy" value={stats?.intentosFallidosHoy ?? 0} sub="Última hora" iconColor="#b45309" iconBg="#fef3cd"
                            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
                        <StatCard label="IPs bloqueadas" value={stats?.ipsBloqueadas ?? 0} sub="Bloqueos activos" iconColor="#c0392b" iconBg="#fdecea"
                            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>} />
                    </div>

                    {/* TABLA IPS */}
                    <div className="panel-card">
                        <div className="panel-header">
                            <div>
                                <div className="panel-title">IPs bloqueadas</div>
                                <div className="panel-sub">{ips.length} bloqueo{ips.length !== 1 ? 's' : ''} activo{ips.length !== 1 ? 's' : ''}</div>
                            </div>
                            <button onClick={fetchData}
                                style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--color-panel-text2)', border: '1px solid var(--color-panel-border)', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor='#1d6fa4'; e.currentTarget.style.color='#1d6fa4'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--color-panel-border)'; e.currentTarget.style.color='var(--color-panel-text2)'; }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                Actualizar
                            </button>
                        </div>

                        {ips.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', fontSize: '13px', gap: '8px' }} className="panel-text-secondary">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                No hay IPs bloqueadas actualmente.
                            </div>
                        ) : (
                            <div className="tabla-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr className="panel-thead">
                                        {['Dirección IP', 'Motivo', 'Bloqueada', 'Acción'].map(h => <th key={h}>{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="panel-tbody">
                                    {ips.map((ip) => (
                                        <tr key={ip.id}>
                                            <td className="panel-td">
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#c0392b' }}>{ip.ip}</span>
                                            </td>
                                            <td className="panel-td" style={{ fontSize: '13px', color: 'var(--color-panel-text2)' }}>{ip.motivo}</td>
                                            <td className="panel-td">
                                                <div style={{ fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--color-panel-text3)' }}>{tiempoDesde(ip.fechaBloqueo)}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-panel-text3)', marginTop: '2px' }}>{formatFecha(ip.fechaBloqueo)}</div>
                                            </td>
                                            <td className="panel-td">
                                                <button onClick={() => { setError(''); setModalIp(ip.ip); }}
                                                    style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#1a7f5a', border: '1px solid #b2dfcf', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background='#e6f4ee'}
                                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                                    Desbloquear
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Seguridad;