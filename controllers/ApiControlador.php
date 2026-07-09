<?php
// controllers/ApiControlador.php
require_once '../models/EditorBD.php';

class ApiControlador {
    private $db;
    
    public function __construct($pdo) { 
        $this->db = new EditorBD($pdo); 
    }

    private function subirArchivo($file, $carpeta, $prefijo, $exts_validas = null) {
        if (empty($file['name'])) return null;
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($exts_validas && !in_array($ext, $exts_validas)) throw new Exception("Formato inválido.");
        
        // Añadimos rand() para que los nombres de los archivos nunca choquen
        $nombre = $prefijo . '_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        $ruta = '../assets/uploads/' . $carpeta . '/' . $nombre;
        
        if (move_uploaded_file($file['tmp_name'], $ruta)) return 'assets/uploads/' . $carpeta . '/' . $nombre;
        throw new Exception("Error al subir archivo al servidor.");
    }

    private function descargarImagenDesdeUrl($url, $carpeta, $prefijo) {
        if (empty($url)) return null;
        
        $imgData = false;
        
        // Intento 1: cURL Seguro
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Evita error de certificados
            $imgData = @curl_exec($ch);
            curl_close($ch);
        }
        
        // Intento 2: Si cURL falla, usamos el lector de flujos de PHP
        if (!$imgData) {
            $opciones = ["ssl" => ["verify_peer" => false, "verify_peer_name" => false]];
            $contexto = stream_context_create($opciones);
            $imgData = @file_get_contents($url, false, $contexto);
        }
        
        if (!$imgData) throw new Exception("No se pudo descargar la imagen de Deezer.");
        
        $dir = '../assets/uploads/' . $carpeta;
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        
        $nombre = $prefijo . '_web_' . time() . '_' . rand(1000,9999) . '.jpg';
        $rutaFisica = $dir . '/' . $nombre;
        
        if (@file_put_contents($rutaFisica, $imgData) === false) {
            throw new Exception("Error de permisos: PHP no puede guardar en la carpeta '$carpeta'.");
        }
        
        return 'assets/uploads/' . $carpeta . '/' . $nombre;
    }

    private function borrarArchivoFisico($ruta) {
        if ($ruta && strpos($ruta, 'default.jpg') === false && file_exists('../' . $ruta)) {
            unlink('../' . $ruta);
        }
    }

    private function ejecutarYResponder($funcionSQL) {
        ob_start(); 
        try {
            $dataPayload = $funcionSQL();
            $basura = ob_get_clean();
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(["status" => "success", "data" => $dataPayload]);
            
        } catch (Throwable $e) { // <--- LA MAGIA ESTÁ AQUÍ (Atrapa Fatal Errors)
            $basura = ob_get_clean();
            header('Content-Type: application/json; charset=utf-8');
            $mensaje = $e->getMessage() . ($basura ? " (PHP: " . strip_tags($basura) . ")" : "");
            echo json_encode(["status" => "error", "message" => $mensaje]);
        }
        exit;
    }

    private function peticionGet($url) {

    if (!function_exists('curl_init')) {
        throw new Exception("La extensión cURL no está habilitada en PHP.");
    }

    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0'
    ]);

    $respuesta = curl_exec($ch);

    if ($respuesta === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception("cURL: ".$error);
    }

    $codigo = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($codigo != 200) {
        throw new Exception("Deezer respondió HTTP ".$codigo);
    }

    return $respuesta;
}

    // ================= MOTOR AUTOMÁTICO EXCLUSIVO DE DEEZER =================
    private function buscarCaratulaEnDeezer($titulo, $artistas, $entidad = 'track') {
        $titulo_limpio = trim(preg_replace('/\(.*?\)|\[.*?\]|- .*/', '', $titulo));
        $artista_limpio = trim(explode(',', $artistas)[0]); 

        if ($entidad === 'artist') {
            $query = urlencode($titulo_limpio);
            $url = "https://api.deezer.com/search/artist?q={$query}&limit=1";
        } elseif ($entidad === 'album') {
            $query = urlencode('album:"' . $titulo_limpio . '" artist:"' . $artista_limpio . '"');
            $url = "https://api.deezer.com/search/album?q={$query}&limit=1";
        } else {
            $query = urlencode('track:"' . $titulo_limpio . '" artist:"' . $artista_limpio . '"');
            $url = "https://api.deezer.com/search/track?q={$query}&limit=1";
        }

        $res = $this->peticionGet($url);
        $data = json_decode($res, true);

        // Plan B: Si no encuentra cruzado, busca solo por título
        if (empty($data['data']) && $entidad !== 'artist') {
            $query = urlencode($titulo_limpio);
            $urlFallback = "https://api.deezer.com/search/{$entidad}?q={$query}&limit=1";
            $res = $this->peticionGet($urlFallback);
            $data = json_decode($res, true);
        }

        if (!empty($data['data'])) {
            if ($entidad === 'artist' && isset($data['data'][0]['picture_xl'])) {
                return $this->descargarImagenDesdeUrl($data['data'][0]['picture_xl'], 'artistas', 'art');
            } elseif ($entidad === 'album' && isset($data['data'][0]['cover_xl'])) {
                return $this->descargarImagenDesdeUrl($data['data'][0]['cover_xl'], 'caratulas', 'cov');
            } elseif ($entidad === 'track' && isset($data['data'][0]['album']['cover_xl'])) {
                return $this->descargarImagenDesdeUrl($data['data'][0]['album']['cover_xl'], 'caratulas', 'cov');
            }
        }
        return null;
    }

    public function insertar($post, $files) {
        $this->ejecutarYResponder(function() use ($post, $files) {
            $acc = $post['accion'] ?? '';
            
            if ($acc === 'crear_artista') {
                // 1. INYECTAR LA VALIDACIÓN AQUÍ
                $this->db->validarArtistaUnico($post['nombre']);

                $foto = null;
                if (!empty($files['foto']['name'])) $foto = $this->subirArchivo($files['foto'], 'artistas', 'art');
                elseif (!empty($post['url_imagen_online'])) $foto = $this->descargarImagenDesdeUrl($post['url_imagen_online'], 'artistas', 'art');
                else $foto = $this->buscarCaratulaEnDeezer($post['nombre'], '', 'artist');
                
                return $this->db->crearArtista($post['nombre'], $foto ?? 'assets/uploads/artistas/default.jpg');
            
            } elseif ($acc === 'crear_album') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                $cover = null;
                
                if (!empty($files['caratula']['name'])) $cover = $this->subirArchivo($files['caratula'], 'caratulas', 'cov');
                elseif (!empty($post['url_imagen_online'])) $cover = $this->descargarImagenDesdeUrl($post['url_imagen_online'], 'caratulas', 'cov');
                else {
                    $nombres_artistas = $this->db->obtenerNombresArtistasPorIds($post['artista_ids']);
                    $cover = $this->buscarCaratulaEnDeezer($post['titulo'], $nombres_artistas, 'album');
                }
                
                return $this->db->crearAlbum($post['titulo'], $post['anio'] ?: null, $cover ?? 'assets/uploads/caratulas/default.jpg', $post['artista_ids']);
            
            } elseif ($acc === 'crear_playlist') {
                $cover = $this->subirArchivo($files['caratula'] ?? null, 'caratulas', 'pl') ?? 'assets/uploads/caratulas/default.jpg';
                return $this->db->crearPlaylist($post['nombre'], $post['descripcion'], $cover);
            
            } elseif ($acc === 'subir_cancion') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                if (empty($files['archivo_mp3']['name'])) throw new Exception("Falta archivo MP3.");
                $ruta = $this->subirArchivo($files['archivo_mp3'], 'musica', 'trk', ['mp3']);
                
                $caratula_cancion = null;
                if (empty($post['album_id'])) {
                    $nombres_artistas = $this->db->obtenerNombresArtistasPorIds($post['artista_ids']);
                    $caratula_cancion = $this->buscarCaratulaEnDeezer($post['titulo'], $nombres_artistas, 'track');
                }
                
                return $this->db->subirCancion($post['titulo'], $post['album_id'] ?: null, $ruta, $post['duracion'] ?? 0, $post['artista_ids'], $caratula_cancion);
            
            } elseif ($acc === 'agregar_a_playlist') {
                return $this->db->agregarAPlaylist($post['playlist_id'], $post['cancion_id']);
            
            } elseif ($acc === 'obtener_sencillos_sin_portada') {
                return $this->db->obtenerCancionesSinCaratula();
                
            } elseif ($acc === 'procesar_portada_individual') {
                $id = intval($post['cancion_id']);
                $titulo = $post['titulo'];
                $art_ids = $post['artista_ids'];
                $nombres = $this->db->obtenerNombresArtistasPorIds(explode(',', $art_ids));
                
                $ruta_img = $this->buscarCaratulaEnDeezer($titulo, $nombres, 'track');
                if ($ruta_img) {
                    $this->db->actualizarCaratulaCancion($id, $ruta_img);
                    return ["actualizada" => true, "ruta" => $ruta_img];
                }
                return ["actualizada" => false];
                
            // === ENDPOINT: BUSCADOR WEB MANUAL EXACTO (DEEZER) ===
            } elseif ($acc === 'buscar_opciones_portada') {
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
                    if ($artista) $query = urlencode('album:"' . $titulo . '" artist:"' . $artista . '"');
                    else $query = urlencode($titulo);
                    $url = "https://api.deezer.com/search/album?q={$query}&limit={$limit}&index={$offset}";
                } else {
                    if ($artista) $query = urlencode('track:"' . $titulo . '" artist:"' . $artista . '"');
                    else $query = urlencode($titulo);
                    $url = "https://api.deezer.com/search/track?q={$query}&limit={$limit}&index={$offset}";
                }

                $res = $this->peticionGet($url);
                $data = json_decode($res, true);
                $resultados = [];

                if (!empty($data['data'])) {
                    foreach($data['data'] as $item) {
                        if ($tipo === 'artista' && isset($item['picture_xl'])) {
                            $resultados[] = $item['picture_xl'];
                        } elseif ($tipo === 'album' && isset($item['cover_xl'])) {
                            $resultados[] = $item['cover_xl'];
                        } elseif ($tipo === 'cancion' && isset($item['album']['cover_xl'])) {
                            $resultados[] = $item['album']['cover_xl'];
                        }
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
                // 1. INYECTAR LA VALIDACIÓN AQUÍ (Pasando el $id para que ignore su propio nombre)
                $this->db->validarArtistaUnico($post['nombre'], $id);

                $foto = null;
                if (!empty($files['foto']['name'])) $foto = $this->subirArchivo($files['foto'], 'artistas', 'art');
                elseif (!empty($post['url_imagen_online'])) $foto = $this->descargarImagenDesdeUrl($post['url_imagen_online'], 'artistas', 'art');
                
                return $this->db->editarArtista($id, $post['nombre'], $foto);
                
            } elseif ($acc === 'editar_album') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                $cover = null;
                if (!empty($files['caratula']['name'])) $cover = $this->subirArchivo($files['caratula'], 'caratulas', 'cov');
                elseif (!empty($post['url_imagen_online'])) $cover = $this->descargarImagenDesdeUrl($post['url_imagen_online'], 'caratulas', 'cov');
                return $this->db->editarAlbum($id, $post['titulo'], $post['anio'] ?: null, $cover, $post['artista_ids']);
                
            } elseif ($acc === 'editar_cancion') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                $ruta = $this->subirArchivo($files['archivo_mp3'] ?? null, 'musica', 'trk', ['mp3']);
                if ($ruta) $this->borrarArchivoFisico($post['ruta_actual'] ?? '');
                
                $caratula_nueva = null;
                if (!empty($files['caratula']['name'])) $caratula_nueva = $this->subirArchivo($files['caratula'], 'caratulas', 'cov');
                elseif (!empty($post['url_imagen_online'])) $caratula_nueva = $this->descargarImagenDesdeUrl($post['url_imagen_online'], 'caratulas', 'cov');
                
                $this->db->editarCancion($id, $post['titulo'], $post['album_id'] ?: null, $ruta, $post['duracion'] ?? 0, $post['artista_ids']);
                
                if ($caratula_nueva) {
                    $this->db->actualizarCaratulaCancion($id, $caratula_nueva);
                }
                return $this->db->obtenerDetallesCancion($id);
                
            } elseif ($acc === 'editar_playlist') {
                $cover = $this->subirArchivo($files['caratula'] ?? null, 'caratulas', 'pl');
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
        // ... (Tu código de backup original se mantiene igual)
    }
}