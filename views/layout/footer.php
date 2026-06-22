</div> <div class="player-bar d-flex align-items-center justify-content-between">
        
        <div class="d-flex align-items-center gap-3" style="width: 25%;">
            <div id="player-icon-container" class="bg-secondary d-flex align-items-center justify-content-center rounded text-muted border border-secondary" style="width: 55px; height: 55px; min-width: 55px;"><i class="bi bi-music-note fs-3"></i></div>
            <img id="current-cover" src="" class="player-img border border-secondary d-none" alt="Cover" style="width: 55px; height: 55px;">
            
            <div class="d-flex align-items-center justify-content-between flex-grow-1 overflow-hidden pe-2">
                <div class="overflow-hidden pe-2">
                    <div id="current-title" class="fw-bold text-white text-truncate small" style="max-width:160px;">Ninguna canción</div>
                    <div id="current-artist" class="text-secondary small text-truncate" style="max-width:160px;">Selecciona un tema</div>
                </div>
                <button type="button" class="btn btn-link text-success p-0 shadow-none" onclick="irACancionActual()" title="Ubicar canción en la tabla">
                    <i class="bi bi-crosshair fs-5" style="filter: drop-shadow(0 0 5px rgba(239,68,68,0.5));"></i>
                </button>
            </div>
        </div>
        
        <div class="d-flex flex-column align-items-center" style="width: 50%;">
            <audio id="audio-player" class="d-none"></audio>
            <div class="d-flex align-items-center gap-3 mb-1">
                <button id="shuffle-btn" class="btn text-secondary fs-5 p-0 lh-1" onclick="toggleShuffle()"><i class="bi bi-shuffle"></i></button>
                <button id="prev-btn" class="btn text-white fs-4 p-0 lh-1" onclick="cancionAnterior()"><i class="bi bi-skip-start-fill"></i></button>
                <button id="play-btn" class="btn btn-light rounded-circle p-0 d-flex align-items-center justify-content-center" style="width:40px; height:40px;" onclick="togglePlay()"><i class="bi bi-play-fill fs-4 text-black"></i></button>
                <button id="next-btn" class="btn text-white fs-4 p-0" onclick="siguienteCancion()"><i class="bi bi-skip-end-fill"></i></button>
                
                <button id="repeat-btn" class="btn text-secondary fs-5 p-0 lh-1" 
                        onclick="
                            window.modoRepetirActivo = !window.modoRepetirActivo;
                            this.className = window.modoRepetirActivo ? 'btn text-success fs-5 p-0 lh-1' : 'btn text-secondary fs-5 p-0 lh-1';
                            document.getElementById('repeat-icon').className = window.modoRepetirActivo ? 'bi bi-repeat-1' : 'bi bi-repeat';
                        ">
                    <i class="bi bi-repeat" id="repeat-icon"></i>
                </button>            
            </div>
            <div class="d-flex align-items-center gap-2 w-100">
                <span id="time-current" class="text-secondary small" style="min-width: 35px; text-align: right;">0:00</span>
                <input type="range" id="progress-bar" class="form-range flex-grow-1" min="0" max="100" value="0" oninput="ajustarTiempo(this.value)">
                <span id="time-total" class="text-secondary small" style="min-width: 35px;">0:00</span>
            </div>
        </div>
        
        <div class="d-flex align-items-center justify-content-end gap-3" style="width: 25%; min-width: 150px;">        
            <div class="d-flex align-items-center gap-2">
                <i id="volume-icon" class="bi bi-volume-up text-secondary fs-5" style="cursor: pointer;" onclick="toggleMute()"></i>
                
                <input type="range" id="volume-slider" class="form-range" style="width:90px;" min="0" max="1" step="0.05" value="1">
            </div>
        </div>
        <button type="button" id="btn-abrir-cola" class="btn text-secondary p-0 fs-5 lh-1 shadow-none" onclick="togglePanelCola()" title="Ver cola">
            <i class="bi bi-view-list"></i>
        </button>
        <button id="btn-abrir-letras" class="btn text-secondary p-0 fs-5 lh-1 ms-3" onclick="togglePanelLetras()" title="Ver Letras">
            <i class="bi bi-card-text"></i>
        </button>
    </div>

    </div> <div class="modal fade" id="artistaModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">Registrar Nuevo Artista</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <form onsubmit="enviarFormularioAsincrono(event, 'api/insertar_elementos.php')">
            <input type="hidden" name="accion" value="crear_artista">
            <div class="modal-body d-flex flex-column gap-3">
                <div>
                    <label class="form-label">Nombre del Artista</label>
                    <input type="text" name="nombre" class="form-control" required>
                </div>
                <div>
                    <label class="form-label">Foto de Perfil <span class="text-warning">(Opcional)</span></label>
                    <input type="file" name="foto" class="form-control" accept="image/*">
                </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-primary w-100 fw-bold">Guardar Artista</button>
            </div>
        </form>
        </div>
    </div>
    </div>

    <div class="modal fade" id="albumModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary"><h5>Registrar Álbum</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <form onsubmit="enviarFormularioAsincrono(event, 'api/insertar_elementos.php')">
                <input type="hidden" name="accion" value="crear_album">
                <div class="modal-body d-flex flex-column gap-3">
                        <div><label class="form-label text-secondary small fw-bold">Título del Álbum</label><input type="text" name="titulo" class="form-control bg-secondary text-white border-0" required></div>
                        <div id="contenedor_buscador_artistas" data-artistas='<?= htmlspecialchars(json_encode($artistas), ENT_QUOTES, 'UTF-8') ?>'>
                            <label class="form-label">Artistas Responsables</label>
                            <div id="album_selected_artists" class="d-flex flex-wrap gap-2 mb-2"></div>
                            <div class="position-relative">
                                <input type="text" id="album_artist_search" class="form-control" placeholder="Escribe para buscar un artista..." autocomplete="off">
                                <div id="album_artist_results" class="position-absolute w-100 mt-1 rounded shadow-lg" style="display: none; z-index: 1060; max-height: 160px; overflow-y: auto; background-color: #141414; border: 1px solid rgba(220, 38, 38, 0.4);">
                                </div>
                            </div>
                            <div id="album_hidden_inputs"></div>
                        </div>
                        <div><label class="form-label text-secondary small fw-bold">Año de lanzamiento <span class="text-warning">(Opcional)</span></label><input type="number" name="anio" class="form-control bg-secondary text-white border-0" placeholder="Ej: 2026"></div>
                        <div><label class="form-label text-secondary small fw-bold">Carátula del Álbum <span class="text-warning">(Opcional)</span></label><input type="file" name="caratula" class="form-control bg-secondary text-white border-0" accept="image/*"></div>
                </div>
                <div class="modal-footer border-secondary"><button type="submit" class="btn btn-success fw-bold w-100">Guardar Álbum</button></div>
            </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="playlistModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark text-white border-secondary">
        <div class="modal-header border-secondary"><h5>Crear Playlist Personal</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
        <form onsubmit="enviarFormularioAsincrono(event, 'api/insertar_elementos.php')">
            <input type="hidden" name="accion" value="crear_playlist">
            <div class="modal-body d-flex flex-column gap-3">
                    <div><label class="form-label text-secondary small fw-bold">Nombre de la Lista</label><input type="text" name="nombre" class="form-control bg-secondary text-white border-0" required></div>
                    <div><label class="form-label text-secondary small fw-bold">Descripción Corta <span class="text-warning">(Opcional)</span></label><input type="text" name="descripcion" class="form-control bg-secondary text-white border-0"></div>
                    <div><label class="form-label text-secondary small fw-bold">Portada Personalizada <span class="text-warning">(Opcional)</span></label><input type="file" name="caratula" class="form-control bg-secondary text-white border-0" accept="image/*"></div>
            </div>
            <div class="modal-footer border-secondary"><button type="submit" class="btn btn-success fw-bold w-100">Crear Playlist</button></div>
        </form>
        </div>
    </div>
    </div>

    <div class="modal fade" id="cancionModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Publicar Canción</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="subirCancionConProgreso(event, 'api/insertar_elementos.php')">
                <input type="hidden" name="accion" value="subir_cancion">
                <input type="hidden" name="duracion" id="input_duracion_mp3" value="0">
                <div class="modal-body d-flex flex-column gap-3">
                        <div>
                            <label class="form-label">Archivo de Audio (.MP3)</label>
                            <input type="file" name="archivo_mp3" id="file_mp3" class="form-control" accept=".mp3" onchange="obtenerDuracionArchivo(this)" required>
                        </div>
                        <div>
                            <label class="form-label">Título del Track</label>
                            <input type="text" name="titulo" class="form-control" required>
                        </div>
                        <div>
                            <label class="form-label">Álbum Vinculado <span class="text-warning">(Opcional)</span></label>
                            <select name="album_id" class="form-select">
                                <option value="">-- Ninguno (Single / Sencillo) --</option>
                                <?php foreach($albumes as $alb): ?>
                                    <option value="<?= $alb['id'] ?>">
                                        <?= htmlspecialchars($alb['titulo']) ?> 
                                        <?php if(!empty($alb['artistas_nombres'])): ?>
                                            (<?= htmlspecialchars($alb['artistas_nombres']) ?>)
                                        <?php endif; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Artistas Integrantes</label>
                            <div id="subir_can_contenedor_buscador" data-artistas='<?= htmlspecialchars(json_encode($artistas), ENT_QUOTES, 'UTF-8') ?>'>
                                <div id="subir_can_selected_artists" class="d-flex flex-wrap gap-2 mb-2"></div>
                                <div class="position-relative">
                                    <input type="text" id="subir_can_artist_search" class="form-control" placeholder="Buscar artista para agregar..." autocomplete="off">
                                    <div id="subir_can_artist_results" class="position-absolute w-100 mt-1 rounded shadow-lg" style="display: none; z-index: 1060; max-height: 160px; overflow-y: auto; background-color: #141414; border: 1px solid rgba(220, 38, 38, 0.4);"></div>
                                </div>
                                <div id="subir_can_hidden_inputs"></div>
                            </div>
                        </div>

                        <div id="contenedor-progreso-subida" class="d-none mt-2">
                            <div class="d-flex justify-content-between text-secondary mb-1" style="font-size: 0.75rem;">
                                <span id="texto-progreso-subida" class="fw-bold">Preparando subida...</span>
                                <span id="porcentaje-progreso-subida" class="fw-bold text-success">0%</span>
                            </div>
                            <div class="progress bg-dark border border-secondary border-opacity-25" style="height: 12px;">
                                <div id="barra-progreso-subida" class="progress-bar bg-success progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%;"></div>
                            </div>
                        </div>
                </div>
                
                <div class="modal-footer justify-content-between border-secondary">
                    <button type="button" id="btn-cancelar-subida" class="btn btn-outline-danger d-none fw-bold" onclick="cancelarSubidaActual()">Cancelar Subida</button>
                    <button type="submit" id="btn-submit-cancion" class="btn btn-primary fw-bold flex-grow-1">Subir Música</button>
                </div>
            </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="agregarAPlaylistModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content bg-dark text-white border-info">
        <div class="modal-header border-secondary"><h6>Añadir a Playlist</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
        <form onsubmit="enviarFormularioAsincrono(event, 'api/insertar_elementos.php')">
            <input type="hidden" name="accion" value="agregar_a_playlist">
            <input type="hidden" name="cancion_id" id="id_cancion_playlist">
            <div class="modal-body">
                    <select name="playlist_id" class="form-select bg-secondary text-white border-0" required>
                        <option value="">-- Elige Playlist --</option>
                        <?php foreach($playlists as $pl): ?><option value="<?= $pl['id'] ?>"><?= htmlspecialchars($pl['nombre']) ?></option><?php endforeach; ?>
                    </select>
            </div>
            <div class="modal-footer border-secondary"><button type="submit" class="btn btn-info text-black fw-bold w-100">Confirmar</button></div>
        </form>
        </div>
    </div>
    </div>

    <div class="modal fade" id="editCancionModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
        <div class="modal-header">
            <h5>Modificar Canción</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <form onsubmit="enviarFormularioAsincrono(event, 'api/editar_elementos.php')">
            <input type="hidden" name="accion" value="editar_cancion">
            <input type="hidden" name="id" id="edit_can_id">
            <div class="modal-body d-flex flex-column gap-3">
                    <div>
                        <label class="form-label">Título de la Canción</label>
                        <input type="text" name="titulo" id="edit_can_titulo" class="form-control" required>
                    </div>
                    <div>
                        <label class="form-label">Archivo MP3 (Opcional)</label>
                        <input type="file" name="archivo_mp3" id="edit_can_archivo" class="form-control bg-dark border-secondary text-white shadow-none" accept=".mp3,audio/*" onchange="obtenerDuracionArchivo(this)">
                        <div class="form-text text-white-50" style="font-size: 0.75rem;">Sube un nuevo archivo solo si deseas reemplazar el audio actual.</div>
                        <input type="hidden" name="ruta_actual" id="edit_can_ruta_actual">
                    </div>
                    <div>
                        <label class="form-label">Álbum</label>
                        <select name="album_id" id="edit_can_album" class="form-select">
                            <option value="">-- Ninguno (Single / Sencillo) --</option>
                            <?php foreach($albumes as $alb): ?>
                                <option value="<?= $alb['id'] ?>">
                                    <?= htmlspecialchars($alb['titulo']) ?> 
                                    <?php if(!empty($alb['artistas_nombres'])): ?>
                                        (<?= htmlspecialchars($alb['artistas_nombres']) ?>)
                                    <?php endif; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Duración del Track</label>
                        <input type="text" id="edit_can_duracion_texto" class="form-control font-monospace" readonly>
                    </div>
                    <div>
                        <label class="form-label">Artistas Integrantes</label>
                        <div id="edit_can_contenedor_buscador" data-artistas='<?= htmlspecialchars(json_encode($artistas), ENT_QUOTES, 'UTF-8') ?>'>
                            <div id="edit_can_selected_artists" class="d-flex flex-wrap gap-2 mb-2"></div>
                            <div class="position-relative">
                                <input type="text" id="edit_can_artist_search" class="form-control" placeholder="Buscar artista para agregar..." autocomplete="off">
                                <div id="edit_can_artist_results" class="position-absolute w-100 mt-1 rounded shadow-lg" style="display: none; z-index: 1060; max-height: 160px; overflow-y: auto; background-color: #141414; border: 1px solid rgba(220, 38, 38, 0.4);"></div>
                            </div>
                            <div id="edit_can_hidden_inputs"></div>
                        </div>
                    </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-primary fw-bold w-100">Guardar Cambios</button>
            </div>
        </form>
        </div>
    </div>
    </div>

    <div class="modal fade" id="editArtistaModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
        <div class="modal-header">
            <h5>Editar Datos del Artista</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <form onsubmit="enviarFormularioAsincrono(event, 'api/editar_elementos.php')">
            <input type="hidden" name="accion" value="editar_artista">
            <input type="hidden" name="id" id="edit_art_id">
            <div class="modal-body d-flex flex-column gap-3">
                    <div>
                        <label class="form-label">Nombre del Artista</label>
                        <input type="text" name="nombre" id="edit_art_nombre" class="form-control" required>
                    </div>
                    <div>
                        <label class="form-label">Reemplazar Foto <span class="text-warning">(Opcional)</span></label>
                        <input type="file" name="foto" class="form-control" accept="image/*">
                    </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-primary fw-bold w-100">Guardar Cambios</button>
            </div>
        </form>
        </div>
    </div>
    </div>

    <div class="modal fade" id="editAlbumModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
        <div class="modal-header">
            <h5>Editar Datos del Álbum</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <form onsubmit="enviarFormularioAsincrono(event, 'api/editar_elementos.php')">
            <input type="hidden" name="accion" value="editar_album">
            <input type="hidden" name="id" id="edit_alb_id">
            <div class="modal-body d-flex flex-column gap-3">
                    <div>
                        <label class="form-label">Título del Álbum</label>
                        <input type="text" name="titulo" id="edit_alb_titulo" class="form-control" required>
                    </div>
                    <div>
                        <label class="form-label">Artistas Responsables</label>
                        <div id="edit_alb_contenedor_buscador" data-artistas='<?= htmlspecialchars(json_encode($artistas), ENT_QUOTES, 'UTF-8') ?>'>
                            <div id="edit_alb_selected_artists" class="d-flex flex-wrap gap-2 mb-2"></div>
                            <div class="position-relative">
                                <input type="text" id="edit_alb_artist_search" class="form-control" placeholder="Buscar artista para agregar..." autocomplete="off">
                                <div id="edit_alb_artist_results" class="position-absolute w-100 mt-1 rounded shadow-lg" style="display: none; z-index: 1060; max-height: 160px; overflow-y: auto; background-color: #141414; border: 1px solid rgba(220, 38, 38, 0.4);"></div>
                            </div>
                            <div id="edit_alb_hidden_inputs"></div>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Año</label>
                        <input type="number" name="anio" id="edit_alb_anio" class="form-control">
                    </div>
                    <div>
                        <label class="form-label">Reemplazar Carátula <span class="text-warning">(Opcional)</span></label>
                        <input type="file" name="caratula" class="form-control" accept="image/*">
                    </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-primary fw-bold w-100">Guardar Cambios</button>
            </div>
        </form>
        </div>
    </div>
    </div>

    <div class="modal fade" id="editPlaylistModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark text-white border-warning">
        <div class="modal-header border-secondary"><h5>Editar Playlist</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
        <form onsubmit="enviarFormularioAsincrono(event, 'api/editar_elementos.php')">
            <input type="hidden" name="accion" value="editar_playlist"><input type="hidden" name="id" id="edit_pl_id">
            <div class="modal-body d-flex flex-column gap-3">
                    <div><label class="form-label text-secondary small fw-bold">Nombre</label><input type="text" name="nombre" id="edit_pl_nombre" class="form-control bg-secondary text-white border-0" required></div>
                    <div><label class="form-label text-secondary small fw-bold">Descripción</label><input type="text" name="descripcion" id="edit_pl_desc" class="form-control bg-secondary text-white border-0"></div>
                    <div><label class="form-label text-secondary small fw-bold">Reemplazar Portada <span class="text-warning">(Opcional)</span></label><input type="file" name="caratula" class="form-control bg-secondary text-white border-0" accept="image/*"></div>
            </div>
            <div class="modal-footer border-secondary"><button type="submit" class="btn btn-warning text-black fw-bold w-100">Guardar Cambios</button></div>
        </form>
        </div>
    </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1100;">
        <div id="backupToast" class="toast align-items-center text-bg-dark border-secondary" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2" id="backupToastMensaje"></div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <div id="colaPanel">
        <div class="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25" style="background-color: #121212;">
            <h6 class="m-0 text-white fw-bold d-flex align-items-center">
                <i class="bi bi-music-note-list text-success me-2 fs-5"></i> Cola de Reproducción
            </h6>
            <button type="button" class="btn text-secondary fs-5 p-0 hover-text-white shadow-none" onclick="togglePanelCola()">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>

        <div class="p-3" style="background-color: #1a1a1a;">
            <p class="text-white-50 small mb-1 fw-bold text-uppercase" style="letter-spacing: 1px; font-size: 0.7rem;">Reproduciendo ahora</p>
            <div class="text-success text-truncate fw-semibold" id="cola-now-title">-- — --</div>
        </div>

        <div class="p-2">
            <p class="text-white-50 small mb-2 ms-2 fw-bold text-uppercase" style="letter-spacing: 1px; font-size: 0.7rem;">A continuación</p>
            <ul class="list-group list-group-flush bg-transparent" id="lista-cola-dinamica"></ul>
        </div>
    </div>

    <div class="modal fade" id="modalLogs" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title text-white fw-bold"><i class="bi bi-shield-check text-success me-2"></i>Historial de Auditoría</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="table-responsive">
                        <table class="table table-dark table-hover mb-0" style="background-color: transparent;">
                            <thead style="background-color: #1a1a1a;">
                                <tr>
                                    <th class="text-secondary small fw-normal py-3 ps-4">FECHA Y HORA</th>
                                    <th class="text-secondary small fw-normal py-3">ACCIÓN</th>
                                    <th class="text-secondary small fw-normal py-3">MÓDULO</th>
                                    <th class="text-secondary small fw-normal py-3 w-50">DESCRIPCIÓN</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-logs-body">
                                </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer justify-content-between">
                    <span class="text-secondary small" id="contador-logs">Cargando registros...</span>
                    <button type="button" class="btn btn-secondary btn-sm px-4" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <div id="letrasPanel" class="letras-panel-overlay">
        <div class="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-25">
            <h5 class="m-0 text-white fw-bold"><i class="bi bi-card-text text-danger me-2"></i> Letras</h5>
            <button class="btn btn-transparent text-white opacity-75 hover-opacity-100 fs-5 p-0" onclick="togglePanelLetras()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div id="letras-lista-dinamica" class="p-4 overflow-y-auto" style="height: calc(100% - 60px);">
            <div class="text-center py-5 text-secondary">
                <i class="bi bi-music-note fs-1 d-block mb-3 opacity-50"></i>
                Reproduce una pista para buscar su letra
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/browser-id3-writer@4.4.0/dist/browser-id3-writer.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    <script src="assets/js/apiServices.js"></script>
    <script src="assets/js/uiController.js?v=4"></script>
    <script src="assets/js/audioEngine.js?v=<?php echo time(); ?>"></script>
    <script src="assets/js/main.js"></script>
    <script src="assets/js/logsController.js?v=2"></script>
</body>
</html>