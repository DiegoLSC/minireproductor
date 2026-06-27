// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    filtrarBiblioteca();
    inicializarControlesNativos();
    restaurarSesion();

    // ==========================================
    // LIMPIEZA DE MODALES AL CERRAR
    // ==========================================
    
    // Limpieza Modal: Publicar Canción
    const modalSubir = document.getElementById('cancionModal');
    if (modalSubir) {
        modalSubir.addEventListener('hidden.bs.modal', function () {
            document.getElementById('subir_can_selected_artists').innerHTML = '';
            document.getElementById('subir_can_hidden_inputs').innerHTML = '';
            window.subirArtistasSeleccionados.clear();
            document.getElementById('subir_can_artist_search').value = '';
            document.getElementById('subir_can_artist_results').style.display = 'none';
        });
    }

    // Limpieza Modal: Registrar Álbum (¡Añadido para evitar duplicados al reabrir!)
    const modalNuevoAlbum = document.getElementById('albumModal');
    if (modalNuevoAlbum) {
        modalNuevoAlbum.addEventListener('hidden.bs.modal', function () {
            document.getElementById('album_selected_artists').innerHTML = '';
            document.getElementById('album_hidden_inputs').innerHTML = '';
            if (window.crearAlbArtistasSeleccionados) window.crearAlbArtistasSeleccionados.clear();
            document.getElementById('album_artist_search').value = '';
            document.getElementById('album_artist_results').style.display = 'none';
        });
    }

    // ==========================================
    // ESTRUCTURA Y COMPORTAMIENTO UI
    // ==========================================

    // Memoria Sidebar PC
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth > 768 && localStorage.getItem('sidebarContraido') === 'true') {
        sidebar.classList.add('contraido');
    }

    // Auto-expansión Sidebar
    document.querySelectorAll('.accordion-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (window.innerWidth > 768 && document.getElementById('sidebar').classList.contains('contraido')) {
                e.stopPropagation(); 
                toggleSidebar(); 
                setTimeout(() => {
                    let targetId = this.getAttribute('data-bs-target');
                    let targetContent = document.querySelector(targetId);
                    if (targetContent) new bootstrap.Collapse(targetContent, { toggle: false }).show();
                }, 350);
            }
        });
    });

    // Barra de volumen (Listener)
    const volumeSlider = document.getElementById('volume-slider');
    const reproductor = document.getElementById('audio-player');
    if (volumeSlider && reproductor) {
        volumeSlider.addEventListener('input', function() {
            const val = parseFloat(this.value);
            reproductor.volume = val;
            if (val === 0) {
                reproductor.muted = true;
                actualizarIconoVolumen(true, 0);
            } else {
                reproductor.muted = false;
                volumenAnterior = val; 
                actualizarIconoVolumen(false, val);
            }
        });
    }

    // Pantalla de carga (Loader)
    const loader = document.getElementById('pantalla-carga');
    if (loader) {
        setTimeout(function() {
            loader.style.opacity = '0'; 
            setTimeout(() => { loader.style.visibility = 'hidden'; }, 500);
        }, 500); 
    }

    const modalLogsEl = document.getElementById('modalLogs');
    if (modalLogsEl) {
        modalLogsEl.addEventListener('show.bs.modal', function () {
            if (typeof cargarHistorialLogs === 'function') {
                cargarHistorialLogs();
            }
        });
    }
});

// ==========================================
// ATAJOS DE TECLADO
// ==========================================
document.addEventListener('keydown', function(event) {
    const elementoActivo = document.activeElement.tagName;
    if (elementoActivo === 'INPUT' || elementoActivo === 'TEXTAREA' || elementoActivo === 'SELECT') return;

    if (event.shiftKey && event.code === 'KeyN') { event.preventDefault(); document.getElementById('next-btn')?.click(); return; }
    if (event.shiftKey && event.code === 'KeyP') { event.preventDefault(); document.getElementById('prev-btn')?.click(); return; }
    if (event.code === 'Space') { event.preventDefault(); document.getElementById('play-btn')?.click(); return; }
    if (event.code === 'KeyM') { event.preventDefault(); toggleMute(); return; }
});

function inicializarControlesNativos() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', cancionAnterior);
        navigator.mediaSession.setActionHandler('nexttrack', siguienteCancion);
    }
}

function actualizarPantallaBloqueo(tituloTrack, artistaTrack, nombreAlbum, rutaImagen) {
    if ('mediaSession' in navigator) {
        const imagenFinal = rutaImagen && rutaImagen !== '' ? rutaImagen : 'assets/img/default.jpg';
        navigator.mediaSession.metadata = new MediaMetadata({
            title: tituloTrack || 'Canción Desconocida',
            artist: artistaTrack || 'Varios Artistas',
            album: nombreAlbum || 'NebulaPlayer',
            artwork: [ { src: imagenFinal, sizes: '512x512', type: 'image/jpeg' } ]
        });
    }
}

function restaurarSesion() {
    const rutaGuardada = localStorage.getItem('nebula_track_ruta');
    if (rutaGuardada) {
        const titulo = localStorage.getItem('nebula_track_titulo');
        const artista = localStorage.getItem('nebula_track_artista');
        const caratula = localStorage.getItem('nebula_track_caratula');
        const tiempoGuardado = localStorage.getItem('nebula_track_tiempo');

        const audio = document.getElementById('audio-player');
        audio.src = rutaGuardada;
        window.rutaEnReproduccion = rutaGuardada;
        document.getElementById('current-title').innerText = titulo;
        document.getElementById('current-artist').innerText = artista;

        const coverImg = document.getElementById('current-cover');
        const iconContainer = document.getElementById('player-icon-container');
        if (!caratula || caratula.includes('default.jpg') || caratula.trim() === '') {
            coverImg.classList.add('d-none');
            iconContainer.classList.remove('d-none');
        } else {
            coverImg.src = caratula;
            coverImg.classList.remove('d-none');
            iconContainer.classList.add('d-none');
        }

        audio.addEventListener('loadedmetadata', function onMetaLoad() {
            if (tiempoGuardado) {
                audio.currentTime = parseFloat(tiempoGuardado);
                document.getElementById('progress-bar').value = (audio.currentTime / audio.duration) * 100;
                document.getElementById('time-current').innerText = formatearTiempo(audio.currentTime);
            }
            audio.removeEventListener('loadedmetadata', onMetaLoad); 
        });
        actualizarPantallaBloqueo(titulo, artista, 'NebulaPlayer', caratula);
    }
}

// ==========================================
// CONTROL DE ELIMINACIÓN CENTRALIZADO PREMIUM
// ==========================================

let _tipoAEliminar = '';
let _idAEliminar = 0;
let _elementoVisualARemover = null;

function prepararEliminacion(tipo, id, btnElemento) {
    _tipoAEliminar = tipo;
    _idAEliminar = id;
    
    // Detecta la fila, tarjeta o contenedor del elemento para poder borrarlo asíncronamente
    _elementoVisualARemover = btnElemento.closest('.target-row') || 
                             btnElemento.closest('tr') || 
                             btnElemento.closest('.card') || 
                             btnElemento.closest('.playlist-item');

    const mensajeEl = document.getElementById('mensajeEliminacionModal');
    if (!mensajeEl) return;

    // Diccionario para adaptar el mensaje de confirmación perfectamente
    const configuracionTipos = {
        'cancion':  { articulo: 'esta', nombre: 'pista' },
        'playlist': { articulo: 'esta', nombre: 'playlist' },
        'album':    { articulo: 'este', nombre: 'álbum' },
        'artista':  { articulo: 'este', nombre: 'artista' }
    };

    // Si el tipo existe en el diccionario usa su configuración, si no, usa una por defecto
    const config = configuracionTipos[tipo] || { articulo: 'este', nombre: tipo };
    
    // Inyecta el texto correcto (Ej: "¿Estás seguro de que deseas eliminar este álbum...?")
    mensajeEl.innerText = `¿Estás seguro de que deseas eliminar ${config.articulo} ${config.nombre} permanentemente?`;

    // Abre el modal de Bootstrap
    const modalConfirmacion = new bootstrap.Modal(document.getElementById('modalConfirmarEliminacion'));
    modalConfirmacion.show();
}

// Escuchador del botón definitivo de confirmación
document.addEventListener('DOMContentLoaded', () => {
    const btnAceptar = document.getElementById('btnAceptarEliminacion');
    if (!btnAceptar) return;
    
    btnAceptar.addEventListener('click', () => {
        // Cierra el modal de forma segura sin crashear el JS
        const modalEl = document.getElementById('modalConfirmarEliminacion');
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
        
        // Ejecuta la eliminación
        eliminarProcedimientoAsincrono(_tipoAEliminar, _idAEliminar, _elementoVisualARemover);
    });
});

function prepararEliminacion(tipo, id, btnElemento) {
    _tipoAEliminar = tipo;
    _idAEliminar = id;
    _elementoVisualARemover = btnElemento.closest('.target-row') || btnElemento.closest('tr') || btnElemento.closest('.card') || btnElemento.closest('.playlist-item');
    
    const mensajeEl = document.getElementById('mensajeEliminacionModal');
    if (!mensajeEl) return;
    
    const configuracionTipos = {
        'cancion':  { articulo: 'esta', nombre: 'pista' },
        'playlist': { articulo: 'esta', nombre: 'playlist' },
        'album':    { articulo: 'este', nombre: 'álbum' },
        'artista':  { articulo: 'este', nombre: 'artista' }
    };
    
    const config = configuracionTipos[tipo] || { articulo: 'este', nombre: tipo };
    mensajeEl.innerText = `¿Estás seguro de que deseas eliminar ${config.articulo} ${config.nombre} permanentemente?`;
    
    // Abre el modal de forma segura
    const modalConfirmacion = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConfirmarEliminacion'));
    modalConfirmacion.show();
}

// ==========================================
// FUNCIÓN QUE EJECUTA LA ELIMINACIÓN REAL EN LA BD
// ==========================================
async function eliminarProcedimientoAsincrono(tipo, id, elementoVisual) {
    try {
        const url = `api/eliminar_elementos.php?tabla=${tipo}&id=${id}`;
        
        const respuesta = await fetch(url, { method: 'GET' });
        
        if (!respuesta.ok) throw new Error('Error en la respuesta del servidor');
        
        const data = await respuesta.json();

        if (data.status === 'success') {
            
            // 1. Mostramos la notificación de éxito
            if (typeof mostrarNotificacionCola === 'function') {
                mostrarNotificacionCola('Elemento eliminado correctamente.');
            }

            // 2. Lógica visual inteligente dependiendo de qué se eliminó
            if (tipo === 'cancion') {
                // Si es una canción individual, la borramos de la vista suavemente
                if (elementoVisual && elementoVisual.classList.contains('target-row')) {
                    elementoVisual.style.transition = "all 0.4s ease";
                    elementoVisual.style.opacity = "0";
                    elementoVisual.style.transform = "scale(0.95)";
                    
                    setTimeout(() => {
                        elementoVisual.remove();
                        const contador = document.getElementById('contador-dinamico');
                        if (contador) {
                            let total = parseInt(contador.innerText);
                            if (!isNaN(total) && total > 0) {
                                contador.innerText = `${total - 1} canciones totales`;
                            }
                        }
                    }, 400); 
                }
            } else {
                // Si es un Artista, Álbum o Playlist, forzamos una recarga automática sutil
                // para que el sistema actualice todas las canciones que contenían ese dato.
                setTimeout(() => {
                    window.location.reload();
                }, 800); // 800ms da tiempo a que el usuario lea la notificación roja antes de recargar
            }
            
        } else {
            alert("Error al eliminar: " + (data.message || "Motivo desconocido"));
        }
    } catch (error) {
        console.error("Error en la petición de eliminación:", error);
        alert("Ocurrió un error de conexión al intentar eliminar el elemento.");
    }
}

async function quitarDePlaylistAsincrono(cancionId, playlistId, elementoBoton) {
    // ELIMINADO EL IF DEL CONFIRM PARA QUE SEA DIRECTO
    try {
        const url = `api/eliminar_elementos.php?tabla=quitar_de_playlist&cancion_id=${cancionId}&playlist_id=${playlistId}`;
        const respuesta = await fetch(url, { method: 'GET' });
        
        if (!respuesta.ok) throw new Error('Error de red');
        const data = await respuesta.json();

        if (data.status === 'success') {
            if (typeof mostrarNotificacionCola === 'function') {
                mostrarNotificacionCola('Canción removida de la playlist.');
            }
            
            const elementoVisual = elementoBoton.closest('.target-row') || elementoBoton.closest('tr');
            if (elementoVisual) {
                elementoVisual.style.transition = "all 0.4s ease";
                elementoVisual.style.opacity = "0";
                elementoVisual.style.transform = "scale(0.95)";
                setTimeout(() => elementoVisual.remove(), 400);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function agregarAPlaylistRealTime(event) {
    event.preventDefault(); // Bloqueo absoluto de recarga
    event.stopPropagation();
    
    const form = event.target;
    const botonSubmit = form.querySelector('button[type="submit"]');
    const textoOriginal = botonSubmit.innerHTML;
    
    botonSubmit.disabled = true;
    botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';

    const formData = new FormData(form);

    try {
        const response = await fetch('api/insertar_elementos.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();

        if (data.status === 'success') {
            // Cierra modal de añadir
            const modalEl = document.getElementById('agregarAPlaylistModal');
            bootstrap.Modal.getInstance(modalEl).hide();

            // Inyecta la playlist a la fila en vivo
            const selectPlaylist = form.querySelector('select[name="playlist_id"]');
            const nombrePlaylist = selectPlaylist.options[selectPlaylist.selectedIndex].text;

            if (window.filaCancionActiva) {
                let playlistsActuales = window.filaCancionActiva.getAttribute('data-playlists') || '';
                if (playlistsActuales.trim() !== '') {
                    playlistsActuales += ', ' + nombrePlaylist;
                } else {
                    playlistsActuales = nombrePlaylist;
                }
                window.filaCancionActiva.setAttribute('data-playlists', playlistsActuales);
            }

            if (typeof mostrarNotificacionCola === 'function') {
                mostrarNotificacionCola('¡Canción añadida a la playlist!');
            }
            form.reset();
            
        } else if (data.status === 'error' && data.message === 'duplicada') {
            // EL NUEVO MODAL PARA DUPLICADOS (Sin recargar)
            document.getElementById('mensajeAlertaModal').innerText = 'Esta canción ya pertenece a la playlist seleccionada.';
            new bootstrap.Modal(document.getElementById('modalAlertaSistema')).show();
            
        } else {
            document.getElementById('mensajeAlertaModal').innerText = "Error: " + (data.message || "No se pudo añadir");
            new bootstrap.Modal(document.getElementById('modalAlertaSistema')).show();
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        document.getElementById('mensajeAlertaModal').innerText = "Ocurrió un error al conectar con el servidor.";
        new bootstrap.Modal(document.getElementById('modalAlertaSistema')).show();
    } finally { // <- AQUÍ ESTABA EL ERROR DE SINTAXIS
        botonSubmit.disabled = false;
        botonSubmit.innerHTML = textoOriginal;
    }
}