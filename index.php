<?php
// index.php
require_once 'config/conexion.php';

// Capturar el orden deseado de la URL (por defecto: desc = más recientes primero)
$orden = (isset($_GET['orden']) && $_GET['orden'] === 'asc') ? 'ASC' : 'DESC';

// Consulta principal OPTIMIZADA
$queryCanciones = "
    SELECT 
        c.id, c.titulo, c.ruta_archivo, c.album_id, c.fecha_subida, c.duracion,
        IFNULL(alb.titulo, 'Single / Sencillo') AS album, 
        IFNULL(alb.caratula, 'uploads/caratulas/default.jpg') AS caratula,
        
        -- Subconsulta para los NOMBRES de los artistas
        (SELECT GROUP_CONCAT(art.nombre SEPARATOR ', ') 
         FROM cancion_artistas ca 
         INNER JOIN artistas art ON ca.artist_id = art.id 
         WHERE ca.cancion_id = c.id) AS artistas_nombres,
         
        -- Subconsulta para los IDs de los artistas (¡ESTO FALTABA!)
        (SELECT GROUP_CONCAT(art.id SEPARATOR ',') 
         FROM cancion_artistas ca 
         INNER JOIN artistas art ON ca.artist_id = art.id 
         WHERE ca.cancion_id = c.id) AS artistas_ids,
         
        -- Subconsulta para las playlists
        IFNULL((SELECT GROUP_CONCAT(pl.nombre SEPARATOR ', ') 
                FROM playlist_canciones plc 
                INNER JOIN playlists pl ON plc.playlist_id = pl.id 
                WHERE plc.cancion_id = c.id), '') AS playlists_nombres
                
    FROM canciones c
    LEFT JOIN albumes alb ON c.album_id = alb.id
    ORDER BY c.fecha_subida $orden
";

// PDO::FETCH_ASSOC es vital para no duplicar datos en RAM
$canciones = $pdo->query($queryCanciones)->fetchAll(PDO::FETCH_ASSOC);


// Consultas para los catálogos (Limpias y con FETCH_ASSOC)
$artistas = $pdo->query("SELECT id, nombre, foto FROM artistas ORDER BY nombre ASC")->fetchAll(PDO::FETCH_ASSOC);
$playlists = $pdo->query("SELECT id, nombre, descripcion FROM playlists ORDER BY nombre ASC")->fetchAll(PDO::FETCH_ASSOC);

// Consulta de Álbumes (Eliminé la duplicada que tenías en tu código original)
$queryAlbumes = "
    SELECT 
        a.id, 
        a.titulo, 
        a.caratula, 
        a.anio,
        GROUP_CONCAT(art.nombre SEPARATOR ', ') AS artistas_nombres,
        GROUP_CONCAT(art.id SEPARATOR ',') AS artistas_ids
    FROM albumes a
    LEFT JOIN albumes_artistas aa ON a.id = aa.album_id
    LEFT JOIN artistas art ON aa.artista_id = art.id
    GROUP BY a.id
    ORDER BY a.titulo ASC
";

$albumes = $pdo->query($queryAlbumes)->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NebulaPlayer - Panel de Control</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <link href="css/estilos.css" rel="stylesheet">
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

        <div class="main-content">
            
            <div class="d-flex gap-3 mb-4 align-items-center">
                <div class="input-group border border-secondary rounded-pill overflow-hidden bg-dark flex-grow-1 position-relative">
                    <span class="input-group-text bg-dark border-0 text-secondary"><i class="bi bi-search fs-5"></i></span>
                    <input type="text" id="buscadorInput" class="form-control bg-dark text-white border-0 shadow-none py-2 pe-5" placeholder="¿Qué quieres escuchar hoy? (Canción, artista, álbum...)" oninput="filtrarBiblioteca()">
                    <button type="button" id="btn-limpiar-busqueda" class="btn btn-link text-secondary hover-text-white border-0 text-decoration-none shadow-none d-none position-absolute top-50 end-0 translate-middle-y me-2" style="z-index: 10;" onclick="limpiarBuscador()" title="Borrar búsqueda">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="btn-group">
                    <button type="button" id="btn-orden-desc" class="btn btn-sm btn-success" onclick="ordenarBibliotecaAsincrona('desc')"><i class="bi bi-sort-down"></i> Más Recientes</button>
                    <button type="button" id="btn-orden-asc" class="btn btn-sm btn-outline-secondary text-white" onclick="ordenarBibliotecaAsincrona('asc')"><i class="bi bi-sort-up"></i> Más Antiguas</button>
                </div>
            </div>

            <div class="bg-dark border border-secondary rounded overflow-hidden">
                <div class="p-3 bg-black border-bottom border-secondary d-flex align-items-center justify-content-between">
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
                                <tr class="song-row target-row" 
                                    data-playlists="<?= htmlspecialchars($c['playlists_nombres']) ?>" 
                                    data-ruta="<?= $c['ruta_archivo'] ?>"
                                    data-titulo="<?= htmlspecialchars($c['titulo']) ?>"
                                    data-artista="<?= htmlspecialchars($c['artistas_nombres']) ?>"
                                    data-caratula="<?= $c['caratula'] ?>"
                                    data-fecha="<?= $c['fecha_subida'] ?>"
                                    onclick="reproducirDesdeFila(this)">
                                
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

                                    <td class="album-col d-none d-md-table-cell" onclick="event.stopPropagation();">
                
                                        <?php if ($c['album'] === 'Single / Sencillo'): ?>
                                        <a href="#" 
                                        onclick="document.getElementById('buscadorInput').value='Single'; filtrarBiblioteca(); return false;" 
                                        class="text-muted font-monospace small text-decoration-none hover-underline">
                                            Single
                                        </a>
                                        <?php else: ?>
                                            <a href="#" 
                                            onclick="document.getElementById('buscadorInput').value='<?= htmlspecialchars(addslashes($c['album']), ENT_QUOTES) ?>'; filtrarBiblioteca(); return false;" 
                                            class="text-secondary text-decoration-none hover-underline">
                                                <?= htmlspecialchars($c['album']) ?>
                                            </a>
                                        <?php endif; ?>
                                    </td>
                                    <td class="artist-col" onclick="event.stopPropagation();">
                                        <?php 
                                        $artistas_lista = explode(', ', $c['artistas_nombres'] ?? 'Artista Desconocido');
                                        foreach($artistas_lista as $i => $nom_art): 
                                        ?>
                                            <a href="#" 
                                            onclick="document.getElementById('buscadorInput').value='<?= htmlspecialchars(addslashes($nom_art)) ?>'; filtrarBiblioteca(); return false;" 
                                            class="text-info text-decoration-none hover-underline">
                                                <?= htmlspecialchars($nom_art) ?>
                                            </a><?= ($i < count($artistas_lista) - 1) ? '<span class="text-secondary">, </span>' : '' ?>
                                        <?php endforeach; ?>
                                    </td>
                        
                                    <td class="text-secondary font-monospace small d-none d-md-table-cell">
                                        <?php 
                                            $segundosTotales = $c['duracion'] ?? 0; 
                                            $minutos = floor($segundosTotales / 60);
                                            $segundos = $segundosTotales % 60;
                                            echo $minutos . ":" . sprintf('%02d', $segundos); 
                                        ?>
                                    </td>
                        
                                    <td onclick="event.stopPropagation();">
                                        <div class="dropdown">
                                            <button type="button" 
                                                    class="btn text-secondary border-0 p-1 shadow-none" 
                                                    data-bs-toggle="dropdown" 
                                                    style="background: none; line-height: 1;">
                                                <i class="bi bi-three-dots-vertical fs-5"></i>
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-end bg-dark border border-secondary border-opacity-20 shadow-lg p-1">
                                                <li>
                                                    <button type="button" class="dropdown-item text-white rounded small py-1.5" data-bs-toggle="modal" data-bs-target="#agregarAPlaylistModal" onclick="document.getElementById('id_cancion_playlist').value='<?= $c['id'] ?>'">
                                                        <i class="bi bi-plus-circle me-2 text-info"></i> Añadir a Playlist
                                                    </button>
                                                </li>
                                                <li>
                                                    <button type="button" class="dropdown-item text-white rounded small py-1.5" data-bs-toggle="modal" data-bs-target="#editCancionModal" 
                                                        onclick="
                                                            cargarModalCancion(<?= $c['id'] ?>, '<?= addslashes($c['titulo']) ?>', '<?= $c['album_id'] ?? '' ?>', <?= $c['duracion'] ?? 0 ?>, '<?= addslashes($c['ruta'] ?? '') ?>'); 
                                                            cargarEtiquetasEdicion('<?= $c['artistas_ids'] ?? '' ?>', '<?= addslashes($c['artistas_nombres'] ?? '') ?>');
                                                        ">
                                                        <i class="bi bi-pencil me-2 text-warning"></i> Editar detalles
                                                    </button>
                                                </li>
                                                <li>
                                                    <button type="button" class="dropdown-item text-white rounded small py-1.5" onclick="event.stopPropagation(); descargarCancionConMetadatos(this, '<?= htmlspecialchars($c['ruta_archivo']) ?>', '<?= addslashes($c['titulo']) ?>', '<?= addslashes($c['artistas_nombres'] ?? '') ?>', '<?= addslashes($c['titulo_album'] ?? 'Single') ?>')">
                                                        <i class="bi bi-download me-2 text-success"></i> <span class="texto-btn">Descargar pista</span>
                                                    </button>
                                                </li>
                                                <li><hr class="dropdown-divider border-secondary border-opacity-20 my-1"></li>
                                                <li>
                                                    <button type="button" class="dropdown-item text-danger rounded small py-1.5" onclick="eliminarElementoAsincrono('cancion', <?= $c['id'] ?>, this)">
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
                <nav>
                    <ul class="pagination pagination-sm mb-0" id="botones-paginacion">
                        </ul>
                </nav>
            </div>
        </div>
    </div>
    <div class="player-bar d-flex align-items-center justify-content-between">
        
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
    </div>

<div class="modal fade" id="artistaModal" tabindex="-1" aria-hidden="true">
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
                  <label class="form-label">
                      Foto de Perfil 
                      <span class="text-warning">(Opcional)</span>
                  </label>
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
      
      <form onsubmit="enviarFormularioAsincrono(event, 'api/insertar_elementos.php')">
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
                
          </div>
          
          <div class="modal-footer">
              <button type="submit" class="btn btn-primary fw-bold w-100">Subir Música</button>
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
                    <label class="form-label">
                        Reemplazar Foto <span class="text-warning">(Opcional)</span>
                    </label>
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
            <div class="toast-body d-flex align-items-center gap-2" id="backupToastMensaje">
                </div>
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
        <div class="text-success text-truncate fw-semibold" id="cola-now-title">
            -- — --
        </div>
    </div>

    <div class="p-2">
        <p class="text-white-50 small mb-2 ms-2 fw-bold text-uppercase" style="letter-spacing: 1px; font-size: 0.7rem;">A continuación</p>
        
        <ul class="list-group list-group-flush bg-transparent" id="lista-cola-dinamica">
            </ul>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/browser-id3-writer@4.4.0/dist/browser-id3-writer.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script src="js/reproductor.js"></script>
</body>
</html>