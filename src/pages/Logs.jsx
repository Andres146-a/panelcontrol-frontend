import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getLogs } from '../services/api';

const tipoStyle = {
    INFO:  { color: '#1d6fa4' },
    WARN:  { color: '#b45309' },
    ERROR: { color: '#c0392b' },
};

const formatFecha = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const resaltarMensaje = (mensaje) => {
    const patron = /([\w.-]+@[\w.-]+\.[a-z]{2,}|\d{1,3}(?:\.\d{1,3}){3}|\/[\w\/.-]+|v\d+\.\d+[\w.]*|\d+\s?(?:MB|GB|KB))/gi;
    const partes = mensaje.split(patron);
    return partes.map((parte, i) =>
        /[\w.-]+@[\w.-]+\.[a-z]{2,}|\d{1,3}(?:\.\d{1,3}){3}|\/[\w\/.-]+|v\d+\.\d+[\w.]*|\d+\s?(?:MB|GB|KB)/i.test(parte)
            ? <strong key={i} style={{ color: 'var(--color-panel-text)', fontWeight: 600 }}>{parte}</strong>
            : parte
    );
};

const exportarCSV = (logs) => {
    const encabezado = ['ID', 'Fecha y Hora', 'Tipo', 'Mensaje'];
    const filas = logs.map(l => [l.id, formatFecha(l.fechaHora), l.tipo, `"${l.mensaje.replace(/"/g, '""')}"`]);
    const csv = [encabezado, ...filas].map(f => f.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
};

const FiltroBtn = ({ label, activo, onClick }) => (
    <button onClick={onClick} style={{
        padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
        cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
        border: activo ? '1px solid #1d6fa4' : '1px solid var(--color-panel-border)',
        background: activo ? '#e8f2f9' : 'transparent',
        color: activo ? '#1d6fa4' : 'var(--color-panel-text2)',
    }}>{label}</button>
);

const Logs = () => {
    const [logs, setLogs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [filtro, setFiltro]   = useState('TODOS');
    const navigate = useNavigate();

    const fetchLogs = () => {
        const token = sessionStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        setLoading(true); setError(null);
        getLogs(token)
            .then(data => { setLogs(data); setLoading(false); })
            .catch(() => { setError('No se pudieron cargar los registros.'); setLoading(false); });
    };
    useEffect(() => { fetchLogs(); }, []);

    const logsFiltrados = filtro === 'TODOS' ? logs : logs.filter(l => l.tipo === filtro);

    return (
        <Layout>
            <div className="panel-card">
                {/* HEADER */}
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Registro de actividad</div>
                        <div className="panel-sub">Eventos del sistema</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
                            {['TODOS', 'INFO', 'WARN', 'ERROR'].map(f => (
                                <FiltroBtn key={f} label={f === 'TODOS' ? 'Todos' : f} activo={filtro === f} onClick={() => setFiltro(f)} />
                            ))}
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'var(--color-panel-border)', margin: '0 4px' }} />
                        <button onClick={() => exportarCSV(logsFiltrados)}
                            style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--color-panel-text2)', border: '1px solid var(--color-panel-border)', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor='#1d6fa4'; e.currentTarget.style.color='#1d6fa4'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--color-panel-border)'; e.currentTarget.style.color='var(--color-panel-text2)'; }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {/* CARGANDO */}
                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '64px 0', fontSize: '13px' }} className="panel-text-secondary">
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Cargando registros...
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#c0392b', fontSize: '13px' }}>{error}</div>
                )}

                {/* SIN RESULTADOS */}
                {!loading && !error && logsFiltrados.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', fontSize: '13px' }} className="panel-text-secondary">
                        No hay registros{filtro !== 'TODOS' ? ` de tipo ${filtro}` : ''}.
                    </div>
                )}

                {/* FILAS */}
                {!loading && !error && logsFiltrados.map((log, i) => {
                    const cfg = tipoStyle[log.tipo] || tipoStyle.INFO;
                    return (
                        <div key={log.id}
                            style={{ padding: '10px 20px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--color-panel-text2)', borderBottom: i < logsFiltrados.length - 1 ? '1px solid var(--color-panel-border)' : 'none', lineHeight: 1.6, display: 'flex', alignItems: 'baseline', transition: 'background 0.1s', cursor: 'default' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-panel-bg)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <span style={{ color: 'var(--color-panel-text3)', marginRight: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                [{formatFecha(log.fechaHora)}]
                            </span>
                            <span style={{ color: cfg.color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                [{log.tipo}]{log.tipo !== 'ERROR' ? '\u00a0' : ''}
                            </span>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-panel-text2)', marginLeft: '6px' }}>
                                — {resaltarMensaje(log.mensaje)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </Layout>
    );
};

export default Logs;