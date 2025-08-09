import psycopg2
import os

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'dpg-d2b7fsruibrs73fbmm5g-a.oregon-postgres.render.com',
    'user': 'activegym_db_user',
    'password': 'yVsyXoWBw9jX4CmmidgJJ2DvWQtjbyyJ',
    'dbname': 'activegym_db',
    'port': 5432
}

def test_connection():
    try:
        print("Intentando conectar a la base de datos...")
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Conexión exitosa!")
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Versión de PostgreSQL: {version[0]}")
        
        # Verificar si las tablas existen
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        print("✅ Tablas encontradas:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        print("✅ Conexión cerrada correctamente")
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    test_connection()
