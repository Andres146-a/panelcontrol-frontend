import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSSLInfo, getEmails, getFTP } from '../services/api';

const DOMINIO = 'supermetalseconds.com';

const StatCard = ({ title, icon, iconBg, iconColor, children }) => (
    <div style={{ flex: '1 1 220px', minWidth: 0, background: 'var(--color-panel-surface)', border: '1px solid var(--color-panel-border)', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(26,46,74,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--color-panel-text3)', fontWeight: 500 }}>{title}</div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>{icon}</div>
        </div>
        {children}
    </div>
);

const InfoRow = ({ icon, iconBg, iconColor, nombre, detalle, badge, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: last ? 'none' : '1px solid var(--color-panel-border)', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-panel-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: iconBg, border: `1px solid ${iconColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: 'var(--color-panel-text)', fontWeight: 500 }}>{nombre}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-panel-text3)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>{detalle}</div>
        </div>
        {badge}
    </div>
);

const Badge = ({ ok, label }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", background: ok ? '#e6f4ee' : '#fdecea', color: ok ? '#1a7f5a' : '#c0392b', border: `1px solid ${ok ? '#b2dfcf' : '#f5c6c2'}` }}>{label}</span>
);

const IconSSL = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconEmail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconFTP = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;

const Servicios = () => {
    const [ssl, setSSL]         = useState(null);
    const [emails, setEmails]   = useState([]);
    const [ftp, setFTP]         = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchTodo = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        setLoading(true);
        try {
            const [sslData, emailsData, ftpData] = await Promise.allSettled([
                getSSLInfo(token), getEmails(token), getFTP(token),
            ]);
            if (sslData.status === 'fulfilled')    setSSL(sslData.value);
            if (emailsData.status === 'fulfilled') setEmails(emailsData.value.filter(e => e.email?.endsWith('@' + DOMINIO)));
            if (ftpData.status === 'fulfilled')    setFTP(ftpData.value);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchTodo(); }, []);

    const diasSSL      = ssl?.diasRestantes ?? null;
    const sslOk        = diasSSL !== null && diasSSL > 14;
    const emailActivos = emails.filter(e => !e.suspendedLogin).length;
    const ftpPrincipal = ftp.find(f => f.tipo === 'main');

    return (
        <Layout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* TARJETAS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <StatCard title="Certificado SSL" iconBg={sslOk ? '#e8f2f9' : '#fdecea'} iconColor={sslOk ? '#1d6fa4' : '#c0392b'} icon={<IconSSL />}>
                        {loading ? <div style={{ fontSize: 13, color: 'var(--color-panel-text3)' }}>Cargando...</div> : ssl ? (
                            <>
                                <div style={{ fontSize: 30, fontWeight: 700, color: sslOk ? 'var(--color-panel-text)' : '#c0392b', letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>{diasSSL}d</div>
                                <div style={{ fontSize: 12, color: sslOk ? 'var(--color-panel-text3)' : '#c0392b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {!sslOk && '⚠ '}{sslOk ? `Válido — ${DOMINIO}` : `Vence pronto — ${DOMINIO}`}
                                </div>
                            </>
                        ) : <div style={{ fontSize: 12, color: 'var(--color-panel-text3)' }}>No disponible</div>}
                    </StatCard>

                    <StatCard title="Cuentas de Correo" iconBg="#e8f2f9" iconColor="#1d6fa4" icon={<IconEmail />}>
                        {loading ? <div style={{ fontSize: 13, color: 'var(--color-panel-text3)' }}>Cargando...</div> : (
                            <>
                                <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-panel-text)', letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>{emails.length}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-panel-text3)' }}>{emailActivos} activas en {DOMINIO}</div>
                            </>
                        )}
                    </StatCard>

                    <StatCard title="Acceso FTP" iconBg="#e8f2f9" iconColor="#1d6fa4" icon={<IconFTP />}>
                        {loading ? <div style={{ fontSize: 13, color: 'var(--color-panel-text3)' }}>Cargando...</div> : ftpPrincipal ? (
                            <>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-panel-text)', letterSpacing: -0.3, lineHeight: 1.3, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>{DOMINIO}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-panel-text3)' }}>Cuenta principal activa</div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-panel-text3)', marginBottom: 6 }}>—</div>
                                <div style={{ fontSize: 12, color: 'var(--color-panel-text3)' }}>Sin cuenta FTP principal</div>
                            </>
                        )}
                    </StatCard>
                </div>

                {/* PANEL INFORMATIVO */}
                <div className="panel-card">
                    <div className="panel-header">
                        <div>
                            <div className="panel-title">Resumen de servicios</div>
                            <div className="panel-sub">Estado actual de los servicios de {DOMINIO}</div>
                        </div>
                        <button onClick={fetchTodo}
                            style={{ padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--color-panel-text2)', border: '1px solid var(--color-panel-border)', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor='#1d6fa4'; e.currentTarget.style.color='#1d6fa4'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--color-panel-border)'; e.currentTarget.style.color='var(--color-panel-text2)'; }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                            Actualizar
                        </button>
                    </div>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', fontSize: 13 }} className="panel-text-secondary">Cargando...</div>
                    ) : (
                        <>
                            <InfoRow icon={<IconSSL />} iconBg={sslOk ? '#e8f2f9' : '#fdecea'} iconColor={sslOk ? '#1d6fa4' : '#c0392b'} nombre="Certificado SSL" detalle={ssl ? `${ssl.emisor} · Vence en ${diasSSL} días · ${ssl.commonName}` : 'No disponible'} badge={<Badge ok={sslOk} label={sslOk ? 'Válido' : 'Vence pronto'} />} />
                            <InfoRow icon={<IconEmail />} iconBg="#e8f2f9" iconColor="#1d6fa4" nombre="Cuentas de Correo" detalle={`${emails.length} cuentas · ${emailActivos} activas · ${emails.length - emailActivos} suspendidas`} badge={<Badge ok={emails.length > 0} label={emails.length > 0 ? 'Activo' : 'Sin cuentas'} />} />
                            <InfoRow icon={<IconFTP />} iconBg={ftpPrincipal ? '#e8f2f9' : '#f5f5f5'} iconColor={ftpPrincipal ? '#1d6fa4' : '#98a8bb'} nombre="Acceso FTP" detalle={ftpPrincipal ? `Cuenta principal activa · ${DOMINIO}` : 'Sin cuenta FTP principal configurada'} badge={<Badge ok={!!ftpPrincipal} label={ftpPrincipal ? 'Activo' : 'Inactivo'} />} last />
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Servicios;