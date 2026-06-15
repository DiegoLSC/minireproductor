<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NebulaPlayer - Panel de Control</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <link href="assets/css/base.css" rel="stylesheet">
    <link href="assets/css/layout.css" rel="stylesheet">
    <link href="assets/css/components.css" rel="stylesheet">
</head>
<body>

    <div id="pantalla-carga" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center flex-column" style="background-color: #050505; z-index: 1060; transition: opacity 0.5s ease, visibility 0.5s ease;">
        <div class="spinner-border text-danger mb-4" style="width: 4rem; height: 4rem;" role="status"></div>
        <h5 class="text-secondary font-monospace" style="letter-spacing: 3px;">SINCRONIZANDO BIBLIOTECA</h5>
    </div>

    <div class="app-container">
    <div class="app-body">
        
        <div class="d-md-none bg-black p-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25" style="position: fixed; top: 0; left: 0; right: 0; z-index: 1040;">
            <h5 class="text-success m-0 fw-bold" onclick="window.location='index.php'" style="cursor:pointer;">
                <i class="bi bi-music-note-beamed"></i> NebulaPlayer
            </h5>
            <button type="button" class="btn text-white p-0 border-0 shadow-none" onclick="toggleSidebar()">
                <i class="bi bi-list fs-1"></i>
            </button>
        </div>

        <div class="sidebar" id="sidebar">
            <button type="button" class="btn text-secondary border-0 p-2 mb-3 w-100 d-flex justify-content-start" onclick="toggleSidebar()" title="Contraer/Expandir Menú">
                <i class="bi bi-layout-sidebar text-white fs-5"></i>
            </button>
        
            <h4 class="text-success mb-4 fw-bold d-flex align-items-center" onclick="window.location='index.php'" style="cursor:pointer;">
                <i class="bi bi-music-note-beamed me-2"></i> 
                <span class="ocultar-al-contraer">NebulaPlayer</span>
            </h4>
        
            <div class="d-flex flex-column gap-2 mb-4">
                <button class="btn btn-sm btn-dark border-secondary border-opacity-50 rounded-pill text-start text-white-50 shadow-sm d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#artistaModal">
                    <i class="bi bi-person-plus-fill me-2 text-danger"></i> 
                    <span class="ocultar-al-contraer">+ Artista</span>
                </button>
                
                <button class="btn btn-sm btn-dark border-secondary border-opacity-50 rounded-pill text-start text-white-50 shadow-sm d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#albumModal">
                    <i class="bi bi-disc-fill me-2 text-danger"></i> 
                    <span class="ocultar-al-contraer">+ Álbum</span>
                </button>
                
                <button class="btn btn-sm btn-dark border-secondary border-opacity-50 rounded-pill text-start text-white-50 shadow-sm d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#playlistModal">
                    <i class="bi bi-folder-plus me-2 text-danger"></i> 
                    <span class="ocultar-al-contraer">+ Playlist</span>
                </button>
                
                <button class="btn btn-danger btn-sm rounded-pill text-start fw-bold mt-2 shadow d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#cancionModal">
                    <i class="bi bi-cloud-upload-fill me-2 text-white"></i> 
                    <span class="ocultar-al-contraer">Subir Canción</span>
                </button>

                <div class="d-flex gap-2 mt-2 w-100">
                    <button type="button" class="btn btn-primary btn-sm rounded-pill fw-bold shadow d-flex align-items-center justify-content-center flex-fill" onclick="iniciarBackup()" title="Descargar Backup">
                        <i class="bi bi-box-seam-fill me-2 text-white"></i> 
                        <span class="ocultar-al-contraer">Descargar</span>
                    </button>

                    <button type="button" class="btn btn-primary btn-sm rounded-pill fw-bold shadow d-flex align-items-center justify-content-center flex-fill" onclick="document.getElementById('input-subir-backup').click()" title="Sincronizar Backup">
                        <i class="bi bi-cloud-arrow-up-fill me-2 text-white"></i> 
                        <span class="ocultar-al-contraer">Sincronizar</span>
                    </button>
                </div>

                <input type="file" id="input-subir-backup" class="d-none" accept=".zip" onchange="procesarSubidaBackup(this)">
            </div>
        
            <hr class="text-secondary border-opacity-50 my-2">

            <div class="accordion accordion-flush bg-transparent" id="acordeonSidebar">
                <div class="accordion-item bg-transparent text-white border-0">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed bg-transparent text-white small fw-bold px-0 py-2 text-uppercase" type="button" data-bs-toggle="collapse" data-bs-target="#dropPlaylists" style="box-shadow:none;">
                            <i class="bi bi-folder2-open me-2 text-warning"></i> 
                            <span class="ocultar-al-contraer">Playlists</span>
                        </button>
                    </h2>
                    <div id="dropPlaylists" class="accordion-collapse collapse" data-bs-parent="#acordeonSidebar">
                        <div class="accordion-body px-1 py-2">
                            <ul class="nav flex-column gap-1 small">
                                <li>
                                    <a href="#" class="nav-link text-white p-1" onclick="filtrarPorPlaylist('')"><i class="bi bi-globe me-2 text-success"></i> Ver Todo</a>
                                </li>
                                <?php foreach($playlists as $pl): ?>
                                <li class="d-flex align-items-center justify-content-between p-1 rounded">
                                    <a href="#" class="text-secondary text-truncate flex-grow-1 text-decoration-none me-1 hover-underline" onclick="filtrarPorPlaylist('<?= addslashes($pl['nombre']) ?>')">
                                        <i class="bi bi-music-note-beamed me-2 text-warning"></i><?= htmlspecialchars($pl['nombre']) ?>
                                    </a>
                                    <div class="d-flex gap-1">
                                        <span style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#editPlaylistModal" onclick="document.getElementById('edit_pl_id').value='<?= $pl['id'] ?>'; document.getElementById('edit_pl_nombre').value='<?= addslashes($pl['nombre']) ?>'; document.getElementById('edit_pl_desc').value='<?= addslashes($pl['descripcion']) ?>';"><i class="bi bi-pencil small text-warning"></i></span>
                                        <span style="cursor:pointer;" onclick="eliminarElementoAsincrono('playlist', <?= $pl['id'] ?>, this)"><i class="bi bi-trash3 small text-danger"></i></span>
                                    </div>
                                </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="accordion-item bg-transparent text-white border-0">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed bg-transparent text-white small fw-bold px-0 py-2 text-uppercase" type="button" data-bs-toggle="collapse" data-bs-target="#dropArtistas" style="box-shadow:none;">
                            <i class="bi bi-person-lines-fill me-2 text-info"></i> 
                            <span class="ocultar-al-contraer">Catálogo</span>
                        </button>
                    </h2>
                    <div id="dropArtistas" class="accordion-collapse collapse" data-bs-parent="#acordeonSidebar">
                        <div class="accordion-body px-0 py-2">
                            
                            <div class="px-2 mb-2 position-relative ocultar-al-contraer">
                                <input type="text" id="inputBuscarCatalogo" class="form-control form-control-sm bg-dark text-white border-secondary shadow-none rounded-pill px-3 pe-4" placeholder="Filtrar artistas o álbumes..." oninput="filtrarMenuCatalogo()">
                                <i class="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3 text-secondary" style="font-size: 0.8rem;"></i>
                            </div>

                            <div class="accordion accordion-flush" id="acordeonSubArtistas">
                                <?php foreach($artistas as $art): ?>
                                <?php $collapseArtId = 'collapse_art_' . $art['id']; ?>
                                    
                                    <div class="accordion-item bg-transparent border-0 mb-1">
                                        <div class="d-flex align-items-center justify-content-between text-secondary p-1 rounded hover-bg-dark item-con-opciones">
                                            <div class="d-flex align-items-center gap-2 text-truncate flex-grow-1" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#<?= $collapseArtId ?>">
                                                <?php if (empty($art['foto']) || strpos($art['foto'], 'default.jpg') !== false): ?>
                                                <div class="bg-secondary d-flex align-items-center justify-content-center rounded-circle text-muted" style="width: 24px; height: 24px; min-width: 24px;"><i class="bi bi-person-fill small"></i></div>
                                                <?php else: ?>
                                                <img src="<?= htmlspecialchars($art['foto']) ?>" style="width: 24px; height: 24px; object-fit: cover;" class="rounded-circle" alt="Art">
                                                <?php endif; ?>
                                                <span class="text-white fw-medium text-truncate"><?= htmlspecialchars($art['nombre']) ?></span>
                                            </div>
                                
                                            <div class="dropdown btn-opciones ms-2">
                                                <button class="btn btn-link text-secondary p-0 border-0 shadow-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                                                    <li><a class="dropdown-item small" href="#" onclick="document.getElementById('buscadorInput').value='<?= addslashes($art['nombre']) ?>'; filtrarBiblioteca(); return false;"><i class="bi bi-search text-success me-2"></i>Buscar todas sus canciones</a></li>
                                                    <li><a class="dropdown-item small" href="#" data-bs-toggle="modal" data-bs-target="#editArtistaModal" onclick="document.getElementById('edit_art_id').value='<?= $art['id'] ?>'; document.getElementById('edit_art_nombre').value='<?= addslashes($art['nombre']) ?>';"><i class="bi bi-pencil text-warning me-2"></i>Editar Artista</a></li>
                                                    <li><hr class="dropdown-divider border-secondary"></li>
                                                    <li><a class="dropdown-item small text-danger" href="#" onclick="eliminarElementoAsincrono('artista', <?= $art['id'] ?>, this)"><i class="bi bi-trash3 text-danger me-2"></i>Eliminar Artista</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                
                                        <div id="<?= $collapseArtId ?>" class="accordion-collapse collapse" data-bs-parent="#acordeonSubArtistas">
                                            <div class="accordion-body p-0 py-1 ps-4 ms-2 border-start border-secondary border-opacity-25">
                                                <ul class="list-unstyled d-flex flex-column gap-1 small mb-0">
                                                    <?php 
                                                    $tiene_albumes = false;
                                                    foreach($albumes as $alb): 
                                                        if(in_array($art['id'], explode(',', $alb['artistas_ids'] ?? ''))):
                                                            $tiene_albumes = true;
                                                    ?>
                                                    <li class="d-flex align-items-center justify-content-between text-secondary p-1 ps-2 hover-bg-dark rounded item-con-opciones">
                                                        <div class="d-flex align-items-center gap-2 text-truncate flex-grow-1" style="cursor:pointer;" onclick="document.getElementById('buscadorInput').value='<?= addslashes($alb['titulo']) ?>'; filtrarBiblioteca();">
                                                            <?php if (empty($alb['caratula']) || strpos($alb['caratula'], 'default.jpg') !== false): ?>
                                                                <div class="bg-secondary d-flex align-items-center justify-content-center rounded text-muted" style="width: 20px; height: 20px; min-width: 20px;"><i class="bi bi-disc" style="font-size: 0.7rem;"></i></div>
                                                            <?php else: ?>
                                                                <img src="<?= htmlspecialchars($alb['caratula']) ?>" style="width: 20px; height: 20px; object-fit: cover;" class="rounded" alt="Alb">
                                                            <?php endif; ?>
                                                            <span class="text-white-50 text-truncate" style="font-size: 0.85rem;"><?= htmlspecialchars($alb['titulo']) ?></span>
                                                        </div>
                                                        
                                                        <div class="dropdown btn-opciones ms-2">
                                                            <button class="btn btn-link text-secondary p-0 border-0 shadow-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-popper-config='{"strategy":"fixed"}'>
                                                                <i class="bi bi-three-dots-vertical"></i>
                                                            </button>
                                                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                                                                <li><a class="dropdown-item small" href="#" data-bs-toggle="modal" data-bs-target="#editAlbumModal" onclick="cargarModalAlbum(<?= $alb['id'] ?>, '<?= addslashes($alb['titulo'] ?? '') ?>', '<?= $alb['anio'] ?? '' ?>'); cargarEtiquetasEdicionAlbum('<?= $alb['artistas_ids'] ?? '' ?>', '<?= addslashes($alb['artistas_nombres'] ?? '') ?>');"><i class="bi bi-pencil text-warning me-2"></i>Editar Álbum</a></li>                                                 <li><hr class="dropdown-divider border-secondary"></li>
                                                                <li><a class="dropdown-item small text-danger" href="#" onclick="eliminarElementoAsincrono('album', <?= $alb['id'] ?>, this)"><i class="bi bi-trash3 text-danger me-2"></i>Eliminar Álbum</a></li>
                                                            </ul>
                                                        </div>
                                                    </li>
                                                    <?php 
                                                        endif; 
                                                    endforeach; 
                                                    if(!$tiene_albumes): 
                                                    ?>
                                                        <li class="text-muted small p-1 ps-2 fst-italic" style="font-size: 0.75rem;">Sin álbumes</li>
                                                    <?php endif; ?>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>