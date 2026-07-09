// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    filtrarBiblioteca();
    inicializarControlesNativos();
    restaurarSesion();

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

    // ==============================================================
    // NUEVO: LIMPIAR PREVISUALIZACIONES AL CERRAR MODALES DE EDICIÓN
    // ==============================================================
    const modalesEdicion = ['editCancionModal', 'editArtistaModal', 'editAlbumModal'];
    modalesEdicion.forEach(modalId => {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', function () {
                // 1. Limpiar el input de archivo (por si seleccionó algo de su PC)
                const fileInput = this.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';

                // 2. Limpiar la URL web oculta
                const hiddenUrl = this.querySelector('.hidden-url-online');
                if (hiddenUrl) hiddenUrl.value = '';

                // 3. Ocultar y vaciar la imagen de previsualización
                const previewContainer = this.querySelector('.preview-container');
                const previewImg = this.querySelector('.preview-img');
                if (previewContainer) previewContainer.classList.add('d-none');
                if (previewImg) previewImg.src = '';
            });
        }
    });

    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth > 768 && localStorage.getItem('sidebarContraido') === 'true') {
        sidebar.classList.add('contraido');
    }

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

    const volumeSlider = document.getElementById('volume-slider');
    const reproductor = document.getElementById('audio-player');
    if (volumeSlider && reproductor) {
        volumeSlider.addEventListener('input', function() {
            const val = parseFloat(this.value);
            reproductor.volume = val;
            localStorage.setItem('nebula_volumen', val);
            if (val === 0) {
                reproductor.muted = true;
                actualizarIconoVolumen(true, 0);
                localStorage.setItem('nebula_muted', 'true');
            } else {
                reproductor.muted = false;
                volumenAnterior = val;
                actualizarIconoVolumen(false, val);
                localStorage.setItem('nebula_muted', 'false');
            }
        });
    }

    const loader = document.getElementById('pantalla-carga');
    if (loader) {
        setTimeout(function() {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.visibility = 'hidden';
            }, 500);
        }, 500);
    } else {
        const buscador = document.getElementById('buscadorInput');
        if (buscador) buscador.focus();
    }

    const modalLogsEl = document.getElementById('modalLogs');
    if (modalLogsEl) {
        modalLogsEl.addEventListener('show.bs.modal', function () {
            if (typeof cargarHistorialLogs === 'function') {
                cargarHistorialLogs();
            }
        });
    }

    // LISTENER PARA EL NUEVO MODAL DE ESCANEO
    const btnAceptarEscaneo = document.getElementById('btnAceptarEscaneo');
    if (btnAceptarEscaneo) {
        btnAceptarEscaneo.addEventListener('click', () => {
            const modalEl = document.getElementById('modalConfirmarEscaneo');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
            ejecutarEscaneoItunesEnLote();
        });
    }
});

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
            artwork: [
                { src: imagenFinal, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
}

function restaurarSesion() {
    const audio = document.getElementById('audio-player');
    const volumeSlider = document.getElementById('volume-slider');
    
    const volGuardado = localStorage.getItem('nebula_volumen');
    const muteGuardado = localStorage.getItem('nebula_muted');
    
    if (volGuardado !== null && audio && volumeSlider) {
        const val = parseFloat(volGuardado);
        audio.volume = val;
        volumenAnterior = val > 0 ? val : 1;
        if (muteGuardado !== 'true') {
            volumeSlider.value = val;
            actualizarIconoVolumen(false, val);
        }
    }
    
    if (muteGuardado === 'true' && audio && volumeSlider) {
        audio.muted = true;
        volumeSlider.value = 0;
        actualizarIconoVolumen(true, 0);
    }
    
    const rutaGuardada = localStorage.getItem('nebula_track_ruta');
    if (rutaGuardada) {
        const titulo = localStorage.getItem('nebula_track_titulo');
        const artista = localStorage.getItem('nebula_track_artista');
        const caratula = localStorage.getItem('nebula_track_caratula');
        const tiempoGuardado = localStorage.getItem('nebula_track_tiempo');
        
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
        
        document.querySelectorAll('.target-row').forEach(fila => {
            fila.classList.remove('bg-dark-subtle', 'border-start', 'border-danger');
            const textoTitulo = fila.querySelector('.title-col span');
            if (textoTitulo) textoTitulo.classList.remove('text-success');
        });
        
        const filaActiva = Array.from(document.querySelectorAll('.target-row')).find(f => f.getAttribute('data-ruta') === rutaGuardada);
        if (filaActiva) {
            filaActiva.classList.add('bg-dark-subtle', 'border-start', 'border-danger');
            const textoTituloActivo = filaActiva.querySelector('.title-col span');
            if (textoTituloActivo) textoTituloActivo.classList.add('text-success');
        }
    }
}

function toggleMute() {
    const reproductor = document.getElementById('audio-player');
    const volumeSlider = document.getElementById('volume-slider');
    if (!reproductor || !volumeSlider) return;
    
    if (reproductor.muted || parseFloat(volumeSlider.value) === 0) {
        reproductor.muted = false;
        let nuevoVol = volumenAnterior > 0 ? volumenAnterior : 1;
        reproductor.volume = nuevoVol;
        volumeSlider.value = nuevoVol;
        actualizarIconoVolumen(false, nuevoVol);
        localStorage.setItem('nebula_volumen', nuevoVol);
        localStorage.setItem('nebula_muted', 'false');
    } else {
        volumenAnterior = parseFloat(volumeSlider.value);
        reproductor.muted = true;
        volumeSlider.value = 0;
        actualizarIconoVolumen(true, 0);
        localStorage.setItem('nebula_muted', 'true');
    }
}

// ==========================================
// CONTROL DE ELIMINACIÓN CENTRALIZADO PREMIUM SPA
// ==========================================
let _tipoAEliminar = '';
let _idAEliminar = 0;
let _elementoVisualARemover = null;

function prepararEliminacion(tipo, id, btnElemento) {
    _tipoAEliminar = tipo;
    _idAEliminar = id;
    _elementoVisualARemover = btnElemento.closest('.target-row') || btnElemento.closest('tr') || btnElemento.closest('.accordion-item') || btnElemento.closest('li.item-con-opciones');
    
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
    
    const modalConfirmacion = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConfirmarEliminacion'));
    modalConfirmacion.show();
}

document.addEventListener('DOMContentLoaded', () => {
    const btnAceptar = document.getElementById('btnAceptarEliminacion');
    if (!btnAceptar) return;
    
    btnAceptar.addEventListener('click', () => {
        const modalEl = document.getElementById('modalConfirmarEliminacion');
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
        eliminarProcedimientoAsincrono(_tipoAEliminar, _idAEliminar, _elementoVisualARemover);
    });
});

async function eliminarProcedimientoAsincrono(tipo, id, elementoVisual) {
    try {
        const url = `api/eliminar_elementos.php?tabla=${tipo}&id=${id}`;
        const respuesta = await fetch(url, { method: 'GET' });
        
        if (!respuesta.ok) throw new Error('Error en la respuesta del servidor');
        
        const data = await respuesta.json();
        
        if (data.status === 'success') {
            if (typeof mostrarNotificacionCola === 'function') {
                mostrarNotificacionCola('Elemento eliminado correctamente.');
            }
            
            if (tipo === 'cancion') {
                if (elementoVisual && elementoVisual.classList.contains('target-row')) {
                    elementoVisual.style.transition = "all 0.4s ease";
                    elementoVisual.style.opacity = "0";
                    elementoVisual.style.transform = "scale(0.95)";
                    setTimeout(() => {
                        elementoVisual.remove();
                        recalcularIndicesTabla();
                        if (typeof filtrarBiblioteca === 'function') {
                            filtrarBiblioteca();
                            if (typeof actualizarColaReproduccion === 'function') {
                                actualizarColaReproduccion();
                                const panel = document.getElementById('colaPanel');
                                if (panel && panel.classList.contains('activo')) renderizarColaVisual();
                            }
                        }
                    }, 400);
                }
            } else if (tipo === 'playlist') {
                const itemPL = document.getElementById(`li_pl_menu_${id}`);
                if (itemPL) {
                    itemPL.style.transition = "all 0.4s ease";
                    itemPL.style.opacity = "0";
                    setTimeout(() => itemPL.remove(), 400);
                }
                document.querySelectorAll(`select option[value="${id}"]`).forEach(opt => opt.remove());
            } else if (tipo === 'album') {
                document.querySelectorAll(`[id^="li_alb_menu_${id}"]`).forEach(item => {
                    const ul = item.parentNode;
                    item.style.transition = "all 0.4s ease";
                    item.style.opacity = "0";
                    setTimeout(() => {
                        item.remove();
                        if (ul && ul.querySelectorAll('li.item-con-opciones').length === 0) {
                            ul.innerHTML = `<li class="text-muted small p-1 ps-2 fst-italic" style="font-size: 0.75rem;">Sin álbumes</li>`;
                        }
                    }, 400);
                });
                document.querySelectorAll(`select option[value="${id}"]`).forEach(opt => opt.remove());
            } else if (tipo === 'artista') {
                const itemArt = document.getElementById(`block_art_${id}`);
                if (itemArt) {
                    itemArt.style.transition = "all 0.4s ease";
                    itemArt.style.opacity = "0";
                    setTimeout(() => itemArt.remove(), 400);
                }
                const contenedoresBuscadores = [
                    'contenedor_buscador_artistas', 'subir_can_contenedor_buscador',
                    'edit_can_contenedor_buscador', 'edit_alb_contenedor_buscador'
                ];
                contenedoresBuscadores.forEach(idCont => {
                    const contSearch = document.getElementById(idCont);
                    if (contSearch && contSearch.listaArtistas) {
                        contSearch.listaArtistas = contSearch.listaArtistas.filter(a => a.id != id);
                        contSearch.dataset.artistas = JSON.stringify(contSearch.listaArtistas);
                    }
                });
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
                setTimeout(() => {
                    elementoVisual.remove();
                    recalcularIndicesTabla();
                    if (typeof filtrarBiblioteca === 'function') filtrarBiblioteca();
                }, 400);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function agregarAPlaylistRealTime(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const form = event.target;
    const botonSubmit = form.querySelector('button[type="submit"]');
    const textoOriginal = botonSubmit.innerHTML;
    
    botonSubmit.disabled = true;
    botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';
    
    const formData = new FormData(form);
    
    try {
        const response = await fetch('api/insertar_elementos.php', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (data.status === 'success') {
            const modalEl = document.getElementById('agregarAPlaylistModal');
            bootstrap.Modal.getInstance(modalEl).hide();
            
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
    } finally {
        botonSubmit.disabled = false;
        botonSubmit.innerHTML = textoOriginal;
    }
}

// ==========================================
// ENRUTADOR DE MUTACIONES EN VIVO (SPA)
// ==========================================
function procesarMutacionSPA(accion, data) {
    if (!data) return;
    switch(accion) {
        case 'crear_artista':
            inyectarArtistaDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Artista registrado');
            break;
        case 'editar_artista':
            actualizarArtistaDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Artista actualizado');
            break;
        case 'crear_album':
            inyectarAlbumDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Álbum registrado');
            break;
        case 'editar_album':
            actualizarAlbumDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Álbum actualizado');
            break;
        case 'crear_playlist':
            inyectarPlaylistDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Playlist creada');
            break;
        case 'editar_playlist':
            actualizarPlaylistDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Playlist actualizada');
            break;
        case 'subir_cancion':
            inyectarCancionDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Pista publicada');
            break;
        case 'editar_cancion':
            actualizarCancionDOM(data);
            if (typeof mostrarNotificacionCola === 'function') mostrarNotificacionCola('Pista modificada');
            break;
    }
}

// ==========================================
// RECALCULAR INDICES VISUALES
// ==========================================
function recalcularIndicesTabla() {
    const filas = document.querySelectorAll('#tablaCanciones tbody .target-row');
    filas.forEach((fila, index) => {
        const celdaNumero = fila.querySelector('td:first-child');
        if (celdaNumero) celdaNumero.innerText = index + 1;
    });
}

// ==========================================
// INYECTORES Y ACTUALIZADORES DOM 
// ==========================================
function inyectarPlaylistDOM(pl) {
    const ul = document.querySelector('#dropPlaylists .nav');
    if (!ul) return;
    
    const li = document.createElement('li');
    li.className = "d-flex align-items-center justify-content-between p-1 rounded hover-bg-dark item-con-opciones";
    li.id = `li_pl_menu_${pl.id}`;
    li.innerHTML = `
        <a href="#" class="text-secondary text-truncate flex-grow-1 text-decoration-none me-1 hover-text-white" data-nombre="${pl.nombre}" onclick="filtrarPorPlaylist(this.getAttribute('data-nombre'), ${pl.id})">
            <i class="bi bi-music-note-list me-2 text-secondary"></i><span class="texto-nombre">${pl.nombre}</span>
        </a>
        <div class="d-flex gap-1 btn-opciones">
            <span style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#editPlaylistModal" data-nombre="${pl.nombre}" data-desc="${pl.descripcion || ''}" onclick="document.getElementById('edit_pl_id').value='${pl.id}'; document.getElementById('edit_pl_nombre').value=this.getAttribute('data-nombre'); document.getElementById('edit_pl_desc').value=this.getAttribute('data-desc');">
                <i class="bi bi-pencil small text-warning opacity-75 hover-opacity-100"></i>
            </span>
            <span style="cursor:pointer;" onclick="event.stopPropagation(); prepararEliminacion('playlist', ${pl.id}, this)">
                <i class="bi bi-trash3 small text-danger opacity-75 hover-opacity-100"></i>
            </span>
        </div>
    `;
    insertarEnOrden(ul, li, '.item-con-opciones', '.texto-nombre');
    
    const selectAdd = document.querySelector('#agregarAPlaylistModal select[name="playlist_id"]');
    if (selectAdd) selectAdd.insertAdjacentHTML('beforeend', `<option value="${pl.id}">${pl.nombre}</option>`);
}

function actualizarPlaylistDOM(pl) {
    const li = document.getElementById(`li_pl_menu_${pl.id}`);
    if (li) {
        const a = li.querySelector('a');
        if (a) {
            a.setAttribute('data-nombre', pl.nombre);
            const spanTexto = a.querySelector('.texto-nombre');
            if (spanTexto) spanTexto.innerText = pl.nombre;
        }
        const editBtn = li.querySelector('[data-bs-target="#editPlaylistModal"]');
        if (editBtn) {
            editBtn.setAttribute('data-nombre', pl.nombre);
            editBtn.setAttribute('data-desc', pl.descripcion || '');
        }
        const ul = li.parentNode;
        ul.removeChild(li);
        insertarEnOrden(ul, li, '.item-con-opciones', '.texto-nombre');
    }
    
    document.querySelectorAll(`select[name="playlist_id"] option[value="${pl.id}"]`).forEach(opt => {
        opt.innerText = pl.nombre;
    });
}

function inyectarArtistaDOM(artista) {
    const contenedor = document.getElementById('acordeonSubArtistas');
    if (!contenedor) return;
    
    const collapseId = `collapse_art_${artista.id}`;
    const esDefault = !artista.foto || artista.foto.includes('default.jpg') || artista.foto.trim() === '';
    const iconoHTML = esDefault 
        ? `<div class="bg-secondary d-flex align-items-center justify-content-center rounded-circle text-muted" style="width: 24px; height: 24px; min-width: 24px;"><i class="bi bi-person-fill small"></i></div>` 
        : `<img src="${artista.foto}" style="width: 24px; height: 24px; object-fit: cover;" class="rounded-circle" alt="Art">`;
        
    const divWrapper = document.createElement('div');
    divWrapper.className = "accordion-item bg-transparent border-0 mb-1";
    divWrapper.id = `block_art_${artista.id}`;
    divWrapper.innerHTML = `
        <div class="d-flex align-items-center justify-content-between text-secondary p-1 rounded hover-bg-dark item-con-opciones">
            <div class="d-flex align-items-center gap-2 text-truncate flex-grow-1" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                ${iconoHTML}
                <span class="text-white fw-medium text-truncate">${artista.nombre}</span>
            </div>
            <div class="dropdown btn-opciones ms-2">
                <button class="btn btn-link text-secondary p-0 border-0 shadow-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                    <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                    <li><a class="dropdown-item small" href="#" data-nombre="${artista.nombre}" onclick="document.getElementById('buscadorInput').value=this.getAttribute('data-nombre'); filtrarBiblioteca(); return false;"><i class="bi bi-search text-success me-2"></i>Buscar todas sus canciones</a></li>
                    <li><a class="dropdown-item small" href="#" data-bs-toggle="modal" data-bs-target="#editArtistaModal" data-nombre="${artista.nombre}" onclick="document.getElementById('edit_art_id').value='${artista.id}'; document.getElementById('edit_art_nombre').value=this.getAttribute('data-nombre');"><i class="bi bi-pencil text-warning me-2"></i>Editar Artista</a></li>
                    <li><hr class="dropdown-divider border-secondary"></li>
                    <li><a class="dropdown-item small text-danger" href="#" onclick="event.preventDefault(); event.stopPropagation(); prepararEliminacion('artista', ${artista.id}, this)"><i class="bi bi-trash3 text-danger me-2"></i>Eliminar Artista</a></li>
                </ul>
            </div>
        </div>
        <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#acordeonSubArtistas">
            <div class="accordion-body p-0 py-1 ps-4 ms-2 border-start border-secondary border-opacity-25">
                <ul class="list-unstyled d-flex flex-column gap-1 small mb-0" id="lista_albumes_art_${artista.id}"><li class="text-muted small p-1 ps-2 fst-italic" style="font-size: 0.75rem;">Sin álbumes</li></ul>
            </div>
        </div>`;
        
    insertarEnOrden(contenedor, divWrapper, '.accordion-item', '.text-white.fw-medium');
    
    const contenedoresBuscadores = [
        'contenedor_buscador_artistas', 'subir_can_contenedor_buscador', 
        'edit_can_contenedor_buscador', 'edit_alb_contenedor_buscador'
    ];
    
    contenedoresBuscadores.forEach(idCont => {
        const contSearch = document.getElementById(idCont);
        if (contSearch && contSearch.listaArtistas) {
            contSearch.listaArtistas.push({ id: artista.id, nombre: artista.nombre, foto: artista.foto });
            const currentData = JSON.parse(contSearch.dataset.artistas || '[]');
            if (!currentData.some(a => a.id == artista.id)) {
                currentData.push({ id: artista.id, nombre: artista.nombre, foto: artista.foto });
                contSearch.dataset.artistas = JSON.stringify(currentData);
            }
        }
    });
}

function actualizarArtistaDOM(artista) {
    const block = document.getElementById(`block_art_${artista.id}`);
    if (!block) return;
    
    const txt = block.querySelector('.text-white.fw-medium');
    if (txt) txt.innerText = artista.nombre;
    
    const esDefault = !artista.foto || artista.foto.includes('default.jpg') || artista.foto.trim() === '';
    // ROMPEDOR DE CACHÉ: Obliga al navegador a renderizar la imagen sin usar su memoria
    const cacheBuster = esDefault ? '' : '?v=' + new Date().getTime();
    
    let img = block.querySelector('img');
    let divFallback = block.querySelector('.bg-secondary');
    
    if (esDefault) {
        if (img) {
            const newDiv = document.createElement('div');
            newDiv.className = 'bg-secondary d-flex align-items-center justify-content-center rounded-circle text-muted';
            newDiv.style.cssText = 'width: 24px; height: 24px; min-width: 24px;';
            newDiv.innerHTML = '<i class="bi bi-person-fill small"></i>';
            img.replaceWith(newDiv);
        }
    } else {
        if (img) {
            img.src = artista.foto + cacheBuster;
        } else if (divFallback) {
            const newImg = document.createElement('img');
            newImg.src = artista.foto + cacheBuster;
            newImg.style.cssText = 'width: 24px; height: 24px; object-fit: cover;';
            newImg.className = 'rounded-circle';
            divFallback.replaceWith(newImg);
        }
    }
    
    const editBtn = block.querySelector('[data-bs-target="#editArtistaModal"]');
    if (editBtn) editBtn.setAttribute('data-nombre', artista.nombre);
    
    const contenedor = document.getElementById('acordeonSubArtistas');
    contenedor.removeChild(block);
    insertarEnOrden(contenedor, block, '.accordion-item', '.text-white.fw-medium');

    document.querySelectorAll('#tablaCanciones tbody .target-row').forEach(tr => {
        const artistsIds = tr.getAttribute('data-artistas-ids') || '';
        if (artistsIds.split(',').map(id => id.trim()).includes(artista.id.toString())) {
            const enlaceArtista = tr.querySelector(`.artist-col a[data-artista-id="${artista.id}"]`);
            if (enlaceArtista) {
                enlaceArtista.innerText = artista.nombre;
                enlaceArtista.setAttribute('onclick', `document.getElementById('buscadorInput').value='${artista.nombre.replace(/'/g, "\\'")}'; filtrarBiblioteca(); return false;`);
            }
            const todosLosNombres = Array.from(tr.querySelectorAll('.artist-col a')).map(a => a.innerText.trim()).join(', ');
            tr.setAttribute('data-artista', todosLosNombres);

            if (window.rutaEnReproduccion === tr.getAttribute('data-ruta')) {
                const currentArtistEl = document.getElementById('current-artist');
                if(currentArtistEl) currentArtistEl.innerText = todosLosNombres;
            }
        }
    });
    
    const contenedoresBuscadores = [
        'contenedor_buscador_artistas', 'subir_can_contenedor_buscador', 
        'edit_can_contenedor_buscador', 'edit_alb_contenedor_buscador'
    ];
    
    contenedoresBuscadores.forEach(idCont => {
        const contSearch = document.getElementById(idCont);
        if (contSearch && contSearch.listaArtistas) {
            const index = contSearch.listaArtistas.findIndex(a => a.id == artista.id);
            if (index !== -1) {
                contSearch.listaArtistas[index].nombre = artista.nombre;
                if (artista.foto) contSearch.listaArtistas[index].foto = artista.foto + cacheBuster;
            }
            contSearch.dataset.artistas = JSON.stringify(contSearch.listaArtistas);
        }
    });
}

function inyectarAlbumDOM(album) {
    const ids = album.artistas_ids ? album.artistas_ids.split(',') : [];
    const esDefault = !album.caratula || album.caratula.includes('default.jpg') || album.caratula.trim() === '';
    const iconoHTML = esDefault 
        ? `<div class="bg-secondary d-flex align-items-center justify-content-center rounded text-muted" style="width: 20px; height: 20px; min-width: 20px;"><i class="bi bi-disc" style="font-size: 0.7rem;"></i></div>` 
        : `<img src="${album.caratula}" style="width: 20px; height: 20px; object-fit: cover;" class="rounded" alt="Alb">`;
        
    ids.forEach(idArt => {
        const ul = document.querySelector(`#lista_albumes_art_${idArt.trim()}`);
        if (ul) {
            const emptyNotice = ul.querySelector('.fst-italic');
            if (emptyNotice) emptyNotice.remove();
            
            const li = document.createElement('li');
            li.className = "d-flex align-items-center justify-content-between text-secondary p-1 ps-2 hover-bg-dark rounded item-con-opciones";
            li.id = `li_alb_menu_${album.id}`;
            li.innerHTML = `
                <div class="d-flex align-items-center gap-2 text-truncate flex-grow-1" style="cursor:pointer;" data-titulo="${album.titulo}" onclick="document.getElementById('buscadorInput').value=this.getAttribute('data-titulo'); filtrarBiblioteca();">
                    ${iconoHTML}
                    <span class="text-white-50 text-truncate" style="font-size: 0.85rem;">${album.titulo}</span>
                </div>
                <div class="dropdown btn-opciones ms-2">
                    <button class="btn btn-link text-secondary p-0 border-0 shadow-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                        <li><a class="dropdown-item small" href="#" data-titulo="${album.titulo}" data-artistas-nombres="${album.artistas_nombres || ''}" data-artistas-ids="${album.artistas_ids}" data-bs-toggle="modal" data-bs-target="#editAlbumModal" onclick="cargarModalAlbum(${album.id}, this.getAttribute('data-titulo'), '${album.anio || ''}'); cargarEtiquetasEdicionAlbum(this.getAttribute('data-artistas-ids'), this.getAttribute('data-artistas-nombres'));"><i class="bi bi-pencil text-warning me-2"></i>Editar Álbum</a></li>
                        <li><hr class="dropdown-divider border-secondary"></li>
                        <li><a class="dropdown-item small text-danger" href="#" onclick="event.preventDefault(); event.stopPropagation(); prepararEliminacion('album', ${album.id}, this)"><i class="bi bi-trash3 text-danger me-2"></i>Eliminar Álbum</a></li>
                    </ul>
                </div>
            `;
            insertarEnOrden(ul, li, '.item-con-opciones', 'span.text-white-50');
        }
    });
    
    const strOpcion = `<option value="${album.id}">${album.titulo} (${album.artistas_nombres || ''})</option>`;
    document.querySelectorAll('select[name="album_id"]').forEach(select => select.insertAdjacentHTML('beforeend', strOpcion));
}

function actualizarAlbumDOM(album) {
    const esDefault = !album.caratula || album.caratula.includes('default.jpg') || album.caratula.trim() === '';
    const cacheBuster = esDefault ? '' : '?v=' + new Date().getTime();

    // 1. ELIMINAR EL ÁLBUM DEL MENÚ ACTUAL (Para poder moverlo a su nuevo artista)
    document.querySelectorAll(`[id^="li_alb_menu_${album.id}"]`).forEach(li => {
        const ul = li.parentNode;
        li.remove();
        // Si el artista se quedó sin álbumes, mostramos el mensaje de "Sin álbumes"
        if (ul && ul.querySelectorAll('li.item-con-opciones').length === 0) {
            if (!ul.querySelector('.fst-italic')) {
                ul.innerHTML = `<li class="text-muted small p-1 ps-2 fst-italic" style="font-size: 0.75rem;">Sin álbumes</li>`;
            }
        }
    });

    // 2. VOLVER A CREAR EL ÁLBUM EN LOS ARTISTAS CORRESPONDIENTES
    const idsArt = album.artistas_ids ? album.artistas_ids.split(',') : [];
    const iconoHTML = esDefault 
        ? `<div class="bg-secondary d-flex align-items-center justify-content-center rounded text-muted" style="width: 20px; height: 20px; min-width: 20px;"><i class="bi bi-disc" style="font-size: 0.7rem;"></i></div>` 
        : `<img src="${album.caratula}${cacheBuster}" style="width: 20px; height: 20px; object-fit: cover;" class="rounded" alt="Alb">`;

    // Protegemos los textos por si tienen comillas dobles
    const tituloEsc = album.titulo.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const artsNombresEsc = (album.artistas_nombres || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");

    idsArt.forEach(idArt => {
        const ul = document.querySelector(`#lista_albumes_art_${idArt.trim()}`);
        if (ul) {
            const emptyNotice = ul.querySelector('.fst-italic');
            if (emptyNotice) emptyNotice.remove();
            
            const li = document.createElement('li');
            li.className = "d-flex align-items-center justify-content-between text-secondary p-1 ps-2 hover-bg-dark rounded item-con-opciones";
            li.id = `li_alb_menu_${album.id}`;
            
            li.innerHTML = `
                <div class="d-flex align-items-center gap-2 text-truncate flex-grow-1" style="cursor:pointer;" data-titulo="${tituloEsc}" onclick="document.getElementById('buscadorInput').value=this.getAttribute('data-titulo'); filtrarBiblioteca();">
                    ${iconoHTML}
                    <span class="text-white-50 text-truncate" style="font-size: 0.85rem;">${album.titulo}</span>
                </div>
                <div class="dropdown btn-opciones ms-2">
                    <button class="btn btn-link text-secondary p-0 border-0 shadow-none" type="button" data-bs-toggle="dropdown" data-bs-boundary="window" aria-expanded="false" onclick="event.stopPropagation();">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                        <li><a class="dropdown-item small" href="#" data-titulo="${tituloEsc}" data-artistas-nombres="${artsNombresEsc}" data-artistas-ids="${album.artistas_ids}" data-bs-toggle="modal" data-bs-target="#editAlbumModal" onclick="cargarModalAlbum(${album.id}, this.getAttribute('data-titulo'), '${album.anio || ''}'); cargarEtiquetasEdicionAlbum(this.getAttribute('data-artistas-ids'), this.getAttribute('data-artistas-nombres'));"><i class="bi bi-pencil text-warning me-2"></i>Editar Álbum</a></li>
                        <li><hr class="dropdown-divider border-secondary"></li>
                        <li><a class="dropdown-item small text-danger" href="#" onclick="event.preventDefault(); event.stopPropagation(); prepararEliminacion('album', ${album.id}, this)"><i class="bi bi-trash3 text-danger me-2"></i>Eliminar Álbum</a></li>
                    </ul>
                </div>
            `;
            insertarEnOrden(ul, li, '.item-con-opciones', 'span.text-white-50');
        }
    });

    // 3. ACTUALIZAR LAS CANCIONES EN LA TABLA PRINCIPAL (Por si cambió el nombre o la carátula)
    document.querySelectorAll(`#tablaCanciones tbody .target-row[data-album-id="${album.id}"]`).forEach(tr => {
        const albumCellA = tr.querySelector('.album-col a');
        if (albumCellA) {
            albumCellA.innerText = album.titulo;
            albumCellA.setAttribute('onclick', `document.getElementById('buscadorInput').value='${tituloEsc}'; filtrarBiblioteca(); return false;`);
        }

        const container = tr.querySelector('.title-col .d-flex');
        if (container && album.caratula) {
            tr.setAttribute('data-caratula', album.caratula);
            let imgFila = container.querySelector('img');
            let divFallbackFila = container.querySelector('.bg-secondary');

            if (imgFila) {
                imgFila.src = album.caratula + cacheBuster;
            } else if (divFallbackFila && !esDefault) {
                const newImg = document.createElement('img');
                newImg.src = album.caratula + cacheBuster;
                newImg.className = 'album-img';
                newImg.alt = 'Cover';
                newImg.loading = 'lazy';
                divFallbackFila.replaceWith(newImg);
            }
        }

        // Si la canción del álbum está sonando ahora mismo, actualizar el reproductor
        if (window.rutaEnReproduccion === tr.getAttribute('data-ruta') && album.caratula) {
            const currentCover = document.getElementById('current-cover');
            const iconContainer = document.getElementById('player-icon-container');
            if (currentCover && iconContainer) {
                currentCover.src = album.caratula + cacheBuster;
                currentCover.classList.remove('d-none');
                iconContainer.classList.add('d-none');
                
                if ('mediaSession' in navigator) {
                    actualizarPantallaBloqueo(tr.getAttribute('data-titulo'), tr.getAttribute('data-artista'), album.titulo, album.caratula + cacheBuster);
                }
            }
        }
    });
    
    // 4. ACTUALIZAR LOS MENÚS DESPLEGABLES DE LOS FORMULARIOS
    document.querySelectorAll(`select[name="album_id"] option[value="${album.id}"]`).forEach(opt => {
        opt.innerText = `${album.titulo} (${album.artistas_nombres || ''})`;
    });
    
    // Refrescar el buscador visualmente
    if (typeof filtrarBiblioteca === 'function') filtrarBiblioteca();
}

function inyectarCancionDOM(c) {
    const tbody = document.querySelector('#tablaCanciones tbody');
    if (!tbody) return;
    
    if (tbody.querySelector('td[colspan="6"]')) {
        tbody.innerHTML = '';
    }
    
    const mins = Math.floor(c.duracion / 60);
    const secs = c.duracion % 60;
    const duracionFmt = mins + ":" + (secs < 10 ? "0" : "") + secs;
    
    const esDefault = !c.caratula || c.caratula.includes('default.jpg') || c.caratula.trim() === '';
    const iconoHTML = esDefault 
        ? `<div class="bg-secondary d-flex align-items-center justify-content-center rounded text-muted" style="width: 45px; height: 45px;"><i class="bi bi-music-note fs-4"></i></div>` 
        : `<img src="${c.caratula}" class="album-img" alt="Cover" loading="lazy">`;
        
    const albumTexto = c.album === 'Single / Sencillo' ? 'Single' : c.album;
    const albumClase = c.album === 'Single / Sencillo' ? 'text-muted font-monospace small' : 'text-secondary';
    
    const idsArt = (c.artistas_ids || '').split(',');
    const arts = (c.artistas_nombres || '').split(', ');
    const htmlArtistas = arts.map((nom, idx) => 
        `<a href="#" data-artista-id="${idsArt[idx] ? idsArt[idx].trim() : ''}" onclick="document.getElementById('buscadorInput').value='${nom.replace(/'/g, "\\'").replace(/"/g, "&quot;")}'; filtrarBiblioteca(); return false;" class="text-info text-decoration-none hover-underline">${nom}</a>`
    ).join('<span class="text-secondary">, </span>');

    const tituloEsc = c.titulo.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const artsEsc = c.artistas_nombres.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const rutaEsc = c.ruta_archivo.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const albEsc = albumTexto.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    
    const tr = document.createElement('tr');
    tr.className = 'song-row target-row';
    tr.id = `fila_cancion_${c.id}`;
    tr.setAttribute('data-playlists', c.playlists_nombres || '');
    tr.setAttribute('data-ruta', c.ruta_archivo);
    tr.setAttribute('data-titulo', c.titulo);
    tr.setAttribute('data-artista', c.artistas_nombres);
    tr.setAttribute('data-caratula', c.caratula);
    tr.setAttribute('data-fecha', c.fecha_subida);
    tr.setAttribute('data-album-id', c.album_id || '');
    tr.setAttribute('data-artistas-ids', c.artistas_ids || '');
    tr.setAttribute('onclick', 'reproducirDesdeFila(this)');
    
    tr.innerHTML = `
        <td class="text-secondary"></td>
        <td class="title-col">
            <div class="d-flex align-items-center gap-3">
                ${iconoHTML}
                <span class="fw-bold">${c.titulo}</span>
            </div>
        </td>
        <td class="album-col d-none d-md-table-cell">
            <a href="#" onclick="document.getElementById('buscadorInput').value='${albEsc}'; filtrarBiblioteca(); return false;" class="${albumClase} text-decoration-none hover-underline">
                ${albumTexto}
            </a>
        </td>
        <td class="artist-col">
            ${htmlArtistas}
        </td>
        <td class="text-secondary font-monospace small d-none d-md-table-cell">${duracionFmt}</td>
        <td onclick="event.stopPropagation();">
            <div class="dropdown">
                <button type="button" class="btn text-secondary border-0 p-1 shadow-none" data-bs-toggle="dropdown" data-bs-boundary="window" style="background: none; line-height: 1;">
                    <i class="bi bi-three-dots-vertical fs-5"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end bg-dark border border-secondary border-opacity-20 shadow-lg p-1">
                    <li>
                        <button class="dropdown-item text-white hover-bg-dark rounded small py-1.5" onclick="agregarAColaManual('${c.ruta_archivo}'); event.stopPropagation();">
                            <i class="bi bi-music-note-list text-danger me-2"></i> Añadir a la cola
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item text-white rounded small py-1.5" data-bs-toggle="modal" data-bs-target="#agregarAPlaylistModal" onclick="document.getElementById('id_cancion_playlist').value='${c.id}'; window.filaCancionActiva = this.closest('tr');">
                            <i class="bi bi-plus-circle me-2 text-info"></i> Añadir a Playlist
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item text-danger rounded small py-1.5 d-none btn-quitar-playlist" onclick="event.stopPropagation(); quitarDePlaylistAsincrono(${c.id}, document.getElementById('playlist_activa_id').value, this)">
                            <i class="bi bi-x-circle text-danger me-2"></i>Quitar de Playlist
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item text-white rounded small py-1.5" data-bs-toggle="modal" data-bs-target="#editCancionModal" onclick="cargarModalCancion(${c.id}, '${tituloEsc}', '${c.album_id || ''}', ${c.duracion}, '${rutaEsc}'); cargarEtiquetasEdicion('${c.artistas_ids || ''}', '${artsEsc}');">
                            <i class="bi bi-pencil me-2 text-warning"></i> Editar detalles
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item text-white rounded small py-1.5" onclick="event.stopPropagation(); descargarCancionConMetadatos(this, '${rutaEsc}', '${tituloEsc}', '${artsEsc}', '${albEsc}');">
                            <i class="bi bi-download me-2 text-success"></i> <span class="texto-btn">Descargar pista</span>
                        </button>
                    </li>
                    <li><hr class="dropdown-divider border-secondary border-opacity-20 my-1"></li>
                    <li>
                        <button type="button" class="dropdown-item text-danger rounded small py-1.5" onclick="prepararEliminacion('cancion', ${c.id}, this); event.stopPropagation();">
                            <i class="bi bi-trash3 me-2"></i> Eliminar pista
                        </button>
                    </li>
                </ul>
            </div>
        </td>`;
        
    tbody.insertBefore(tr, tbody.firstChild);
    recalcularIndicesTabla();
    
    if (typeof filtrarBiblioteca === 'function') {
        filtrarBiblioteca();
        if (typeof actualizarColaReproduccion === 'function') {
            actualizarColaReproduccion();
            const panel = document.getElementById('colaPanel');
            if (panel && panel.classList.contains('activo')) renderizarColaVisual();
        }
    }
}

function actualizarCancionDOM(c) {
    const tr = document.getElementById(`fila_cancion_${c.id}`);
    if (!tr) return;
    
    tr.setAttribute('data-titulo', c.titulo);
    tr.setAttribute('data-artista', c.artistas_nombres);
    tr.setAttribute('data-caratula', c.caratula);
    tr.setAttribute('data-ruta', c.ruta_archivo);
    tr.setAttribute('data-playlists', c.playlists_nombres || '');
    tr.setAttribute('data-album-id', c.album_id || '');
    tr.setAttribute('data-artistas-ids', c.artistas_ids || '');
    
    const tituloSpan = tr.querySelector('.title-col span.fw-bold');
    if (tituloSpan) tituloSpan.innerText = c.titulo;
    
    const esDefault = !c.caratula || c.caratula.includes('default.jpg') || c.caratula.trim() === '';
    const cacheBuster = esDefault ? '' : '?v=' + new Date().getTime();
    
    const container = tr.querySelector('.title-col .d-flex');
    let img = container.querySelector('img');
    let divFallback = container.querySelector('.bg-secondary');
    
    if (esDefault) {
        if (img) {
            const newDiv = document.createElement('div');
            newDiv.className = 'bg-secondary d-flex align-items-center justify-content-center rounded text-muted';
            newDiv.style.cssText = 'width: 45px; height: 45px;';
            newDiv.innerHTML = '<i class="bi bi-music-note fs-4"></i>';
            img.replaceWith(newDiv);
        }
    } else {
        if (img) {
            img.src = c.caratula + cacheBuster;
        } else if (divFallback) {
            const newImg = document.createElement('img');
            newImg.src = c.caratula + cacheBuster;
            newImg.className = 'album-img';
            newImg.alt = 'Cover';
            newImg.loading = 'lazy';
            divFallback.replaceWith(newImg);
        }
    }
    
    const albumCell = tr.querySelector('.album-col a');
    if (albumCell) {
        const isSingle = c.album === 'Single / Sencillo';
        albumCell.innerText = isSingle ? 'Single' : c.album;
        albumCell.className = `${isSingle ? 'text-muted font-monospace small' : 'text-secondary'} text-decoration-none hover-underline`;
        albumCell.setAttribute('onclick', `document.getElementById('buscadorInput').value='${(isSingle ? 'Single' : c.album).replace(/'/g, "\\'").replace(/"/g, "&quot;")}'; filtrarBiblioteca(); return false;`);
    }
    
    const artistCell = tr.querySelector('.artist-col');
    if (artistCell) {
        const idsArt = (c.artistas_ids || '').split(',');
        const arts = (c.artistas_nombres || '').split(', ');
        artistCell.innerHTML = arts.map((nom, idx) => 
            `<a href="#" data-artista-id="${idsArt[idx] ? idsArt[idx].trim() : ''}" onclick="document.getElementById('buscadorInput').value='${nom.replace(/'/g, "\\'").replace(/"/g, "&quot;")}'; filtrarBiblioteca(); return false;" class="text-info text-decoration-none hover-underline">${nom}</a>`
        ).join('<span class="text-secondary">, </span>');
    }
    
    const mins = Math.floor(c.duracion / 60);
    const secs = c.duracion % 60;
    const duracionCell = tr.querySelector('td.font-monospace');
    if (duracionCell) {
        duracionCell.innerText = mins + ":" + (secs < 10 ? "0" : "") + secs;
    }
    
    if (window.rutaEnReproduccion === c.ruta_archivo) {
        document.getElementById('current-title').innerText = c.titulo;
        document.getElementById('current-artist').innerText = c.artistas_nombres;
        const currentCover = document.getElementById('current-cover');
        if (currentCover) currentCover.src = c.caratula + cacheBuster;
        
        if ('mediaSession' in navigator) {
            actualizarPantallaBloqueo(c.titulo, c.artistas_nombres, c.album || 'Single', c.caratula + cacheBuster);
        }
    }
    
    const editBtn = tr.querySelector('[data-bs-target="#editCancionModal"]');
    if (editBtn) {
        const tituloEscapado = c.titulo.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const rutaEscapada = c.ruta_archivo.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const artistasNombresEscapados = c.artistas_nombres.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        editBtn.setAttribute('onclick', `cargarModalCancion(${c.id}, '${tituloEscapado}', '${c.album_id || ''}', ${c.duracion || 0}, '${rutaEscapada}'); cargarEtiquetasEdicion('${c.artistas_ids || ''}', '${artistasNombresEscapados}');`);
    }
    
    const downloadBtn = tr.querySelector('.bi-download').closest('button');
    if (downloadBtn) {
        const tituloEscapado = c.titulo.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const rutaEscapada = c.ruta_archivo.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const artistasNombresEscapados = c.artistas_nombres.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const albumEscapado = (c.album || 'Single').replace(/'/g, "\\'").replace(/"/g, "&quot;");
        downloadBtn.setAttribute('onclick', `event.stopPropagation(); descargarCancionConMetadatos(this, '${rutaEscapada}', '${tituloEscapado}', '${artistasNombresEscapados}', '${albumEscapado}')`);
    }
    
    if (typeof filtrarBiblioteca === 'function') {
        filtrarBiblioteca();
        if (typeof actualizarColaReproduccion === 'function') {
            actualizarColaReproduccion();
            const panel = document.getElementById('colaPanel');
            if (panel && panel.classList.contains('activo')) renderizarColaVisual();
        }
    }
}

function insertarEnOrden(contenedor, nuevoElemento, selectorItems, selectorNombre) {
    const items = Array.from(contenedor.children).filter(el => el.matches && el.matches(selectorItems));
    const getTexto = (el) => {
        const nodo = el.querySelector(selectorNombre);
        return nodo ? nodo.innerText.trim() : "";
    };
    const nombreNuevo = getTexto(nuevoElemento);
    let insertado = false;
    for (let item of items) {
        if (item === nuevoElemento) continue;
        const nombreExistente = getTexto(item);
        if (nombreNuevo.localeCompare(nombreExistente, 'es', { sensitivity: 'base', numeric: true }) < 0) {
            contenedor.insertBefore(nuevoElemento, item);
            insertado = true;
            break;
        }
    }
    if (!insertado) contenedor.appendChild(nuevoElemento);
}

// ==========================================
// SISTEMA DE ETIQUETAS (TAGS) GENERALIZADO
// ==========================================
function inicializarBuscadorEtiquetas(config) {
    const { idContenedor, idSearch, idResults, idSelected, idHidden, setGlobal, prefix } = config;
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    
    contenedor.listaArtistas = JSON.parse(contenedor.dataset.artistas || '[]');
    const searchInput = document.getElementById(idSearch);
    const resultsContainer = document.getElementById(idResults);
    if (!searchInput || !resultsContainer) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        if (query.length === 0) {
            resultsContainer.style.display = 'none';
            return;
        }
        const listaActual = contenedor.listaArtistas || [];
        const filtrados = listaActual.filter(art => art.nombre.toLowerCase().includes(query) && !setGlobal.has(art.id.toString()));
        if (filtrados.length > 0) {
            resultsContainer.style.display = 'block';
            filtrados.forEach(art => {
                const div = document.createElement('div');
                div.className = 'p-2 text-white-50 hover-bg-carmesi';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = art.nombre;
                div.addEventListener('click', function(e) {
                    if (prefix === 'alb') window.agregarEtiquetaAlbum(art.id, art.nombre);
                    else if (prefix === 'can') window.agregarEtiquetaCancion(art.id, art.nombre);
                    else if (prefix === 'sub') window.agregarEtiquetaSubir(art.id, art.nombre);
                    else if (prefix === 'nuevo_alb') window.agregarEtiquetaNuevoAlbum(art.id, art.nombre);
                    searchInput.value = '';
                    resultsContainer.style.display = 'none';
                    searchInput.focus();
                });
                resultsContainer.appendChild(div);
            });
        } else resultsContainer.style.display = 'none';
    });
    
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target))
            resultsContainer.style.display = 'none';
    });
}

function creadorDeEtiquetas(id, nombre, setGlobal, prefix, hiddenContainerId, selectedContainerId) {
    const idStr = id.toString();
    setGlobal.add(idStr);
    const hiddenContainer = document.getElementById(hiddenContainerId);
    const selectedContainer = document.getElementById(selectedContainerId);
    if (!hiddenContainer || !selectedContainer) return;
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'artista_ids[]';
    hiddenInput.value = idStr;
    hiddenInput.id = `${prefix}_hidden_art_${idStr}`;
    hiddenContainer.appendChild(hiddenInput);
    
    const tag = document.createElement('span');
    tag.className = 'badge d-flex align-items-center p-2 rounded-pill';
    tag.style.cssText = 'background-color: #1a1a1a; border: 1px solid var(--borde-carmesí); color: #ffffff; font-size: 0.8rem;';
    tag.id = `${prefix}_tag_art_${idStr}`;
    tag.innerHTML = `${nombre} <i class="bi bi-x-circle-fill ms-2 text-danger" style="cursor:pointer; font-size: 0.9rem;"></i>`;
    tag.querySelector('i').addEventListener('click', function() {
        tag.remove();
        const inputABorrar = document.getElementById(`${prefix}_hidden_art_${idStr}`);
        if (inputABorrar) inputABorrar.remove();
        setGlobal.delete(idStr);
    });
    selectedContainer.appendChild(tag);
}

window.editAlbArtistasSeleccionados = new Set();
window.editArtistasSeleccionados = new Set();
window.subirArtistasSeleccionados = new Set();
window.crearAlbArtistasSeleccionados = new Set();
window.agregarEtiquetaAlbum = (id, nombre) => creadorDeEtiquetas(id, nombre, window.editAlbArtistasSeleccionados, 'alb', 'edit_alb_hidden_inputs', 'edit_alb_selected_artists');
window.agregarEtiquetaCancion = (id, nombre) => creadorDeEtiquetas(id, nombre, window.editArtistasSeleccionados, 'can', 'edit_can_hidden_inputs', 'edit_can_selected_artists');
window.agregarEtiquetaSubir = (id, nombre) => creadorDeEtiquetas(id, nombre, window.subirArtistasSeleccionados, 'sub', 'subir_can_hidden_inputs', 'subir_can_selected_artists');
window.agregarEtiquetaNuevoAlbum = (id, nombre) => creadorDeEtiquetas(id, nombre, window.crearAlbArtistasSeleccionados, 'nuevo_alb', 'album_hidden_inputs', 'album_selected_artists');

function cargarEtiquetasEdicionAlbum(idsCSV, nombresCSV) {
    document.getElementById('edit_alb_selected_artists').innerHTML = '';
    document.getElementById('edit_alb_hidden_inputs').innerHTML = '';
    window.editAlbArtistasSeleccionados.clear();
    if (!idsCSV || !nombresCSV) return;
    const ids = idsCSV.toString().split(',');
    const nombres = nombresCSV.split(',');
    for (let i = 0; i < ids.length; i++) if (ids[i].trim() !== '') window.agregarEtiquetaAlbum(ids[i].trim(), nombres[i].trim());
}

function cargarEtiquetasEdicion(idsCSV, nombresCSV) {
    document.getElementById('edit_can_selected_artists').innerHTML = '';
    document.getElementById('edit_can_hidden_inputs').innerHTML = '';
    window.editArtistasSeleccionados.clear();
    if (!idsCSV || !nombresCSV) return;
    const ids = idsCSV.toString().split(',');
    const nombres = nombresCSV.split(',');
    for (let i = 0; i < ids.length; i++) if (ids[i].trim() !== '') window.agregarEtiquetaCancion(ids[i].trim(), nombres[i].trim());
}

// ==========================================
// INITIALIZATION AND DELEGATED EVENTS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarBuscadorEtiquetas({
        idContenedor: 'contenedor_buscador_artistas',
        idSearch: 'album_artist_search', idResults: 'album_artist_results',
        idSelected: 'album_selected_artists', idHidden: 'album_hidden_inputs',
        setGlobal: window.crearAlbArtistasSeleccionados, prefix: 'nuevo_alb'
    });
    
    inicializarBuscadorEtiquetas({
        idContenedor: 'subir_can_contenedor_buscador',
        idSearch: 'subir_can_artist_search', idResults: 'subir_can_artist_results',
        idSelected: 'subir_can_selected_artists', idHidden: 'subir_can_hidden_inputs',
        setGlobal: window.subirArtistasSeleccionados, prefix: 'sub'
    });
    
    inicializarBuscadorEtiquetas({
        idContenedor: 'edit_can_contenedor_buscador',
        idSearch: 'edit_can_artist_search', idResults: 'edit_can_artist_results',
        idSelected: 'edit_can_selected_artists', idHidden: 'edit_can_hidden_inputs',
        setGlobal: window.editArtistasSeleccionados, prefix: 'can'
    });
    
    inicializarBuscadorEtiquetas({
        idContenedor: 'edit_alb_contenedor_buscador',
        idSearch: 'edit_alb_artist_search', idResults: 'edit_alb_artist_results',
        idSelected: 'edit_alb_selected_artists', idHidden: 'edit_alb_hidden_inputs',
        setGlobal: window.editAlbArtistasSeleccionados, prefix: 'alb'
    });
    
    document.body.addEventListener('click', function(e) {
        const itemCola = e.target.closest('[data-index]');
        const perteneceACola = e.target.closest('#colaPanel') || e.target.closest('#lista-cola-dinamica');
        if (itemCola && perteneceACola) {
            if (e.target.closest('.btn-eliminar-cola') || e.target.tagName.toLowerCase() === 'button' || e.target.classList.contains('bi-x') || e.target.closest('i.bi-x-lg')) {
                return;
            }
            const indiceStr = itemCola.getAttribute('data-index');
            const indice = parseInt(indiceStr);
            if (!isNaN(indice) && typeof reproducirDesdeCola === 'function') {
                reproducirDesdeCola(indice);
            }
        }
    });
});

// ==========================================
// MOTOR DE BÚSQUEDA DE CARÁTULAS (iTUNES) - WIDGET FLOTANTE
// ==========================================
let _cancionesParaEscanearItunes = [];
window._escaneoItunesActivo = false;
window._indiceEscaneoItunes = 0;
window._actualizadasItunes = 0;

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('widgetProgresoItunes');
    const header = document.getElementById('widgetProgresoItunesHeader');
    if (!el || !header) return;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    header.onmousedown = (e) => {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
            header.style.cursor = "grab";
        };
        document.onmousemove = (e) => {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
            el.style.bottom = "auto";
            el.style.right = "auto";
        };
        header.style.cursor = "grabbing";
    };
});

function cerrarWidgetEscaneo() {
    window._escaneoItunesActivo = false;
    document.getElementById('widgetProgresoItunes').classList.add('d-none');
}

async function iniciarEscaneoItunes() {
    const toastEl = document.getElementById('backupToast');
    const toastBody = document.getElementById('backupToastMensaje');
    const toast = new bootstrap.Toast(toastEl, { autohide: true });
    toastBody.innerHTML = `<span class="spinner-border spinner-border-sm text-secondary me-2" role="status"></span> Analizando biblioteca...`;
    toast.show();
    
    try {
        const formData = new FormData();
        formData.append('accion', 'obtener_sencillos_sin_portada');
        const req = await fetch('api/insertar_elementos.php', { method: 'POST', body: formData });
        const res = await req.json();
        
        if (res.status !== 'success') throw new Error(res.message);
        
        _cancionesParaEscanearItunes = res.data;
        if (_cancionesParaEscanearItunes.length === 0) {
            toastBody.innerHTML = `<i class="bi bi-check-circle-fill text-success fs-5 me-2"></i> Todos tus sencillos ya tienen portada.`;
            setTimeout(() => bootstrap.Toast.getInstance(toastEl).hide(), 3000);
            return;
        }
        
        bootstrap.Toast.getInstance(toastEl).hide();
        document.getElementById('mensajeConfirmarEscaneo').innerText = `Se encontraron ${_cancionesParaEscanearItunes.length} sencillos sin portada.\n\n¿Deseas iniciar la búsqueda automática en Apple Music?`;
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConfirmarEscaneo'));
        modal.show();
        
    } catch (error) {
        console.error(error);
        toastBody.innerHTML = `<i class="bi bi-x-circle-fill text-danger fs-5 me-2"></i> Error al conectar con el servidor.`;
    }
}

async function ejecutarEscaneoItunesEnLote() {
    const total = _cancionesParaEscanearItunes.length;
    if (total === 0) return;
    
    if (window._indiceEscaneoItunes >= total) {
        window._indiceEscaneoItunes = 0;
        window._actualizadasItunes = 0;
    }
    window._escaneoItunesActivo = true;
    
    const widget = document.getElementById('widgetProgresoItunes');
    const statusText = document.getElementById('itunes-status-text');
    const progress = document.getElementById('itunes-progress');
    const count = document.getElementById('itunes-count');
    const percent = document.getElementById('itunes-percent');
    const btnPausar = document.getElementById('btnPausarEscaneo');
    
    widget.classList.remove('d-none');
    btnPausar.classList.remove('d-none');
    progress.classList.add('progress-bar-animated');
    
    btnPausar.innerHTML = '<i class="bi bi-pause-fill fs-5"></i>';
    btnPausar.title = "Pausar";
    btnPausar.onclick = () => {
        window._escaneoItunesActivo = false;
        btnPausar.innerHTML = '<i class="bi bi-play-fill fs-5"></i>';
        btnPausar.title = "Reanudar";
        statusText.innerHTML = "<span class='text-warning'><i class='bi bi-pause-circle me-1'></i>Pausado. Haz clic en 'Play' para continuar.</span>";
        progress.classList.remove('progress-bar-animated');
        btnPausar.onclick = ejecutarEscaneoItunesEnLote;
    };
    
    for (let i = window._indiceEscaneoItunes; i < total; i++) {
        if (!window._escaneoItunesActivo) return;
        
        const cancion = _cancionesParaEscanearItunes[i];
        window._indiceEscaneoItunes = i;
        statusText.innerHTML = `Buscando: <span class="fw-bold">${cancion.titulo}</span>...`;
        
        const fd = new FormData();
        fd.append('accion', 'procesar_portada_individual');
        fd.append('cancion_id', cancion.id);
        fd.append('titulo', cancion.titulo);
        fd.append('artista_ids', cancion.artista_ids);
        
        try {
            const scanReq = await fetch('api/insertar_elementos.php', { method: 'POST', body: fd });
            const scanRes = await scanReq.json();
            
            if (scanRes.status === 'success' && scanRes.data.actualizada) {
                window._actualizadasItunes++;
                const nuevaRuta = scanRes.data.ruta;
                const tr = document.getElementById('fila_cancion_' + cancion.id);
                if (tr) {
                    tr.setAttribute('data-caratula', nuevaRuta);
                    const container = tr.querySelector('.title-col .d-flex');
                    if (container) {
                        let divFallback = container.querySelector('.bg-secondary');
                        if (divFallback) {
                            const newImg = document.createElement('img');
                            newImg.src = nuevaRuta;
                            newImg.className = 'album-img';
                            newImg.alt = 'Cover';
                            newImg.loading = 'lazy';
                            divFallback.replaceWith(newImg);
                        }
                    }
                    if (window.rutaEnReproduccion === tr.getAttribute('data-ruta')) {
                        const currentCover = document.getElementById('current-cover');
                        const iconContainer = document.getElementById('player-icon-container');
                        if (currentCover && iconContainer) {
                            currentCover.src = nuevaRuta;
                            currentCover.classList.remove('d-none');
                            iconContainer.classList.add('d-none');
                            if ('mediaSession' in navigator) {
                                actualizarPantallaBloqueo(tr.getAttribute('data-titulo'), tr.getAttribute('data-artista'), 'Single', nuevaRuta);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error al buscar:", cancion.id);
        }
        
        window._indiceEscaneoItunes++;
        const procesadas = window._indiceEscaneoItunes;
        const porcentajeVal = Math.round((procesadas / total) * 100);
        progress.style.width = porcentajeVal + '%';
        percent.innerText = porcentajeVal + '%';
        count.innerText = `${procesadas} / ${total}`;
    }
    
    if (window._indiceEscaneoItunes >= total) {
        window._escaneoItunesActivo = false;
        progress.classList.remove('progress-bar-animated');
        btnPausar.classList.add('d-none');
        statusText.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>¡Finalizado! ${window._actualizadasItunes} portadas nuevas encontradas.</span>`;
    }
}

// ==========================================
// BUSCADOR WEB DE PORTADAS MANUAL (DEEZER)
// ==========================================

let _nodoPreviewActivo = null;
let _tipoBusquedaWeb = 'cancion';
window._currentOffsetWeb = 0; 

function abrirBuscadorPortadas(tipo, inputIdParaTermino, botonElemento) {
    _tipoBusquedaWeb = tipo;
    _nodoPreviewActivo = botonElemento.closest('.input-group').parentElement;
    window._currentOffsetWeb = 0;
    
    let tituloActual = document.getElementById(inputIdParaTermino).value.trim();
    let artistasNombres = [];
    let idContenedorArtistas = '';
    
    if (tipo === 'cancion') idContenedorArtistas = inputIdParaTermino.replace('_titulo', '_selected_artists');
    if (tipo === 'album') idContenedorArtistas = inputIdParaTermino.replace('_titulo', '_selected_artists');
    
    if (idContenedorArtistas) {
        const contenedorArt = document.getElementById(idContenedorArtistas);
        if (contenedorArt) {
            const badges = contenedorArt.querySelectorAll('.badge');
            badges.forEach(b => artistasNombres.push(b.textContent.trim()));
        }
    }
    
    document.getElementById('inputBusquedaWebTitulo').value = tituloActual;
    const inputArtista = document.getElementById('inputBusquedaWebArtista');
    const colArtista = document.getElementById('colBusquedaWebArtista');
    
    if (tipo === 'artista') {
        colArtista.style.display = 'none';
        inputArtista.value = '';
    } else {
        colArtista.style.display = 'block';
        inputArtista.value = artistasNombres.join(", ");
    }
    
    document.getElementById('resultadosBusquedaWeb').innerHTML = '<div class="text-secondary my-4">Presiona buscar para escanear en Deezer.</div>';
    
    const modalBuscador = new bootstrap.Modal(document.getElementById('modalBuscadorPortadas'));
    modalBuscador.show();

    if (tituloActual.trim() !== '') {
        ejecutarBusquedaWeb(false);
    }
}

async function ejecutarBusquedaWeb(cargarMas = false) {
    const titulo = document.getElementById('inputBusquedaWebTitulo').value.trim();
    const artista = document.getElementById('inputBusquedaWebArtista').value.trim();
    const contenedor = document.getElementById('resultadosBusquedaWeb');
    
    if (!titulo) return;
    
    if (!cargarMas) {
        window._currentOffsetWeb = 0;
        contenedor.innerHTML = '<div class="col-12 py-4"><div class="spinner-border text-danger" role="status"></div></div>';
    } else {
        window._currentOffsetWeb += 12; 
        const btnCargarMas = document.getElementById('btnCargarMasWeb');
        if (btnCargarMas) btnCargarMas.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
    }
    
    const fd = new FormData();
    fd.append('accion', 'buscar_opciones_portada');
    fd.append('tipo', _tipoBusquedaWeb);
    fd.append('titulo', titulo);
    fd.append('artista', artista);
    fd.append('offset', window._currentOffsetWeb);
    
    try {
        const req = await fetch('api/insertar_elementos.php', { method: 'POST', body: fd });
        const texto = await req.text();
        console.log(texto);
        const res = JSON.parse(texto);
        
        if (res.status === 'success' && res.data.length > 0) {
            if (!cargarMas) contenedor.innerHTML = '';
            else {
                const oldBtnContainer = document.getElementById('contenedorCargarMasWeb');
                if (oldBtnContainer) oldBtnContainer.remove();
            }
            
            res.data.forEach(url => {
                const col = document.createElement('div');
                col.className = 'col-4 col-md-3 mb-2';
                const claseImg = _tipoBusquedaWeb === 'artista' ? 'rounded-circle' : 'rounded';
                
                col.innerHTML = `
                    <div class="position-relative hover-scale" style="cursor: pointer;" onclick="seleccionarImagenWeb('${url}')">
                        <img src="${url}" class="img-fluid ${claseImg} border border-secondary hover-border-danger" style="aspect-ratio: 1/1; object-fit: cover; width: 100%;">
                    </div>
                `;
                contenedor.appendChild(col);
            });
            
            if (res.data.length > 0) {
                const btnContainer = document.createElement('div');
                btnContainer.className = 'col-12 mt-3 mb-2';
                btnContainer.id = 'contenedorCargarMasWeb';
                btnContainer.innerHTML = `<button id="btnCargarMasWeb" class="btn btn-outline-danger btn-sm fw-bold px-4 shadow-none" onclick="ejecutarBusquedaWeb(true)">Cargar más resultados <i class="bi bi-chevron-down ms-1"></i></button>`;
                contenedor.appendChild(btnContainer);
            }
        } else {
            if (!cargarMas) {
                contenedor.innerHTML = '<div class="text-danger my-4"><i class="bi bi-emoji-frown me-2"></i>No se encontraron resultados en Deezer. Intenta modificar el nombre.</div>';
            } else {
                const oldBtnContainer = document.getElementById('contenedorCargarMasWeb');
                if (oldBtnContainer) oldBtnContainer.innerHTML = '<div class="text-secondary small mt-2 fw-bold">Fin de la galería.</div>';
            }
        }
    } catch (e) {
        if (!cargarMas) contenedor.innerHTML = '<div class="text-danger my-4">Error de red. Intenta nuevamente.</div>';
        else {
            const btnCargarMas = document.getElementById('btnCargarMasWeb');
            if (btnCargarMas) btnCargarMas.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Error. Reintentar';
        }
    }
}

function seleccionarImagenWeb(url) {
    if (_nodoPreviewActivo) {
        const hiddenInput = _nodoPreviewActivo.querySelector('.hidden-url-online');
        if (hiddenInput) hiddenInput.value = url;
        const previewContainer = _nodoPreviewActivo.querySelector('.preview-container');
        const previewImg = _nodoPreviewActivo.querySelector('.preview-img');
        if (previewContainer && previewImg) {
            previewImg.src = url;
            previewContainer.classList.remove('d-none');
        }
    }
    const modalBuscador = bootstrap.Modal.getInstance(document.getElementById('modalBuscadorPortadas'));
    if (modalBuscador) modalBuscador.hide();
}