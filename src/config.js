// En produccion el frontend y la API comparten dominio: nginx envia /api/ al backend.
// Para desarrollo local: crear .env.local con VITE_API_URL=http://localhost:8081
export const BASE_URL = import.meta.env.VITE_API_URL || "/api";
