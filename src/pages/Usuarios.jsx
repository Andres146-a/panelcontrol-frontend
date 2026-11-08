import { useNavigate } from 'react-router-dom';
import { getUsuarios, crearUsuario, editarUsuario, eliminarUsuario, getLogs } from '../services/api';
import Layout from '../components/Layout';
import React, { useState, useEffect } from 'react';

const Modal = ({ title, onClose, children, wide }) => (
    <div onClick={e => e.target === e.currentTarget && onClose()}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(26,46,74,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dm-modal-bg" style={{ width: wide ? '560px' : '440px', animation: 'fadeUp 0.2s ease', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="dm-modal-title">{title}</div>
            {children}
        </div>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
);

const Field = ({ label, children }) => (
    <div style={{ marginBottom: '16px' }}>
        <label className="dm-label">{label}</label>
        {children}
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

const tipoLogColor = { INFO: '#1d6fa4', WARN: '#b45309', ERROR: '#c0392b' };
const formatFecha = (iso) => { const d = new Date(iso); const p = (n) => String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };

const Usuarios = () => {
    const [usuarios, setUsuarios]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError]                 = useState('');
    const [modalCrear, setModalCrear]       = useState(false);
    const [modalEditar, setModalEditar]     = useState(null);
    const [modalEliminar, setModalEliminar] = useState(null);
    const [modalDetalle, setModalDetalle]   = useState(null);
    const formCrearInicial = { nombre: '', email: '', password: '', role: 'USER' };
    const [formCrear, setFormCrear]   = useState(formCrearInicial);
    const [formEditar, setFormEditar] = useState({ nombre: '', email: '', password: '', role: 'USER' });
    const navigate = useNavigate();
    const token    = sessionStorage.getItem("token");

    const fetchUsuarios = async () => {
        if (!token) { navigate("/"); return; }
        try { const data = await getUsuarios(token); setUsuarios(data); }
        catch { navigate("/"); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchUsuarios(); }, []);

    const handleCrear = async () => {
        setError('');
        if (!formCrear.nombre || !formCrear.email || !formCrear.password) { setError('Todos los campos son obligatorios.'); return; }
        setActionLoading(true);
        try { await crearUsuario(token, formCrear); await fetchUsuarios(); setModalCrear(false); setFormCrear(formCrearInicial); }
        catch (err) { setError(err.message || 'Error al crear el usuario.'); }
        finally { setActionLoading(false); }
    };

    const abrirEditar = (usuario) => { setError(''); setFormEditar({ nombre: usuario.nombre, email: usuario.email, password: '', role: usuario.role }); setModalEditar(usuario); };

    const handleEditar = async () => {
        setError('');
        if (!formEditar.nombre || !formEditar.email) { setError('Nombre y email son obligatorios.'); return; }
        setActionLoading(true);
        try { await editarUsuario(token, modalEditar.id, formEditar); await fetchUsuarios(); setModalEditar(null); }
        catch (err) { setError(err.message || 'Error al actualizar el usuario.'); }
        finally { setActionLoading(false); }
    };

    const handleEliminar = async () => {
        setActionLoading(true);
        try { await eliminarUsuario(token, modalEliminar.id); await fetchUsuarios(); setModalEliminar(null); }
        catch (err) { setError(err.message || 'Error al eliminar el usuario.'); }
        finally { setActionLoading(false); }
    };

    const abrirDetalle = async (usuario) => {
        setModalDetalle({ usuario, logs: [], loadingLogs: true });
        try {
            const todosLogs = await getLogs(token);
            const logsUsuario = todosLogs.filter(l => l.mensaje.includes(usuario.email)).slice(0, 5);
            setModalDetalle({ usuario, logs: logsUsuario, loadingLogs: false });
        } catch { setModalDetalle(prev => ({ ...prev, loadingLogs: false })); }
    };

    const iniciales    = (nombre) => nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarColors = ['#1d6fa4','#1a7f5a','#b45309','#6b3fa0','#c0392b','#2c7a7b'];
    const avatarColor  = (id) => avatarColors[id % avatarColors.length];

    const ActionBtn = ({ onClick, title, hoverBg, hoverBorder, hoverColor, children }) => (
        <button onClick={onClick} title={title}
            style={{ width: '28px', height: '28px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: '1px solid transparent', color: '#6b7e96', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background=hoverBg; e.currentTarget.style.borderColor=hoverBorder; e.currentTarget.style.color=hoverColor; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='#6b7e96'; }}
        >{children}</button>
    );

    return (
        <Layout>
            {/* MODAL CREAR */}
            {modalCrear && (
                <Modal title="Registrar nuevo usuario" onClose={() => { setModalCrear(false); setError(''); }}>
                    <Field label="Nombre completo"><input className="dm-input" placeholder="Ej. Juan Pérez" value={formCrear.nombre} onChange={e => setFormCrear({ ...formCrear, nombre: e.target.value })} /></Field>
                    <Field label="Correo electrónico"><input className="dm-input" type="email" placeholder="juan@empresa.com" value={formCrear.email} onChange={e => setFormCrear({ ...formCrear, email: e.target.value })} /></Field>
                    <Field label="Contraseña"><input className="dm-input" type="password" placeholder="Mín. 10 caracteres, mayúscula, número y símbolo (@#$%^&+=)" value={formCrear.password} onChange={e => setFormCrear({ ...formCrear, password: e.target.value })} /></Field>
                    <Field label="Rol"><select className="dm-input" value={formCrear.role} onChange={e => setFormCrear({ ...formCrear, role: e.target.value })}><option value="USER">USER — Acceso estándar</option><option value="AUDITOR">AUDITOR — Solo abrir buzones (con registro)</option><option value="ADMIN">ADMIN — Acceso completo</option></select></Field>
                    {error && <div style={{ fontSize: '12px', color: '#c0392b', marginBottom: '8px' }}>{error}</div>}
                    <ModalFooter onClose={() => { setModalCrear(false); setError(''); }} onConfirm={handleCrear} confirmLabel="Crear usuario" loading={actionLoading} />
                </Modal>
            )}

            {/* MODAL EDITAR */}
            {modalEditar && (
                <Modal title="Editar usuario" onClose={() => { setModalEditar(null); setError(''); }}>
                    <Field label="Nombre completo"><input className="dm-input" value={formEditar.nombre} onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })} /></Field>
                    <Field label="Correo electrónico"><input className="dm-input" type="email" value={formEditar.email} onChange={e => setFormEditar({ ...formEditar, email: e.target.value })} /></Field>
                    <Field label="Nueva contraseña"><input className="dm-input" type="password" placeholder="Dejar en blanco para no cambiar" value={formEditar.password} onChange={e => setFormEditar({ ...formEditar, password: e.target.value })} /></Field>
                    <Field label="Rol"><select className="dm-input" value={formEditar.role} onChange={e => setFormEditar({ ...formEditar, role: e.target.value })}><option value="USER">USER — Acceso estándar</option><option value="AUDITOR">AUDITOR — Solo abrir buzones (con registro)</option><option value="ADMIN">ADMIN — Acceso completo</option></select></Field>
                    {error && <div style={{ fontSize: '12px', color: '#c0392b', marginBottom: '8px' }}>{error}</div>}
                    <ModalFooter onClose={() => { setModalEditar(null); setError(''); }} onConfirm={handleEditar} confirmLabel="Guardar cambios" loading={actionLoading} />
                </Modal>
            )}

            {/* MODAL ELIMINAR */}
            {modalEliminar && (
                <Modal title="Eliminar usuario" onClose={() => { setModalEliminar(null); setError(''); }}>
                    <div style={{ fontSize: '13.5px', lineHeight: 1.6 }} className="panel-text-secondary">
                        ¿Estás seguro de que quieres eliminar a{' '}
                        <strong className="panel-text-primary">{modalEliminar.nombre}</strong>?<br />
                        <span style={{ fontSize: '12px' }}>{modalEliminar.email}</span><br /><br />
                        <span style={{ color: '#c0392b', fontSize: '12px' }}>⚠ Esta acción no se puede deshacer.</span>
                    </div>
                    {error && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '12px' }}>{error}</div>}
                    <ModalFooter onClose={() => { setModalEliminar(null); setError(''); }} onConfirm={handleEliminar} confirmLabel="Sí, eliminar" confirmColor="#c0392b" loading={actionLoading} />
                </Modal>
            )}

            {/* MODAL DETALLE */}
            {modalDetalle && (
                <Modal title="Detalle del usuario" onClose={() => setModalDetalle(null)} wide>
                    <div className="dm-surface2" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', marginBottom: '24px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: avatarColor(modalDetalle.usuario.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {iniciales(modalDetalle.usuario.nombre)}
                        </div>
                        <div>
                            <div style={{ fontSize: '16px', fontWeight: 700 }} className="panel-text-primary">{modalDetalle.usuario.nombre}</div>
                            <div style={{ fontSize: '12px', marginTop: '2px' }} className="panel-text-secondary">{modalDetalle.usuario.email}</div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", background: modalDetalle.usuario.role === 'ADMIN' ? '#e8eaf6' : '#e8f2f9', color: modalDetalle.usuario.role === 'ADMIN' ? '#3949ab' : '#1d6fa4', border: `1px solid ${modalDetalle.usuario.role === 'ADMIN' ? '#c5cae9' : '#b3d4ea'}` }}>{modalDetalle.usuario.role}</span>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace" }} className="panel-text-secondary">ID</div>
                            <div style={{ fontSize: '18px', fontWeight: 700 }} className="panel-text-primary">#{modalDetalle.usuario.id}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="panel-text-secondary">Actividad reciente</div>
                    {modalDetalle.loadingLogs ? (
                        <div style={{ textAlign: 'center', padding: '24px', fontSize: '13px' }} className="panel-text-secondary">Cargando actividad...</div>
                    ) : modalDetalle.logs.length === 0 ? (
                        <div className="dm-surface2" style={{ textAlign: 'center', padding: '24px', fontSize: '13px' }}>Sin actividad registrada para este usuario.</div>
                    ) : (
                        <div style={{ border: '1px solid var(--color-panel-border)', borderRadius: '8px', overflow: 'hidden' }}>
                            {modalDetalle.logs.map((log, i) => (
                                <div key={log.id} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '9px 14px', borderBottom: i < modalDetalle.logs.length - 1 ? '1px solid var(--color-panel-border)' : 'none', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px' }}>
                                    <span style={{ color: 'var(--color-panel-text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>[{formatFecha(log.fechaHora)}]</span>
                                    <span style={{ color: tipoLogColor[log.tipo] || '#1d6fa4', fontWeight: 700, flexShrink: 0 }}>[{log.tipo}]</span>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-panel-text2)' }}>— {log.mensaje}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="dm-footer">
                        <button onClick={() => setModalDetalle(null)} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: '#1d6fa4', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif' }}>Cerrar</button>
                    </div>
                </Modal>
            )}

            {/* TABLA */}
            <div className="panel-card">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Gestión de Usuarios</div>
                        <div className="panel-sub">{usuarios.length} usuarios registrados</div>
                    </div>
                    <button onClick={() => { setError(''); setFormCrear(formCrearInicial); setModalCrear(true); }}
                        style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: '#1d6fa4', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif' }}>
                        + Nuevo usuario
                    </button>
                </div>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px' }} className="panel-text-secondary">Cargando usuarios...</div>
                ) : (
                    <div className="tabla-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr className="panel-thead">
                            {['Usuario', 'Rol', 'Acciones'].map(h => <th key={h}>{h}</th>)}
                        </tr></thead>
                        <tbody className="panel-tbody">
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td className="panel-td">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: avatarColor(usuario.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{iniciales(usuario.nombre)}</div>
                                            <div>
                                                <div className="panel-text-primary" style={{ fontSize: '13.5px' }}>{usuario.nombre}</div>
                                                <div className="panel-text-secondary">{usuario.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="panel-td">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", background: usuario.role === 'ADMIN' ? '#e8eaf6' : '#e8f2f9', color: usuario.role === 'ADMIN' ? '#3949ab' : '#1d6fa4', border: `1px solid ${usuario.role === 'ADMIN' ? '#c5cae9' : '#b3d4ea'}` }}>{usuario.role}</span>
                                    </td>
                                    <td className="panel-td">
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <ActionBtn onClick={() => abrirDetalle(usuario)} title="Ver detalle" hoverBg="#e8f2f9" hoverBorder="#b3d4ea" hoverColor="#1d6fa4"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></ActionBtn>
                                            <ActionBtn onClick={() => abrirEditar(usuario)} title="Editar" hoverBg="#e8f2f9" hoverBorder="#b3d4ea" hoverColor="#1d6fa4"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></ActionBtn>
                                            <ActionBtn onClick={() => { setError(''); setModalEliminar(usuario); }} title="Eliminar" hoverBg="#fdecea" hoverBorder="#f5c6c2" hoverColor="#c0392b"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></ActionBtn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>
        </Layout>
    );
};

export default Usuarios;