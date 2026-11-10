import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

import { BASE_URL } from "../config";

const tipoNotif = {
    ERROR:    { color: '#c0392b', bg: '#fdecea', border: '#f5c6c2' },
    WARN:     { color: '#b45309', bg: '#fef3cd', border: '#f6d860' },
    IP:       { color: '#c0392b', bg: '#fdecea', border: '#f5c6c2' },
    USUARIO:  { color: '#1d6fa4', bg: '#e8f2f9', border: '#b3d4ea' },
    SERVICIO: { color: '#b45309', bg: '#fef3cd', border: '#f6d860' },
};

const tiempoDesde = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1)    return 'Ahora mismo';
    if (diff < 60)   return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff/60)}h`;
    return `Hace ${Math.floor(diff/1440)}d`;
};

const useNotificaciones = (token) => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [leidas, setLeidas] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('notif_leidas') || '[]'); }
        catch { return []; }
    });
    useEffect(() => {
        if (!token) return;
        const fetchData = async () => {
            try {
                const [logsRes, ipsRes] = await Promise.all([
                    fetch(`${BASE_URL}/logs`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${BASE_URL}/seguridad/ips-bloqueadas`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                const logs = logsRes.ok ? await logsRes.json() : [];
                const ips  = ipsRes.ok  ? await ipsRes.json()  : [];
                const notifs = [];
                logs.forEach(log => {
                    if (log.tipo === 'ERROR' || log.tipo === 'WARN')
                        notifs.push({ id: `log-${log.id}`, tipo: log.tipo, mensaje: log.mensaje, fecha: log.fechaHora });
                    if (log.tipo === 'INFO' && log.mensaje.includes('fue registrado'))
                        notifs.push({ id: `log-${log.id}`, tipo: 'USUARIO', mensaje: log.mensaje, fecha: log.fechaHora });
                    if (log.tipo === 'INFO' && log.mensaje.includes('cambió estado a false'))
                        notifs.push({ id: `log-${log.id}`, tipo: 'SERVICIO', mensaje: log.mensaje, fecha: log.fechaHora });
                });
                ips.forEach(ip => notifs.push({
                    id: `ip-${ip.id}`, tipo: 'IP',
                    mensaje: `IP ${ip.ip} bloqueada — ${ip.motivo}`, fecha: ip.fechaBloqueo
                }));
                notifs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                setNotificaciones(notifs.slice(0, 10));
            } catch {}
        };
        fetchData();
    }, [token]);
    const noLeidas = notificaciones.filter(n => !leidas.includes(n.id)).length;
    const marcarLeidas = () => {
        const ids = notificaciones.map(n => n.id);
        sessionStorage.setItem('notif_leidas', JSON.stringify(ids));
        setLeidas(ids);
    };
    return { notificaciones, noLeidas, marcarLeidas };
};

const useBusqueda = (token) => {
    const [query, setQuery]           = useState('');
    const [resultados, setResultados] = useState(null);
    const [buscando, setBuscando]     = useState(false);
    const buscar = useCallback(async (q) => {
        if (q.length < 2) { setResultados(null); return; }
        setBuscando(true);
        try {
            const [uRes, eRes, sRes, lRes] = await Promise.all([
                fetch(`${BASE_URL}/usuarios`,      { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_URL}/cpanel/emails`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_URL}/servicios`,     { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_URL}/logs`,          { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const usuarios  = uRes.ok ? await uRes.json() : [];
            const emails    = eRes.ok ? await eRes.json() : [];
            const servicios = sRes.ok ? await sRes.json() : [];
            const logs      = lRes.ok ? await lRes.json() : [];
            const q_ = q.toLowerCase();
            setResultados({
                usuarios:  usuarios.filter(u => u.nombre?.toLowerCase().includes(q_) || u.email?.toLowerCase().includes(q_)).slice(0, 3),
                emails:    emails.filter(e => e.email?.toLowerCase().includes(q_) && e.email.includes('@supermetalseconds.com')).slice(0, 3),
                servicios: servicios.filter(s => s.nombre?.toLowerCase().includes(q_)).slice(0, 3),
                logs:      logs.filter(l => l.mensaje?.toLowerCase().includes(q_)).slice(0, 3),
            });
        } catch { setResultados(null); }
        finally { setBuscando(false); }
    }, [token]);
    useEffect(() => {
        const t = setTimeout(() => buscar(query), 300);
        return () => clearTimeout(t);
    }, [query, buscar]);
    const totalResultados = resultados
        ? Object.values(resultados).reduce((acc, arr) => acc + arr.length, 0)
        : 0;
    return { query, setQuery, resultados, buscando, totalResultados };
};

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const token    = sessionStorage.getItem('token');
    const rol       = sessionStorage.getItem('rol') || 'USER';
    const esAdmin   = rol === 'ADMIN';
    const esAuditor = rol === 'AUDITOR';

    const bellRef   = useRef(null);
    const searchRef = useRef(null);

    const [dropOpen, setDropOpen]     = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('theme') === 'dark');

    const toggleDark = () => {
        const nuevo = !darkMode;
        setDarkMode(nuevo);
        if (nuevo) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
        else       { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    };

    const { notificaciones, noLeidas, marcarLeidas } = useNotificaciones(token);
    const { query, setQuery, resultados, buscando, totalResultados } = useBusqueda(token);

    const titles = {
        '/dashboard': 'Dashboard', '/emails': 'Emails', '/usuarios': 'Usuarios',
        '/servicios': 'Gestión de Servicios', '/logs': 'Logs',
        '/seguridad': 'Seguridad', '/accesos': 'Accesos a buzones', '/configuracion': 'Configuración',
    };
    const currentTitle = titles[location.pathname] || 'Dashboard';
    const handleLogout = () => { sessionStorage.clear(); navigate('/'); };

    useEffect(() => {
        const handler = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target))     setDropOpen(false);
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); } };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [setQuery]);

    const handleBellClick = () => {
        if (!dropOpen) marcarLeidas();
        setDropOpen(p => !p);
        setSearchOpen(false);
    };
    const handleSearchFocus = () => { setSearchOpen(true); setDropOpen(false); };
    const irA = (path) => { setSearchOpen(false); setQuery(''); navigate(path); };

    const NavItem = ({ path, label, icon }) => (
        <div onClick={() => navigate(path)}
            className={`mx-2 px-4 py-2 rounded-md text-sm flex items-center gap-2 cursor-pointer mt-1 ${
                location.pathname === path ? 'bg-accent text-white font-medium' : 'text-white/55 hover:bg-white/10'
            }`}>
            {icon}{label}
        </div>
    );

    // Bottom nav item para móvil
    const BottomNavItem = ({ path, icon }) => (
        <div onClick={() => navigate(path)}
            style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '8px 0', cursor: 'pointer',
                color: location.pathname === path ? '#1d6fa4' : 'var(--color-panel-text3)',
                borderTop: location.pathname === path ? '2px solid #1d6fa4' : '2px solid transparent',
                transition: 'all 0.15s',
            }}>
            {icon}
        </div>
    );

    const SeccionResultados = ({ titulo, items, renderItem }) => {
        if (!items || items.length === 0) return null;
        return (
            <div>
                <div style={{ padding: '6px 14px 4px', fontSize: '10px', fontWeight: 700, color: '#98a8bb', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{titulo}</div>
                {items.map((item, i) => renderItem(item, i))}
            </div>
        );
    };

    const ResultadoRow = ({ onClick, left, right, sub }) => (
        <div onClick={onClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-panel-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div>
                <div style={{ fontSize: '13px', color: 'var(--color-panel-text)', fontWeight: 500 }}>{left}</div>
                {sub && <div style={{ fontSize: '11px', color: 'var(--color-panel-text3)', marginTop: '1px' }}>{sub}</div>}
            </div>
            {right && <div style={{ fontSize: '11px', color: 'var(--color-panel-text3)', fontFamily: "'IBM Plex Mono', monospace" }}>{right}</div>}
        </div>
    );

    return (
        <div className="flex min-h-screen bg-panel-bg">

            {/* ── SIDEBAR — solo desktop ── */}
            <aside className="hidden md:flex w-60 bg-navy flex-col fixed top-0 left-0 h-full overflow-y-auto">
                <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                    <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                    </div>
                    <div>
                        <div className="text-white font-bold text-sm">AdminPanel - SuperMetalPPG</div>
                        <div className="text-white/40 text-xs">Gestión empresarial</div>
                    </div>
                </div>
                <nav className="flex-1 py-4">
                    {!esAuditor && <div className="px-4 py-2 text-white/30 text-xs font-semibold tracking-widest uppercase">Principal</div>}
                    {!esAuditor && <NavItem path="/dashboard" label="Dashboard" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}/>}
                    <NavItem path="/emails" label="Emails" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}/>
                    {!esAuditor && <NavItem path="/usuarios" label="Usuarios" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}/>}
                    {!esAuditor && <NavItem path="/servicios" label="Servicios" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>}/>}
                    {!esAuditor && <div className="px-4 py-2 text-white/30 text-xs font-semibold tracking-widest uppercase mt-3">Sistema</div>}
                    {!esAuditor && <NavItem path="/logs" label="Logs" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}/>}
                    {esAdmin && <NavItem path="/accesos" label="Accesos a buzones" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}/>}
                    {!esAuditor && <NavItem path="/seguridad" label="Seguridad" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}/>}
                    {!esAuditor && <NavItem path="/configuracion" label="Configuración" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}/>}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-white/55 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main className="md:ml-60 flex-1 min-w-0 flex flex-col min-h-screen">

                {/* TOPBAR */}
                <div className="h-14 bg-panel-surface border-b border-panel-border flex items-center px-4 md:px-7 gap-4 sticky top-0 z-10">
                    <div className="flex-1 text-sm text-panel-text3 truncate">
                        <span className="hidden md:inline">AdminPanel - SuperMetalPPG / </span>
                        <span className="text-panel-text font-semibold">{currentTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Búsqueda — solo desktop */}
                        <div ref={searchRef} className="hidden md:block" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-panel-bg)', border: `1px solid ${searchOpen ? '#1d6fa4' : 'var(--color-panel-border)'}`, borderRadius: '6px', padding: '6px 10px', width: searchOpen ? '220px' : '160px', transition: 'all 0.2s', boxShadow: searchOpen ? '0 0 0 3px rgba(29,111,164,0.1)' : 'none' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? '#1d6fa4' : 'var(--color-panel-text3)'} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                                <input placeholder="Buscar..." value={query} onChange={e => setQuery(e.target.value)} onFocus={handleSearchFocus}
                                    style={{ border: 'none', outline: 'none', fontSize: '12px', color: 'var(--color-panel-text)', fontFamily: 'Inter, sans-serif', background: 'transparent', width: '100%' }} />
                                {query && <button onClick={() => { setQuery(''); setSearchOpen(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-panel-text3)', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>}
                            </div>
                            {searchOpen && (
                                <div style={{ position: 'absolute', top: '38px', right: 0, width: '360px', background: 'var(--color-panel-surface)', border: '1px solid var(--color-panel-border)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(26,46,74,0.12)', zIndex: 100, overflow: 'hidden', animation: 'fadeUp 0.15s ease' }}>
                                    {!query && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-panel-text3)', fontSize: '13px' }}>Escribe para buscar en el panel...</div>}
                                    {query.length === 1 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-panel-text3)', fontSize: '12px' }}>Escribe al menos 2 caracteres</div>}
                                    {query.length >= 2 && buscando && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-panel-text3)', fontSize: '13px' }}>Buscando...</div>}
                                    {query.length >= 2 && !buscando && resultados && totalResultados === 0 && (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-panel-text3)', fontSize: '13px' }}>Sin resultados para <strong style={{ color: 'var(--color-panel-text)' }}>"{query}"</strong></div>
                                    )}
                                    {query.length >= 2 && !buscando && resultados && totalResultados > 0 && (
                                        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                            <SeccionResultados titulo="Usuarios" items={resultados.usuarios} renderItem={(u, i) => <ResultadoRow key={i} onClick={() => irA('/usuarios')} left={u.nombre} sub={u.email} right={u.role} />}/>
                                            <SeccionResultados titulo="Emails" items={resultados.emails} renderItem={(e, i) => <ResultadoRow key={i} onClick={() => irA('/emails')} left={e.email} right={e.suspendedLogin ? 'Suspendido' : 'Activo'} />}/>
                                            <SeccionResultados titulo="Servicios" items={resultados.servicios} renderItem={(s, i) => <ResultadoRow key={i} onClick={() => irA('/servicios')} left={s.nombre} sub={s.descripcion} right={s.activo ? 'Activo' : 'Inactivo'} />}/>
                                            <SeccionResultados titulo="Logs" items={resultados.logs} renderItem={(l, i) => <ResultadoRow key={i} onClick={() => irA('/logs')} left={l.mensaje.length > 50 ? l.mensaje.slice(0,50)+'...' : l.mensaje} right={l.tipo} />}/>
                                        </div>
                                    )}
                                    {query.length >= 2 && !buscando && resultados && totalResultados > 0 && (
                                        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-panel-border)', background: 'var(--color-panel-bg)' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--color-panel-text3)' }}>{totalResultados} resultado{totalResultados !== 1 ? 's' : ''} · Click para ir a la sección</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Dark mode */}
                        <div onClick={toggleDark} className="w-8 h-8 bg-panel-surface border border-panel-border rounded-md flex items-center justify-center cursor-pointer hover:border-accent text-panel-text3" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
                            {darkMode ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            )}
                        </div>

                        {/* Campanita */}
                        <div ref={bellRef} style={{ position: 'relative' }}>
                            <div onClick={handleBellClick} className="w-8 h-8 bg-panel-surface border border-panel-border rounded-md flex items-center justify-center cursor-pointer hover:border-accent relative text-panel-text3">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                {noLeidas > 0 && <div style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', borderRadius: '50%', background: '#c0392b', border: '1.5px solid white' }} />}
                            </div>
                            {dropOpen && (
                                <div style={{ position: 'absolute', top: '38px', right: 0, width: '300px', background: 'var(--color-panel-surface)', border: '1px solid var(--color-panel-border)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(26,46,74,0.12)', zIndex: 100, overflow: 'hidden', animation: 'fadeUp 0.15s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--color-panel-border)', background: 'var(--color-panel-bg)' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-panel-text)' }}>Notificaciones</div>
                                        <span style={{ fontSize: '11px', color: 'var(--color-panel-text3)', fontFamily: "'IBM Plex Mono', monospace" }}>{notificaciones.length} eventos</span>
                                    </div>
                                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                        {notificaciones.length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-panel-text3)', fontSize: '13px' }}>Sin notificaciones recientes</div>
                                        ) : notificaciones.map(notif => {
                                            const cfg = tipoNotif[notif.tipo] || tipoNotif.WARN;
                                            return (
                                                <div key={notif.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 16px', borderBottom: '1px solid var(--color-panel-border)', transition: 'background 0.1s', cursor: 'default' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-panel-bg)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: '5px' }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '12.5px', color: 'var(--color-panel-text)', lineHeight: 1.4, wordBreak: 'break-word' }}>{notif.mensaje}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-panel-text3)', marginTop: '3px', fontFamily: "'IBM Plex Mono', monospace" }}>{tiempoDesde(notif.fecha)}</div>
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, marginTop: '2px' }}>{notif.tipo}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-panel-border)', background: 'var(--color-panel-bg)', textAlign: 'center' }}>
                                        <span onClick={() => { setDropOpen(false); navigate('/logs'); }} style={{ fontSize: '12px', color: '#1d6fa4', cursor: 'pointer', fontWeight: 500 }}>Ver todos los registros →</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cerrar sesión — solo desktop */}
                        <div onClick={handleLogout} className="hidden md:flex w-8 h-8 bg-panel-surface border border-panel-border rounded-md items-center justify-center cursor-pointer hover:border-accent text-panel-text3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO */}
                <div className="flex-1 p-4 md:p-7 pb-20 md:pb-7">{children}</div>
            </main>

            {/* ── BOTTOM NAV — solo móvil ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-panel-surface border-t border-panel-border flex items-stretch" style={{ height: '60px' }}>
                {!esAuditor && <BottomNavItem path="/dashboard" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}/>}
                <BottomNavItem path="/emails" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}/>
                {!esAuditor && <BottomNavItem path="/usuarios" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}/>}
                {!esAuditor && <BottomNavItem path="/servicios" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>}/>}
                {!esAuditor && <BottomNavItem path="/logs" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}/>}
                {!esAuditor && <BottomNavItem path="/configuracion" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}/>}
            </nav>

            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
    );
};

export default Layout;