-- Tabla de usuarios/socios del SISTEMA (acceso al panel de administración)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'socio',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar el administrador principal del SISTEMA
INSERT INTO usuarios (nombre, usuario, password, rol) 
VALUES ('Administrador Principal', 'administradorprincipal', 'admiRocki1976', 'admin')
ON CONFLICT (usuario) DO NOTHING;

-- Índices para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- NOTA: Los miembros del gimnasio (clientes) están en la tabla 'clientes'
-- y NO tienen acceso al sistema de administración
