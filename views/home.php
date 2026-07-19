<div class="main-content">
    <input type="hidden" id="playlist_activa_id" value="">
    
    <div class="d-flex gap-3 mb-4 align-items-center">
        <div class="input-group border border-secondary rounded-pill overflow-hidden bg-dark flex-grow-1 position-relative">
            <span class="input-group-text bg-dark border-0 text-secondary"><i class="bi bi-search fs-5"></i></span>
            <input type="text" id="buscadorInput" class="form-control bg-dark text-white border-0 shadow-none py-2 pe-5" placeholder="¿Qué quieres escuchar hoy? (Canción, artista o álbum)" oninput="filtrarBiblioteca()">
            <button type="button" id="btn-limpiar-busqueda" class="btn btn-link text-secondary hover-text-white border-0 text-decoration-none shadow-none d-none position-absolute top-50 end-0 translate-middle-y me-2" style="z-index: 10;" onclick="limpiarBuscador()" title="Borrar búsqueda">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="btn-group">
            <button type="button" id="btn-orden-desc" class="btn btn-sm btn-success" onclick="ordenarBibliotecaAsincrona('desc')"><i class="bi bi-sort-down"></i> Más Recientes</button>
            <button type="button" id="btn-orden-asc" class="btn btn-sm btn-outline-secondary text-white" onclick="ordenarBibliotecaAsincrona('asc')"><i class="bi bi-sort-up"></i> Más Antiguas</button>
        </div>
    </div>

    <div class="bg-dark border border-secondary rounded">
        <div class="p-3 bg-black border-bottom border-secondary d-flex align-items-center justify-content-between rounded-top">
            <h5 class="text-success fw-bold m-0"><i class="bi bi-music-note-list me-2"></i> Mi Biblioteca Musical</h5>
            <span class="badge bg-secondary" id="contador-dinamico"><?= count($canciones) ?> canciones totales</span>
        </div>
        <div class="table-responsive">
            <table class="table table-dark table-hover align-middle mb-0" id="tablaCanciones">
                <thead>
                    <tr class="text-secondary border-bottom border-secondary">
                        <th style="width: 5%">#</th>
                        <th>Título</th>
                        <th class="d-none d-md-table-cell">Álbum</th>
                        <th>Artistas</th>
                        <th class="d-none d-md-table-cell">Duración</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if(empty($canciones)): ?>
                        <tr>
                            <td colspan="6" class="text-center text-secondary py-4">Biblioteca vacía. Registra los elementos en el menú izquierdo.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach($canciones as $index => $c): ?>
                            <tr class="song-row target-row" id="fila_cancion_<?= $c['id'] ?>" data-playlists="<?= htmlspecialchars($c['playlists_nombres']) ?>" data-ruta="<?= htmlspecialchars($c['ruta_archivo']) ?>" data-titulo="<?= htmlspecialchars($c['titulo']) ?>" data-artista="<?= htmlspecialchars($c['artistas_nombres']) ?>" data-caratula="<?= htmlspecialchars($c['caratula']) ?>" data-fecha="<?= htmlspecialchars($c['fecha_subida']) ?>" data-album-id="<?= $c['album_id'] ?? '' ?>" data-artistas-ids="<?= $c['artistas_ids'] ?? '' ?>">
                                <td class="text-secondary"><?= $index + 1 ?></td>
                                <td class="title-col">
                                    <div class="d-flex align-items-center gap-3">
                                        <?php if (empty($c['caratula']) || strpos($c['caratula'], 'default.jpg') !== false): ?>
                                            <div class="bg-secondary d-flex align-items-center justify-content-center rounded text-muted" style="width: 45px; height: 45px;"><i class="bi bi-music-note fs-4"></i></div>
                                        <?php else: ?>
                                            <img src="<?= htmlspecialchars($c['caratula']) ?>" class="album-img" alt="Cover" loading="lazy">
                                        <?php endif; ?>
                                        <span class="fw-bold"><?= htmlspecialchars($c['titulo']) ?></span>
                                    </div>
                                </td>
                                <td class="album-col d-none d-md-table-cell btn-no-propagar">
                                    <?php if ($c['album'] === 'Single / Sencillo'): ?>
                                        <a href="#" class="text-muted font-monospace small text-decoration-none hover-underline link-filtro-busqueda" data-filtro="Single">Single</a>
                                    <?php else: ?>
                                        <a href="#" class="text-secondary text-decoration-none hover-underline link-filtro-busqueda" data-filtro="<?= htmlspecialchars($c['album'], ENT_QUOTES) ?>">
                                            <?= htmlspecialchars($c['album']) ?>
                                        </a>
                                    <?php endif; ?>
                                </td>
                                <td class="artist-col btn-no-propagar">
                                    <?php $artistas_lista = explode(', ', $c['artistas_nombres'] ?? 'Artista Desconocido'); foreach($artistas_lista as $i => $nom_art): ?>
                                        <a href="#" class="text-info text-decoration-none hover-underline link-filtro-busqueda" data-filtro="<?= htmlspecialchars($nom_art, ENT_QUOTES) ?>">
                                            <?= htmlspecialchars($nom_art) ?>
                                        </a><?= ($i < count($artistas_lista) - 1) ? '<span class="text-secondary">, </span>' : '' ?>
                                    <?php endforeach; ?>
                                </td>
                                <td class="text-secondary font-monospace small d-none d-md-table-cell">
                                    <?php $segundosTotales = $c['duracion'] ?? 0; echo floor($segundosTotales / 60) . ":" . sprintf('%02d', $segundosTotales % 60); ?>
                                </td>
                                <td class="btn-no-propagar">
                                    <div class="dropdown">
                                        <button type="button" class="btn text-secondary border-0 p-1 shadow-none" data-bs-toggle="dropdown" data-bs-boundary="window" style="background: none; line-height: 1;">
                                            <i class="bi bi-three-dots-vertical fs-5"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end bg-dark border border-secondary border-opacity-20 shadow-lg p-1">
                                            <li>
                                                <button class="dropdown-item text-white hover-bg-dark rounded small py-1.5 btn-accion-fila" data-accion="add-cola">
                                                    <i class="bi bi-music-note-list text-danger me-2"></i> Añadir a la cola
                                                </button>
                                            </li>
                                            <li>
                                                <button type="button" class="dropdown-item text-white rounded small py-1.5 btn-accion-fila" data-accion="add-playlist" data-bs-toggle="modal" data-bs-target="#agregarAPlaylistModal">
                                                    <i class="bi bi-plus-circle me-2 text-info"></i> Añadir a Playlist
                                                </button>
                                            </li>
                                            <li>
                                                <button type="button" class="dropdown-item text-danger rounded small py-1.5 d-none btn-quitar-playlist btn-accion-fila" data-accion="remove-playlist">
                                                    <i class="bi bi-x-circle text-danger me-2"></i>Quitar de Playlist
                                                </button>
                                            </li>
                                            <li>
                                                <button type="button" class="dropdown-item text-white rounded small py-1.5 btn-accion-fila" data-accion="editar" data-bs-toggle="modal" data-bs-target="#editCancionModal">
                                                    <i class="bi bi-pencil me-2 text-warning"></i> Editar detalles
                                                </button>
                                            </li>
                                            <li>
                                                <button type="button" class="dropdown-item text-white rounded small py-1.5 btn-accion-fila" data-accion="descargar" data-album-nombre="<?= htmlspecialchars($c['album'] ?? 'Single', ENT_QUOTES) ?>">
                                                    <i class="bi bi-download me-2 text-success"></i> <span class="texto-btn">Descargar pista</span>
                                                </button>
                                            </li>
                                            <li><hr class="dropdown-divider border-secondary border-opacity-20 my-1"></li>
                                            <li>
                                                <button type="button" class="dropdown-item text-danger rounded small py-1.5 btn-accion-fila" data-accion="eliminar">
                                                    <i class="bi bi-trash3 me-2"></i> Eliminar pista
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mt-3" id="paginacion-container">
        <span class="text-secondary small" id="info-paginacion">Cargando biblioteca...</span>
        <nav><ul class="pagination pagination-sm mb-0" id="botones-paginacion"></ul></nav>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    // 1. LECTOR GLOBAL DE DURACIÓN MP3 (A prueba de fallos)
    document.body.addEventListener('change', function(e) {
        if (e.target.tagName === 'INPUT' && e.target.type === 'file' && (e.target.name === 'archivo_mp3' || e.target.accept.includes('audio'))) {
            const archivo = e.target.files[0];
            if (!archivo) return;
            const form = e.target.closest('form');
            if (!form) return;
            
            let inputDuracion = form.querySelector('input[name="duracion"]');
            if (!inputDuracion) {
                inputDuracion = document.createElement('input');
                inputDuracion.type = 'hidden';
                inputDuracion.name = 'duracion';
                form.appendChild(inputDuracion);
            }
            const objUrl = URL.createObjectURL(archivo);
            const audioTemp = new Audio(objUrl);
            audioTemp.addEventListener('loadedmetadata', () => {
                inputDuracion.value = Math.round(audioTemp.duration);
                URL.revokeObjectURL(objUrl); 
            });
        }
    });

    // 2. ESCUCHADOR DE LA TABLA (Delegación principal)
    const tabla = document.getElementById('tablaCanciones');
    if (tabla) {
        tabla.addEventListener('click', (e) => {
            if (e.target.closest('.btn-no-propagar')) e.stopPropagation();

            const linkFiltro = e.target.closest('.link-filtro-busqueda');
            if (linkFiltro) {
                e.preventDefault();
                document.getElementById('buscadorInput').value = linkFiltro.dataset.filtro;
                if(typeof filtrarBiblioteca === 'function') filtrarBiblioteca();
                return;
            }

            const fila = e.target.closest('.target-row');
            if (fila && !e.target.closest('.dropdown') && !e.target.closest('a')) {
                if (typeof reproducirDesdeFila === 'function') reproducirDesdeFila(fila);
                return;
            }

            const btnAccion = e.target.closest('.btn-accion-fila');
            if (btnAccion && fila) {
                const id = fila.id.replace('fila_cancion_', '');
                const titulo = fila.dataset.titulo;
                const ruta = fila.dataset.ruta;
                const albumId = fila.dataset.albumId;
                const artIds = fila.dataset.artistasIds;
                const artNombres = fila.dataset.artista;
                
                switch (btnAccion.dataset.accion) {
                    case 'add-cola':
                        if(typeof agregarAColaManual === 'function') agregarAColaManual(ruta);
                        break;
                    case 'add-playlist':
                        // ASIGNACIÓN DE DATOS
                        const inputId = document.getElementById('id_cancion_playlist');
                        if (inputId) inputId.value = id;
                        window.filaCancionActiva = fila;
                        
                        // PARCHE DIRECTO: FORZAR APERTURA DE MODAL POR JAVASCRIPT
                        const modalPlaylist = document.getElementById('agregarPlaylistModal'); // OJO: SI TU MODAL SE LLAMA DIFERENTE, CAMBIA ESTE NOMBRE
                        if (modalPlaylist) {
                            bootstrap.Modal.getOrCreateInstance(modalPlaylist).show();
                        } else {
                            console.error("No se encuentra el ID 'agregarPlaylistModal' en tu HTML.");
                        }
                        break;
                    case 'remove-playlist':
                        const inputPlaylist = document.getElementById('playlist_activa_id');
                        if (inputPlaylist && typeof quitarDePlaylistAsincrono === 'function') {
                            quitarDePlaylistAsincrono(id, inputPlaylist.value, btnAccion);
                        }
                        break;
                    case 'editar':
                        const tdDuracion = fila.querySelector('td.font-monospace');
                        let duracionSegs = 0;
                        if (tdDuracion) {
                            const partes = tdDuracion.innerText.trim().split(':');
                            if (partes.length === 2) {
                                duracionSegs = (parseInt(partes[0]) * 60) + parseInt(partes[1]);
                            }
                        }
                        if(typeof cargarModalCancion === 'function') cargarModalCancion(id, titulo, albumId, duracionSegs, ruta);
                        if(typeof cargarEtiquetasEdicion === 'function') cargarEtiquetasEdicion(artIds, artNombres);
                        
                        const formEdicion = document.querySelector('#editCancionModal form');
                        if (formEdicion) {
                            let inputDur = formEdicion.querySelector('input[name="duracion"]');
                            if (!inputDur) {
                                inputDur = document.createElement('input');
                                inputDur.type = 'hidden';
                                inputDur.name = 'duracion';
                                formEdicion.appendChild(inputDur);
                            }
                            inputDur.value = duracionSegs;
                        }
                        break;
                    case 'descargar':
                        const albumNombre = btnAccion.dataset.albumNombre;
                        if(typeof descargarCancionConMetadatos === 'function') descargarCancionConMetadatos(btnAccion, ruta, titulo, artNombres, albumNombre);
                        break;
                    case 'eliminar':
                        if(typeof prepararEliminacion === 'function') prepararEliminacion('cancion', id, btnAccion);
                        break;
                }
            }
        });
    }
});
</script>