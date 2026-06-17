// assets/js/apiServices.js

// ==========================================
// FORMULARIOS LIGEROS (Textos, Ediciones pequeñas)
// ==========================================
function enviarFormularioAsincrono(event, urlApi) {
    event.preventDefault();
    const formulario = event.target;
    const botonSubmit = formulario.querySelector('button[type="submit"]');
    
    // Bloqueo Visual
    const textoOriginal = botonSubmit.innerHTML;
    botonSubmit.disabled = true;
    botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';

    const formData = new FormData(formulario);

    fetch(urlApi, { method: 'POST', body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            location.reload(); // O recargar la tabla dinámicamente si tienes la función
        } else alert("Error: " + data.message);
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Ocurrió un error de conexión con el servidor.");
    })
    .finally(() => {
        // Restauración
        botonSubmit.disabled = false;
        botonSubmit.innerHTML = textoOriginal;
    });
}


// ==========================================
// FORMULARIO PESADO (MP3 CON BARRA DE PROGRESO)
// ==========================================
let xhrSubidaActual = null; // Variable global para poder abortar

function subirCancionConProgreso(event, urlApi) {
    event.preventDefault();
    const formulario = event.target;
    
    // Captura de elementos UI
    const botonSubmit = document.getElementById('btn-submit-cancion');
    const botonCancelar = document.getElementById('btn-cancelar-subida');
    const contenedorProgreso = document.getElementById('contenedor-progreso-subida');
    const barraProgreso = document.getElementById('barra-progreso-subida');
    const textoProgreso = document.getElementById('texto-progreso-subida');
    const porcentajeTexto = document.getElementById('porcentaje-progreso-subida');

    // Preparar UI para modo "Subiendo"
    botonSubmit.classList.add('d-none');
    contenedorProgreso.classList.remove('d-none');
    botonCancelar.classList.remove('d-none');
    barraProgreso.style.width = '0%';
    barraProgreso.classList.remove('bg-danger');
    barraProgreso.classList.add('bg-success', 'progress-bar-animated');

    const formData = new FormData(formulario);
    xhrSubidaActual = new XMLHttpRequest();
    const tiempoInicio = Date.now();

    // Evento que se dispara continuamente mientras el archivo viaja a internet
    xhrSubidaActual.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            // 1. Porcentaje puro
            const porcentaje = Math.round((e.loaded / e.total) * 100);
            barraProgreso.style.width = porcentaje + '%';
            porcentajeTexto.innerText = porcentaje + '%';

            // 2. Cálculo de métricas y velocidad
            const subidoMB = (e.loaded / (1024 * 1024)).toFixed(1);
            const totalMB = (e.total / (1024 * 1024)).toFixed(1);
            
            const tiempoTranscurrido = (Date.now() - tiempoInicio) / 1000; // en segundos
            let textoTiempo = '';

            // Solo calculamos el ETA si ya pasó medio segundo para evitar saltos locos al inicio
            if (tiempoTranscurrido > 0.5) {
                const velocidadSubida = e.loaded / tiempoTranscurrido; // bytes por segundo
                const bytesRestantes = e.total - e.loaded;
                const segundosRestantes = Math.max(0, bytesRestantes / velocidadSubida);

                if (segundosRestantes > 60) {
                    textoTiempo = Math.ceil(segundosRestantes / 60) + ' min restantes';
                } else if (segundosRestantes > 0 && e.loaded !== e.total) {
                    textoTiempo = Math.ceil(segundosRestantes) + ' seg restantes';
                } else {
                    textoTiempo = 'Procesando archivo en el servidor...';
                }
            }

            textoProgreso.innerText = `${subidoMB} MB / ${totalMB} MB — ${textoTiempo}`;
        }
    });

    // Evento cuando el servidor responde
    xhrSubidaActual.addEventListener('load', () => {
        if (xhrSubidaActual.status === 200) {
            try {
                const data = JSON.parse(xhrSubidaActual.responseText);
                if (data.status === 'success') {
                    textoProgreso.innerText = "¡Subida completada con éxito!";
                    porcentajeTexto.innerText = "100%";
                    barraProgreso.classList.remove('progress-bar-animated');
                    
                    // Esperamos 1 segundo para que el usuario vea que llegó al 100% y recargamos
                    setTimeout(() => location.reload(), 1000);
                } else {
                    mostrarErrorSubida("Error del servidor: " + data.message);
                }
            } catch(err) {
                mostrarErrorSubida("La respuesta del servidor no fue válida.");
            }
        } else {
            mostrarErrorSubida("Error de servidor. Código: " + xhrSubidaActual.status);
        }
    });

    // Evento si se cae el internet
    xhrSubidaActual.addEventListener('error', () => mostrarErrorSubida("Fallo en la conexión a internet."));
    
    // Evento si el usuario apretó Cancelar
    xhrSubidaActual.addEventListener('abort', () => mostrarErrorSubida("Subida cancelada por el usuario."));

    // Enviar a la ruta
    xhrSubidaActual.open('POST', urlApi, true);
    xhrSubidaActual.send(formData);

    // Helper interno para limpiar en caso de error
    function mostrarErrorSubida(mensaje) {
        textoProgreso.innerText = mensaje;
        textoProgreso.classList.replace('text-secondary', 'text-danger');
        barraProgreso.classList.replace('bg-success', 'bg-danger');
        barraProgreso.classList.remove('progress-bar-animated');
        botonCancelar.innerText = "Cerrar";
        
        // Habilitamos el botón de volver a intentar en 3 segundos
        setTimeout(() => {
            botonSubmit.classList.remove('d-none');
            botonCancelar.classList.add('d-none');
            textoProgreso.classList.replace('text-danger', 'text-secondary');
            contenedorProgreso.classList.add('d-none');
            botonCancelar.innerText = "Cancelar Subida";
        }, 3500);
    }
}

// Función que detona el botón "Cancelar"
function cancelarSubidaActual() {
    if (xhrSubidaActual) {
        xhrSubidaActual.abort(); // Dispara automáticamente el evento 'abort' arriba
        xhrSubidaActual = null;
    }
}

function eliminarElementoAsincrono(tabla, id, botonClid) {
    event.stopPropagation();
    if (!confirm(`¿Estás seguro de que deseas eliminar este registro?`)) return;
    
    fetch(`api/eliminar_elementos.php?tabla=${tabla}&id=${id}`)
    .then(response => {
        if (response.ok) {
            alert("¡El elemento ha sido eliminado con éxito!");
            // ESTA LÍNEA ES LA CLAVE: Refrescamos la vista
            location.reload();
        } else { 
            alert("Error: No se pudo eliminar el elemento."); 
        }
    }).catch(err => console.error(err));
}

// SISTEMA DE BACKUP
let backupInterval;

function iniciarBackup() {
    if (!confirm("¿Estás seguro de que deseas generar un backup de toda tu biblioteca?\n\nEste proceso se ejecutará en segundo plano y puede tardar un poco.")) return;

    const toastEl = document.getElementById('backupToast');
    const toastBody = document.getElementById('backupToastMensaje');
    const toast = new bootstrap.Toast(toastEl);

    toastBody.innerHTML = `<span class="spinner-border spinner-border-sm text-warning" role="status"></span> Empaquetando tu biblioteca...`;
    toast.show();

    fetch('api/backup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'accion=iniciar'
    }).catch(e => console.error("Error al lanzar proceso:", e));

    clearInterval(backupInterval);
    backupInterval = setInterval(revisarEstadoBackup, 3000);
}

function procesarSubidaBackup(input) {
    const archivo = input.files[0];
    if (!archivo) return; 

    const mensaje = `¿Estás seguro de sincronizar el backup "${archivo.name}"?\n\nEl sistema analizará los archivos y SOLO añadirá las canciones, artistas y álbumes que NO existan actualmente.`;

    if (!confirm(mensaje)) {
        input.value = ''; 
        return;
    }

    const toastEl = document.getElementById('backupToast');
    const toastBody = document.getElementById('backupToastMensaje');
    if (toastEl && toastBody) {
        const toast = new bootstrap.Toast(toastEl);
        toastBody.innerHTML = `<span class="spinner-border spinner-border-sm text-info" role="status"></span> Analizando y fusionando biblioteca...`;
        toast.show();
    }

    const formData = new FormData();
    formData.append('archivo_backup', archivo);

    fetch('api/restaurar_backup.php', { method: 'POST', body: formData })
    .then(response => response.json())
    .then(datos => {
        if (datos.estado === 'exito') {
            toastBody.innerHTML = `<i class="bi bi-check-circle-fill text-success fs-5"></i> ¡Fusión completada! Se añadieron ${datos.canciones_nuevas || 0} canciones nuevas.`;
            setTimeout(() => location.reload(), 3000); 
        } else {
            toastBody.innerHTML = `<i class="bi bi-x-circle-fill text-danger fs-5"></i> Error: ${datos.mensaje}`;
        }
    })
    .catch(err => {
        console.error("Error en la subida:", err);
        toastBody.innerHTML = `<i class="bi bi-x-circle-fill text-danger fs-5"></i> Hubo un error de red al subir el archivo.`;
    })
    .finally(() => { input.value = ''; });
}

async function revisarEstadoBackup() {
    try {
        const respuesta = await fetch('api/backup.php?accion=estado');
        const datos = await respuesta.json();

        if (datos.estado === 'completado') {
            clearInterval(backupInterval); 
            const toastBody = document.getElementById('backupToastMensaje');
            toastBody.innerHTML = `
                <i class="bi bi-check-circle-fill text-success fs-5"></i> 
                <span>¡Backup Listo!</span>
                <a href="${datos.archivo}" download class="btn btn-sm btn-success ms-2">Descargar ZIP</a>
            `;
            fetch('api/backup.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'accion=limpiar' });
        } 
        else if (datos.estado === 'error') {
            clearInterval(backupInterval);
            document.getElementById('backupToastMensaje').innerHTML = `<i class="bi bi-x-circle-fill text-danger fs-5"></i> Hubo un error al crear el backup.`;
        }
    } catch (error) { console.error("Revisando estado...", error); }
}

async function descargarCancionConMetadatos(boton, rutaAudio, tituloTrack, artistasTexto, albumTrack) {
    const textoOriginal = boton.querySelector('.texto-btn').innerText;
    const iconoOriginal = boton.querySelector('i').className;
    
    try {
        boton.querySelector('.texto-btn').innerText = " Preparando...";
        boton.querySelector('i').className = "bi bi-hourglass-split text-warning spinner-border spinner-border-sm";
        boton.disabled = true;

        const rutaLimpia = rutaAudio.replace('../', '');
        const respuesta = await fetch(rutaLimpia);
        if (!respuesta.ok) throw new Error("Archivo MP3 no encontrado.");
        const buffer = await respuesta.arrayBuffer();

        let writer;
        if (typeof ID3Writer !== 'undefined') writer = new ID3Writer(buffer);
        else if (typeof browserID3Writer !== 'undefined') writer = new browserID3Writer(buffer);
        else throw new Error("La librería de metadatos no cargó.");

        const arrayArtistas = artistasTexto ? artistasTexto.split(',').map(a => a.trim()) : ['Artista Desconocido'];

        writer.setFrame('TIT2', tituloTrack)
              .setFrame('TPE1', arrayArtistas)
              .setFrame('TALB', albumTrack || 'Sencillo');
        writer.addTag();

        const blob = writer.getBlob();
        const urlObjeto = URL.createObjectURL(blob);

        const enlaceDescarga = document.createElement('a');
        enlaceDescarga.href = urlObjeto;
        enlaceDescarga.download = `${tituloTrack.replace(/[<>:"/\\|?*]+/g, '')}.mp3`;
        
        document.body.appendChild(enlaceDescarga);
        enlaceDescarga.click();
        
        document.body.removeChild(enlaceDescarga);
        URL.revokeObjectURL(urlObjeto);

    } catch (error) {
        console.error("Error al inyectar metadatos:", error);
        alert("Error: " + error.message); 
    } finally {
        boton.querySelector('.texto-btn').innerText = textoOriginal;
        boton.querySelector('i').className = iconoOriginal;
        boton.disabled = false;
    }

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
                        contador.innerText = "0 registros encontrados";
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
                    
                    contador.innerText = `Mostrando los últimos ${data.datos.length} registros`;
                } else {
                    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${data.mensaje}</td></tr>`;
                }
            })
            .catch(err => {
                console.error("Error obteniendo logs:", err);
                tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Error de conexión al obtener el historial.</td></tr>`;
            });
    }
}