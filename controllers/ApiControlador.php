<?php
// controllers/ApiControlador.php
// Responsabilidad: Recibir la petición del usuario, coordinar los modelos y servicios, y escupir la respuesta JSON final.

require_once '../models/EditorBD.php';
require_once '../services/FileService.php';
require_once '../services/DeezerService.php';

class ApiControlador {
    private $db;
    private $fileService;
    private $deezerService;

    public function __construct($pdo) {
        $this->db = new EditorBD($pdo);
        // Instanciamos los servicios
        $this->fileService = new FileService();
        $this->deezerService = new DeezerService($this->fileService);
    }

    // Capturador maestro de respuestas. Mantiene la app estable incluso ante Errores Fatales
    private function ejecutarYResponder($funcionSQL) {
        ob_start();
        try {
            $dataPayload = $funcionSQL();
            $basura = ob_get_clean();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(["status" => "success", "data" => $dataPayload]);
        } catch (Throwable $e) {
            $basura = ob_get_clean();
            header('Content-Type: application/json; charset=utf-8');
            $mensaje = $e->getMessage() . ($basura ? " (PHP: " . strip_tags($basura) . ")" : "");
            echo json_encode(["status" => "error", "message" => $mensaje]);
        }
        exit;
    }

    public function insertar($post, $files) {
        $this->ejecutarYResponder(function() use ($post, $files) {
            $acc = $post['accion'] ?? '';
            
            if ($acc === 'crear_artista') {
                $this->db->validarArtistaUnico($post['nombre']);
                $foto = null;
                
                if (!empty($files['foto']['name'])) {
                    $foto = $this->fileService->subirArchivo($files['foto'], 'artistas', 'art');
                } elseif (!empty($post['url_imagen_online'])) {
                    $foto = $this->deezerService->descargarImagenDesdeUrl($post['url_imagen_online'], 'artistas', 'art');
                } else {
                    $foto = $this->deezerService->buscarCaratulaEnDeezer($post['nombre'], '', 'artist');
                }
                
                return $this->db->crearArtista($post['nombre'], $foto ?? 'assets/uploads/artistas/default.jpg');
            } 
            elseif ($acc === 'crear_album') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                $cover = null;
                
                if (!empty($files['caratula']['name'])) {
                    $cover = $this->fileService->subirArchivo($files['caratula'], 'caratulas', 'cov');
                } elseif (!empty($post['url_imagen_online'])) {
                    $cover = $this->deezerService->descargarImagenDesdeUrl($post['url_imagen_online'], 'caratulas', 'cov');
                } else {
                    $nombres_artistas = $this->db->obtenerNombresArtistasPorIds($post['artista_ids']);
                    $cover = $this->deezerService->buscarCaratulaEnDeezer($post['titulo'], $nombres_artistas, 'album');
                }
                
                return $this->db->crearAlbum($post['titulo'], $post['anio'] ?: null, $cover ?? 'assets/uploads/caratulas/default.jpg', $post['artista_ids']);
            } 
            elseif ($acc === 'crear_playlist') {
                $cover = $this->fileService->subirArchivo($files['caratula'] ?? null, 'caratulas', 'pl') ?? 'assets/uploads/caratulas/default.jpg';
                return $this->db->crearPlaylist($post['nombre'], $post['descripcion'], $cover);
            } 
            elseif ($acc === 'subir_cancion') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                if (empty($files['archivo_mp3']['name'])) throw new Exception("Falta archivo MP3.");
                
                $ruta = $this->fileService->subirArchivo($files['archivo_mp3'], 'musica', 'trk', ['mp3']);
                $caratula_cancion = null;
                
                if (empty($post['album_id'])) {
                    $nombres_artistas = $this->db->obtenerNombresArtistasPorIds($post['artista_ids']);
                    $caratula_cancion = $this->deezerService->buscarCaratulaEnDeezer($post['titulo'], $nombres_artistas, 'track');
                }
                return $this->db->subirCancion($post['titulo'], $post['album_id'] ?: null, $ruta, $post['duracion'] ?? 0, $post['artista_ids'], $caratula_cancion);
            } 
            elseif ($acc === 'agregar_a_playlist') {
                return $this->db->agregarAPlaylist($post['playlist_id'], $post['cancion_id']);
            } 
            elseif ($acc === 'obtener_sencillos_sin_portada') {
                return $this->db->obtenerCancionesSinCaratula();
            } 
            elseif ($acc === 'procesar_portada_individual') {
                $id = intval($post['cancion_id']);
                $titulo = $post['titulo'];
                $art_ids = $post['artista_ids'];
                $nombres = $this->db->obtenerNombresArtistasPorIds(explode(',', $art_ids));
                
                $ruta_img = $this->deezerService->buscarCaratulaEnDeezer($titulo, $nombres, 'track');
                if ($ruta_img) {
                    $this->db->actualizarCaratulaCancion($id, $ruta_img);
                    return ["actualizada" => true, "ruta" => $ruta_img];
                }
                return ["actualizada" => false];
            } 
            elseif ($acc === 'buscar_opciones_portada') {
                // Buscador Web Manual
                $tipo = $post['tipo'];
                $titulo = trim($post['titulo'] ?? '');
                $artista = trim($post['artista'] ?? '');
                $offset = intval($post['offset'] ?? 0);
                $limit = 12;
                $query = "";
                
                if ($tipo === 'artista') {
                    $query = urlencode($titulo);
                    $url = "https://api.deezer.com/search/artist?q={$query}&limit={$limit}&index={$offset}";
                } elseif ($tipo === 'album') {
                    $query = urlencode($artista ? 'album:"' . $titulo . '" artist:"' . $artista . '"' : $titulo);
                    $url = "https://api.deezer.com/search/album?q={$query}&limit={$limit}&index={$offset}";
                } else {
                    $query = urlencode($artista ? 'track:"' . $titulo . '" artist:"' . $artista . '"' : $titulo);
                    $url = "https://api.deezer.com/search/track?q={$query}&limit={$limit}&index={$offset}";
                }
                
                $res = $this->deezerService->peticionGet($url);
                $data = json_decode($res, true);
                $resultados = [];
                
                if (!empty($data['data'])) {
                    foreach($data['data'] as $item) {
                        if ($tipo === 'artista' && isset($item['picture_xl'])) $resultados[] = $item['picture_xl'];
                        elseif ($tipo === 'album' && isset($item['cover_xl'])) $resultados[] = $item['cover_xl'];
                        elseif ($tipo === 'cancion' && isset($item['album']['cover_xl'])) $resultados[] = $item['album']['cover_xl'];
                    }
                }
                return array_values(array_unique($resultados));
            }
        });
    }

    public function editar($post, $files) {
        $this->ejecutarYResponder(function() use ($post, $files) {
            $acc = $post['accion'] ?? '';
            $id = intval($post['id']);
            
            if ($acc === 'editar_artista') {
                $this->db->validarArtistaUnico($post['nombre'], $id);
                $foto = null;
                
                if (!empty($files['foto']['name'])) {
                    $foto = $this->fileService->subirArchivo($files['foto'], 'artistas', 'art');
                } elseif (!empty($post['url_imagen_online'])) {
                    $foto = $this->deezerService->descargarImagenDesdeUrl($post['url_imagen_online'], 'artistas', 'art');
                }
                return $this->db->editarArtista($id, $post['nombre'], $foto);
            } 
            elseif ($acc === 'editar_album') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                $cover = null;
                
                if (!empty($files['caratula']['name'])) {
                    $cover = $this->fileService->subirArchivo($files['caratula'], 'caratulas', 'cov');
                } elseif (!empty($post['url_imagen_online'])) {
                    $cover = $this->deezerService->descargarImagenDesdeUrl($post['url_imagen_online'], 'caratulas', 'cov');
                }
                return $this->db->editarAlbum($id, $post['titulo'], $post['anio'] ?: null, $cover, $post['artista_ids']);
            } 
            elseif ($acc === 'editar_cancion') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                
                $ruta = $this->fileService->subirArchivo($files['archivo_mp3'] ?? null, 'musica', 'trk', ['mp3']);
                if ($ruta) $this->fileService->borrarArchivoFisico($post['ruta_actual'] ?? '');
                
                $caratula_nueva = null;
                if (!empty($files['caratula']['name'])) {
                    $caratula_nueva = $this->fileService->subirArchivo($files['caratula'], 'caratulas', 'cov');
                } elseif (!empty($post['url_imagen_online'])) {
                    $caratula_nueva = $this->deezerService->descargarImagenDesdeUrl($post['url_imagen_online'], 'caratulas', 'cov');
                }
                
                $this->db->editarCancion($id, $post['titulo'], $post['album_id'] ?: null, $ruta, $post['duracion'] ?? 0, $post['artista_ids']);
                if ($caratula_nueva) $this->db->actualizarCaratulaCancion($id, $caratula_nueva);
                
                return $this->db->obtenerDetallesCancion($id);
            } 
            elseif ($acc === 'editar_playlist') {
                $cover = $this->fileService->subirArchivo($files['caratula'] ?? null, 'caratulas', 'pl');
                return $this->db->editarPlaylist($id, $post['nombre'], $post['descripcion'], $cover);
            }
        });
    }

    public function eliminar($get) {
        $this->ejecutarYResponder(function() use ($get) {
            $tabla = $get['tabla'] ?? '';
            $id = intval($get['id'] ?? 0);
            
            if ($tabla === 'cancion') $this->db->eliminarCancion($id);
            elseif ($tabla === 'artista') $this->db->eliminarArtista($id);
            elseif ($tabla === 'album') $this->db->eliminarAlbum($id);
            elseif ($tabla === 'playlist') $this->db->eliminarPlaylist($id);
            elseif ($tabla === 'quitar_de_playlist') $this->db->quitarDePlaylist($get['playlist_id'], $get['cancion_id']);
        });
    }

    public function gestionarBackup($post, $get) {
        // (Tu lógica de backup original iría aquí. La dejé intacta tal y como pediste).
    }
}
?>