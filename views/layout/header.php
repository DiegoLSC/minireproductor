<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NebulaPlayer - Panel de Control</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <link href="assets/css/base.css" rel="stylesheet">
    <link href="assets/css/layout.css?v=<?php echo time(); ?>" rel="stylesheet">
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
            
            <div class="d-flex align-items-center justify-content-between mb-4 mt-2 px-2">
                <div class="d-flex align-items-center w-100">
                    <i class="bi bi-music-note-beamed text-danger fs-3 me-3 hover-scale" style="cursor:pointer;" onclick="if(document.getElementById('sidebar').classList.contains('contraido')) { toggleSidebar(); } else { window.location='index.php'; }" title="NebulaPlayer"></i>
                    
                    <span class="ocultar-al-contraer fw-bold text-white fs-5 flex-grow-1 text-truncate" style="cursor:pointer; letter-spacing: 0.5px;" onclick="window.location='index.php'">NebulaPlayer</span>
                    
                    <button type="button" class="btn text-secondary border-0 p-0 shadow-none ocultar-al-contraer ms-2 hover-scale" onclick="toggleSidebar()" title="Contraer Menú">
                        <i class="bi bi-layout-sidebar-inset text-white-50 fs-5 hover-text-white"></i>
                    </button>
                </div>
            </div>
        
            <div class="d-flex flex-column gap-1 mb-4">
                <div class="d-flex flex-column mb-2 px-2">
                    <button class="btn btn-menu-lateral btn-sm text-start text-secondary shadow-none d-flex align-items-center py-2 rounded" data-bs-toggle="modal" data-bs-target="#artistaModal">
                        <i class="bi bi-person-plus fs-5 me-3 text-secondary"></i> 
                        <span class="ocultar-al-contraer fw-medium">Añadir Artista</span>
                    </button>
                    
                    <button class="btn btn-menu-lateral btn-sm text-start text-secondary shadow-none d-flex align-items-center py-2 rounded" data-bs-toggle="modal" data-bs-target="#albumModal">
                        <i class="bi bi-disc fs-5 me-3 text-secondary"></i> 
                        <span class="ocultar-al-contraer fw-medium">Añadir Álbum</span>
                    </button>
                    
                    <button class="btn btn-menu-lateral btn-sm text-start text-secondary shadow-none d-flex align-items-center py-2 rounded" data-bs-toggle="modal" data-bs-target="#playlistModal">
                        <i class="bi bi-collection-play fs-5 me-3 text-secondary"></i> 
                        <span class="ocultar-al-contraer fw-medium">Nueva Playlist</span>
                    </button>
                </div>
                
                <button class="btn btn-danger btn-sm rounded-pill text-center fw-bold shadow-sm d-flex align-items-center justify-content-center mx-2 py-2 mb-2" data-bs-toggle="modal" data-bs-target="#cancionModal">
                    <i class="bi bi-cloud-upload-fill me-2 fs-6 text-white"></i> 
                    <span class="ocultar-al-contraer">Subir Canción</span>
                </button>

                <div class="d-flex gap-2 mx-2 mt-1">
                    <button type="button" class="btn btn-outline-secondary border-opacity-25 btn-sm rounded-pill fw-medium d-flex align-items-center justify-content-center flex-fill text-secondary hover-bg-carmesi" onclick="iniciarBackup()" title="Descargar Backup">
                        <i class="bi bi-box-seam me-2"></i> 
                        <span class="ocultar-al-contraer">Backup</span>
                    </button>

                    <button type="button" class="btn btn-outline-secondary border-opacity-25 btn-sm rounded-pill fw-medium d-flex align-items-center justify-content-center flex-fill text-secondary hover-bg-carmesi" onclick="document.getElementById('input-subir-backup').click()" title="Sincronizar Backup">
                        <i class="bi bi-arrow-repeat me-2"></i> 
                        <span class="ocultar-al-contraer">Restaurar</span>
                    </button>
                </div>
                <input type="file" id="input-subir-backup" class="d-none" accept=".zip" onchange="procesarSubidaBackup(this)">
            </div>
        
            <hr class="text-secondary border-opacity-25 my-3 mx-2">

            <div class="accordion accordion-flush bg-transparent" id="acordeonSidebar">
                <div class="accordion-item bg-transparent text-white border-0">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed bg-transparent text-white-50 small fw-bold px-0 py-2 text-uppercase" type="button" data-bs-toggle="collapse" data-bs-target="#dropPlaylists" style="box-shadow:none;">
                            <i class="bi bi-collection me-2 text-danger"></i> 
                            <span class="ocultar-al-contraer">Playlists</span>
                        </button>
                    </h2>
                    <div id="dropPlaylists" class="accordion-collapse collapse" data-bs-parent="#acordeonSidebar">
                        <div class="accordion-body px-1 py-2">
                            <ul class="nav flex-column gap-1 small">
                                <li>
                                    <a href="#" class="nav-link text-white-50 p-1 hover-text-white" onclick="filtrarPorPlaylist('')"><i class="bi bi-globe me-2 text-secondary"></i> Ver Todo</a>
                                </li>
                                <?php foreach($playlists as $pl): ?>
                                <li class="d-flex align-items-center justify-content-between p-1 rounded hover-bg-dark">
                                    <a href="#" class="text-secondary text-truncate flex-grow-1 text-decoration-none me-1 hover-text-white" data-nombre="<?= htmlspecialchars($pl['nombre'], ENT_QUOTES, 'UTF-8') ?>" onclick="filtrarPorPlaylist(this.getAttribute('data-nombre'))">
                                        <i class="bi bi-music-note-list me-2 text-secondary"></i><?= htmlspecialchars($pl['nombre']) ?>
                                    </a>
                                    <div class="d-flex gap-1">
                                        <span style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#editPlaylistModal" data-nombre="<?= htmlspecialchars($pl['nombre'], ENT_QUOTES, 'UTF-8') ?>" data-desc="<?= htmlspecialchars($pl['descripcion'], ENT_QUOTES, 'UTF-8') ?>" onclick="document.getElementById('edit_pl_id').value='<?= $pl['id'] ?>'; document.getElementById('edit_pl_nombre').value=this.getAttribute('data-nombre'); document.getElementById('edit_pl_desc').value=this.getAttribute('data-desc');"><i class="bi bi-pencil small text-warning opacity-75 hover-opacity-100"></i></span>
                                        <span style="cursor:pointer;" onclick="eliminarElementoAsincrono('playlist', <?= $pl['id'] ?>, this)"><i class="bi bi-trash3 small text-danger opacity-75 hover-opacity-100"></i></span>
                                    </div>
                                </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="accordion-item bg-transparent text-white border-0 mt-2">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed bg-transparent text-white-50 small fw-bold px-0 py-2 text-uppercase" type="button" data-bs-toggle="collapse" data-bs-target="#dropArtistas" style="box-shadow:none;">
                            <i class="bi bi-person-lines-fill me-2 text-danger"></i> 
                            <span class="ocultar-al-contraer">Catálogo</span>
                        </button>
                    </h2>
                    <div id="dropArtistas" class="accordion-collapse collapse" data-bs-parent="#acordeonSidebar">
                        <div class="accordion-body px-0 py-2">
                            
                            <div class="px-2 mb-3 position-relative ocultar-al-contraer">
                                <input type="text" id="inputBuscarCatalogo" class="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 shadow-none rounded-pill px-3 pe-4" placeholder="Filtrar catálogo..." oninput="filtrarMenuCatalogo()">
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
                                                <img src="<?= htmlspecialchars($art['foto'], ENT_QUOTES, 'UTF-8') ?>" style="width: 24px; height: 24px; object-fit: cover;" class="rounded-circle" alt="Art">
                                                <?php endif; ?>
                                                <span class="text-white fw-medium text-truncate"><?= htmlspecialchars($art['nombre'], ENT_QUOTES, 'UTF-8') ?></span>
                                            </div>
                                            <div class="dropdown btn-opciones ms-2">
                                                <button class="btn btn-link text-secondary p-0 border-0 shadow-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                                                    <li><a class="dropdown-item small" href="#" data-nombre="<?= htmlspecialchars($art['nombre'], ENT_QUOTES, 'UTF-8') ?>" onclick="document.getElementById('buscadorInput').value=this.getAttribute('data-nombre'); filtrarBiblioteca(); return false;"><i class="bi bi-search text-success me-2"></i>Buscar todas sus canciones</a></li>
                                                    <li><a class="dropdown-item small" href="#" data-bs-toggle="modal" data-bs-target="#editArtistaModal" data-nombre="<?= htmlspecialchars($art['nombre'], ENT_QUOTES, 'UTF-8') ?>" onclick="document.getElementById('edit_art_id').value='<?= $art['id'] ?>'; document.getElementById('edit_art_nombre').value=this.getAttribute('data-nombre');"><i class="bi bi-pencil text-warning me-2"></i>Editar Artista</a></li>
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
                                                        <div class="d-flex align-items-center gap-2 text-truncate flex-grow-1" style="cursor:pointer;" data-titulo="<?= htmlspecialchars($alb['titulo'], ENT_QUOTES, 'UTF-8') ?>" onclick="document.getElementById('buscadorInput').value=this.getAttribute('data-titulo'); filtrarBiblioteca();">
                                                            <?php if (empty($alb['caratula']) || strpos($alb['caratula'], 'default.jpg') !== false): ?>
                                                                <div class="bg-secondary d-flex align-items-center justify-content-center rounded text-muted" style="width: 20px; height: 20px; min-width: 20px;"><i class="bi bi-disc" style="font-size: 0.7rem;"></i></div>
                                                            <?php else: ?>
                                                                <img src="<?= htmlspecialchars($alb['caratula'], ENT_QUOTES, 'UTF-8') ?>" style="width: 20px; height: 20px; object-fit: cover;" class="rounded" alt="Alb">
                                                            <?php endif; ?>
                                                            <span class="text-white-50 text-truncate" style="font-size: 0.85rem;"><?= htmlspecialchars($alb['titulo'], ENT_QUOTES, 'UTF-8') ?></span>
                                                        </div>
                                                        <div class="dropdown btn-opciones ms-2">
                                                            <button class="btn btn-link text-secondary p-0 border-0 shadow-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                                                                <i class="bi bi-three-dots-vertical"></i>
                                                            </button>
                                                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                                                                <li><a class="dropdown-item small" href="#" data-titulo="<?= htmlspecialchars($alb['titulo'], ENT_QUOTES, 'UTF-8') ?>" data-artistas-nombres="<?= htmlspecialchars($alb['artistas_nombres'], ENT_QUOTES, 'UTF-8') ?>" data-artistas-ids="<?= $alb['artistas_ids'] ?>" data-bs-toggle="modal" data-bs-target="#editAlbumModal" onclick="cargarModalAlbum(<?= $alb['id'] ?>, this.getAttribute('data-titulo'), '<?= $alb['anio'] ?? '' ?>'); cargarEtiquetasEdicionAlbum(this.getAttribute('data-artistas-ids'), this.getAttribute('data-artistas-nombres'));"><i class="bi bi-pencil text-warning me-2"></i>Editar Álbum</a></li>
                                                                <li><hr class="dropdown-divider border-secondary"></li>
                                                                <li><a class="dropdown-item small text-danger" href="#" onclick="eliminarElementoAsincrono('album', <?= $alb['id'] ?>, this)"><i class="bi bi-trash3 text-danger me-2"></i>Eliminar Álbum</a></li>
                                                            </ul>
                                                        </div>
                                                    </li>
                                                    <?php endif; endforeach; ?>
                                                    <?php if(!$tiene_albumes): ?>
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

            <hr class="border-secondary opacity-25 my-3 mx-2">

            <div class="nav-item w-100 mb-2 px-2">
                <button type="button" class="btn btn-transparent text-secondary w-100 text-start px-2 py-2 d-flex align-items-center hover-bg-carmesi rounded" data-bs-toggle="modal" data-bs-target="#modalLogs">
                    <i class="bi bi-shield-check fs-5 me-3"></i>
                    <span class="fw-medium text-truncate ocultar-al-contraer">Registro de Actividad</span>
                </button>
            </div>
        </div>