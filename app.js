// ActiveGym - Frontend JavaScript

// Global variables
let members = [];
let dailyUsers = [];
let sales = [];
let memberPayments = []; // Historial de pagos de miembros
let statistics = {};

// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://activegym.onrender.com/api';

// Utility functions
function formatDate(dateString) {
    try {
        if (!dateString) return 'N/A';
        
        let date;
        
        // Handle both string and Date objects
        if (typeof dateString === 'string') {
        // Parse the date string manually to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
            date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
        } else if (dateString instanceof Date) {
            date = dateString;
        } else {
            // Try to create a Date object
            date = new Date(dateString);
        }
        
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return 'N/A';
    }
}

function formatDateTime(dateString) {
    try {
        if (!dateString) return 'N/A';
        
        let date;
        
        // Handle both date-only and datetime strings
        if (dateString.includes('T')) {
            // It's a datetime string
            date = new Date(dateString);
        } else {
            // It's a date-only string, parse manually to avoid timezone issues
            const [year, month, day] = dateString.split('-').map(Number);
            date = new Date(year, month - 1, day);
        }
        
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting datetime:', dateString, error);
        return 'N/A';
    }
}

function showNotification(title, message, type = 'success', duration = 2000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found');
        return;
    }
    
    // Crear la notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Iconos según el tipo
    const icons = {
        success: 'fas fa-check',
        error: 'fas fa-times',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="${icons[type] || icons.success}"></i>
            </div>
            <div class="notification-text">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="notification-progress">
            <div class="notification-progress-bar"></div>
        </div>
    `;
    
    // Agregar al contenedor
    container.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-ocultar después del tiempo especificado
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Función de compatibilidad para mantener showAlert
function showAlert(message, type = 'success') {
    const titles = {
        success: '¡Éxito!',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información'
    };
    
    showNotification(titles[type] || 'Notificación', message, type);
}

function getStatusBadge(status) {
    const statusMap = {
        'ACTIVO': 'badge-activo',
        'VENCIDO': 'badge-vencido',
        'VENCE HOY': 'badge-vence-hoy'
    };
    
    return `<span class="badge ${statusMap[status] || 'badge-secondary'}">${status}</span>`;
}

// Calculate end date based on duration
function calculateEndDate(startDate, duration) {
    const start = new Date(startDate);
    const end = new Date(start);
    
    if (duration === 30) {
        // For 1 month, add exactly 1 month
        end.setMonth(end.getMonth() + 1);
    } else if (duration === 7) {
        // For 1 week, add 6 days to get 7 days total
        end.setDate(end.getDate() + 6);
    } else if (duration === 14) {
        // For 2 weeks, add 14 days to get 15 days total
        end.setDate(end.getDate() + 14);
        } else {
        end.setDate(end.getDate() + duration - 1);
    }
    
    return end.toISOString().split('T')[0];
}

// Load sample data for demonstration
function loadData() {
    // Load real data from API
    fetch('http://localhost:5000/api/clientes')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading data:', data.error);
                loadSampleData(); // Fallback to sample data
        } else {
                members = data;
        updateMembersTable();
        updateDashboard();
        updateStatistics();
            }
        })
        .catch(error => {
            console.error('Error connecting to API:', error);
            loadSampleData(); // Fallback to sample data
        });
    
    // Load daily users and sales
    loadDailyUsers();
    loadSales();
}

function loadDailyUsers() {
    fetch('http://localhost:5000/api/usuarios-diarios')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading daily users:', data.error);
                dailyUsers = [];
            } else {
                dailyUsers = data;
                updateDailyUsersTable();
            }
        })
        .catch(error => {
            console.error('Error connecting to daily users API:', error);
            dailyUsers = [];
        });
}

function loadSales() {
    fetch('http://localhost:5000/api/ventas')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading sales:', data.error);
                sales = [];
            } else {
                sales = data;
                updateSalesTable();
            }
        })
        .catch(error => {
            console.error('Error connecting to sales API:', error);
            sales = [];
        });
}

// Load sample data for demonstration
function loadSampleData() {
    // Initialize empty arrays for fallback
    members = [];
    dailyUsers = [];
    sales = [];
    memberPayments = [];
    statistics = {
        members: { total_members: 0, active_members: 0, expired_members: 0 },
        daily_users: 0,
        sales: { total_sales: 0, total_amount: 0 },
        income: { mensualidad_income: 0, daily_income: 0, sales_income: 0, total_income: 0 }
    };

    updateDashboard();
    updateMembersTable();
    updateDailyUsersTable();
    updateSalesTable();
    updateStatistics();
}

// Dashboard functions
function updateDashboard() {
    // Load real statistics from API
    fetch('http://localhost:5000/api/estadisticas')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading statistics:', data.error);
                // Use fallback data
                document.getElementById('total-members').textContent = '0';
                document.getElementById('expired-members').textContent = '0';
                document.getElementById('daily-users').textContent = '0';
                document.getElementById('total-income').textContent = '$0';
            } else {
                // Update dashboard with real data
                document.getElementById('total-members').textContent = data.members.total_members || 0;
                document.getElementById('expired-members').textContent = data.members.expired_members || 0;
                document.getElementById('daily-users').textContent = data.daily_users || 0;
                document.getElementById('total-income').textContent = `$${data.income_today?.toFixed(2) || '0.00'}`;
                
                // Also update statistics tab
                updateStatisticsTab(data);
            }
        })
        .catch(error => {
            console.error('Error connecting to statistics API:', error);
            // Use fallback data
            document.getElementById('total-members').textContent = '0';
            document.getElementById('expired-members').textContent = '0';
            document.getElementById('daily-users').textContent = '0';
            document.getElementById('total-income').textContent = '$0';
        });
}

function updateStatisticsTab(data) {
    // Update income breakdown
    document.getElementById('monthly-income').textContent = `$${data.members_income?.toFixed(2) || '0.00'}`;
    document.getElementById('daily-income').textContent = `$${data.daily_income?.toFixed(2) || '0.00'}`;
    document.getElementById('sales-income').textContent = `$${data.sales_income?.toFixed(2) || '0.00'}`;
    document.getElementById('grand-total-income').textContent = `$${data.income_today?.toFixed(2) || '0.00'}`;
    
    // Update members summary
    const activeMembers = data.members.total_members - data.members.expired_members;
    document.getElementById('active-members').textContent = activeMembers || 0;
    document.getElementById('expired-members-stats').textContent = data.members.expired_members || 0;
}

// Members functions
function updateMembersTable() {
    const tbody = document.getElementById('members-table-body');
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay miembros registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = members.map(member => `
        <tr>
            <td><strong>${member.nombre} ${member.apellido}</strong></td>
            <td>${getStatusBadge(member.estado_mensualidad)}</td>
            <td>${formatDate(member.fecha_fin_mensualidad)}</td>
            <td>
                <button class="btn btn-sm btn-action ${member.estado_mensualidad === 'ACTIVO' ? 'btn-secondary' : 'btn-success'}" 
                        onclick="${member.estado_mensualidad === 'ACTIVO' ? 'return false;' : `showRenewMemberModal(${member.id})`}" 
                        title="${member.estado_mensualidad === 'ACTIVO' ? 'Membresía activa - No necesita renovación' : 'Renovar'}">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="btn btn-sm btn-action btn-history" onclick="showMemberHistory(${member.id})" title="Historial">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-action btn-warning" onclick="editMember(${member.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-action btn-danger" onclick="deleteMember(${member.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddMemberModal() {
    // Reset modal for new member
    resetMemberModal();
    
    // Set default date (today)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('member-fecha-inicio').value = today;
    
    const modal = new bootstrap.Modal(document.getElementById('addMemberModal'));
    modal.show();
}

function resetMemberModal() {
    // Clear all fields
    document.getElementById('member-nombre').value = '';
    document.getElementById('member-apellido').value = '';
    document.getElementById('member-peso').value = '';
    document.getElementById('member-telefono').value = '';
    document.getElementById('member-precio').value = '';
    document.getElementById('member-duracion').value = '';
    
    // Reset modal title and button
    document.querySelector('#addMemberModal .modal-title').innerHTML = '<i class="fas fa-user-plus me-2"></i>Nuevo Miembro';
    document.querySelector('#addMemberModal .btn-primary').textContent = 'Guardar';
    
    // Remove edit ID
    document.getElementById('addMemberModal').removeAttribute('data-edit-id');
}

function addMember() {
    const formData = {
        nombre: document.getElementById('member-nombre').value,
        apellido: document.getElementById('member-apellido').value,
        peso: document.getElementById('member-peso').value || null,
        telefono: document.getElementById('member-telefono').value,
        precio_mensualidad: parseFloat(document.getElementById('member-precio').value) || 0,
        fecha_inicio: document.getElementById('member-fecha-inicio').value,
        duracion: parseInt(document.getElementById('member-duracion').value) || 0
    };
    
    // Validate required fields
    if (!formData.nombre || !formData.apellido || !formData.telefono || !formData.precio_mensualidad || !formData.fecha_inicio || !formData.duracion) {
        showAlert('Por favor completa todos los campos requeridos', 'danger');
        return;
    }
    
    // Check if we're editing or adding
    const editId = document.getElementById('addMemberModal').getAttribute('data-edit-id');
    
    if (editId) {
        // Editing existing member
        const memberId = parseInt(editId);
        
        fetch(`http://localhost:5000/api/clientes/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Cliente actualizado exitosamente');
                loadData(); // Reload data from API
            }
        })
        .catch(error => {
            console.error('Error updating client:', error);
            showAlert('Error al actualizar el cliente', 'danger');
        });
    } else {
        // Adding new member
        fetch('http://localhost:5000/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('Error', data.error, 'error');
            } else {
                showNotification('Cliente Registrado', 'El cliente ha sido registrado exitosamente', 'success');
                loadData(); // Reload data from API
            }
        })
        .catch(error => {
            console.error('Error adding client:', error);
            showNotification('Error', 'Error al agregar el cliente', 'error');
        });
    }
    
    // Update UI
    updateMembersTable();
    updateDashboard();
    updateStatistics();
    
    // Reset modal for next use
    resetMemberModal();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMemberModal'));
            modal.hide();
}

function deleteMember(memberId) {
    // Guardar el ID del miembro a eliminar
    window.memberToDelete = memberId;
    
    // Mostrar el modal personalizado
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
}

    // Función para confirmar la eliminación
    function confirmDelete() {
        const memberId = window.memberToDelete;
        
        fetch(`http://localhost:5000/api/clientes/${memberId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('Error', data.error, 'error');
        } else {
                showNotification('Cliente Eliminado', 'El cliente ha sido eliminado exitosamente', 'success');
                loadData(); // Reload data from API
            }
        })
        .catch(error => {
            console.error('Error deleting client:', error);
            showNotification('Error', 'Error al eliminar el cliente', 'error');
        });
        
        // Cerrar el modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        deleteModal.hide();
    }

// Función para limpiar la calculadora
function limpiarCalculadora() {
    // Limpiar todos los campos del formulario
    document.getElementById('weight').value = '';
    document.getElementById('height').value = '';
    document.getElementById('age').value = '';
    document.getElementById('gender').value = '';
    document.getElementById('activity').value = '';
    document.getElementById('goal').value = '';
    
    // Ocultar resultados
    document.getElementById('calculatorResults').style.display = 'none';
    document.getElementById('calculatorPlaceholder').style.display = 'block';
    
    // Ocultar botón de generar plan de comidas
    document.getElementById('generateMealPlanBtn').style.display = 'none';
    
    // Ocultar plan de comidas personalizado
    const mealPlanSection = document.getElementById('mealPlanSection');
    if (mealPlanSection) {
        mealPlanSection.style.display = 'none';
    }
    
    // Limpiar plan de comidas si existe
    const mealPlanContainer = document.getElementById('mealPlanContainer');
    if (mealPlanContainer) {
        mealPlanContainer.remove();
    }
    
    // Mostrar notificación
    showNotification('Calculadora Limpiada', 'Todos los campos han sido reseteados', 'success');
}

// Función para cargar el historial de estadísticas
function loadHistorial() {
    fetch('http://localhost:5000/api/estadisticas/historial')
        .then(response => response.json())
        .then(data => {
            updateHistorialTable(data);
        })
        .catch(error => {
            console.error('Error loading historial:', error);
            showNotification('Error', 'Error al cargar el historial', 'error');
        });
}

// Función para actualizar la tabla de historial
function updateHistorialTable(historial) {
    const tableBody = document.getElementById('historial-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (historial.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay datos de historial disponibles</td></tr>';
        return;
    }
    
    historial.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(stat.fecha)}</td>
            <td>${stat.total_miembros}</td>
            <td>${stat.usuarios_diarios}</td>
            <td>${stat.ventas}</td>
            <td>$${parseFloat(stat.ingresos_totales).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showMemberHistory(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        showAlert('Cliente no encontrado', 'danger');
        return;
    }
    
        // Get member payments from API
    fetch(`http://localhost:5000/api/clientes/${memberId}/pagos`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert(data.error, 'danger');
                return;
            }
            
            const memberPaymentsList = data;
            
            // Calculate total paid
            const totalPaid = memberPaymentsList.reduce((sum, payment) => {
                const precio = parseFloat(payment.precio || 0);
                return sum + precio;
            }, 0);
            
            const content = document.getElementById('member-history-content');
            content.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Información del Cliente</h6>
                        <p><strong>Nombre:</strong> ${member.nombre} ${member.apellido}</p>
                        <p><strong>Peso:</strong> ${member.peso ? `${member.peso} kg` : 'No registrado'}</p>
                        <p><strong>Teléfono:</strong> ${member.telefono}</p>
                        <p><strong>Precio Mensualidad:</strong> $${parseFloat(member.precio_mensualidad || 0).toFixed(2)}</p>
                        <p><strong>Fecha de inicio:</strong> ${formatDate(member.fecha_inicio)}</p>
                        <p><strong>Fecha fin mensualidad:</strong> ${formatDate(member.fecha_fin_mensualidad)}</p>
                        <p><strong>Estado:</strong> ${getStatusBadge(member.estado_mensualidad)}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Resumen de Pagos</h6>
                        <p><strong>Total Pagado:</strong> <span class="text-success">$${totalPaid.toFixed(2)}</span></p>
                        <p><strong>Número de Pagos:</strong> ${memberPaymentsList.length}</p>
                    </div>
                </div>
                <hr>
                <h6>Historial Completo de Pagos</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Fecha Pago</th>
                                <th>Duración</th>
                                <th>Precio</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Fin</th>
                                <th>Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${memberPaymentsList.map(payment => `
                                <tr>
                                    <td>${formatDate(payment.fecha_pago)}</td>
                                    <td>${payment.duracion} días</td>
                                    <td>$${parseFloat(payment.precio || 0).toFixed(2)}</td>
                                    <td>${formatDate(payment.fecha_inicio)}</td>
                                    <td>${formatDate(payment.fecha_fin)}</td>
                                    <td>
                                        <span class="badge ${payment.tipo === 'mensualidad' ? 'bg-primary' : 'bg-success'}">
                                            ${payment.tipo === 'mensualidad' ? 'Mensualidad' : 'Renovación'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('memberHistoryModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error loading payment history:', error);
            showAlert('Error al cargar el historial del cliente', 'danger');
        });
}

// Daily Users functions
function updateDailyUsersTable() {
    const tbody = document.getElementById('daily-table-body');
    
    if (dailyUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay usuarios diarios hoy</td></tr>';
        return;
    }
    
    const tableHTML = dailyUsers.map(user => `
        <tr>
            <td><strong>${user.cantidad_clientes}</strong></td>
            <td>$${parseFloat(user.precio_por_cliente || 0).toFixed(2)}</td>
            <td><strong>$${parseFloat(user.total || 0).toFixed(2)}</strong></td>
            <td>${formatDateTime(user.created_at)}</td>
        </tr>
    `).join('');
    
    tbody.innerHTML = tableHTML;
}

function showAddDailyUserModal() {
    // Reset modal for new user
    resetDailyUserModal();
    
    const modal = new bootstrap.Modal(document.getElementById('addDailyUserModal'));
    modal.show();
    
    // Add event listeners for auto-calculation
    document.getElementById('daily-cantidad').addEventListener('input', calculateDailyTotal);
    document.getElementById('daily-precio-unitario').addEventListener('input', calculateDailyTotal);
}

function resetDailyUserModal() {
    // Clear fields
    document.getElementById('daily-cantidad').value = '1';
    document.getElementById('daily-precio-unitario').value = '';
    document.getElementById('daily-total-calculado').value = '$0.00';
    
    // Reset modal title and button
    document.querySelector('#addDailyUserModal .modal-title').innerHTML = '<i class="fas fa-user-plus me-2"></i>Nuevo Usuario Diario';
    document.querySelector('#addDailyUserModal .btn-primary').textContent = 'Guardar';
    
    // Remove edit ID
    document.getElementById('addDailyUserModal').removeAttribute('data-edit-id');
}

function calculateDailyTotal() {
    const cantidad = parseInt(document.getElementById('daily-cantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('daily-precio-unitario').value) || 0;
    const total = cantidad * precioUnitario;
    
    document.getElementById('daily-total-calculado').value = `$${total.toFixed(2)}`;
}

function addDailyUser() {
    const formData = {
        cantidad_clientes: parseInt(document.getElementById('daily-cantidad').value) || 0,
        precio_por_cliente: parseFloat(document.getElementById('daily-precio-unitario').value) || 0
    };
    
    // Calculate total
    formData.total = formData.cantidad_clientes * formData.precio_por_cliente;
    
    // Validate required fields
    if (!formData.cantidad_clientes || !formData.precio_por_cliente) {
        showAlert('Por favor completa todos los campos requeridos', 'danger');
        return;
    }
    
    // Check if we're editing or adding
    const editId = document.getElementById('addDailyUserModal').getAttribute('data-edit-id');
    
    if (editId) {
        // Editing existing user
        const userId = parseInt(editId);
        
        fetch(`http://localhost:5000/api/usuarios-diarios/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Usuario diario actualizado exitosamente');
                loadDailyUsers(); // Reload data from API
                updateDashboard(); // Update dashboard statistics
            }
        })
        .catch(error => {
            console.error('Error updating daily user:', error);
            showAlert('Error al actualizar el usuario diario', 'danger');
        });
    } else {
        // Adding new user
        fetch('http://localhost:5000/api/usuarios-diarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('Error', data.error, 'error');
            } else {
                showNotification('Usuario Diario Registrado', 'El usuario diario ha sido registrado exitosamente', 'success');
                loadDailyUsers(); // Reload data from API
                updateDashboard(); // Update dashboard statistics
            }
        })
        .catch(error => {
            console.error('Error adding daily user:', error);
            showNotification('Error', 'Error al agregar el usuario diario', 'error');
        });
    }
    
    // Reset modal for next use
    resetDailyUserModal();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDailyUserModal'));
            modal.hide();
}

function deleteDailyUser(userId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario diario?')) {
        return;
    }
    
    // Remove from sample data
    const userIndex = dailyUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        dailyUsers.splice(userIndex, 1);
        
        showNotification('Usuario Diario Eliminado', 'El usuario diario ha sido eliminado exitosamente', 'success');
        
        // Update UI
        updateDailyUsersTable();
        updateDashboard();
        updateStatistics();
        } else {
        showAlert('Usuario no encontrado', 'danger');
    }
}

function editDailyUser(userId) {
    const user = dailyUsers.find(u => u.id === userId);
    if (!user) {
        showAlert('Usuario no encontrado', 'danger');
        return;
    }
    
    // Fill the form with user data
    document.getElementById('daily-cantidad').value = user.cantidad_clientes;
    document.getElementById('daily-precio-unitario').value = user.precio_por_cliente;
    document.getElementById('daily-total-calculado').value = `$${user.total.toFixed(2)}`;
    
    // Store the user ID for update
    document.getElementById('addDailyUserModal').setAttribute('data-edit-id', userId);
    
    // Change modal title
    document.querySelector('#addDailyUserModal .modal-title').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Usuario Diario';
    
    // Change button text
    document.querySelector('#addDailyUserModal .btn-primary').textContent = 'Actualizar';
    
    const modal = new bootstrap.Modal(document.getElementById('addDailyUserModal'));
    modal.show();
}

// Sales functions
function updateSalesTable() {
    const tbody = document.getElementById('sales-table-body');
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay ventas registradas hoy</td></tr>';
        return;
    }
    
    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td><strong>${sale.producto}</strong></td>
            <td>${sale.cantidad}</td>
            <td>$${parseFloat(sale.precio_unitario || 0).toFixed(2)}</td>
            <td><strong>$${parseFloat(sale.total || 0).toFixed(2)}</strong></td>
        </tr>
    `).join('');
}

function showAddSaleModal() {
    // Reset modal for new sale
    resetSaleModal();
    
    const modal = new bootstrap.Modal(document.getElementById('addSaleModal'));
    modal.show();
    
    // Add event listeners for auto-calculation
    document.getElementById('sale-cantidad').addEventListener('input', calculateSaleTotal);
    document.getElementById('sale-precio-unitario').addEventListener('input', calculateSaleTotal);
}

function resetSaleModal() {
    // Clear fields
    document.getElementById('sale-producto').value = '';
    document.getElementById('sale-cantidad').value = '1';
    document.getElementById('sale-precio-unitario').value = '';
    document.getElementById('sale-total-calculado').value = '$0.00';
    
    // Reset modal title and button
    document.querySelector('#addSaleModal .modal-title').innerHTML = '<i class="fas fa-plus me-2"></i>Nueva Venta';
    document.querySelector('#addSaleModal .btn-primary').textContent = 'Guardar';
    
    // Remove edit ID
    document.getElementById('addSaleModal').removeAttribute('data-edit-id');
}

function calculateSaleTotal() {
    const cantidad = parseInt(document.getElementById('sale-cantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('sale-precio-unitario').value) || 0;
    const total = cantidad * precioUnitario;
    
    document.getElementById('sale-total-calculado').value = `$${total.toFixed(2)}`;
}

function addSale() {
    const formData = {
        producto: document.getElementById('sale-producto').value,
        cantidad: parseInt(document.getElementById('sale-cantidad').value) || 0,
        precio_unitario: parseFloat(document.getElementById('sale-precio-unitario').value) || 0
    };
    
    // Calculate total
    formData.total = formData.cantidad * formData.precio_unitario;
    
    // Validate required fields
    if (!formData.producto || !formData.cantidad || !formData.precio_unitario) {
        showAlert('Por favor completa todos los campos requeridos', 'danger');
        return;
    }
    
    // Check if we're editing or adding
    const editId = document.getElementById('addSaleModal').getAttribute('data-edit-id');
    
    if (editId) {
        // Editing existing sale
        const saleId = parseInt(editId);
        
        fetch(`http://localhost:5000/api/ventas/${saleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Venta actualizada exitosamente');
                loadSales(); // Reload data from API
                updateDashboard(); // Update dashboard statistics
            }
        })
        .catch(error => {
            console.error('Error updating sale:', error);
            showAlert('Error al actualizar la venta', 'danger');
        });
    } else {
        // Adding new sale
        fetch('http://localhost:5000/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('Error', data.error, 'error');
            } else {
                showNotification('Venta Registrada', 'La venta ha sido registrada exitosamente', 'success');
                loadSales(); // Reload data from API
                updateDashboard(); // Update dashboard statistics
            }
        })
        .catch(error => {
            console.error('Error adding sale:', error);
            showNotification('Error', 'Error al registrar la venta', 'error');
        });
    }
    
    // Reset modal for next use
    resetSaleModal();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addSaleModal'));
            modal.hide();
}

function deleteSale(saleId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
        return;
    }
    
    // Remove from sample data
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex > -1) {
        sales.splice(saleIndex, 1);
        
        showNotification('Venta Eliminada', 'La venta ha sido eliminada exitosamente', 'success');
        
        // Update UI
        updateSalesTable();
        updateDashboard();
        updateStatistics();
        } else {
        showAlert('Venta no encontrada', 'danger');
    }
}

function editSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        showAlert('Venta no encontrada', 'danger');
        return;
    }
    
    // Fill the form with sale data
    document.getElementById('sale-producto').value = sale.producto;
    document.getElementById('sale-cantidad').value = sale.cantidad;
    document.getElementById('sale-precio-unitario').value = sale.precio_unitario;
    document.getElementById('sale-total-calculado').value = `$${sale.total.toFixed(2)}`;
    
    // Store the sale ID for update
    document.getElementById('addSaleModal').setAttribute('data-edit-id', saleId);
    
    // Change modal title
    document.querySelector('#addSaleModal .modal-title').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Venta';
    
    // Change button text
    document.querySelector('#addSaleModal .btn-primary').textContent = 'Actualizar';
    
    const modal = new bootstrap.Modal(document.getElementById('addSaleModal'));
    modal.show();
}

// Statistics functions
function updateStatistics() {
    document.getElementById('monthly-income').textContent = `$${statistics.income?.mensualidad_income || 0}`;
    document.getElementById('daily-income').textContent = `$${statistics.income?.daily_income || 0}`;
    document.getElementById('sales-income').textContent = `$${statistics.income?.sales_income || 0}`;
    document.getElementById('grand-total-income').textContent = `$${statistics.income?.total_income || 0}`;
    document.getElementById('active-members').textContent = statistics.members?.active_members || 0;
    document.getElementById('expired-members-stats').textContent = statistics.members?.expired_members || 0;
}

// Search functionality
function setupSearch() {
    const searchMembers = document.getElementById('search-members');
    const searchDaily = document.getElementById('search-daily');
    
    if (searchMembers) {
        searchMembers.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#members-table-body tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    if (searchDaily) {
        searchDaily.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#daily-table-body tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    const searchSales = document.getElementById('search-sales');
    if (searchSales) {
        searchSales.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#sales-table-body tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Load data from API
    loadData();
    
    // Setup search functionality
    setupSearch();
    
    // Reset modal when closed
    document.getElementById('addMemberModal').addEventListener('hidden.bs.modal', function() {
        resetMemberModal();
    });
    
    document.getElementById('addDailyUserModal').addEventListener('hidden.bs.modal', function() {
        resetDailyUserModal();
    });
    
    document.getElementById('addSaleModal').addEventListener('hidden.bs.modal', function() {
        resetSaleModal();
    });
    
    // Set up form submissions
    document.getElementById('addMemberForm')?.addEventListener('submit', function(e) {
        console.log('Form submit event triggered');
        e.preventDefault();
        addMember();
    });
    
    document.getElementById('addDailyUserForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        addDailyUser();
    });
    
    document.getElementById('renewMemberForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        renewMember();
    });
    
    document.getElementById('calculatorForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateMacros();
    });
    
    document.getElementById('generateMealPlanBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        generateMealPlan();
    });
    
            // Confirm delete button
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
        
        // Limpiar calculadora button
        document.getElementById('limpiarCalculadora')?.addEventListener('click', limpiarCalculadora);
        
        // Historial tab
        document.getElementById('historial-tab')?.addEventListener('click', loadHistorial);
    

    

    

    
    // Reload data when switching tabs
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            if (e.target.getAttribute('href') === '#daily-users') {
                loadDailyUsers();
            } else if (e.target.getAttribute('href') === '#sales') {
                loadSales();
            }
        });
    });
    
    // Auto-refresh dashboard every 5 minutes
    setInterval(() => {
        // In a real application, this would fetch fresh data from the server
        console.log('Auto-refreshing dashboard...');
    }, 300000);
});

function editMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        showAlert('Cliente no encontrado', 'danger');
        return;
    }
    
    // Fill the form with member data
    document.getElementById('member-nombre').value = member.nombre;
    document.getElementById('member-apellido').value = member.apellido;
    document.getElementById('member-peso').value = member.peso || '';
    document.getElementById('member-telefono').value = member.telefono;
    document.getElementById('member-precio').value = member.precio_mensualidad;
    
    // Format date for input field (YYYY-MM-DD)
    const fechaInicio = new Date(member.fecha_inicio);
    const fechaFormateada = fechaInicio.toISOString().split('T')[0];
    document.getElementById('member-fecha-inicio').value = fechaFormateada;
    
    document.getElementById('member-duracion').value = member.duracion;
    
    // Store the member ID for update
    document.getElementById('addMemberModal').setAttribute('data-edit-id', memberId);
    
    // Change modal title
    document.querySelector('#addMemberModal .modal-title').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Cliente';
    
    // Change button text
    document.querySelector('#addMemberModal .btn-primary').textContent = 'Actualizar';
    
    const modal = new bootstrap.Modal(document.getElementById('addMemberModal'));
    modal.show();
}

function showRenewMemberModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        showAlert('Miembro no encontrado', 'danger');
        return;
    }
    
    // Fill member info
    document.getElementById('renew-member-name').textContent = `${member.nombre} ${member.apellido}`;
    document.getElementById('renew-member-status').innerHTML = getStatusBadge(member.estado_mensualidad);
    document.getElementById('renew-member-expires').textContent = formatDate(member.fecha_fin_mensualidad);
    
    // Set default values
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('renew-fecha-inicio').value = today;
    document.getElementById('renew-duracion').value = member.duracion;
    document.getElementById('renew-precio').value = member.precio_mensualidad;
    
    // Store member ID for renewal
    document.getElementById('renewMemberModal').setAttribute('data-member-id', memberId);
    
    // Add event listeners for auto-calculation
    document.getElementById('renew-duracion').addEventListener('change', calculateRenewEndDate);
    document.getElementById('renew-fecha-inicio').addEventListener('change', calculateRenewEndDate);
    
    // Calculate initial end date
    calculateRenewEndDate();
    
    const modal = new bootstrap.Modal(document.getElementById('renewMemberModal'));
    modal.show();
}

function calculateRenewEndDate() {
    const fechaInicio = document.getElementById('renew-fecha-inicio').value;
    const duracion = parseInt(document.getElementById('renew-duracion').value) || 0;
    
    if (!fechaInicio || !duracion) {
        document.getElementById('renew-fecha-fin-calculada').value = '';
        return;
    }
    
    const startDate = new Date(fechaInicio);
    const endDate = new Date(startDate);
    
    if (duracion === 30) {
        // For 1 month, add exactly 1 month (same day next month)
        const [startYear, startMonth, startDay] = fechaInicio.split('-').map(Number);
        
        let endYear = startYear;
        let endMonth = startMonth + 1;
        
        if (endMonth > 12) {
            endMonth = 1;
            endYear++;
        }
        
        let endDay = startDay;
        const daysInEndMonth = new Date(endYear, endMonth, 0).getDate();
        
        if (startDay > daysInEndMonth) {
            endDay = daysInEndMonth;
        }
        
        const yearStr = String(endYear);
        const monthStr = String(endMonth).padStart(2, '0');
        const dayStr = String(endDay).padStart(2, '0');
        document.getElementById('renew-fecha-fin-calculada').value = `${yearStr}-${monthStr}-${dayStr}`;
    } else if (duracion === 7) {
        // For 1 week, add 6 days to get 7 days total
        endDate.setDate(startDate.getDate() + 6);
        document.getElementById('renew-fecha-fin-calculada').value = endDate.toISOString().split('T')[0];
    } else if (duracion === 14) {
        // For 2 weeks, add 14 days to get 15 days total
        endDate.setDate(startDate.getDate() + 14);
        document.getElementById('renew-fecha-fin-calculada').value = endDate.toISOString().split('T')[0];
    }
}





function renewMember() {
    const memberId = parseInt(document.getElementById('renewMemberModal').getAttribute('data-member-id'));
    
    const formData = {
        fecha_inicio: document.getElementById('renew-fecha-inicio').value,
        duracion: parseInt(document.getElementById('renew-duracion').value) || 0,
        precio_mensualidad: parseFloat(document.getElementById('renew-precio').value) || 0
    };
    
    // Validate required fields
    if (!formData.fecha_inicio || !formData.duracion || !formData.precio_mensualidad) {
        showAlert('Por favor completa todos los campos requeridos', 'danger');
        return;
    }
    
    fetch(`http://localhost:5000/api/clientes/${memberId}/renovar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            showAlert('Cliente renovado exitosamente');
            loadData(); // Reload data from API
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('renewMemberModal'));
            modal.hide();
        }
    })
    .catch(error => {
        console.error('Error renewing client:', error);
        showAlert('Error al renovar el cliente', 'danger');
    });
}

// Calculator Functions
function calculateMacros() {
    // Get form values
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const activity = parseFloat(document.getElementById('activity').value);
    const goal = document.getElementById('goal').value;
    
    // Validate inputs
    if (!weight || !height || !age || !gender || !activity || !goal) {
        showAlert('Por favor completa todos los campos requeridos', 'danger');
        return;
    }
    
    // Calculate BMI
    const bmi = calculateBMI(weight, height);
    const bmiCategory = getBMICategory(bmi);
    
    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
    const bmr = calculateBMR(weight, height, age, gender);
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activity;
    
    // Calculate daily calories based on goal (using percentage-based approach)
    let dailyCalories = tdee;
    let caloriesDescription = 'Mantenimiento';
    
    if (goal === 'lose') {
        // Maximum 20% deficit to avoid muscle loss
        const deficit = tdee * 0.20;
        dailyCalories = tdee - deficit;
        caloriesDescription = `Déficit del 20% para pérdida de peso`;
    } else if (goal === 'gain') {
        // 20% surplus for clean muscle gain
        const surplus = tdee * 0.20;
        dailyCalories = tdee + surplus;
        caloriesDescription = `Superávit del 20% para ganancia muscular`;
    }
    
    // Calculate macronutrients
    const macros = calculateMacronutrients(dailyCalories, goal, weight);
    
    // Display results
    displayCalculatorResults(bmi, bmiCategory, bmr, dailyCalories, caloriesDescription, macros);
}

function calculateBMI(weight, height) {
    // BMI = weight (kg) / height (m)²
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidad I';
    if (bmi < 40) return 'Obesidad II';
    return 'Obesidad III';
}

function calculateBMR(weight, height, age, gender) {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

function calculateMacronutrients(calories, goal, weight) {
    let proteinGrams, carbsGrams, fatsGrams;
    
    if (goal === 'lose') {
        // Higher protein for weight loss (1.6-2.2 g/kg)
        proteinGrams = Math.round(weight * 2.0);
        // Fats 25-35% of calories
        const fatsCalories = calories * 0.30;
        fatsGrams = Math.round(fatsCalories / 9);
        // Remaining calories for carbs
        const carbsCalories = calories - (proteinGrams * 4) - fatsCalories;
        carbsGrams = Math.round(carbsCalories / 4);
    } else if (goal === 'gain') {
        // Moderate protein for muscle gain (1.6-2.2 g/kg)
        proteinGrams = Math.round(weight * 1.8);
        // Fats 20-30% of calories
        const fatsCalories = calories * 0.25;
        fatsGrams = Math.round(fatsCalories / 9);
        // Remaining calories for carbs
        const carbsCalories = calories - (proteinGrams * 4) - fatsCalories;
        carbsGrams = Math.round(carbsCalories / 4);
    } else {
        // Maintenance: protein 1.0-1.2 g/kg
        proteinGrams = Math.round(weight * 1.1);
        // Fats 20-35% of calories
        const fatsCalories = calories * 0.30;
        fatsGrams = Math.round(fatsCalories / 9);
        // Remaining calories for carbs
        const carbsCalories = calories - (proteinGrams * 4) - fatsCalories;
        carbsGrams = Math.round(carbsCalories / 4);
    }
    
    return {
        protein: proteinGrams,
        carbs: carbsGrams,
        fats: fatsGrams
    };
}

function calculateIdealWeight(height, gender) {
    // J.D Robinson formula
    const heightInInches = height / 2.54; // Convert cm to inches
    const fiveFeetInInches = 60; // 5 feet = 60 inches
    
    if (gender === 'male') {
        return 52 + (1.9 * (heightInInches - fiveFeetInInches));
    } else {
        return 49 + (1.7 * (heightInInches - fiveFeetInInches));
    }
}

function calculateMaxMusclePotential(height) {
    // Martin Berkhan formula
    const upperRange = height - 98;
    const lowerRange = height - 102;
    return { lower: lowerRange, upper: upperRange };
}

function displayCalculatorResults(bmi, bmiCategory, bmr, dailyCalories, caloriesDescription, macros) {
    // Hide placeholder and show results
    document.getElementById('calculatorPlaceholder').style.display = 'none';
    document.getElementById('calculatorResults').style.display = 'block';
    
    // Get additional data for calculations
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const gender = document.getElementById('gender').value;
    
    // Calculate ideal weight and muscle potential
    const idealWeight = calculateIdealWeight(height, gender);
    const musclePotential = calculateMaxMusclePotential(height);
    
    // Update BMI
    document.getElementById('bmi-result').textContent = bmi.toFixed(1);
    document.getElementById('bmi-category').textContent = bmiCategory;
    
    // Update BMR
    document.getElementById('bmr-result').textContent = Math.round(bmr);
    
    // Update ideal weight and muscle potential
    document.getElementById('ideal-weight').textContent = idealWeight.toFixed(1);
    document.getElementById('muscle-potential').textContent = `${musclePotential.lower.toFixed(1)} - ${musclePotential.upper.toFixed(1)}`;
    
    // Update daily calories
    document.getElementById('daily-calories').textContent = Math.round(dailyCalories);
    document.getElementById('calories-description').textContent = caloriesDescription;
    
    // Update macronutrients
    document.getElementById('protein-result').textContent = macros.protein;
    document.getElementById('carbs-result').textContent = macros.carbs;
    document.getElementById('fats-result').textContent = macros.fats;
    
    // Show success message
    showAlert('Cálculo completado exitosamente');
    
    // Log additional information for reference
    console.log('Información adicional:');
    console.log(`Peso ideal (${gender === 'male' ? 'hombre' : 'mujer'}): ${idealWeight.toFixed(1)} kg`);
    console.log(`Máximo potencial muscular: ${musclePotential.lower.toFixed(1)} - ${musclePotential.upper.toFixed(1)} kg`);
    console.log(`Rango de proteínas recomendado: ${Math.round(weight * 1.6)} - ${Math.round(weight * 2.2)} g/día`);
    
    // Show meal plan button
    document.getElementById('generateMealPlanBtn').style.display = 'inline-block';
}

function generateMealPlan() {
    const dailyCalories = parseInt(document.getElementById('daily-calories').textContent);
    const proteinGrams = parseInt(document.getElementById('protein-result').textContent);
    const carbsGrams = parseInt(document.getElementById('carbs-result').textContent);
    const fatsGrams = parseInt(document.getElementById('fats-result').textContent);
    const goal = document.getElementById('goal').value;
    
    // Define meal distribution based on goal
    let mealDistribution;
    if (goal === 'gain') {
        // 6 meals for muscle gain
        mealDistribution = [
            { name: 'Desayuno', calories: 0.20, protein: 0.20, carbs: 0.20, fats: 0.20 },
            { name: 'Snack Mañana', calories: 0.15, protein: 0.15, carbs: 0.15, fats: 0.15 },
            { name: 'Almuerzo', calories: 0.25, protein: 0.25, carbs: 0.25, fats: 0.25 },
            { name: 'Snack Tarde', calories: 0.15, protein: 0.15, carbs: 0.15, fats: 0.15 },
            { name: 'Cena', calories: 0.20, protein: 0.20, carbs: 0.20, fats: 0.20 },
            { name: 'Snack Nocturno', calories: 0.05, protein: 0.05, carbs: 0.05, fats: 0.05 }
        ];
    } else if (goal === 'lose') {
        // 4 meals for weight loss
        mealDistribution = [
            { name: 'Desayuno', calories: 0.25, protein: 0.25, carbs: 0.25, fats: 0.25 },
            { name: 'Almuerzo', calories: 0.35, protein: 0.35, carbs: 0.35, fats: 0.35 },
            { name: 'Snack Tarde', calories: 0.20, protein: 0.20, carbs: 0.20, fats: 0.20 },
            { name: 'Cena', calories: 0.20, protein: 0.20, carbs: 0.20, fats: 0.20 }
        ];
    } else {
        // 5 meals for maintenance
        mealDistribution = [
            { name: 'Desayuno', calories: 0.20, protein: 0.20, carbs: 0.20, fats: 0.20 },
            { name: 'Snack Mañana', calories: 0.15, protein: 0.15, carbs: 0.15, fats: 0.15 },
            { name: 'Almuerzo', calories: 0.30, protein: 0.30, carbs: 0.30, fats: 0.30 },
            { name: 'Snack Tarde', calories: 0.15, protein: 0.15, carbs: 0.15, fats: 0.15 },
            { name: 'Cena', calories: 0.20, protein: 0.20, carbs: 0.20, fats: 0.20 }
        ];
    }
    
    // Generate meal plan table
    const tableBody = document.getElementById('mealPlanTable');
    tableBody.innerHTML = '';
    
    mealDistribution.forEach(meal => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${meal.name}</strong></td>
            <td>${Math.round(dailyCalories * meal.calories)} cal</td>
            <td>${Math.round(proteinGrams * meal.protein)}g</td>
            <td>${Math.round(carbsGrams * meal.carbs)}g</td>
            <td>${Math.round(fatsGrams * meal.fats)}g</td>
        `;
        tableBody.appendChild(row);
    });
    
    // Show meal plan section
    document.getElementById('mealPlanSection').style.display = 'block';
    
    // Scroll to meal plan
    document.getElementById('mealPlanSection').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
    
    showAlert('Plan de comidas generado exitosamente', 'success');
}

// Egresos functions
let egresos = [];

function loadEgresos() {
    fetch(`${API_BASE_URL}/egresos`)
        .then(response => response.json())
        .then(data => {
            egresos = data;
            updateEgresosTable();
        })
        .catch(error => {
            console.error('Error loading egresos:', error);
            showNotification('Error', 'Error al cargar egresos', 'error');
        });
}

function updateEgresosTable() {
    const tableBody = document.getElementById('egresos-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (egresos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay egresos registrados</td></tr>';
        return;
    }
    
    egresos.forEach(egreso => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(egreso.fecha)}</td>
            <td>${egreso.descripcion}</td>
            <td>$${parseFloat(egreso.monto).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function showAddEgresoModal() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('egreso-fecha').value = today;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addEgresoModal'));
    modal.show();
}

function addEgreso() {
    const descripcion = document.getElementById('egreso-descripcion').value.trim();
    const monto = parseFloat(document.getElementById('egreso-monto').value);
    const fecha = document.getElementById('egreso-fecha').value;
    
    if (!descripcion || isNaN(monto) || monto <= 0) {
        showNotification('Error', 'Por favor completa todos los campos correctamente', 'error');
        return;
    }
    
    const egresoData = {
        descripcion: descripcion,
        monto: monto,
        fecha: fecha
    };
    
    fetch(`${API_BASE_URL}/egresos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(egresoData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        showNotification('Éxito', 'Gasto agregado exitosamente', 'success');
            
            // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEgresoModal'));
            modal.hide();
        
        // Reset form
        document.getElementById('egreso-descripcion').value = '';
        document.getElementById('egreso-monto').value = '';
        document.getElementById('egreso-fecha').value = new Date().toISOString().split('T')[0];
        
        // Reload data
        loadEgresos();
        updateDashboard();
    })
    .catch(error => {
        console.error('Error adding egreso:', error);
        showNotification('Error', 'Error al agregar gasto', 'error');
    });
}

// Update dashboard to include expenses and balance
function updateDashboard() {
    fetch(`${API_BASE_URL}/estadisticas`)
        .then(response => response.json())
        .then(data => {
            statistics = data;
            
            // Update dashboard metrics
            document.getElementById('total-members').textContent = data.members.total_members;
            document.getElementById('daily-users').textContent = data.daily_users;
            document.getElementById('total-income').textContent = `$${data.income_today.toFixed(2)}`;
            document.getElementById('expenses-today-dashboard').textContent = `$${data.expenses_today.toFixed(2)}`;
            document.getElementById('balance-today').textContent = `$${data.profit_today.toFixed(2)}`;
            
            // Update statistics tab
            updateStatisticsTab(data);
        })
        .catch(error => {
            console.error('Error updating dashboard:', error);
        });
}

// Update statistics tab to include expenses and profit
function updateStatisticsTab(data) {
    // Update income breakdown
    document.getElementById('monthly-income').textContent = `$${data.members_income.toFixed(2)}`;
    document.getElementById('daily-income').textContent = `$${data.daily_income.toFixed(2)}`;
    document.getElementById('sales-income').textContent = `$${data.sales_income.toFixed(2)}`;
    document.getElementById('grand-total-income').textContent = `$${data.income_today.toFixed(2)}`;
    
    // Update member summary
    document.getElementById('active-members').textContent = data.members.total_members - data.members.expired_members;
    document.getElementById('expired-members-stats').textContent = data.members.expired_members;
    
    // Update expenses and profit
    document.getElementById('expenses-today').textContent = `$${data.expenses_today.toFixed(2)}`;
    document.getElementById('profit-today').textContent = `$${data.profit_today.toFixed(2)}`;
}

// Update historial table to include expenses and profit
function updateHistorialTable(historial) {
    const tableBody = document.getElementById('historial-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (historial.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay datos de historial disponibles</td></tr>';
        return;
    }
    
    historial.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(stat.fecha)}</td>
            <td>${stat.total_miembros}</td>
            <td>${stat.usuarios_diarios}</td>
            <td>${stat.ventas}</td>
            <td>$${parseFloat(stat.ingresos_totales).toFixed(2)}</td>
            <td>$${parseFloat(stat.egresos_totales).toFixed(2)}</td>
            <td>$${parseFloat(stat.ganancias_diarias).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadData();
    loadDailyUsers();
    loadSales();
    loadEgresos();
    updateDashboard();
    
    // Setup search functionality
    setupSearch();
    
    // Setup calculator form
    const calculatorForm = document.getElementById('calculatorForm');
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateMacros();
        });
    }
    
    // Setup egresos form
    const addEgresoForm = document.getElementById('addEgresoForm');
    if (addEgresoForm) {
        addEgresoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addEgreso();
        });
    }
    
    // Setup historial tab
    document.getElementById('historial-tab')?.addEventListener('click', loadHistorial);
    
    // Setup delete confirmation
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
    
    // Setup calculator buttons
    document.getElementById('generateMealPlanBtn')?.addEventListener('click', generateMealPlan);
    document.getElementById('limpiarCalculadora')?.addEventListener('click', limpiarCalculadora);
    
    // Setup daily user total calculation
    document.getElementById('daily-cantidad-clientes')?.addEventListener('input', calculateDailyTotal);
    document.getElementById('daily-precio-por-cliente')?.addEventListener('input', calculateDailyTotal);
    
    // Setup sale total calculation
    document.getElementById('sale-cantidad')?.addEventListener('input', calculateSaleTotal);
    document.getElementById('sale-precio-unitario')?.addEventListener('input', calculateSaleTotal);
    
    // Setup renew member form
    document.getElementById('renewMemberForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        renewMember();
    });
    
    // Setup renew duration change
    document.getElementById('renew-duracion')?.addEventListener('change', calculateRenewEndDate);
    document.getElementById('renew-fecha-inicio')?.addEventListener('change', calculateRenewEndDate);
});

// ===== FUNCIONES PARA GESTIÓN DE SOCIOS =====

// Cargar socios
function loadSocios() {
    fetch(`${API_BASE_URL}/usuarios`)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                updateSociosTable(data);
            } else {
                console.error('Error loading socios:', data);
                showNotification('Error', 'Error al cargar socios', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error', 'Error de conexión', 'error');
        });
}

// Actualizar tabla de socios
function updateSociosTable(socios) {
    const tableBody = document.getElementById('socios-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (socios.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <p>No hay socios registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    socios.forEach(socio => {
        const row = document.createElement('tr');
        const statusBadge = socio.activo ? 
            '<span class="badge bg-success">Activo</span>' : 
            '<span class="badge bg-danger">Inactivo</span>';
        
        row.innerHTML = `
            <td>${socio.nombre}</td>
            <td>${socio.usuario}</td>
            <td><span class="badge bg-${socio.rol === 'admin' ? 'primary' : 'secondary'}">${socio.rol}</span></td>
            <td>${statusBadge}</td>
            <td>${formatDateTime(socio.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editSocio(${socio.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSocio(${socio.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Mostrar modal para agregar socio
function showAddSocioModal() {
    document.getElementById('addSocioForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('addSocioModal'));
    modal.show();
}

// Agregar socio
function addSocio() {
    const nombre = document.getElementById('socio-nombre').value;
    const usuario = document.getElementById('socio-usuario').value;
    const password = document.getElementById('socio-password').value;
    const rol = document.getElementById('socio-rol').value;
    
    if (!nombre || !usuario || !password) {
        showNotification('Error', 'Todos los campos son requeridos', 'error');
        return;
    }
    
    fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nombre,
            usuario,
            password,
            rol
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showNotification('Éxito', data.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('addSocioModal')).hide();
            loadSocios();
        } else {
            showNotification('Error', data.error || 'Error al agregar socio', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error', 'Error de conexión', 'error');
    });
}

// Editar socio
function editSocio(socioId) {
    fetch(`${API_BASE_URL}/usuarios/${socioId}`)
        .then(response => response.json())
        .then(socio => {
            document.getElementById('edit-socio-id').value = socio.id;
            document.getElementById('edit-socio-nombre').value = socio.nombre;
            document.getElementById('edit-socio-usuario').value = socio.usuario;
            document.getElementById('edit-socio-rol').value = socio.rol;
            document.getElementById('edit-socio-activo').value = socio.activo.toString();
            document.getElementById('edit-socio-password').value = '';
            
            const modal = new bootstrap.Modal(document.getElementById('editSocioModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error', 'Error al cargar datos del socio', 'error');
        });
}

// Actualizar socio
function updateSocio() {
    const socioId = document.getElementById('edit-socio-id').value;
    const nombre = document.getElementById('edit-socio-nombre').value;
    const usuario = document.getElementById('edit-socio-usuario').value;
    const password = document.getElementById('edit-socio-password').value;
    const rol = document.getElementById('edit-socio-rol').value;
    const activo = document.getElementById('edit-socio-activo').value === 'true';
    
    const updateData = {
        nombre,
        usuario,
        rol,
        activo
    };
    
    if (password) {
        updateData.password = password;
    }
    
    fetch(`${API_BASE_URL}/usuarios/${socioId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showNotification('Éxito', data.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('editSocioModal')).hide();
            loadSocios();
        } else {
            showNotification('Error', data.error || 'Error al actualizar socio', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error', 'Error de conexión', 'error');
    });
}

// Eliminar socio
function deleteSocio(socioId) {
    if (confirm('¿Estás seguro de que quieres eliminar este socio?')) {
        fetch(`${API_BASE_URL}/usuarios/${socioId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showNotification('Éxito', data.message, 'success');
                loadSocios();
            } else {
                showNotification('Error', data.error || 'Error al eliminar socio', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error', 'Error de conexión', 'error');
        });
    }
}

// Cargar socios cuando se hace clic en el tab
document.getElementById('socios-tab')?.addEventListener('click', loadSocios);