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
        // Cierra el modal
        const modalEl = document.getElementById('modalConfirmarEliminacion');
        bootstrap.Modal.getInstance(modalEl).hide();

        // Ejecuta tu función AJAX original pasándole el tipo, id y el elemento visual
        eliminarProcedimientoAsincrono(_tipoAEliminar, _idAEliminar, _elementoVisualARemover);
    });
});

// ==========================================
// FUNCIÓN QUE EJECUTA LA ELIMINACIÓN REAL EN LA BD
// ==========================================
async function eliminarProcedimientoAsincrono(tipo, id, elementoVisual) {
    try {
        // MUY IMPORTANTE: Verifica que esta ruta apunte a tu archivo PHP real que procesa la eliminación.
        // He puesto 'api/eliminar_elementos.php' como ejemplo basado en tu estructura.
        const url = `api/eliminar_elementos.php?tabla=${tipo}&id=${id}`;
        
        const respuesta = await fetch(url, { method: 'GET' });
        
        if (!respuesta.ok) throw new Error('Error en la respuesta del servidor');
        
        const data = await respuesta.json();

        if (data.status === 'success') {
            // 1. Animación de desvanecimiento elegante (Crimson Velvet style)
            if (elementoVisual) {
                elementoVisual.style.transition = "all 0.4s ease";
                elementoVisual.style.opacity = "0";
                elementoVisual.style.transform = "scale(0.95)"; // Se encoje un poquito antes de desaparecer
                
                setTimeout(() => {
                    elementoVisual.remove();
                    
                    // 2. (Opcional) Si estamos en la vista de canciones, actualizamos el contador de arriba
                    const contador = document.getElementById('contador-dinamico');
                    if (contador && tipo === 'cancion') {
                        let total = parseInt(contador.innerText);
                        if (!isNaN(total) && total > 0) {
                            contador.innerText = `${total - 1} canciones totales`;
                        }
                    }
                }, 400); // Espera a que termine la animación para borrar el HTML
            }
            
            // 3. Reutilizamos tu notificación tipo Toast para avisar del éxito
            if (typeof mostrarNotificacionCola === 'function') {
                mostrarNotificacionCola('Elemento eliminado permanentemente.');
            }
            
        } else {
            alert("Error al eliminar: " + (data.message || "Motivo desconocido"));
        }
    } catch (error) {
        console.error("Error en la petición de eliminación:", error);
        alert("Ocurrió un error de conexión al intentar eliminar el elemento.");
    }
}