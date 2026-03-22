import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const BASE_URL = "https://panelcontrol-backend-production.up.railway.app";

const getConfiguracion = async (token) => {
    const response = await fetch(`${BASE_URL}/configuracion`, {
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch configuracion");
    return response.json();
};

const InfoCard = ({ title, items }) => (
    <div className="panel-card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-panel-border)', background: 'var(--color-panel-bg)' }}>
            <div className="panel-title" style={{ fontSize: '13px' }}>{title}</div>
        </div>
        <div style={{ padding: '4px 0' }}>
            {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < items.length - 1 ? '1px solid var(--color-panel-border)' : 'none' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-panel-text3)' }}>{item.label}</div>
                    <div style={{
                        fontSize: '13px', fontWeight: 500,
                        color: item.highlight ? item.highlight : 'var(--color-panel-text)',
                        fontFamily: item.mono ? "'IBM Plex Mono', monospace" : 'Inter, sans-serif',
                        background: item.badge ? item.badgeBg || '#e8f2f9' : 'transparent',
                        padding: item.badge ? '3px 10px' : '0',
                        borderRadius: item.badge ? '4px' : '0',
                        border: item.badge ? `1px solid ${item.badgeBorder || '#b3d4ea'}` : 'none',
                    }}>{item.value}</div>
                </div>
            ))}
        </div>
    </div>
);

const JwtIndicator = ({ horas }) => {
    const porcentaje = Math.min((horas / 168) * 100, 100);
    const color   = horas <= 1 ? '#c0392b' : horas <= 8 ? '#b45309' : '#1a7f5a';
    const bgColor = horas <= 1 ? '#fdecea' : horas <= 8 ? '#fef3cd' : '#e6f4ee';

    return (
        <div style={{ padding: '20px', background: 'var(--color-panel-surface)', border: '1px solid var(--color-panel-border)', borderRadius: '10px', boxShadow: '0 1px 3px rgba(26,46,74,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-panel-text)' }}>Expiración del token JWT</div>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '4px', background: bgColor, color, border: `1px solid ${color}40`, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {horas}h configuradas
                </span>
            </div>
            <div style={{ background: 'var(--color-panel-bg)', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${porcentaje}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-panel-text3)' }}>
                {horas <= 1
                    ? '⚠ Token muy corto — los usuarios tendrán que hacer login muy seguido.'
                    : horas <= 8
                    ? 'Token de corta duración — bueno para seguridad.'
                    : horas === 24
                    ? 'Configuración estándar — expira cada 24 horas.'
                    : `Token de larga duración — ${horas} horas antes de expirar.`}
            </div>
        </div>
    );
};

const Configuracion = () => {
    const [config, setConfig]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const navigate = useNavigate();
    const token = sessionStorage.getItem('token');

    useEffect(() => {
        if (!token) { navigate('/'); return; }
        getConfiguracion(token)
            .then(data => { setConfig(data); setLoading(false); })
            .catch(() => { setError('No se pudo cargar la configuración.'); setLoading(false); });
    }, []);

    if (loading) return (
        <Layout>
            <div style={{ textAlign: 'center', padding: '64px', fontSize: '13px' }} className="panel-text-secondary">Cargando configuración...</div>
        </Layout>
    );

    if (error) return (
        <Layout>
            <div style={{ textAlign: 'center', padding: '64px', color: '#c0392b', fontSize: '13px' }}>{error}</div>
        </Layout>
    );

    return (
        <Layout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-panel-text)' }}>Configuración del sistema</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-panel-text3)', marginTop: '2px' }}>Información general del panel</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '4px', background: '#e6f4ee', color: '#1a7f5a', border: '1px solid #b2dfcf', fontFamily: "'IBM Plex Mono', monospace" }}>
                        v{config.version} · {config.entorno}
                    </span>
                </div>

                {/* GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <InfoCard title="General" items={[
                        { label: 'Nombre del sistema', value: config.nombreSistema, mono: true },
                        { label: 'Versión', value: config.version, mono: true, badge: true, badgeBg: '#e8f2f9', badgeBorder: '#b3d4ea', highlight: '#1d6fa4' },
                        { label: 'Entorno', value: config.entorno, badge: true, badgeBg: '#e6f4ee', badgeBorder: '#b2dfcf', highlight: '#1a7f5a' },
                        { label: 'Zona horaria', value: config.zonaHoraria },
                    ]} />
                    <InfoCard title="Seguridad" items={[
                        { label: 'Algoritmo JWT', value: 'HS256', mono: true },
                        { label: 'Duración del token', value: `${config.jwtExpiracionHoras} horas`, mono: true },
                        { label: 'Expiración en ms', value: `${config.jwtExpiracionMs.toLocaleString()} ms`, mono: true },
                        { label: 'Cifrado contraseñas', value: 'BCrypt', mono: true, badge: true, badgeBg: '#e6f4ee', badgeBorder: '#b2dfcf', highlight: '#1a7f5a' },
                    ]} />
                </div>

                <JwtIndicator horas={config.jwtExpiracionHoras} />

                <InfoCard title="Información del sistema" items={[
                    { label: 'Framework', value: 'Spring Boot 3.5', mono: true },
                    { label: 'Lenguaje', value: 'Java 21', mono: true },
                    { label: 'Base de datos', value: 'SQL Server', mono: true },
                    { label: 'Frontend', value: 'React + Vite + Tailwind CSS v4', mono: true },
                    { label: 'Integración cPanel', value: 'UAPI · Puerto 2083', mono: true },
                ]} />
            </div>
        </Layout>
    );
};

export default Configuracion;