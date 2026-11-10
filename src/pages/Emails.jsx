import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmails, crearEmail, cambiarPasswordEmail, eliminarEmail, abrirBuzon } from '../services/api';
import Layout from '../components/Layout';

const DOMINIO_CLIENTE = 'supermetalseconds.com';

const Modal = ({ title, onClose, children }) => (
    <div onClick={e => e.target === e.currentTarget && onClose()}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(26,46,74,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dm-modal-bg" style={{ width: '440px', animation: 'fadeUp 0.2s ease' }}>
            <div className="dm-modal-title">{title}</div>
            {children}
        </div>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
);

const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom: '16px' }}>
        <label className="dm-label">{label}</label>
        {children}
        {hint && <div style={{ fontSize: '11px', color: 'var(--color-panel-text3)', marginTop: '4px' }}>{hint}</div>}
    </div>
);

const ModalFooter = ({ onClose, onConfirm, confirmLabel, confirmColor, loading }) => (
    <div className="dm-footer">
        <button className="dm-btn-cancel" onClick={onClose}>Cancelar</button>
        <button onClick={onConfirm} disabled={loading} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', background: confirmColor || '#1d6fa4', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Procesando...' : confirmLabel}
        </button>
    </div>
);

const Badge = ({ activo }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", background: activo ? '#e6f4ee' : '#fdecea', color: activo ? '#1a7f5a' : '#c0392b', border: `1px solid ${activo ? '#b2dfcf' : '#f5c6c2'}` }}>
        {activo ? 'Activo' : 'Suspendido'}
    </span>
);

const ActionBtn = ({ onClick, title, hoverBg, hoverBorder, hoverColor, children }) => (
    <button onClick={onClick} title={title}
        style={{ width: '28px', height: '28px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: '1px solid transparent', color: 'var(--color-panel-text3)', transition: 'all 0.12s' }}
        onMouseEnter={e => { e.currentTarget.style.background=hoverBg; e.currentTarget.style.borderColor=hoverBorder; e.currentTarget.style.color=hoverColor; }}
        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--color-panel-text3)'; }}
    >{children}</button>
);

const Emails = () => {
    const [emails, setEmails]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError]                 = useState('');
    const [errorCarga, setErrorCarga]       = useState('');
    const [busqueda, setBusqueda]           = useState('');
    const [modalCrear, setModalCrear]       = useState(false);
    const [modalPassword, setModalPassword] = useState(null);
    const [modalEliminar, setModalEliminar] = useState(null);
    const formCrearInicial = { email: '', password: '', quota: 0 };
    const [formCrear, setFormCrear]         = useState(formCrearInicial);
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [modalBuzon, setModalBuzon]       = useState(null);
    const [motivo, setMotivo]               = useState('');
    const navigate = useNavigate();
    const token    = sessionStorage.getItem("token");
    const rol      = sessionStorage.getItem("rol") || 'USER';
    const puedeAbrirBuzon = rol === 'ADMIN' || rol === 'AUDITOR';
    const puedeGestionar  = rol === 'ADMIN';

    const fetchEmails = async () => {
        if (!token) { navigate("/"); return; }
        setLoading(true);
        setErrorCarga('');
        try {
            const data = await getEmails(token);
            setEmails(data.filter(e => e.email && e.email.endsWith('@' + DOMINIO_CLIENTE)));
        } catch (err) {
            // Solo se cierra la sesion si el token no sirve; un fallo de cPanel no es un logout.
            if (err.status === 401 || err.status === 403) { navigate("/"); return; }
            setErrorCarga('No se pudieron cargar las cuentas de correo (error del servidor o de cPanel). Intenta de nuevo en unos minutos.');
        }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchEmails(); }, []);

    const emailsFiltrados  = emails.filter(e => e.email.toLowerCase().includes(busqueda.toLowerCase()));
    const totalActivos     = emailsFiltrados.filter(e => !e.suspendedLogin).length;
    const totalSuspendidos = emailsFiltrados.filter(e => e.suspendedLogin).length;

    const handleCrear = async () => {
        setError('');
        if (!formCrear.email || !formCrear.password) { setError('Email y contraseña son obligatorios.'); return; }
        if (!formCrear.email.includes('@')) { setError(`Incluye el dominio. Ej: nombre@${DOMINIO_CLIENTE}`); return; }
        setActionLoading(true);
        try { await crearEmail(token, formCrear); await fetchEmails(); setModalCrear(false); setFormCrear(formCrearInicial); }
        catch (err) { setError(err.message || 'Error al crear el correo.'); }
        finally { setActionLoading(false); }
    };

    const handleCambiarPassword = async () => {
        setError('');
        if (!nuevaPassword) { setError('La contraseña es obligatoria.'); return; }
        setActionLoading(true);
        try { await cambiarPasswordEmail(token, modalPassword, nuevaPassword); setModalPassword(null); setNuevaPassword(''); }
        catch (err) { setError(err.message || 'Error al cambiar la contraseña.'); }
        finally { setActionLoading(false); }
    };

    const handleAbrirBuzon = async () => {
        setError('');
        if (motivo.trim().length < 10) { setError('Describe el motivo (mínimo 10 caracteres).'); return; }
        setActionLoading(true);
        // La ventana se abre antes del await para que el navegador no bloquee el popup.
        const ventana = window.open('', '_blank');
        try {
            const url = await abrirBuzon(token, modalBuzon, motivo.trim());
            if (ventana) { ventana.opener = null; ventana.location.href = url; } else { window.location.href = url; }
            setModalBuzon(null); setMotivo('');
        } catch (err) {
            if (ventana) ventana.close();
            setError(err.message || 'No se pudo abrir el buzón.');
        }
        finally { setActionLoading(false); }
    };

    const handleEliminar = async () => {
        setActionLoading(true);
        try { await eliminarEmail(token, modalEliminar); await fetchEmails(); setModalEliminar(null); }
        catch (err) { setError(err.message || 'Error al eliminar el correo.'); }
        finally { setActionLoading(false); }
    };

    return (
        <Layout>
            {/* MODAL CREAR */}
            {modalCrear && (
                <Modal title="Crear cuenta de correo" onClose={() => { setModalCrear(false); setError(''); }}>
                    <Field label="Dirección de correo" hint={`Ej: nombre@${DOMINIO_CLIENTE}`}>
                        <input className="dm-input" placeholder={`nombre@${DOMINIO_CLIENTE}`} value={formCrear.email} onChange={e => setFormCrear({ ...formCrear, email: e.target.value })} />
                    </Field>
                    <Field label="Contraseña" hint="Mínimo 10 caracteres · Mayúscula, número y símbolo">
                        <input className="dm-input" type="password" placeholder="Ej: Empresa2026@#$" value={formCrear.password} onChange={e => setFormCrear({ ...formCrear, password: e.target.value })} />
                    </Field>
                    <Field label="Cuota (MB)" hint="0 = ilimitado">
                        <input className="dm-input" type="number" placeholder="0" value={formCrear.quota} onChange={e => setFormCrear({ ...formCrear, quota: parseInt(e.target.value) || 0 })} />
                    </Field>
                    {error && <div style={{ fontSize: '12px', color: '#c0392b', marginBottom: '8px' }}>{error}</div>}
                    <ModalFooter onClose={() => { setModalCrear(false); setError(''); }} onConfirm={handleCrear} confirmLabel="Crear correo" loading={actionLoading} />
                </Modal>
            )}

            {/* MODAL CAMBIAR PASSWORD */}
            {modalPassword && (
                <Modal title="Cambiar contraseña" onClose={() => { setModalPassword(null); setError(''); setNuevaPassword(''); }}>
                    <div className="dm-surface2" style={{ fontSize: '13px', color: 'var(--color-panel-text3)', marginBottom: '20px', padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {modalPassword}
                    </div>
                    <Field label="Nueva contraseña" hint="Mínimo 10 caracteres · Mayúscula, número y símbolo">
                        <input className="dm-input" type="password" placeholder="Ej: NuevaClave2026@#$" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} />
                    </Field>
                    {error && <div style={{ fontSize: '12px', color: '#c0392b', marginBottom: '8px' }}>{error}</div>}
                    <ModalFooter onClose={() => { setModalPassword(null); setError(''); setNuevaPassword(''); }} onConfirm={handleCambiarPassword} confirmLabel="Cambiar contraseña" loading={actionLoading} />
                </Modal>
            )}

            {/* MODAL ABRIR BUZON */}
            {modalBuzon && (
                <Modal title="Abrir buzón (acceso supervisado)" onClose={() => { setModalBuzon(null); setError(''); setMotivo(''); }}>
                    <div className="dm-surface2" style={{ fontSize: '13px', color: 'var(--color-panel-text3)', marginBottom: '16px', padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {modalBuzon}
                    </div>
                    <Field label="Motivo del acceso" hint="Obligatorio. Queda registrado junto con tu usuario, la fecha y tu IP.">
                        <textarea className="dm-input" rows={3} maxLength={300} placeholder="Ej: Revisión por reclamo del cliente X, orden de gerencia" value={motivo} onChange={e => setMotivo(e.target.value)} />
                    </Field>
                    {error && <div style={{ fontSize: '12px', color: '#c0392b', marginBottom: '8px' }}>{error}</div>}
                    <ModalFooter onClose={() => { setModalBuzon(null); setError(''); setMotivo(''); }} onConfirm={handleAbrirBuzon} confirmLabel="Abrir buzón" loading={actionLoading} />
                </Modal>
            )}

            {/* MODAL ELIMINAR */}
            {modalEliminar && (
                <Modal title="Eliminar cuenta de correo" onClose={() => { setModalEliminar(null); setError(''); }}>
                    <div style={{ fontSize: '13.5px', color: 'var(--color-panel-text2)', lineHeight: 1.6 }}>
                        ¿Estás seguro de que quieres eliminar la cuenta{' '}
                        <strong style={{ color: 'var(--color-panel-text)', fontFamily: "'IBM Plex Mono', monospace" }}>{modalEliminar}</strong>?
                        <br /><br />
                        <span style={{ color: '#c0392b', fontSize: '12px' }}>⚠ Esta acción eliminará todos los correos almacenados. No se puede deshacer.</span>
                    </div>
                    {error && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '12px' }}>{error}</div>}
                    <ModalFooter onClose={() => { setModalEliminar(null); setError(''); }} onConfirm={handleEliminar} confirmLabel="Sí, eliminar cuenta" confirmColor="#c0392b" loading={actionLoading} />
                </Modal>
            )}

            {/* PANEL */}
            <div className="panel-card">
                {/* HEADER */}
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Cuentas de Email</div>
                        <div className="panel-sub">{emailsFiltrados.length} cuentas · {totalActivos} activas · {totalSuspendidos} suspendidas</div>
                    </div>
                    {puedeGestionar && <button onClick={() => { setError(''); setFormCrear(formCrearInicial); setModalCrear(true); }}
                        style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: '#1d6fa4', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif' }}>
                        + Nueva cuenta
                    </button>}
                </div>

                {errorCarga && (
                    <div style={{ padding: '10px 20px', fontSize: '13px', color: '#c0392b', background: '#fdecea', borderBottom: '1px solid #f5c6c2' }}>
                        {errorCarga} <button onClick={fetchEmails} style={{ marginLeft: '8px', border: 'none', background: 'none', color: '#1d6fa4', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Reintentar</button>
                    </div>
                )}

                {/* BARRA BÚSQUEDA */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-panel-border)', background: 'var(--color-panel-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-panel-surface)', border: '1px solid var(--color-panel-border)', borderRadius: '6px', padding: '7px 12px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-panel-text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input placeholder="Buscar correo..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--color-panel-text)', fontFamily: 'Inter, sans-serif', width: '100%', background: 'transparent' }} />
                        {busqueda && <button onClick={() => setBusqueda('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-panel-text3)', fontSize: '18px', lineHeight: 1 }}>×</button>}
                    </div>
                </div>

                {/* TABLA */}
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px' }} className="panel-text-secondary">Cargando cuentas...</div>
                ) : emailsFiltrados.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px' }} className="panel-text-secondary">
                        No se encontraron cuentas{busqueda ? ` para "${busqueda}"` : ''}.
                    </div>
                ) : (
                    <div className="tabla-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr className="panel-thead">
                                {['Cuenta de correo', 'Login', 'Recepción', 'Acciones'].map(h => <th key={h} className={(h === 'Login' || h === 'Recepción') ? 'hidden sm:table-cell' : ''}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="panel-tbody">
                            {emailsFiltrados.map((item, i) => {
                                const usuario = item.email.split('@')[0];
                                return (
                                    <tr key={i}>
                                        <td className="panel-td">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1d6fa4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                                    {usuario.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-panel-text)', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>{item.email}</div>
                                                    <div className="hidden sm:block" style={{ fontSize: '11px', color: 'var(--color-panel-text3)', marginTop: '1px' }}>@{DOMINIO_CLIENTE}</div>
                                                    <div className="sm:hidden" style={{ fontSize: '11px', marginTop: '2px', color: (item.suspendedLogin || item.suspendedIncoming) ? '#c0392b' : '#1a7f5a' }}>{(item.suspendedLogin || item.suspendedIncoming) ? 'Suspendido' : 'Activo'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="panel-td hidden sm:table-cell"><Badge activo={!item.suspendedLogin} /></td>
                                        <td className="panel-td hidden sm:table-cell"><Badge activo={!item.suspendedIncoming} /></td>
                                        <td className="panel-td">
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {puedeAbrirBuzon && (
                                                    <ActionBtn onClick={() => { setError(''); setMotivo(''); setModalBuzon(item.email); }} title="Abrir buzón" hoverBg="#e6f4ee" hoverBorder="#b2dfcf" hoverColor="#1a7f5a">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    </ActionBtn>
                                                )}
                                                {puedeGestionar && (<>
                                                <ActionBtn onClick={() => { setError(''); setNuevaPassword(''); setModalPassword(item.email); }} title="Cambiar contraseña" hoverBg="#e8f2f9" hoverBorder="#b3d4ea" hoverColor="#1d6fa4">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                                </ActionBtn>
                                                <ActionBtn onClick={() => { setError(''); setModalEliminar(item.email); }} title="Eliminar cuenta" hoverBg="#fdecea" hoverBorder="#f5c6c2" hoverColor="#c0392b">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                                </ActionBtn>
                                                </>)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                )}
            </div>
        </Layout>
    );
};

export default Emails;