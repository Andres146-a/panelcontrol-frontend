import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getAccesosBuzon } from '../services/api';

const colorResultado = { OK: '#1a7f5a', ERROR: '#c0392b', PENDIENTE: '#b45309' };

const formatFecha = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Accesos = () => {
    const [accesos, setAccesos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        getAccesosBuzon(token)
            .then(setAccesos)
            .catch(() => setError('No se pudo cargar el registro de accesos.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="dm-surface" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--color-panel-text2)' }}>
                    Cada apertura de un buzón queda registrada con quién, cuándo, desde qué IP y con qué motivo. Últimos 100 accesos.
                </div>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px' }} className="panel-text-secondary">Cargando...</div>
                ) : error ? (
                    <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: '#c0392b' }}>{error}</div>
                ) : accesos.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px' }} className="panel-text-secondary">Aún no hay accesos registrados.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="panel-thead">
                                    {['Fecha', 'Solicitante', 'Buzón', 'Motivo', 'IP', 'Resultado'].map(h => <th key={h}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="panel-tbody">
                                {accesos.map(a => (
                                    <tr key={a.id}>
                                        <td className="panel-td" style={{ whiteSpace: 'nowrap' }}>{formatFecha(a.fechaHora)}</td>
                                        <td className="panel-td">{a.solicitante}</td>
                                        <td className="panel-td" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{a.buzon}</td>
                                        <td className="panel-td" style={{ maxWidth: '320px' }}>{a.motivo}</td>
                                        <td className="panel-td" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{a.ip}</td>
                                        <td className="panel-td" style={{ fontWeight: 600, color: colorResultado[a.resultado] }}>{a.resultado}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Accesos;
