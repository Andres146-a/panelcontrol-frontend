import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login.jsx';
import Dashboard from './pages/Dashboard';
import Emails from './pages/Emails';
import Usuaruis from './pages/Usuarios';
import Logs from './pages/Logs';
import Servicios from './pages/Servicios';  
import Seguridad from './pages/Seguridad';
import Configuracion from './pages/Configuracion';
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login/>} />
                <Route path="/dashboard" element={<Dashboard/>} />
                <Route path="/emails" element={<Emails/>} />
                <Route path="/usuarios" element={<Usuaruis/>} />
                <Route path="/logs" element={<Logs/>} />
                <Route path="/servicios" element={<Servicios/>} />
                <Route path="/seguridad" element={<Seguridad/>} />
                <Route path="/configuracion" element={<Configuracion/>} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;