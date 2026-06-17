// assets/js/logsController.js

let logsOffset = 0; // Lleva la cuenta de cuántos registros ya hemos cargado
let totalLogsCargados = 0;

document.addEventListener('DOMContentLoaded', () => {
    const modalLogsEl = document.getElementById('modalLogs');
    if (modalLogsEl) {
        modalLogsEl.addEventListener('show.bs.modal', () => {
            // Reiniciar el contador y limpiar la tabla cada vez que se abre el modal
            logsOffset = 0;
            totalLogsCargados = 0;
            const tbody = document.getElementById('tabla-logs-body');
            if(tbody) tbody.innerHTML = '';
            
            cargarHistorialLogs();
        });
    }
});

function cargarHistorialLogs() {
    const tbody = document.getElementById('tabla-logs-body');
    const contador = document.getElementById('contador-logs');
    const footerModal = document.querySelector('#modalLogs .modal-footer'); // Buscar el footer para el botón
    
    if (!tbody) return;

    // Si es la primera carga (offset 0), mostrar el spinner grande
    if (logsOffset === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-secondary"><div class="spinner-border spinner-border-sm text-success me-2"></div>Cargando historial...</td></tr>`;
    }

    // Asegurarnos de que exista un contenedor para el botón de "Cargar más"
    let contenedorBoton = document.getElementById('contenedor-cargar-mas');
    if (!contenedorBoton && footerModal) {
        // Creamos un div para poner el botón justo antes de los botones de cerrar
        contenedorBoton = document.createElement('div');
        contenedorBoton.id = 'contenedor-cargar-mas';
        contenedorBoton.className = 'w-100 text-center mb-2'; // Centrado y con margen
        footerModal.insertBefore(contenedorBoton, footerModal.firstChild); // Insertar al inicio del footer
    }

    if (contenedorBoton) {
        contenedorBoton.innerHTML = `<span class="text-secondary small"><div class="spinner-border spinner-border-sm text-success me-2"></div>Buscando registros...</span>`;
    }


    // Le pasamos el offset actual a la API
    fetch(`api/obtener_logs.php?offset=${logsOffset}`)
        .then(response => response.json())
        .then(data => {
            if (data.estado === 'exito') {
                
                // Si es la primera página, limpiamos el spinner
                if (logsOffset === 0) tbody.innerHTML = ''; 
                
                if (data.datos.length === 0 && logsOffset === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-secondary"><i class="bi bi-inbox d-block fs-3 mb-2 opacity-50"></i>No hay registros de auditoría.</td></tr>`;
                    if(contador) contador.innerText = "0 registros encontrados";
                    if(contenedorBoton) contenedorBoton.innerHTML = ''; // Ocultar zona de botón
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
                
                totalLogsCargados += data.datos.length;
                if(contador) contador.innerText = `Mostrando ${totalLogsCargados} registros`;

                // Gestionar el botón "Cargar más"
                if (contenedorBoton) {
                    if (data.hay_mas) {
                        // Si el PHP dice que hay más, pintamos el botón y preparamos el próximo offset
                        logsOffset += 50; 
                        contenedorBoton.innerHTML = `<button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-4" onclick="cargarHistorialLogs()"><i class="bi bi-arrow-clockwise me-2"></i>Cargar registros anteriores</button>`;
                    } else {
                        // Ya no hay más registros en la DB
                        contenedorBoton.innerHTML = `<span class="text-secondary small fst-italic">Fin del historial.</span>`;
                    }
                }

            } else {
                 if (logsOffset === 0) {
                     tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${data.mensaje}</td></tr>`;
                 }
                 if(contenedorBoton) contenedorBoton.innerHTML = `<span class="text-danger small">Error cargando más registros.</span>`;
            }
        })
        .catch(err => {
            console.error("Error obteniendo logs:", err);
            if (logsOffset === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Error de conexión al obtener el historial.</td></tr>`;
            }
            if(contenedorBoton) contenedorBoton.innerHTML = `<span class="text-danger small">Error de conexión.</span>`;
        });
}