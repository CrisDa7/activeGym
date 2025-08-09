-- ActiveGym Database Setup
-- Ejecutar este script en tu base de datos PostgreSQL en Render

-- Tabla de clientes/miembros
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    fecha_inicio DATE NOT NULL,
    fecha_fin_mensualidad DATE NOT NULL,
    estado_mensualidad VARCHAR(20) DEFAULT 'ACTIVO',
    plan_mensualidad VARCHAR(50),
    precio_mensualidad DECIMAL(10,2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos de miembros
CREATE TABLE IF NOT EXISTS pagos_miembros (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios diarios
CREATE TABLE IF NOT EXISTS usuarios_diarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_entrada DATE NOT NULL,
    hora_entrada TIME,
    precio DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas/productos
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    producto VARCHAR(100) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    precio_total DECIMAL(10,2) NOT NULL,
    fecha_venta DATE NOT NULL,
    metodo_pago VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de egresos
CREATE TABLE IF NOT EXISTS egresos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estadísticas diarias
CREATE TABLE IF NOT EXISTS estadisticas_diarias (
    id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    total_miembros INTEGER DEFAULT 0,
    usuarios_diarios INTEGER DEFAULT 0,
    ventas INTEGER DEFAULT 0,
    ingresos_totales DECIMAL(10,2) DEFAULT 0,
    egresos_totales DECIMAL(10,2) DEFAULT 0,
    ganancias_diarias DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_fin ON clientes(fecha_fin_mensualidad);
CREATE INDEX IF NOT EXISTS idx_usuarios_diarios_fecha ON usuarios_diarios(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha);
CREATE INDEX IF NOT EXISTS idx_estadisticas_fecha ON estadisticas_diarias(fecha);
