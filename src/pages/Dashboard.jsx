import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDashboardStats, getAccesosPorDia, getAccesosBuzon, getEmails, getResumenCuentas } from '../services/api';

const DOMINIO = '@supermetalseconds.com';

const tiempoDesde = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1)    return 'Ahora mismo';
    if (diff < 60)   return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`;
    return `Hace ${Math.floor(diff / 1440)} d`;
};

const Card = ({ titulo, valor, sub, color = '#1d6fa4', bg = '#e8f2f9', icon }) => (
    <div className="bg-panel-surface border border-panel-border rounded-xl p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-panel-text3 uppercase tracking-wide">{titulo}</p>
                <p className="text-2xl font-bold text-panel-text mt-1">{valor}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">{icon}</svg>
            </div>
        </div>
        <div className="mt-3"><span className="text-xs text-panel-text3">{sub}</span></div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats]     = useState({});
    const [grafico, setGrafico] = useState([]);
    const [accesos, setAccesos] = useState([]);
    const [emails, setEmails]   = useState([]);
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");

    useEffect(() => {
        if (!token) { navigate("/"); return; }
        Promise.allSettled([
            getDashboardStats(token), getAccesosPorDia(token), getAccesosBuzon(token),
            getEmails(token), getResumenCuentas(token),
        ]).then(([s, g, a, e, r]) => {
            if (s.status === 'fulfilled') setStats(s.value);
            if (g.status === 'fulfilled') setGrafico(g.value);
            if (a.status === 'fulfilled') setAccesos(a.value);
            if (e.status === 'fulfilled') setEmails(e.value.filter(x => x.email?.endsWith(DOMINIO)));
            if (r.status === 'fulfilled') setResumen(r.value);
            setLoading(false);
        });
    }, []);

    const total = resumen?.cuentasDominio ?? emails.length;
    const limite = !resumen ? '-' : resumen.ilimitado ? 'Ilimitadas' : resumen.limite != null ? resumen.limite : '-';
    const suspendidas = emails.filter(e => e.suspendedLogin).length;
    const maxAcc = grafico.length ? Math.max(...grafico.map(d => d.accesos), 1) : 1;
    const hoy = new Date().toDateString();
    const v = (x) => loading ? '...' : x;

    return (
        <Layout>
            <div className="p-0 md:p-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                    <Card titulo="Cuentas de correo" valor={v(total)} sub={loading ? '' : `${total - suspendidas} activas · ${suspendidas} suspendidas`}
                        icon={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>} />
                    <Card titulo="Límite del plan" valor={v(limite)} sub="Las cuentas nuevas las crea el administrador" color="#6d4cc2" bg="#efeafa"
                        icon={<><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></>} />
                    <Card titulo="Buzones abiertos hoy" valor={v(stats.accesosHoy || 0)} sub="Accesos supervisados" color="#1a7f5a" bg="#e6f4ee"
                        icon={<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>} />
                    <Card titulo="Últimos 7 días" valor={v(stats.accesosSemana || 0)} sub="Accesos a buzones" color="#b45309" bg="#fef3cd"
                        icon={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
                    <div className="lg:col-span-2 bg-panel-surface border border-panel-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-panel-border">
                            <div className="text-sm font-semibold text-panel-text">Accesos a buzones</div>
                            <div className="text-xs text-panel-text3 mt-0.5">Por día — últimos 7 días</div>
                        </div>
                        <div className="p-5">
                            {loading ? <div className="h-28 flex items-center justify-center text-xs text-panel-text3">Cargando...</div> : (
                                <div className="flex items-end gap-3 h-28">
                                    {grafico.map((d, i) => {
                                        const esHoy = new Date(d.fecha + 'T00:00:00').toDateString() === hoy;
                                        const altura = Math.max((d.accesos / maxAcc) * 100, d.accesos > 0 ? 8 : 4);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.accesos} accesos`}>
                                                <span className="text-xs text-panel-text3" style={{ fontSize: '10px' }}>{d.accesos || ''}</span>
                                                <div style={{ width: '100%', height: `${altura}%`, borderRadius: '4px 4px 0 0', background: esHoy ? '#1a7f5a' : d.accesos === 0 ? '#e2e5eb' : '#1d6fa4' }} />
                                                <span className="text-xs text-panel-text3" style={{ fontSize: '10px' }}>{d.dia}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-panel-surface border border-panel-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-panel-border flex items-center justify-between">
                            <div className="text-sm font-semibold text-panel-text">Últimos accesos</div>
                            <button onClick={() => navigate('/accesos')} className="text-xs" style={{ color: '#1d6fa4', background: 'none', border: 'none', cursor: 'pointer' }}>Ver todos</button>
                        </div>
                        {loading ? <div className="px-5 py-8 text-center text-xs text-panel-text3">Cargando...</div>
                        : accesos.length === 0 ? <div className="px-5 py-8 text-center text-xs text-panel-text3">Aún no se ha abierto ningún buzón</div>
                        : accesos.slice(0, 6).map((a) => (
                            <div key={a.id} className="px-5 py-3 border-b border-panel-border last:border-0">
                                <div className="text-xs text-panel-text2" style={{ wordBreak: 'break-all' }}>{a.buzon}</div>
                                <div className="text-xs text-panel-text3 mt-0.5">{tiempoDesde(a.fechaHora)}{a.resultado ? ` · ${a.resultado}` : ''}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
