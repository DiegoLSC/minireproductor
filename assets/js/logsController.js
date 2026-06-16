// assets/js/logsController.js

document.addEventListener('DOMContentLoaded', () => {
    // Escuchamos el evento nativo de Bootstrap cuando el modal se va a abrir
    const modalLogsEl = document.getElementById('modalLogs');
    if (modalLogsEl) {
        modalLogsEl.addEventListener('show.bs.modal', cargarHistorialLogs);
    }
});

function cargarHistorialLogs() {
    const tbody = document.getElementById('tabla-logs-body');
    const contador = document.getElementById('contador-logs');
    
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-secondary"><div class="spinner-border spinner-border-sm text-success me-2"></div>Cargando historial...</td></tr>`;

    fetch('api/obtener_logs.php')
        .then(response => response.json())
        .then(data => {
            if (data.estado === 'exito') {
                tbody.innerHTML = ''; 
                
                if (data.datos.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-secondary"><i class="bi bi-inbox d-block fs-3 mb-2 opacity-50"></i>No hay registros de auditoría.</td></tr>`;
                    if(contador) contador.innerText = "0 registros encontrados";
                    return;
                }

                data.datos.forEach(log => {
                    let badgeClass = 'bg-secondary';
                    if (log.accion === 'INSERTAR') badgeClass = 'bg-success';
                    if (log.accion === 'EDITAR') badgeClass = 'bg-primary';
                    if (log.accion === 'ELIMINAR') badgeClass = 'bg-danger';

                    const fechaObj = new Date(log.fecha_hora);
                    const fechaFormat = fechaObj.toLocaleDateString() + ' ' + fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    const tr = document.createElement('tr');
                    tr.className = 'song-row';
                    tr.innerHTML = `
                        <td class="ps-4 text-secondary small align-middle">${fechaFormat}</td>
                        <td class="align-middle"><span class="badge ${badgeClass} bg-opacity-25 text-white border border-light border-opacity-10">${log.accion}</span></td>
                        <td class="text-white-50 small align-middle text-uppercase">${log.modulo}</td>
                        <td class="text-white small align-middle pe-4">${log.descripcion}</td>
                    `;
                    tbody.appendChild(tr);
                });
                
                if(contador) contador.innerText = `Mostrando los últimos ${data.datos.length} registros`;
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${data.mensaje}</td></tr>`;
            }
        })
        .catch(err => {
            console.error("Error obteniendo logs:", err);
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Error de conexión al obtener el historial.</td></tr>`;
        });
}