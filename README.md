# ActiveGym - Sistema de Gestión de Gimnasio

## Descripción
Sistema completo de gestión para gimnasios que incluye gestión de miembros, usuarios diarios, ventas, estadísticas y más.

## Tecnologías Utilizadas
- **Backend**: Python Flask
- **Base de Datos**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Despliegue**: Render

## Configuración para Despliegue en Render

### 1. Configurar Base de Datos
1. Crear una base de datos PostgreSQL en Render
2. Obtener las credenciales de conexión

### 2. Variables de Entorno
Configurar las siguientes variables de entorno en Render:
- `DB_HOST`: Host de la base de datos
- `DB_USER`: Usuario de la base de datos
- `DB_PASSWORD`: Contraseña de la base de datos
- `DB_NAME`: Nombre de la base de datos
- `DB_PORT`: Puerto de la base de datos (5432)

### 3. Despliegue
1. Conectar tu repositorio de GitHub a Render
2. Render detectará automáticamente la configuración
3. La aplicación se desplegará automáticamente

## Estructura del Proyecto
- `app.py`: Backend Flask
- `app.js`: Frontend JavaScript
- `index.html`: Interfaz de usuario
- `style.css`: Estilos CSS
- `requirements.txt`: Dependencias de Python
- `render.yaml`: Configuración de Render

## Funcionalidades
- Gestión de miembros
- Usuarios diarios
- Ventas y productos
- Estadísticas y reportes
- Calculadora de macros
- Historial de pagos
