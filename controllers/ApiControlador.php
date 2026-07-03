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
        
        $nombre = $prefijo . '_' . time() . '.' . $ext;
        $ruta = '../assets/uploads/' . $carpeta . '/' . $nombre;
        
        if (move_uploaded_file($file['tmp_name'], $ruta)) return 'assets/uploads/' . $carpeta . '/' . $nombre;
        throw new Exception("Error al subir archivo al servidor.");
    }

    private function borrarArchivoFisico($ruta) {
        if ($ruta && strpos($ruta, 'default.jpg') === false && file_exists('../' . $ruta)) {
            unlink('../' . $ruta);
        }
    }

    private function ejecutarYResponder($funcionSQL) {
        try {
            $dataPayload = $funcionSQL();
            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $dataPayload]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // ================= MOTOR UNIVERSAL DE ITUNES =================
    private function hacerPeticionItunes($termino, $entidad = 'song', $prefijo_archivo = 'cov') {
        $url = "https://itunes.apple.com/search?term={$termino}&media=music&entity={$entidad}&limit=1";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_USERAGENT, 'NebulaPlayer/1.0'); 
        $response = curl_exec($ch);
        curl_close($ch);
        
        if ($response) {
            $data = json_decode($response, true);
            if (!empty($data['results']) && isset($data['results'][0]['artworkUrl100'])) {
                // Forzar resolución a 600x600 px nativos de Apple
                $imgUrl = str_replace('100x100bb', '600x600bb', $data['results'][0]['artworkUrl100']);
                
                $imgData = @file_get_contents($imgUrl);
                if ($imgData) {
                    $carpeta = ($prefijo_archivo === 'art') ? 'artistas' : 'caratulas';
                    if (!is_dir('../assets/uploads/' . $carpeta)) mkdir('../assets/uploads/' . $carpeta, 0777, true);
                    $nombre = $prefijo_archivo . '_auto_' . time() . '_' . rand(1000,9999) . '.jpg';
                    $ruta = '../assets/uploads/' . $carpeta . '/' . $nombre;
                    file_put_contents($ruta, $imgData);
                    return 'assets/uploads/' . $carpeta . '/' . $nombre;
                }
            }
        }
        return null;
    }

    private function buscarCaratulaEnItunes($titulo, $artistas) {
        $titulo_limpio = trim(preg_replace('/\(.*?\)|\[.*?\]|- .*/', '', $titulo));
        $termino_completo = urlencode($titulo_limpio . ' ' . str_replace(',', ' ', $artistas));
        $ruta = $this->hacerPeticionItunes($termino_completo, 'song', 'cov');
        if ($ruta) return $ruta;

        // Plan B para canciones
        $termino_corto = urlencode($titulo_limpio);
        return $this->hacerPeticionItunes($termino_corto, 'song', 'cov');
    }

    private function buscarCaratulaAlbumEnItunes($titulo_album, $artistas) {
        $titulo_limpio = trim(preg_replace('/\(.*?\)|\[.*?\]|- .*/', '', $titulo_album));
        $termino_completo = urlencode($titulo_limpio . ' ' . str_replace(',', ' ', $artistas));
        $ruta = $this->hacerPeticionItunes($termino_completo, 'album', 'cov');
        if ($ruta) return $ruta;

        // Plan B para álbumes
        $termino_corto = urlencode($titulo_limpio);
        return $this->hacerPeticionItunes($termino_corto, 'album', 'cov');
    }

    private function buscarFotoArtistaEnItunes($nombre_artista) {
        $termino = urlencode(trim($nombre_artista));
        return $this->hacerPeticionItunes($termino, 'album', 'art');
    }

    public function insertar($post, $files) {
        $this->ejecutarYResponder(function() use ($post, $files) {
            $acc = $post['accion'] ?? '';
            
            if ($acc === 'crear_artista') {
                $foto = null;
                if (!empty($files['foto']['name'])) {
                    $foto = $this->subirArchivo($files['foto'], 'artistas', 'art');
                } else {
                    $foto = $this->buscarFotoArtistaEnItunes($post['nombre']);
                }
                $foto = $foto ?? 'assets/uploads/artistas/default.jpg';
                return $this->db->crearArtista($post['nombre'], $foto);
            
            } elseif ($acc === 'crear_album') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                
                $cover = null;
                if (!empty($files['caratula']['name'])) {
                    $cover = $this->subirArchivo($files['caratula'], 'caratulas', 'cov');
                } else {
                    // CORRECCIÓN: Los artistas ya vienen como arreglo desde el formulario
                    $nombres_artistas = $this->db->obtenerNombresArtistasPorIds($post['artista_ids']);
                    $cover = $this->buscarCaratulaAlbumEnItunes($post['titulo'], $nombres_artistas);
                }
                $cover = $cover ?? 'assets/uploads/caratulas/default.jpg';
                
                return $this->db->crearAlbum($post['titulo'], $post['anio'] ?: null, $cover, $post['artista_ids']);
            
            } elseif ($acc === 'crear_playlist') {
                $cover = $this->subirArchivo($files['caratula'] ?? null, 'caratulas', 'pl') ?? 'assets/uploads/caratulas/default.jpg';
                return $this->db->crearPlaylist($post['nombre'], $post['descripcion'], $cover);
            
            } elseif ($acc === 'subir_cancion') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                if (empty($files['archivo_mp3']['name'])) throw new Exception("Falta archivo MP3.");
                $ruta = $this->subirArchivo($files['archivo_mp3'], 'musica', 'trk', ['mp3']);
                
                $caratula_cancion = null;
                if (empty($post['album_id'])) {
                    // CORRECCIÓN: Evitamos el 'explode' que rompía el PHP
                    $nombres_artistas = $this->db->obtenerNombresArtistasPorIds($post['artista_ids']);
                    $caratula_cancion = $this->buscarCaratulaEnItunes($post['titulo'], $nombres_artistas);
                }
                
                return $this->db->subirCancion($post['titulo'], $post['album_id'] ?: null, $ruta, $post['duracion'] ?? 0, $post['artista_ids'], $caratula_cancion);
            
            } elseif ($acc === 'agregar_a_playlist') {
                return $this->db->agregarAPlaylist($post['playlist_id'], $post['cancion_id']);
            
            } elseif ($acc === 'obtener_sencillos_sin_portada') {
                return $this->db->obtenerCancionesSinCaratula();
                
            } elseif ($acc === 'procesar_portada_individual') {
                $id = intval($post['cancion_id']);
                $titulo = $post['titulo'];
                $art_ids = $post['artista_ids']; // Aquí sí llega como string de la base de datos
                $nombres = $this->db->obtenerNombresArtistasPorIds(explode(',', $art_ids));
                
                $ruta_img = $this->buscarCaratulaEnItunes($titulo, $nombres);
                
                if ($ruta_img) {
                    $this->db->actualizarCaratulaCancion($id, $ruta_img);
                    return ["actualizada" => true, "ruta" => $ruta_img];
                }
                return ["actualizada" => false];
            }
        });
    }

    public function editar($post, $files) {
        $this->ejecutarYResponder(function() use ($post, $files) {
            $acc = $post['accion'] ?? '';
            $id = intval($post['id']);
            
            if ($acc === 'editar_artista') {
                $foto = $this->subirArchivo($files['foto'] ?? null, 'artistas', 'art');
                return $this->db->editarArtista($id, $post['nombre'], $foto);
            } elseif ($acc === 'editar_album') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                $cover = $this->subirArchivo($files['caratula'] ?? null, 'caratulas', 'cov');
                return $this->db->editarAlbum($id, $post['titulo'], $post['anio'] ?: null, $cover, $post['artista_ids']);
            } elseif ($acc === 'editar_playlist') {
                $cover = $this->subirArchivo($files['caratula'] ?? null, 'caratulas', 'pl');
                return $this->db->editarPlaylist($id, $post['nombre'], $post['descripcion'], $cover);
            } elseif ($acc === 'editar_cancion') {
                if (empty($post['artista_ids'])) throw new Exception("Faltan artistas");
                $ruta = $this->subirArchivo($files['archivo_mp3'] ?? null, 'musica', 'trk', ['mp3']);
                if ($ruta) $this->borrarArchivoFisico($post['ruta_actual'] ?? '');
                return $this->db->editarCancion($id, $post['titulo'], $post['album_id'] ?: null, $ruta, $post['duracion'] ?? 0, $post['artista_ids']);
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
        $accion = $post['accion'] ?? $get['accion'] ?? '';
        $archivo_estado = '../backups/estado.json';
        $archivo_zip = '../backups/NebulaPlayer_Backup.zip';
        $archivo_db = '../backups/configuracion_y_datos.json';

        try {
            switch ($accion) {
                case 'estado':
                    if (file_exists($archivo_estado)) echo file_get_contents($archivo_estado);
                    else echo json_encode(["estado" => "inactivo"]);
                    exit;

                case 'limpiar':
                    if (file_exists($archivo_estado)) unlink($archivo_estado);
                    echo json_encode(["status" => "limpiado"]);
                    exit;

                case 'iniciar':
                    ignore_user_abort(true);
                    set_time_limit(0); 
                    ini_set('memory_limit', '512M'); 
                    file_put_contents($archivo_estado, json_encode(["estado" => "procesando"]));
                    $db_data = $this->db->exportarBaseDatos();
                    file_put_contents($archivo_db, json_encode($db_data, JSON_PRETTY_PRINT));

                    $zip = new ZipArchive();
                    if ($zip->open($archivo_zip, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
                        $zip->addFile($archivo_db, 'configuracion_y_datos.json');
                        $dir_uploads = '../assets/uploads'; 
                        if (is_dir($dir_uploads)) {
                            $archivos = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir_uploads), RecursiveIteratorIterator::LEAVES_ONLY);
                            foreach ($archivos as $name => $file) {
                                if (!$file->isDir()) {
                                    $ruta_fisica = $file->getRealPath();
                                    $ruta_relativa = 'assets/uploads/' . substr($ruta_fisica, strlen(realpath($dir_uploads)) + 1);
                                    $zip->addFile($ruta_fisica, str_replace('\\', '/', $ruta_relativa));
                                }
                            }
                        }
                        $zip->close();
                    } else {
                        throw new Exception("No se pudo crear el archivo ZIP.");
                    }

                    if (file_exists($archivo_db)) unlink($archivo_db);
                    file_put_contents($archivo_estado, json_encode([
                        "estado" => "completado",
                        "archivo" => "backups/NebulaPlayer_Backup.zip"
                    ]));
                    exit;
            }
        } catch (Exception $e) {
            file_put_contents($archivo_estado, json_encode(["estado" => "error", "mensaje" => $e->getMessage()]));
            exit;
        }
    }
}