# AdminPanel

Sistema de gestión empresarial desarrollado a medida para **SuperMetal Seconds** (`supermetalseconds.com`). Centraliza la administración de correos corporativos, usuarios del panel y el estado de los servicios del dominio, integrándose en tiempo real con cPanel vía API.


---

## ✨ Características principales

### Dashboard
- Total de cuentas de correo activas en tiempo real
- Días restantes del certificado SSL con alerta visual automática
- Cantidad de administradores y usuarios del panel
- Sesiones iniciadas hoy + gráfico de actividad de los últimos 7 días

### Gestión de correos (integrado con cPanel)
- Listado completo de cuentas de correo con estado en tiempo real
- Crear, editar contraseña y eliminar cuentas
- Búsqueda y filtrado en tiempo real

### Gestión de usuarios del panel
- Roles `ADMIN` / `USER`
- Edición de nombre, correo y contraseña
- Historial de actividad por usuario
- Eliminación de accesos

### Servicios — estado del dominio
- Certificado SSL: emisor, dominio y días para vencer
- Cuentas de correo: activas vs. suspendidas
- Acceso FTP: estado de la cuenta principal

### Seguridad
- Bloqueo automático por intentos fallidos de login
- Registro de IPs bloqueadas con opción de desbloqueo
- Autenticación JWT con expiración configurable
- Cifrado BCrypt en todas las contraseñas

### Registros (Logs)
- Historial de inicios de sesión
- Cambios en usuarios y correos
- Alertas de seguridad y errores
- Exportación a CSV para auditorías

### UI/UX
- Modo oscuro con persistencia entre sesiones
- Diseño responsivo (escritorio, tablet, móvil) con navegación inferior en móvil
- Búsqueda global en tiempo real

---

## 🛠 Stack tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| Backend | Java 21 + Spring Boot 3.5 | API REST segura y escalable |
| Seguridad | Spring Security + JWT | Autenticación y autorización |
| Base de datos | PostgreSQL (Railway) | Almacenamiento en la nube |
| Frontend | React + Vite + Tailwind | Interfaz moderna y responsiva |
| Integración | cPanel UAPI | Datos reales del servidor |
| Despliegue | Railway (backend) + Vercel (frontend) | Infraestructura 24/7 |

---

## 📁 Estructura del backend

```
com.panel.panelcontrol
├── controller
│   └── UsuarioController.java
├── service
│   └── UsuarioService.java
├── repository
│   └── UsuarioRepository.java
├── model
│   └── Usuario.java
├── dto
│   ├── UsuarioRequestDTO.java
│   └── UsuarioResponseDTO.java
├── exception
│   ├── UsuarioNotFoundException.java
│   └── GlobalExceptionHandler.java
└── security
    ├── JwtUtil.java
    ├── JwtFilter.java
    └── SecurityConfig.java
```

### Endpoints principales

**Usuarios**
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/usuarios` | Lista todos los usuarios |
| POST | `/usuarios` | Crea un nuevo usuario (201) |
| GET | `/usuarios/{id}` | Busca usuario por ID |
| PUT | `/usuarios/{id}` | Actualiza un usuario |
| DELETE | `/usuarios/{id}` | Elimina un usuario (204) |

**Autenticación**
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/auth/registro` | Crea usuario con contraseña cifrada (BCrypt) |
| POST | `/auth/login` | Devuelve token JWT |

### Manejo de errores
- `GlobalExceptionHandler` (`@RestControllerAdvice`) intercepta todas las excepciones.
- `UsuarioNotFoundException` → `404 Not Found`
- `MethodArgumentNotValidException` → `400 Bad Request` con detalle de campos inválidos
- Respuestas JSON estandarizadas con mensaje, error y timestamp.

### Validaciones (`UsuarioRequestDTO`)
- `@NotBlank`, `@Email`, `@Size`, `@Pattern` sobre nombre, email y contraseña.
- `UsuarioResponseDTO` nunca expone la contraseña al cliente.

---

## 🔐 Seguridad

- Autenticación con tokens **JWT** — las contraseñas nunca se almacenan en texto plano.
- Cifrado **BCrypt** para todas las contraseñas de usuarios.
- Bloqueo automático de IPs tras múltiples intentos fallidos de login.
- **35 tests automatizados** (21 unitarios + 14 de integración) que validan el correcto funcionamiento.

**Flujo JWT:**
```
Cliente hace login
   → recibe TOKEN
   → envía el token en cada request
   → JwtFilter verifica el token
       → si es válido   → deja pasar la petición
       → si es inválido → 401 Unauthorized
```

---

## 🧪 Testing

- **35 tests** en total (21 unitarios + 14 de integración), todos en verde.
- Cobertura sobre controladores, servicios y seguridad.

---

## 🚀 Despliegue

- **Backend:** Railway (servidores USA West) + PostgreSQL con respaldo automático.
- **Frontend:** Vercel CDN global — carga rápida desde cualquier país.
- CORS configurado, dominio propio, favicon personalizado y routing correcto.
- Disponibilidad 24/7 desde cualquier dispositivo con internet.

---

## 📄 Páginas del frontend

1. Dashboard
2. Emails
3. Usuarios
4. Servicios
5. Logs
6. Seguridad
7. Configuración

Todas con soporte completo de modo oscuro (persistente vía `localStorage`) y diseño responsivo.

---

## 📌 Estado del proyecto

| Fase | Descripción | Estado |
|---|---|---|
| 1 | CRUD de Usuario | ✅ Completado |
| 2 | Validaciones y manejo de errores | ✅ Completado |
| 3 | Spring Security + JWT | ✅ Completado |
| 4 | Integración cPanel UAPI (correos, SSL, FTP) | ✅ Completado |
| 5 | Frontend React (7 páginas) + modo oscuro | ✅ Completado |
| 6 | Despliegue en producción (Railway + Vercel) | ✅ Completado |

---

## 👤 Autor

Desarrollado por **Andrés** — Estudiante de Ingeniería de Software, en colaboración con el equipo técnico de SuperMetal Seconds.
