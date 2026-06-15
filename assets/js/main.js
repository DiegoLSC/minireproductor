// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    filtrarBiblioteca();
    inicializarControlesNativos();
    restaurarSesion();

    // Inicializadores de Etiquetas (Tags)
    inicializarBuscadorEtiquetas({ idContenedor: 'contenedor_buscador_artistas', idSearch: 'album_artist_search', idResults: 'album_artist_results', idSelected: 'album_selected_artists', idHidden: 'album_hidden_inputs', setGlobal: window.editAlbArtistasSeleccionados, prefix: 'alb' });
    inicializarBuscadorEtiquetas({ idContenedor: 'edit_can_contenedor_buscador', idSearch: 'edit_can_artist_search', idResults: 'edit_can_artist_results', idSelected: 'edit_can_selected_artists', idHidden: 'edit_can_hidden_inputs', setGlobal: window.editArtistasSeleccionados, prefix: 'can' });
    inicializarBuscadorEtiquetas({ idContenedor: 'subir_can_contenedor_buscador', idSearch: 'subir_can_artist_search', idResults: 'subir_can_artist_results', idSelected: 'subir_can_selected_artists', idHidden: 'subir_can_hidden_inputs', setGlobal: window.subirArtistasSeleccionados, prefix: 'sub' });

    // Limpieza de Modales
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
});

// Atajos de Teclado
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