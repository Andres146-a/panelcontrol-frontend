import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDashboardStats, getLogs, getSSLInfo, getLoginsPorDia, getEmails } from '../services/api';

const dotColor = (tipo, mensaje) => {
    if (tipo === 'ERROR') return '#c0392b';
    if (tipo === 'WARN')  return '#b45309';
    if (mensaje?.includes('inició sesión')) return '#1a7f5a';
    if (mensaje?.includes('bloqueada') || mensaje?.includes('fallido')) return '#c0392b';
    return '#1d6fa4';
};

const tiempoDesde = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1)    return 'Ahora mismo';
    if (diff < 60)   return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff/60)} hora${Math.floor(diff/60) > 1 ? 's' : ''}`;
    return `Hace ${Math.floor(diff/1440)} día${Math.floor(diff/1440) > 1 ? 's' : ''}`;
};

const sslColor = (dias) => {
    if (dias <= 7)  return { color: '#c0392b', bg: '#fdecea', border: '#f5c6c2', label: 'Crítico' };
    if (dias <= 30) return { color: '#b45309', bg: '#fef3cd', border: '#f6d860', label: 'Pronto' };
    return { color: '#1a7f5a', bg: '#e6f4ee', border: '#b2dfcf', label: 'Vigente' };
};

const Dashboard = () => {
    const [stats, setStats]         = useState({});
    const [logs, setLogs]           = useState([]);
    const [ssl, setSsl]             = useState(null);
    const [grafico, setGrafico]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [emails, setEmails] = useState([]);
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");

    useEffect(() => {
        if (!token) { navigate("/"); return; }
        const fetchData = async () => {
            try {
                
const [statsData, logsData, sslData, graficoData, emailsData] = await Promise.allSettled([
    getDashboardStats(token),
    getLogs(token),
    getSSLInfo(token),
    getLoginsPorDia(token),
    getEmails(token),
]);
if (statsData.status === 'fulfilled')  setStats(statsData.value);
if (logsData.status === 'fulfilled')   setLogs(logsData.value);
if (sslData.status === 'fulfilled')    setSsl(sslData.value);
if (graficoData.status === 'fulfilled') setGrafico(graficoData.value);
if (emailsData.status === 'fulfilled')
    setEmails(emailsData.value.filter(e => e.email?.endsWith('@supermetalseconds.com')));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const hoy = new Date().toDateString();
    const loginsHoy = logs.filter(l =>
        l.tipo === 'INFO' &&
        l.mensaje?.includes('inició sesión') &&
        new Date(l.fechaHora).toDateString() === hoy
    ).length;

    const sslCfg = ssl ? sslColor(ssl.diasRestantes) : null;

    // Calcular altura de cada barra relativa al máximo
    const maxLogins = grafico.length > 0 ? Math.max(...grafico.map(d => d.logins), 1) : 1;
    const hoy2 = new Date().toDateString();

    return (
        <Layout>
            <div className="p-0 md:p-7">

                {/* ── CARDS ── */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">

    {/* Cuentas de correo */}
    <div className="bg-panel-surface border border-panel-border rounded-xl p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-panel-text3 uppercase tracking-wide">Cuentas de correo</p>
                <p className="text-2xl font-bold text-panel-text mt-1">{loading ? '...' : emails.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f2f9' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d6fa4" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
            <span className="text-xs" style={{ color: '#1a7f5a' }}>{loading ? '' : `${emails.filter(e => !e.suspendedLogin).length} activas`}</span>
            <span className="text-xs text-panel-text3">en supermetalseconds.com</span>
        </div>
    </div>

    {/* SSL */}
    <div className="bg-panel-surface border border-panel-border rounded-xl p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-panel-text3 uppercase tracking-wide">Certificado SSL</p>
                <p className="text-2xl font-bold mt-1" style={{ color: loading || !ssl ? '#1a2332' : sslColor(ssl.diasRestantes).color }}>
                    {loading ? '...' : ssl ? `${ssl.diasRestantes}d` : 'N/A'}
                </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: loading || !ssl ? '#e8f2f9' : sslColor(ssl.diasRestantes).bg }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={loading || !ssl ? '#1d6fa4' : sslColor(ssl.diasRestantes).color} strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            </div>
        </div>
        <div className="mt-3">
            <span className="text-xs text-panel-text3">
                {loading || !ssl ? '' : ssl.diasRestantes <= 7 ? '⚠ Renovar urgente' : ssl.diasRestantes <= 30 ? '⚠ Vence pronto' : "Vigente — Let's Encrypt"}
            </span>
        </div>
    </div>

    {/* Usuarios del panel */}
    <div className="bg-panel-surface border border-panel-border rounded-xl p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-panel-text3 uppercase tracking-wide">Usuarios del panel</p>
                <p className="text-2xl font-bold text-panel-text mt-1">{loading ? '...' : stats.totalUsuarios || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f2f9' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d6fa4" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
        </div>
        <div className="mt-3">
            <span className="text-xs text-panel-text3">Administradores y usuarios</span>
        </div>
    </div>

    {/* Logins hoy */}
    <div className="bg-panel-surface border border-panel-border rounded-xl p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-panel-text3 uppercase tracking-wide">Logins hoy</p>
                <p className="text-2xl font-bold text-panel-text mt-1">{loading ? '...' : loginsHoy}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e6f4ee' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a7f5a" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </div>
        </div>
        <div className="mt-3">
            <span className="text-xs text-panel-text3">Sesiones iniciadas hoy</span>
        </div>
    </div>

</div>

{/* ── BANNER SSL ── */}
{!loading && ssl && ssl.diasRestantes <= 30 && (
    <div style={{ background: sslCfg.bg, border: `1px solid ${sslCfg.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fff', border: `1px solid ${sslCfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={sslCfg.color} strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: sslCfg.color }}>Certificado SSL — {ssl.dominio}</div>
            <div style={{ fontSize: '12px', color: sslCfg.color, opacity: 0.8, marginTop: '2px' }}>
                {ssl.emisor} · Vence el {new Date(ssl.venceEn).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', background: '#fff', border: `1px solid ${sslCfg.border}`, fontSize: '13px', fontWeight: 700, color: sslCfg.color, fontFamily: "'IBM Plex Mono', monospace" }}>
            {ssl.diasRestantes <= 7 && '⚠ '}{ssl.diasRestantes} días restantes
        </span>
    </div>
)}

                {/* ── GRÁFICO + ACTIVIDAD ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
                    <div className="lg:col-span-2 bg-panel-surface border border-panel-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-panel-border">
                            <div className="text-sm font-semibold text-panel-text">Actividad del sistema</div>
                            <div className="text-xs text-panel-text3 mt-0.5">Logins por día — últimos 7 días</div>
                        </div>
                        <div className="p-5">
                            {loading ? (
                                <div className="h-28 flex items-center justify-center text-xs text-panel-text3">Cargando...</div>
                            ) : (
                                <div className="flex items-end gap-3 h-28">
                                    {grafico.map((d, i) => {
                                        const esHoy = new Date(d.fecha + 'T00:00:00').toDateString() === hoy2;
                                        const altura = maxLogins === 0 ? 8 : Math.max((d.logins / maxLogins) * 100, d.logins > 0 ? 8 : 4);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.logins} logins`}>
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: `${altura}%`,
                                                        borderRadius: '4px 4px 0 0',
                                                        background: esHoy ? '#1a7f5a' : d.logins === 0 ? '#e2e5eb' : '#1d6fa4',
                                                        opacity: 0.9,
                                                        transition: 'opacity 0.15s',
                                                        cursor: 'pointer',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.9}
                                                />
                                                <span className="text-xs text-panel-text3" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px' }}>
                                                    {d.dia}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 border-t border-panel-border">
                            <div className="px-5 py-4 border-r border-panel-border">
                                <div className="text-xs font-semibold text-panel-text3 uppercase tracking-wide mb-1">Logins hoy</div>
                                <div className="text-xl font-bold text-panel-text">{loading ? '...' : loginsHoy}</div>
                            </div>
                            <div className="px-5 py-4">
                                <div className="text-xs font-semibold text-panel-text3 uppercase tracking-wide mb-1">Usuarios del panel</div>
                                <div className="text-xl font-bold text-panel-text">{stats.totalUsuarios || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* ACTIVIDAD RECIENTE */}
                    <div className="bg-panel-surface border border-panel-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-panel-border">
                            <div className="text-sm font-semibold text-panel-text">Actividad reciente</div>
                        </div>
                        {loading ? (
                            <div className="px-5 py-8 text-center text-xs text-panel-text3">Cargando...</div>
                        ) : logs.length === 0 ? (
                            <div className="px-5 py-8 text-center text-xs text-panel-text3">Sin actividad reciente</div>
                        ) : (
                            logs.slice(0, 6).map((log) => (
                                <div key={log.id} className="flex items-start gap-3 px-5 py-3 border-b border-panel-border last:border-0 hover:bg-panel-bg transition-colors">
                                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                        style={{ background: dotColor(log.tipo, log.mensaje) }} />
                                    <div>
                                        <div className="text-xs text-panel-text2">{log.mensaje}</div>
                                        <div className="text-xs text-panel-text3 mt-0.5">{tiempoDesde(log.fechaHora)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;