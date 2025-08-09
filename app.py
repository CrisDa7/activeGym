
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://127.0.0.1:3000"])


# Database configuration using environment variables (for Render or local)
import os
def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', ''),
        dbname=os.environ.get('DB_NAME', 'activeGym'),
        port=os.environ.get('DB_PORT', 5432)
    )
    return conn

def calculate_end_date(start_date, duration):
    start = datetime.strptime(start_date, '%Y-%m-%d')
    
    if duration == 30:
        # For 1 month, add exactly 1 month (same day next month)
        year = start.year
        month = start.month + 1
        if month > 12:
            month = 1
            year += 1
        
        # Handle month end dates
        try:
            end_date = start.replace(year=year, month=month)
        except ValueError:
            # If the day doesn't exist in the target month, use the last day
            end_date = start.replace(year=year, month=month, day=1) - timedelta(days=1)
    else:
        # For weeks, add the specified days
        end_date = start + timedelta(days=duration-1)
    
    return end_date.strftime('%Y-%m-%d')

def update_member_status():
    """Update member status based on current date"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all members
        cursor.execute("SELECT id, fecha_fin_mensualidad FROM clientes")
        members = cursor.fetchall()
        
        today = datetime.now().date()
        
        for member in members:
            # Handle both string and date objects
            if isinstance(member['fecha_fin_mensualidad'], str):
                end_date = datetime.strptime(member['fecha_fin_mensualidad'], '%Y-%m-%d').date()
            else:
                end_date = member['fecha_fin_mensualidad']
            
            if end_date < today:
                status = 'VENCIDO'
            elif end_date == today:
                status = 'VENCE HOY'
            else:
                status = 'ACTIVO'
            
            cursor.execute("UPDATE clientes SET estado_mensualidad = %s WHERE id = %s", (status, member['id']))
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error updating member status: {e}")

@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    try:
        update_member_status()
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM clientes ORDER BY created_at DESC")
        clientes = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for cliente in clientes:
            if cliente['created_at']:
                cliente['created_at'] = cliente['created_at'].isoformat()
            if cliente['updated_at']:
                cliente['updated_at'] = cliente['updated_at'].isoformat()
            if cliente['fecha_inicio']:
                cliente['fecha_inicio'] = cliente['fecha_inicio'].strftime('%Y-%m-%d')
            if cliente['fecha_fin_mensualidad']:
                cliente['fecha_fin_mensualidad'] = cliente['fecha_fin_mensualidad'].strftime('%Y-%m-%d')
        
        cursor.close()
        conn.close()
        
        return jsonify(clientes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clientes', methods=['POST'])
def add_cliente():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['nombre', 'apellido', 'telefono', 'precio_mensualidad', 'fecha_inicio', 'duracion']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Calculate end date
        fecha_fin = calculate_end_date(data['fecha_inicio'], data['duracion'])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        INSERT INTO clientes (nombre, apellido, peso, telefono, precio_mensualidad, 
                             fecha_inicio, fecha_fin_mensualidad, duracion, estado_mensualidad)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'ACTIVO')
        """
        
        values = (
            data['nombre'],
            data['apellido'],
            data.get('peso'),
            data['telefono'],
            data['precio_mensualidad'],
            data['fecha_inicio'],
            fecha_fin,
            data['duracion']
        )
        
        cursor.execute(query, values)
        cliente_id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'id': cliente_id, 'message': 'Cliente agregado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clientes/<int:cliente_id>', methods=['PUT'])
def update_cliente(cliente_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['nombre', 'apellido', 'telefono', 'precio_mensualidad', 'fecha_inicio', 'duracion']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Calculate end date
        fecha_fin = calculate_end_date(data['fecha_inicio'], data['duracion'])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        UPDATE clientes SET 
            nombre = %s, apellido = %s, peso = %s, telefono = %s, 
            precio_mensualidad = %s, fecha_inicio = %s, fecha_fin_mensualidad = %s, 
            duracion = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """
        
        values = (
            data['nombre'],
            data['apellido'],
            data.get('peso'),
            data['telefono'],
            data['precio_mensualidad'],
            data['fecha_inicio'],
            fecha_fin,
            data['duracion'],
            cliente_id
        )
        
        cursor.execute(query, values)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Cliente no encontrado'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Cliente actualizado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clientes/<int:cliente_id>', methods=['DELETE'])
def delete_cliente(cliente_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM clientes WHERE id = %s", (cliente_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Cliente no encontrado'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Cliente eliminado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clientes/<int:cliente_id>/pagos', methods=['GET'])
def get_cliente_pagos(cliente_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get client info
        cursor.execute("SELECT * FROM clientes WHERE id = %s", (cliente_id,))
        cliente = cursor.fetchone()
        
        if not cliente:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cliente no encontrado'}), 404
        
        # Convert datetime objects to strings
        if cliente['created_at']:
            cliente['created_at'] = cliente['created_at'].isoformat()
        if cliente['updated_at']:
            cliente['updated_at'] = cliente['updated_at'].isoformat()
        if cliente['fecha_inicio']:
            cliente['fecha_inicio'] = cliente['fecha_inicio'].strftime('%Y-%m-%d')
        if cliente['fecha_fin_mensualidad']:
            cliente['fecha_fin_mensualidad'] = cliente['fecha_fin_mensualidad'].strftime('%Y-%m-%d')
        
        # For now, return client info as payment history
        # Later we can create a separate payments table
        pagos = [{
            'id': 1,
            'member_id': cliente_id,
            'fecha_inicio': cliente['fecha_inicio'],
            'fecha_fin': cliente['fecha_fin_mensualidad'],
            'duracion': cliente['duracion'],
            'precio': cliente['precio_mensualidad'],
            'fecha_pago': cliente['created_at'][:10],
            'tipo': 'mensualidad'
        }]
        
        cursor.close()
        conn.close()
        
        return jsonify(pagos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clientes/<int:cliente_id>/renovar', methods=['POST'])
def renovar_cliente(cliente_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['fecha_inicio', 'duracion', 'precio_mensualidad']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Calculate end date
        fecha_fin = calculate_end_date(data['fecha_inicio'], data['duracion'])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        UPDATE clientes SET 
            fecha_inicio = %s, fecha_fin_mensualidad = %s, duracion = %s,
            precio_mensualidad = %s, estado_mensualidad = 'ACTIVO', 
            updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        
        values = (
            data['fecha_inicio'],
            fecha_fin,
            data['duracion'],
            data['precio_mensualidad'],
            cliente_id
        )
        
        cursor.execute(query, values)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Cliente no encontrado'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Cliente renovado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Daily Users API
@app.route('/api/usuarios-diarios', methods=['GET'])
def get_usuarios_diarios():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM usuarios_diarios ORDER BY created_at DESC")
        usuarios = cursor.fetchall()
        
        # Convert datetime objects to strings
        for usuario in usuarios:
            if usuario['created_at']:
                usuario['created_at'] = usuario['created_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return jsonify(usuarios)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/usuarios-diarios', methods=['POST'])
def add_usuario_diario():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['cantidad_clientes', 'precio_por_cliente']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Calculate total
        total = data['cantidad_clientes'] * data['precio_por_cliente']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        INSERT INTO usuarios_diarios (cantidad_clientes, precio_por_cliente, total)
        VALUES (%s, %s, %s)
        """
        
        values = (
            data['cantidad_clientes'],
            data['precio_por_cliente'],
            total
        )
        
        cursor.execute(query, values)
        usuario_id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'id': usuario_id, 'message': 'Usuario diario agregado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/usuarios-diarios/<int:usuario_id>', methods=['PUT'])
def update_usuario_diario(usuario_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['cantidad_clientes', 'precio_por_cliente']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Calculate total
        total = data['cantidad_clientes'] * data['precio_por_cliente']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        UPDATE usuarios_diarios SET 
            cantidad_clientes = %s, precio_por_cliente = %s, total = %s
        WHERE id = %s
        """
        
        values = (
            data['cantidad_clientes'],
            data['precio_por_cliente'],
            total,
            usuario_id
        )
        
        cursor.execute(query, values)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Usuario diario actualizado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/usuarios-diarios/<int:usuario_id>', methods=['DELETE'])
def delete_usuario_diario(usuario_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM usuarios_diarios WHERE id = %s", (usuario_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Usuario diario eliminado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Sales API
@app.route('/api/ventas', methods=['GET'])
def get_ventas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM ventas ORDER BY created_at DESC")
        ventas = cursor.fetchall()
        
        # Convert datetime objects to strings
        for venta in ventas:
            if venta['created_at']:
                venta['created_at'] = venta['created_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return jsonify(ventas)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ventas', methods=['POST'])
def add_venta():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['producto', 'cantidad', 'precio_unitario']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Calculate total
        total = data['cantidad'] * data['precio_unitario']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        INSERT INTO ventas (producto, cantidad, precio_unitario, total)
        VALUES (%s, %s, %s, %s)
        """
        
        values = (
            data['producto'],
            data['cantidad'],
            data['precio_unitario'],
            total
        )
        
        cursor.execute(query, values)
        venta_id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'id': venta_id, 'message': 'Venta registrada exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ventas/<int:venta_id>', methods=['PUT'])
def update_venta(venta_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['producto', 'cantidad', 'precio_unitario']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Calculate total
        total = data['cantidad'] * data['precio_unitario']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        UPDATE ventas SET 
            producto = %s, cantidad = %s, precio_unitario = %s, total = %s
        WHERE id = %s
        """
        
        values = (
            data['producto'],
            data['cantidad'],
            data['precio_unitario'],
            total,
            venta_id
        )
        
        cursor.execute(query, values)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Venta no encontrada'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Venta actualizada exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ventas/<int:venta_id>', methods=['DELETE'])
def delete_venta(venta_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM ventas WHERE id = %s", (venta_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Venta no encontrada'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Venta eliminada exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Statistics API
@app.route('/api/estadisticas', methods=['GET'])
def get_estadisticas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get today's date
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Check if we have statistics for today, if not create them
        cursor.execute("SELECT * FROM estadisticas_diarias WHERE fecha = %s", (today,))
        today_stats = cursor.fetchone()
        
        if not today_stats:
            # Create new daily statistics record
            cursor.execute("""
                INSERT INTO estadisticas_diarias (fecha, total_miembros, usuarios_diarios, ventas, ingresos_totales)
                VALUES (%s, 0, 0, 0, 0.00)
            """, (today,))
            conn.commit()
            today_stats = {'total_miembros': 0, 'usuarios_diarios': 0, 'ventas': 0, 'ingresos_totales': 0.00}
        
        # Count total monthly members (only members with complete data)
        cursor.execute("SELECT COUNT(*) as total FROM clientes")
        total_members = cursor.fetchone()['total']
        
        # Count expired members
        cursor.execute("SELECT COUNT(*) as total FROM clientes WHERE estado_mensualidad = 'VENCIDO'")
        expired_members = cursor.fetchone()['total']
        
        # Count members registered today
        cursor.execute("SELECT COUNT(*) as total FROM clientes WHERE DATE(created_at) = %s", (today,))
        today_members = cursor.fetchone()['total']
        
        # Count daily users registered today (sum of cantidad_clientes)
        cursor.execute("SELECT COALESCE(SUM(cantidad_clientes), 0) as total FROM usuarios_diarios WHERE DATE(created_at) = %s", (today,))
        today_daily_users = cursor.fetchone()['total']
        
        # Count sales today
        cursor.execute("SELECT COUNT(*) as total FROM ventas WHERE DATE(created_at) = %s", (today,))
        today_sales = cursor.fetchone()['total']
        
        # Total users registered today (members + daily users)
        total_users_today = today_members + today_daily_users
        
        # Calculate today's income from members registered today
        cursor.execute("SELECT COALESCE(SUM(precio_mensualidad), 0) as total FROM clientes WHERE DATE(created_at) = %s", (today,))
        members_income = cursor.fetchone()['total']
        
        # Calculate today's income from daily users
        cursor.execute("SELECT COALESCE(SUM(total), 0) as total FROM usuarios_diarios WHERE DATE(created_at) = %s", (today,))
        daily_income = cursor.fetchone()['total']
        
        # Calculate today's income from sales
        cursor.execute("SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE DATE(created_at) = %s", (today,))
        sales_income = cursor.fetchone()['total']
        
        # Calculate total income today (members + daily users + sales)
        total_income_today = float(members_income) + float(daily_income) + float(sales_income)
        
        # Calculate today's expenses
        cursor.execute("SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE DATE(fecha) = %s", (today,))
        today_expenses = cursor.fetchone()['total']
        
        # Calculate today's profit (income - expenses)
        today_profit = total_income_today - float(today_expenses)
        
        # Update daily statistics
        cursor.execute("""
            UPDATE estadisticas_diarias 
            SET total_miembros = %s, usuarios_diarios = %s, ventas = %s, ingresos_totales = %s, egresos_totales = %s, ganancias_diarias = %s
            WHERE fecha = %s
        """, (total_members, total_users_today, today_sales, total_income_today, today_expenses, today_profit, today))
        conn.commit()
        
        statistics = {
            'members': {
                'total_members': total_members,
                'expired_members': expired_members
            },
            'daily_users': total_users_today,  # Total users registered today (members + daily users)
            'income_today': total_income_today,
            'expenses_today': float(today_expenses),
            'profit_today': today_profit,
            'members_income': float(members_income),
            'daily_income': float(daily_income),
            'sales_income': float(sales_income)
        }
        
        cursor.close()
        conn.close()
        
        return jsonify(statistics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Historial de Estadísticas Diarias API
@app.route('/api/estadisticas/historial', methods=['GET'])
def get_estadisticas_historial():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get last 30 days of statistics
        cursor.execute("""
            SELECT fecha, total_miembros, usuarios_diarios, ventas, ingresos_totales, egresos_totales, ganancias_diarias
            FROM estadisticas_diarias 
            ORDER BY fecha DESC 
            LIMIT 30
        """)
        
        historial = cursor.fetchall()
        
        # Format dates for frontend
        for stat in historial:
            stat['fecha'] = stat['fecha'].strftime('%Y-%m-%d')
            stat['ingresos_totales'] = float(stat['ingresos_totales'])
            stat['egresos_totales'] = float(stat['egresos_totales'])
            stat['ganancias_diarias'] = float(stat['ganancias_diarias'])
        
        cursor.close()
        conn.close()
        
        return jsonify(historial)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Egresos API
@app.route('/api/egresos', methods=['GET'])
def get_egresos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM egresos ORDER BY created_at DESC")
        egresos = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for egreso in egresos:
            if egreso['created_at']:
                egreso['created_at'] = egreso['created_at'].isoformat()
            if egreso['fecha']:
                egreso['fecha'] = egreso['fecha'].strftime('%Y-%m-%d')
        
        cursor.close()
        conn.close()
        
        return jsonify(egresos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/egresos', methods=['POST'])
def add_egreso():
    try:
        data = request.get_json()
        
        descripcion = data.get('descripcion')
        monto = data.get('monto')
        fecha = data.get('fecha', datetime.now().strftime('%Y-%m-%d'))
        
        if not descripcion or not monto:
            return jsonify({'error': 'Descripción y monto son requeridos'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO egresos (fecha, descripcion, monto)
            VALUES (%s, %s, %s)
        """, (fecha, descripcion, monto))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Egreso agregado exitosamente'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Frontend routes
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port) 