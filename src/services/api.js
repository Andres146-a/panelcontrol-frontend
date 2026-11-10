import { data } from "react-router-dom";
import { BASE_URL } from "../config";

export const login = async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error("Login failed");
    }

    const data = await response.text();
    return data; 
}

export const getEmails = async (token) => {
    const response = await fetch(`${BASE_URL}/cpanel/emails`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const err = new Error("Failed to fetch emails");
        err.status = response.status; // 401/403 = sesion; otro codigo = falla del servidor o de cPanel
        throw err;
    }

    const data = await response.json();
    return data; 
}

export const getDashboardStats = async (token) => {
    const response = await fetch(`${BASE_URL}/dashboard/stats`,{
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
     if (!response.ok) {
        throw new Error("Failed to fetch emails");
    }

    const data = await response.json();
    return data; 
}

export const getUsuarios = async (token) => {
    const response = await fetch(`${BASE_URL}/usuarios`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch usuarios");
    }

    const data = await response.json();
    return data; 
}   
export const getLogs = async (token) => {
    const response = await fetch(`${BASE_URL}/logs`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch logs");
    }
    const data = await response.json();
    return data;
}


export const crearUsuario = async (token, usuarioData) => {
    const response = await fetch(`${BASE_URL}/usuarios`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(usuarioData),
    });

    if (!response.ok) {
        throw new Error("Failed to create usuario");
    }

    const data = await response.json();
    return data; 
}

export const editarUsuario = async (token, id, data) => {
    const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
      
        if (errorData.errors) {
            throw new Error(Object.values(errorData.errors).join(' · '));
        }
        throw new Error(errorData.mensaje || 'Error al actualizar');
    }
    return response.json();
}

export const eliminarUsuario = async (token, id) => {
    const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    
    if (!response.ok) {
        throw new Error("Failed to delete usuario");
    }
}   

export const crearEmail = async (token, data) => {
    const response = await fetch(`${BASE_URL}/cpanel/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al crear correo');
    }
    return response.json();
}

export const cambiarPasswordEmail = async (token, email, password) => {
    const response = await fetch(`${BASE_URL}/cpanel/emails/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ password }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al cambiar contraseña');
    }
    return response.json();
}

export const eliminarEmail = async (token, email) => {
    const response = await fetch(`${BASE_URL}/cpanel/emails/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al eliminar correo');
    }
    return response.json();
}
export const getSeguridadStats = async (token) => {
    const response = await fetch(`${BASE_URL}/seguridad/stats`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch seguridad stats");
    return response.json();
}

export const getIpsBloqueadas = async (token) => {
    const response = await fetch(`${BASE_URL}/seguridad/ips-bloqueadas`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch IPs bloqueadas");
    return response.json();
}

export const desbloquearIp = async (token, ip) => {
    const response = await fetch(`${BASE_URL}/seguridad/ips-bloqueadas/${encodeURIComponent(ip)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to desbloquear IP");
    return response.json();
}


export const getMe = async (token) => {
    const response = await fetch(`${BASE_URL}/usuarios/me`, { headers: { "Authorization": `Bearer ${token}` } });
    if (!response.ok) throw new Error("No se pudo obtener el usuario");
    return response.json();
};

export const abrirBuzon = async (token, email, motivo) => {
    const response = await fetch(`${BASE_URL}/cpanel/emails/${encodeURIComponent(email)}/webmail-sesion`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || data.message || "No se pudo abrir el buzón");
    }
    return data.url;
};

export const getAccesosBuzon = async (token) => {
    const response = await fetch(`${BASE_URL}/cpanel/accesos-buzon`, { headers: { "Authorization": `Bearer ${token}` } });
    if (!response.ok) throw new Error("No se pudo cargar el registro de accesos");
    return response.json();
};

export const getResumenCuentas = async (token) => {
    const response = await fetch(`${BASE_URL}/cpanel/emails/resumen`, { headers: { "Authorization": `Bearer ${token}` } });
    if (!response.ok) throw new Error("No se pudo cargar el resumen de cuentas");
    return response.json();
};

export const getAccesosPorDia = async (token) => {
    const response = await fetch(`${BASE_URL}/dashboard/accesos-por-dia`, { headers: { "Authorization": `Bearer ${token}` } });
    if (!response.ok) throw new Error("No se pudo cargar accesos por dia");
    return response.json();
};
