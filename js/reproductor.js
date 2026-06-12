// reproductor.js - Motor Interactivo de NebulaPlayer

const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const progressBar = document.getElementById('progress-bar');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const shuffleBtn = document.getElementById('shuffle-btn');

let listaDeReproduccion = [];
let indiceActual = -1;
let modoAleatorio = false;
let filtroPlaylistActivo = "";
let cancionesEscuchadas = [];
let isRepeatActive = false; 

// ==========================================
// VARIABLES DE PAGINACIÓN (NUEVO)
// ==========================================
let paginaActual = 1;
const cancionesPorPagina = 20;
let filasFiltradasGlobal = []; 

// Se actualiza para que la cola tenga TODAS las canciones filtradas, no solo las 15 visibles
function actualizarColaReproduccion() {
    listaDeReproduccion = [];
    filasFiltradasGlobal.forEach((fila) => {
        listaDeReproduccion.push({
            ruta: fila.getAttribute('data-ruta'),
            titulo: fila.getAttribute('data-titulo'),
            artista: fila.getAttribute('data-artista'),
            caratula: fila.getAttribute('data-caratula')
        });
    });
}

function reproducirDesdeFila(elementoFila) {
    actualizarColaReproduccion();
    const rutaBusca = elementoFila.getAttribute('data-ruta');
    indiceActual = listaDeReproduccion.findIndex(cancion => cancion.ruta === rutaBusca);
    
    if (indiceActual !== -1) {
        // ¡CRUCIAL! Si le dio clic a una canción y el aleatorio está prendido, barajamos el resto
        if (modoAleatorio) mezclarColaActual();
        
        const track = listaDeReproduccion[indiceActual];
        reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
    }
}

function reproducirCancion(ruta, titulo, artist, caratula) {
    // [NUEVO] Guardar la canción actual en la memoria del navegador
    localStorage.setItem('nebula_track_ruta', ruta);
    localStorage.setItem('nebula_track_titulo', titulo);
    localStorage.setItem('nebula_track_artista', artist);
    localStorage.setItem('nebula_track_caratula', caratula);

    audio.src = ruta;
    window.rutaEnReproduccion = ruta; // Guardamos esto para el rastreador
    document.getElementById('current-title').innerText = titulo;
    document.getElementById('current-artist').innerText = artist;
    
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

    const filas = document.querySelectorAll('.target-row');
    filas.forEach(fila => {
        fila.classList.remove('bg-dark-subtle', 'border-start', 'border-danger');
        const textoTitulo = fila.querySelector('.title-col span');
        if (textoTitulo) textoTitulo.classList.remove('text-success');
    });

    const filaActiva = Array.from(filas).find(fila => fila.getAttribute('data-ruta') === ruta);
    if (filaActiva) {
        filaActiva.classList.add('bg-dark-subtle', 'border-start', 'border-danger');
        const textoTituloActivo = filaActiva.querySelector('.title-col span');
        if (textoTituloActivo) textoTituloActivo.classList.add('text-success');
    }

    audio.play();
    playBtn.innerHTML = '<i class="bi bi-pause-fill fs-3 text-black"></i>';
    if (document.getElementById('colaPanel').classList.contains('activo')) {
        renderizarColaVisual();
    }

    // [NUEVO] Actualizar la pantalla de bloqueo y dispositivos nativos
    actualizarPantallaBloqueo(titulo, artist, 'NebulaPlayer', caratula);
}

function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="bi bi-pause-fill fs-3 text-black"></i>';
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="bi bi-play-fill fs-3 text-black"></i>';
    }
}

function siguienteCancion() {
    if (listaDeReproduccion.length === 0) actualizarColaReproduccion();
    if (listaDeReproduccion.length === 0) return;

    // Ya no tiramos dados matemáticos. Solo avanzamos 1 paso en nuestra cola ordenada o barajada
    indiceActual++;
    
    if (indiceActual >= listaDeReproduccion.length) {
        indiceActual = 0; // Si llegamos al final, volvemos a la número 1
    }

    const track = listaDeReproduccion[indiceActual];
    reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
}

function cancionAnterior() {
    if (listaDeReproduccion.length === 0) actualizarColaReproduccion();
    if (listaDeReproduccion.length === 0) return;

    // Solo retrocedemos 1 paso
    indiceActual--;
    if (indiceActual < 0) indiceActual = listaDeReproduccion.length - 1;

    const track = listaDeReproduccion[indiceActual];
    reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
}

// ==========================================
// NUEVO: MEZCLADOR FÍSICO DE COLA
// ==========================================
function mezclarColaActual() {
    // Mezclamos todas las canciones que están después de la que está sonando ahora
    const inicio = indiceActual + 1;
    for (let i = listaDeReproduccion.length - 1; i > inicio; i--) {
        const j = Math.floor(Math.random() * (i - inicio + 1)) + inicio;
        // Intercambiamos posiciones
        [listaDeReproduccion[i], listaDeReproduccion[j]] = [listaDeReproduccion[j], listaDeReproduccion[i]];
    }
}

function toggleShuffle() {
    modoAleatorio = !modoAleatorio;
    if (modoAleatorio) {
        shuffleBtn.className = "btn text-success fs-5 p-0 lh-1";
        if (indiceActual !== -1) {
            mezclarColaActual(); // Barajamos físicamente
            if (document.getElementById('colaPanel').classList.contains('activo')) renderizarColaVisual();
        }
    } else {
        shuffleBtn.className = "btn text-secondary fs-5 p-0 lh-1";
        if (indiceActual !== -1) {
            // Restauramos el orden original de la biblioteca
            const rutaActual = listaDeReproduccion[indiceActual].ruta;
            actualizarColaReproduccion(); 
            indiceActual = listaDeReproduccion.findIndex(c => c.ruta === rutaActual);
            if (document.getElementById('colaPanel').classList.contains('activo')) renderizarColaVisual();
        }
    }
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const porcentaje = (audio.currentTime / audio.duration) * 100;
        progressBar.value = porcentaje;
        timeCurrent.innerText = formatearTiempo(audio.currentTime);

        // [NUEVO] Guardar el segundo exacto de la canción
        localStorage.setItem('nebula_track_tiempo', audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    timeTotal.innerText = formatearTiempo(audio.duration);
});

audio.onended = function() { 
    if (window.modoRepetirActivo === true) {
        audio.currentTime = 0;
        audio.play();
    } else {
        siguienteCancion(); 
    }
};

function ajustarTiempo(valorPorcentaje) {
    if (!audio.duration) return;
    audio.currentTime = (valorPorcentaje / 100) * audio.duration;
}

function formatearTiempo(segundos) {
    if (isNaN(segundos)) return "0:00";
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
}

function togglePanelCola() {
    const panel = document.getElementById('colaPanel');
    const botonCola = document.getElementById('btn-abrir-cola');
    panel.classList.toggle('activo');
    if (panel.classList.contains('activo')) {
        botonCola.className = "btn text-success p-0 fs-5 lh-1";
        renderizarColaVisual();
        
        // ¡Encendemos el Drag & Drop aquí!
        inicializarDragAndDropCola(); 
    } else {
        botonCola.className = "btn text-secondary p-0 fs-5 lh-1";
    }
}

function renderizarColaVisual() {
    const ahoraTitulo = document.getElementById('current-title').innerText;
    const ahoraArtista = document.getElementById('current-artist').innerText;
    document.getElementById('cola-now-title').innerText = `${ahoraTitulo} — ${ahoraArtista}`;
    const contenedorLista = document.getElementById('lista-cola-dinamica');
    contenedorLista.innerHTML = "";

    if (listaDeReproduccion.length === 0 || indiceActual === -1) {
        contenedorLista.innerHTML = `<li class="list-group-item bg-transparent text-secondary border-0 small text-center py-4"><i class="bi bi-music-note-list d-block fs-3 mb-2 opacity-50"></i>La cola está vacía.</li>`;
        return;
    }

    let posicionEnCola = 1;
    for (let i = indiceActual + 1; i < listaDeReproduccion.length; i++) {
        const track = listaDeReproduccion[i];
        const indexOrigen = i; 
        
        const li = document.createElement('li');
        // Añadimos un pequeño padding extra y cursor-grab
        li.className = "list-group-item bg-black border-0 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between p-2.5 text-white small song-row-cola";
        
        li.innerHTML = `
            <div class="d-flex align-items-center flex-grow-1 pe-2 text-truncate" style="max-width: 200px;">
                <i class="bi bi-grip-vertical text-secondary me-2 drag-handle" style="cursor: grab; font-size: 1.2rem;"></i>
                
                <span class="text-secondary fw-bold me-3 opacity-50" style="min-width: 15px;">${posicionEnCola}</span>
                <div class="text-truncate">
                    <span class="fw-semibold d-block text-truncate text-white" title="${track.titulo}">${track.titulo}</span>
                    <span class="text-secondary small d-block text-truncate" title="${track.artista}">${track.artista}</span>
                </div>
            </div>
            <div class="d-flex gap-1">
                <button type="button" class="btn btn-transparent btn-sm p-1 text-danger opacity-75 hover-opacity-100" onclick="quitarDeColaTemporal(${indexOrigen}); event.stopPropagation();"><i class="bi bi-x-lg"></i></button>
            </div>
        `;
        contenedorLista.appendChild(li);
        posicionEnCola++;
    }

    if (contenedorLista.innerHTML === "") {
        contenedorLista.innerHTML = `<li class="list-group-item bg-transparent text-secondary border-0 small text-center py-4"><i class="bi bi-check-circle d-block fs-4 mb-2 text-danger opacity-50"></i>No hay más canciones en espera.</li>`;
    }
}

function moverEnCola(indexActual, direccion) {
    const nuevoIndex = indexActual + direccion;
    if (nuevoIndex <= indiceActual || nuevoIndex >= listaDeReproduccion.length) return;
    const itemTemporal = listaDeReproduccion[indexActual];
    listaDeReproduccion[indexActual] = listaDeReproduccion[nuevoIndex];
    listaDeReproduccion[nuevoIndex] = itemTemporal;
    renderizarColaVisual();
}

function quitarDeColaTemporal(indexEliminar) {
    listaDeReproduccion.splice(indexEliminar, 1);
    renderizarColaVisual();
}
// ==========================================
// DRAG & DROP PARA LA COLA DE REPRODUCCIÓN
// ==========================================
let sortableCola = null;

function inicializarDragAndDropCola() {
    const contenedorLista = document.getElementById('lista-cola-dinamica');
    if (!contenedorLista) return;

    if (sortableCola) return; 

    sortableCola = new Sortable(contenedorLista, {
        handle: '.drag-handle',
        animation: 150,         
        ghostClass: 'bg-secondary', 
        
        // --- [NUEVOS AJUSTES PARA CELULARES] ---
        delay: 150,             // Requiere mantener presionado 150ms para "agarrar" la canción
        delayOnTouchOnly: true, // Solo pide mantener presionado en celulares, en PC es al clic
        touchStartThreshold: 5, // Permite que el dedo tiemble un poco sin cancelar el agarre
        // ---------------------------------------

        onEnd: function (evt) {
            if (evt.oldIndex === evt.newIndex) return;

            const indexRealAntiguo = evt.oldIndex + indiceActual + 1;
            const indexRealNuevo = evt.newIndex + indiceActual + 1;

            const cancionMovida = listaDeReproduccion.splice(indexRealAntiguo, 1)[0];
            listaDeReproduccion.splice(indexRealNuevo, 0, cancionMovida);

            renderizarColaVisual();
        }
    });
}

function enviarFormularioAsincrono(event, urlDestino) {
    event.preventDefault();
    const formulario = event.target;
    const formData = new FormData(formulario);
    const modalInstance = bootstrap.Modal.getInstance(formulario.closest('.modal'));

    fetch(urlDestino, { method: 'POST', body: formData })
    .then(response => {
        if (response.ok) {
            if (modalInstance) modalInstance.hide();
            formulario.reset();
            alert("¡Cambios guardados con éxito en la Base de Datos!");
            filtrarBiblioteca(); // Refresca todo
        } else { alert("Hubo un problema en el servidor."); }
    }).catch(err => console.error(err));
}

function eliminarElementoAsincrono(tabla, id, botonClid) {
    event.stopPropagation();
    if (!confirm(`¿Estás seguro de que deseas eliminar este registro?`)) return;
    fetch(`api/eliminar_elementos.php?tabla=${tabla}&id=${id}`)
    .then(response => {
        if (response.ok) {
            alert("¡El elemento ha sido eliminado con éxito!");
            const fila = botonClid.closest('tr') || botonClid.closest('li');
            if (fila) fila.remove();
            filtrarBiblioteca(); // Refresca índices y paginación
        } else { alert("Error: No se pudo eliminar el elemento."); }
    }).catch(err => console.error(err));
}

function ordenarBibliotecaAsincrona(tipoOrden) {
    const tablaBody = document.querySelector('#tablaCanciones tbody');
    const filas = Array.from(tablaBody.querySelectorAll('.target-row'));
    filas.sort((filaA, filaB) => {
        const fechaA = new Date(filaA.getAttribute('data-fecha'));
        const fechaB = new Date(filaB.getAttribute('data-fecha'));
        return tipoOrden === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
    filas.forEach(fila => tablaBody.appendChild(fila));
    document.getElementById('btn-orden-desc').className = tipoOrden === 'desc' ? "btn btn-sm btn-success" : "btn btn-sm btn-outline-secondary text-white";
    document.getElementById('btn-orden-asc').className = tipoOrden === 'asc' ? "btn btn-sm btn-success" : "btn btn-sm btn-outline-secondary text-white";
    
    filtrarBiblioteca(); // Aplicamos los filtros y repaginamos
}

function limpiarBuscador() {
    const input = document.getElementById('buscadorInput');
    input.value = ''; 
    filtrarBiblioteca(); 
    input.focus(); 
}

// ==========================================
// NUEVO SISTEMA DE FILTRADO Y PAGINACIÓN
// ==========================================
function filtrarBiblioteca() {
    const textoFiltro = document.getElementById('buscadorInput').value.toLowerCase();
    
    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    if (btnLimpiar) {
        if (textoFiltro.length > 0) btnLimpiar.classList.remove('d-none');
        else btnLimpiar.classList.add('d-none');
    }

    const todasLasFilas = Array.from(document.querySelectorAll('.target-row'));
    filasFiltradasGlobal = []; // Vaciamos la lista global

    todasLasFilas.forEach(fila => {
        const titulo = fila.querySelector('.title-col').innerText.toLowerCase();
        const album = fila.querySelector('.album-col').innerText.toLowerCase();
        const artistas = fila.querySelector('.artist-col').innerText.toLowerCase();
        const playlistsAsociadas = fila.getAttribute('data-playlists').toLowerCase();
        
        const coincideTexto = titulo.includes(textoFiltro) || album.includes(textoFiltro) || artistas.includes(textoFiltro) || playlistsAsociadas.includes(textoFiltro);
        const coincidePlaylist = (filtroPlaylistActivo === "") || playlistsAsociadas.includes(filtroPlaylistActivo.toLowerCase());
        
        if (coincideTexto && coincidePlaylist) {
            filasFiltradasGlobal.push(fila);
        }
        
        // Escondemos todas físicamente para que el renderizador decida cuáles mostrar
        fila.style.display = 'none'; 
    });

    const badgeContador = document.getElementById('contador-dinamico');
    if (badgeContador) {
        badgeContador.innerText = filtroPlaylistActivo === "" ? `${filasFiltradasGlobal.length} canciones totales` : `${filasFiltradasGlobal.length} en "${filtroPlaylistActivo}"`;
    }
    
    // Regresamos a la página 1 cuando se realiza una búsqueda
    paginaActual = 1; 
    renderizarPaginaActual();
}

function renderizarPaginaActual() {
    // 1. Esconder todo de nuevo por seguridad
    document.querySelectorAll('.target-row').forEach(fila => fila.style.display = 'none');

    // 2. Calcular los límites matemáticos
    const inicio = (paginaActual - 1) * cancionesPorPagina;
    const fin = inicio + cancionesPorPagina;
    
    // 3. Tomar solo las 15 filas que corresponden a esta página
    const filasAMostrar = filasFiltradasGlobal.slice(inicio, fin);
    filasAMostrar.forEach(fila => fila.style.display = ''); // Las mostramos

    // 4. Actualizar textos de paginación UI
    const totalPaginas = Math.ceil(filasFiltradasGlobal.length / cancionesPorPagina);
    const infoPaginacion = document.getElementById('info-paginacion');
    const ulPaginacion = document.getElementById('botones-paginacion');

    if(infoPaginacion) {
        const inicioText = filasFiltradasGlobal.length > 0 ? inicio + 1 : 0;
        const finText = fin > filasFiltradasGlobal.length ? filasFiltradasGlobal.length : fin;
        infoPaginacion.innerText = `Mostrando ${inicioText} a ${finText} de ${filasFiltradasGlobal.length} canciones`;
    }

    // 5. Dibujar los botones numéricos
    if(ulPaginacion) {
        ulPaginacion.innerHTML = '';
        
        // Botón Anterior (<<)
        const liPrev = document.createElement('li');
        liPrev.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
        liPrev.innerHTML = `<a class="page-link bg-dark border-secondary text-white shadow-none" href="#" onclick="cambiarPagina(${paginaActual - 1}); return false;">&laquo;</a>`;
        ulPaginacion.appendChild(liPrev);

        // Generador de números de página
        for(let i = 1; i <= totalPaginas; i++) {
            // Lógica para no tener 50 botones. Muestra el 1, el final, y los 2 cercanos al actual.
            if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
                const bgStyle = i === paginaActual ? 'bg-danger border-danger' : 'bg-dark border-secondary text-white';
                li.innerHTML = `<a class="page-link ${bgStyle} shadow-none" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>`;
                ulPaginacion.appendChild(li);
            } else if (i === paginaActual - 3 || i === paginaActual + 3) {
                const li = document.createElement('li');
                li.className = `page-item disabled`;
                li.innerHTML = `<a class="page-link bg-dark border-secondary text-secondary shadow-none" href="#">...</a>`;
                ulPaginacion.appendChild(li);
            }
        }

        // Botón Siguiente (>>)
        const liNext = document.createElement('li');
        liNext.className = `page-item ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''}`;
        liNext.innerHTML = `<a class="page-link bg-dark border-secondary text-white shadow-none" href="#" onclick="cambiarPagina(${paginaActual + 1}); return false;">&raquo;</a>`;
        ulPaginacion.appendChild(liNext);
    }

    actualizarColaReproduccion();
    cancionesEscuchadas = [];
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(filasFiltradasGlobal.length / cancionesPorPagina);
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        renderizarPaginaActual();
        // Hacemos un scroll suave al inicio de la tabla para comodidad del usuario
        document.getElementById('tablaCanciones').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filtrarPorPlaylist(nombrePlaylist) {
    filtroPlaylistActivo = nombrePlaylist;
    if (nombrePlaylist === "") document.getElementById('buscadorInput').value = "";
    filtrarBiblioteca();
    
    const enlaces = document.querySelectorAll('#acordeonSidebar .nav-link, #acordeonSidebar a');
    enlaces.forEach(enlace => { enlace.classList.remove('text-success', 'fw-bold'); enlace.classList.add('text-secondary'); });
    const eventoOrigen = window.event?.target;
    if (eventoOrigen && eventoOrigen.tagName === 'A') { eventoOrigen.classList.remove('text-secondary'); eventoOrigen.classList.add('text-success', 'fw-bold'); }
}

function obtenerDuracionArchivo(input) {
    const archivo = input.files[0];
    if (!archivo) return;
    const audioTemporal = document.createElement('audio');
    audioTemporal.src = URL.createObjectURL(archivo);
    audioTemporal.addEventListener('loadedmetadata', function() {
        document.getElementById('input_duracion_mp3').value = Math.round(audioTemporal.duration);
    });
}

// ==========================================
// LLENAR DATOS DEL MODAL (EDITAR CANCIÓN)
// ==========================================
function cargarModalCancion(id, titulo, album_id, duracion) {
    // 1. Llenar los campos básicos
    document.getElementById('edit_can_id').value = id;
    document.getElementById('edit_can_titulo').value = titulo;
    
    // 2. Seleccionar el álbum (o dejarlo en Single si es nulo)
    document.getElementById('edit_can_album').value = album_id || '';
    
    // 3. Formatear la duración (ej: 188 segundos -> 3:08 min)
    let min = Math.floor(duracion / 60);
    let sec = duracion % 60;
    let secFormateado = sec < 10 ? '0' + sec : sec;
    
    let inputDuracion = document.getElementById('edit_can_duracion_texto');
    if(inputDuracion) {
        inputDuracion.value = min + ':' + secFormateado + ' min';
    }
}

function cargarModalAlbum(id, titulo, anio) {
    document.getElementById('edit_alb_id').value = id;
    document.getElementById('edit_alb_titulo').value = titulo;
    document.getElementById('edit_alb_anio').value = anio || '';
}

// ==========================================
// BUSCADOR DE ARTISTAS - MODAL EDITAR ÁLBUM
// ==========================================
let editAlbArtistasSeleccionados = new Set();

document.addEventListener("DOMContentLoaded", function() {
    const contenedorEditAlb = document.getElementById('edit_alb_contenedor_buscador');
    if (!contenedorEditAlb) return;

    const listaArtistasEditAlb = JSON.parse(contenedorEditAlb.dataset.artistas || '[]');
    const searchInputEditAlb = document.getElementById('edit_alb_artist_search');
    const resultsContainerEditAlb = document.getElementById('edit_alb_artist_results');

    searchInputEditAlb.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        resultsContainerEditAlb.innerHTML = '';
        
        if (query.length === 0) {
            resultsContainerEditAlb.style.display = 'none';
            return;
        }

        const filtrados = listaArtistasEditAlb.filter(art => 
            art.nombre.toLowerCase().includes(query) && !editAlbArtistasSeleccionados.has(art.id.toString())
        );

        if (filtrados.length > 0) {
            resultsContainerEditAlb.style.display = 'block';
            filtrados.forEach(art => {
                const div = document.createElement('div');
                div.className = 'p-2 text-white-50 hover-bg-carmesi';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = art.nombre;
                
                div.addEventListener('click', function() {
                    agregarEtiquetaArtistaEdicionAlbum(art.id, art.nombre);
                    searchInputEditAlb.value = '';
                    resultsContainerEditAlb.style.display = 'none';
                    searchInputEditAlb.focus(); 
                });
                
                resultsContainerEditAlb.appendChild(div);
            });
        } else {
            resultsContainerEditAlb.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!searchInputEditAlb.contains(e.target) && !resultsContainerEditAlb.contains(e.target)) {
            resultsContainerEditAlb.style.display = 'none';
        }
    });
});

function agregarEtiquetaArtistaEdicionAlbum(id, nombre) {
    const idStr = id.toString();
    editAlbArtistasSeleccionados.add(idStr);

    const hiddenInputsContainer = document.getElementById('edit_alb_hidden_inputs');
    const selectedContainer = document.getElementById('edit_alb_selected_artists');

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'artista_ids[]';
    hiddenInput.value = idStr;
    hiddenInput.id = `edit_alb_hidden_art_${idStr}`;
    hiddenInputsContainer.appendChild(hiddenInput);

    const tag = document.createElement('span');
    tag.className = 'badge d-flex align-items-center p-2 rounded-pill';
    tag.style.backgroundColor = '#1a1a1a';
    tag.style.border = '1px solid var(--sistema-carmesí)';
    tag.style.color = '#ffffff';
    tag.style.fontSize = '0.8rem';
    tag.id = `edit_alb_tag_art_${idStr}`;

    tag.innerHTML = `
        ${nombre} 
        <i class="bi bi-x-circle-fill ms-2 text-danger" style="cursor:pointer; font-size: 0.9rem;"></i>
    `;

    tag.querySelector('i').addEventListener('click', function() {
        tag.remove();
        document.getElementById(`edit_alb_hidden_art_${idStr}`).remove();
        editAlbArtistasSeleccionados.delete(idStr);
    });

    selectedContainer.appendChild(tag);
}

// Función para cargar los artistas cuando le das al botón de Editar
function cargarEtiquetasEdicionAlbum(idsCSV, nombresCSV) {
    document.getElementById('edit_alb_selected_artists').innerHTML = '';
    document.getElementById('edit_alb_hidden_inputs').innerHTML = '';
    editAlbArtistasSeleccionados.clear();

    if (!idsCSV || !nombresCSV) return;

    const ids = idsCSV.toString().split(',');
    const nombres = nombresCSV.split(',');

    for (let i = 0; i < ids.length; i++) {
        if (ids[i].trim() !== '') {
            agregarEtiquetaArtistaEdicionAlbum(ids[i].trim(), nombres[i].trim());
        }
    }
}

// INICIALIZADOR: Se ejecuta automáticamente al cargar la página para preparar la página 1
document.addEventListener('DOMContentLoaded', () => {
    filtrarBiblioteca();
    // [NUEVO] Conectar botones nativos y de pantalla de bloqueo al cargar
    inicializarControlesNativos();

    // [NUEVO] Recuperar la canción donde te quedaste
    restaurarSesion();
});

// ==========================================
// FILTRADO DEL MENÚ LATERAL (MINI-BUSCADOR)
// ==========================================
function filtrarMenuCatalogo() {
    const texto = document.getElementById('inputBuscarCatalogo').value.toLowerCase();
    const artistasBlocks = document.querySelectorAll('#acordeonSubArtistas > .accordion-item');

    artistasBlocks.forEach(block => {
        const spanArtista = block.querySelector('.text-white.fw-medium.text-truncate');
        if (!spanArtista) return;
        const nombreArtista = spanArtista.innerText.toLowerCase();
        
        const albumesLi = block.querySelectorAll('ul > li.item-con-opciones');
        let algunAlbumCoincide = false;

        const coincideArtista = nombreArtista.includes(texto);

        // Filtrar los álbumes internos
        albumesLi.forEach(li => {
            const spanAlbum = li.querySelector('.text-white-50.text-truncate');
            if (!spanAlbum) return;
            const nombreAlbum = spanAlbum.innerText.toLowerCase();

            // Si el artista coincide, mostramos todos sus álbumes. Si no, solo el álbum que coincida.
            if (coincideArtista || nombreAlbum.includes(texto)) {
                li.classList.remove('d-none');
                li.classList.add('d-flex'); // Restauramos la clase de Bootstrap
                if (nombreAlbum.includes(texto)) algunAlbumCoincide = true;
            } else {
                li.classList.remove('d-flex');
                li.classList.add('d-none');
            }
        });

        // Filtrar el letrero de "Sin álbumes" por si el artista no tiene nada
        const sinAlbumesLi = block.querySelector('li.fst-italic');
        if (sinAlbumesLi) {
            if (coincideArtista) sinAlbumesLi.classList.remove('d-none');
            else sinAlbumesLi.classList.add('d-none');
        }

        const collapseDiv = block.querySelector('.accordion-collapse');
        
        // Decidir si mostramos toda la carpeta del artista
        if (coincideArtista || algunAlbumCoincide) {
            block.style.display = '';
            
            // UX Premium: Si hay texto en el buscador, expandimos la carpeta para ver el resultado
            if (texto.length > 0 && collapseDiv) {
                collapseDiv.classList.add('show');
            } else if (texto.length === 0 && collapseDiv) {
                // Si borra la búsqueda, volvemos a contraer todo para mantener el orden
                collapseDiv.classList.remove('show');
            }
        } else {
            // Ocultamos al artista completo si no coincide nada
            block.style.display = 'none';
        }
    });
}

// ==========================================
// RASTREADOR DE CANCIÓN ACTUAL
// ==========================================
function irACancionActual() {
    if (!window.rutaEnReproduccion) return; // Si no hay canción sonando, no hace nada

    // 1. Buscamos el índice exacto en el arreglo de las 200 canciones
    const index = filasFiltradasGlobal.findIndex(fila => fila.getAttribute('data-ruta') === window.rutaEnReproduccion);

    if (index !== -1) {
        // 2. Matemáticas: Calculamos en qué página cayó esa fila
        const paginaDestino = Math.floor(index / cancionesPorPagina) + 1;
        
        // 3. Forzamos el cambio de página si es necesario
        if (paginaActual !== paginaDestino) {
            cambiarPagina(paginaDestino);
        }

        // 4. Scrolleamos suavemente y hacemos parpadear la fila
        setTimeout(() => {
            const filaObjetivo = filasFiltradasGlobal[index];
            filaObjetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Efecto visual (flash carmesí)
            filaObjetivo.style.transition = "background-color 0.4s ease";
            filaObjetivo.style.backgroundColor = "rgba(239, 68, 68, 0.4)"; 
            
            setTimeout(() => {
                filaObjetivo.style.backgroundColor = ""; // Regresa a la normalidad
            }, 1200);
        }, 150); // Pequeño delay para que a Bootstrap le dé tiempo de dibujar la nueva página
    } else {
        // Si el usuario buscó "Rock" en el buscador pero está sonando "Pop", le avisamos
        alert("La canción que está sonando no se encuentra en tu búsqueda actual. Limpia el buscador e inténtalo de nuevo.");
    }
}

// Este script se ejecuta apenas el HTML de la tabla exista, sin esperar a las imágenes pesadas
document.addEventListener("DOMContentLoaded", function() {
    const loader = document.getElementById('pantalla-carga');
    
    if (loader) {
        // Le damos medio segundo (500ms) para disimular la carga de red
        setTimeout(function() {
            loader.style.opacity = '0'; // Efecto de desvanecimiento
            
            // Lo quitamos por completo de la pantalla después del desvanecimiento
            setTimeout(() => { 
                loader.style.visibility = 'hidden'; 
            }, 500);
        }, 500); 
    }
});

// Plan B de seguridad por si falla el primero
window.addEventListener('load', function() {
    const loader = document.getElementById('pantalla-carga');
    if (loader && loader.style.visibility !== 'hidden') {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.visibility = 'hidden'; }, 500);
    }
});

// ==========================================
// BUSCADOR DE ARTISTAS CON ETIQUETAS (TAGS)
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const contenedor = document.getElementById('contenedor_buscador_artistas');
    
    // Si el modal no existe en esta página, detenemos el script para evitar errores
    if (!contenedor) return; 

    // 1. Extraemos los artistas del atributo HTML y los convertimos a objeto JS
    const listaArtistas = JSON.parse(contenedor.dataset.artistas || '[]');

    const searchInput = document.getElementById('album_artist_search');
    const resultsContainer = document.getElementById('album_artist_results');
    const selectedContainer = document.getElementById('album_selected_artists');
    const hiddenInputsContainer = document.getElementById('album_hidden_inputs');
    
    let artistasSeleccionados = new Set();

    // Evento al escribir en el buscador
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        
        if (query.length === 0) {
            resultsContainer.style.display = 'none';
            return;
        }

        const filtrados = listaArtistas.filter(art => 
            art.nombre.toLowerCase().includes(query) && !artistasSeleccionados.has(art.id)
        );

        if (filtrados.length > 0) {
            resultsContainer.style.display = 'block';
            filtrados.forEach(art => {
                const div = document.createElement('div');
                div.className = 'p-2 text-white-50 hover-bg-carmesi';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = art.nombre;
                
                div.addEventListener('click', function() {
                    agregarEtiquetaArtista(art.id, art.nombre);
                    searchInput.value = '';
                    resultsContainer.style.display = 'none';
                    searchInput.focus(); 
                });
                
                resultsContainer.appendChild(div);
            });
        } else {
            resultsContainer.style.display = 'none';
        }
    });

    // Ocultar resultados si se hace clic fuera del buscador
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });

    // Función principal para crear la etiqueta visual y el input oculto
    function agregarEtiquetaArtista(id, nombre) {
        artistasSeleccionados.add(id);

        // Input oculto para PHP
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'artista_ids[]';
        hiddenInput.value = id;
        hiddenInput.id = `hidden_art_${id}`;
        hiddenInputsContainer.appendChild(hiddenInput);

        // Etiqueta visual (Tag)
        const tag = document.createElement('span');
        tag.className = 'badge d-flex align-items-center p-2 rounded-pill';
        tag.style.backgroundColor = '#1a1a1a';
        tag.style.border = '1px solid var(--sistema-carmesí)';
        tag.style.color = '#ffffff';
        tag.style.fontSize = '0.8rem';
        tag.id = `tag_art_${id}`;

        tag.innerHTML = `
            ${nombre} 
            <i class="bi bi-x-circle-fill ms-2 text-danger" style="cursor:pointer; font-size: 0.9rem;"></i>
        `;

        // Evento para eliminar la etiqueta
        tag.querySelector('i').addEventListener('click', function() {
            tag.remove();
            document.getElementById(`hidden_art_${id}`).remove();
            artistasSeleccionados.delete(id);
        });

        selectedContainer.appendChild(tag);
    }
});

// ==========================================
// BUSCADOR DE ARTISTAS - MODAL EDITAR CANCIÓN
// ==========================================
// Hacemos el Set global para poder limpiarlo desde otras funciones
let editArtistasSeleccionados = new Set();

document.addEventListener("DOMContentLoaded", function() {
    const contenedorEdit = document.getElementById('edit_can_contenedor_buscador');
    if (!contenedorEdit) return;

    const listaArtistasEdit = JSON.parse(contenedorEdit.dataset.artistas || '[]');
    const searchInputEdit = document.getElementById('edit_can_artist_search');
    const resultsContainerEdit = document.getElementById('edit_can_artist_results');

    searchInputEdit.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        resultsContainerEdit.innerHTML = '';
        
        if (query.length === 0) {
            resultsContainerEdit.style.display = 'none';
            return;
        }

        const filtrados = listaArtistasEdit.filter(art => 
            art.nombre.toLowerCase().includes(query) && !editArtistasSeleccionados.has(art.id.toString())
        );

        if (filtrados.length > 0) {
            resultsContainerEdit.style.display = 'block';
            filtrados.forEach(art => {
                const div = document.createElement('div');
                div.className = 'p-2 text-white-50 hover-bg-carmesi';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = art.nombre;
                
                div.addEventListener('click', function() {
                    agregarEtiquetaArtistaEdicion(art.id, art.nombre);
                    searchInputEdit.value = '';
                    resultsContainerEdit.style.display = 'none';
                    searchInputEdit.focus(); 
                });
                
                resultsContainerEdit.appendChild(div);
            });
        } else {
            resultsContainerEdit.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!searchInputEdit.contains(e.target) && !resultsContainerEdit.contains(e.target)) {
            resultsContainerEdit.style.display = 'none';
        }
    });
});

// Función para pintar la etiqueta y crear el input en el modal de edición
function agregarEtiquetaArtistaEdicion(id, nombre) {
    // Aseguramos que el ID sea texto para evitar problemas al buscar en el Set
    const idStr = id.toString();
    editArtistasSeleccionados.add(idStr);

    const hiddenInputsContainer = document.getElementById('edit_can_hidden_inputs');
    const selectedContainer = document.getElementById('edit_can_selected_artists');

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'artista_ids[]';
    hiddenInput.value = idStr;
    hiddenInput.id = `edit_hidden_art_${idStr}`;
    hiddenInputsContainer.appendChild(hiddenInput);

    const tag = document.createElement('span');
    tag.className = 'badge d-flex align-items-center p-2 rounded-pill';
    tag.style.backgroundColor = '#1a1a1a';
    tag.style.border = '1px solid var(--sistema-carmesí)';
    tag.style.color = '#ffffff';
    tag.style.fontSize = '0.8rem';
    tag.id = `edit_tag_art_${idStr}`;

    tag.innerHTML = `
        ${nombre} 
        <i class="bi bi-x-circle-fill ms-2 text-danger" style="cursor:pointer; font-size: 0.9rem;"></i>
    `;

    tag.querySelector('i').addEventListener('click', function() {
        tag.remove();
        document.getElementById(`edit_hidden_art_${idStr}`).remove();
        editArtistasSeleccionados.delete(idStr);
    });

    selectedContainer.appendChild(tag);
}

// Función CRUCIAL: Limpia y pre-carga los artistas cuando abres el modal
function cargarEtiquetasEdicion(idsCSV, nombresCSV) {
    document.getElementById('edit_can_selected_artists').innerHTML = '';
    document.getElementById('edit_can_hidden_inputs').innerHTML = '';
    editArtistasSeleccionados.clear();

    if (!idsCSV || !nombresCSV) return;

    const ids = idsCSV.toString().split(',');
    const nombres = nombresCSV.split(',');

    for (let i = 0; i < ids.length; i++) {
        if (ids[i].trim() !== '') {
            agregarEtiquetaArtistaEdicion(ids[i].trim(), nombres[i].trim());
        }
    }
}

// ==========================================
// BUSCADOR DE ARTISTAS - MODAL SUBIR CANCIÓN
// ==========================================
let subirArtistasSeleccionados = new Set();

document.addEventListener("DOMContentLoaded", function() {
    const contenedorSubir = document.getElementById('subir_can_contenedor_buscador');
    if (!contenedorSubir) return;

    const listaArtistasSubir = JSON.parse(contenedorSubir.dataset.artistas || '[]');
    const searchInputSubir = document.getElementById('subir_can_artist_search');
    const resultsContainerSubir = document.getElementById('subir_can_artist_results');
    const selectedContainerSubir = document.getElementById('subir_can_selected_artists');
    const hiddenInputsContainerSubir = document.getElementById('subir_can_hidden_inputs');

    searchInputSubir.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        resultsContainerSubir.innerHTML = '';
        
        if (query.length === 0) {
            resultsContainerSubir.style.display = 'none';
            return;
        }

        const filtrados = listaArtistasSubir.filter(art => 
            art.nombre.toLowerCase().includes(query) && !subirArtistasSeleccionados.has(art.id.toString())
        );

        if (filtrados.length > 0) {
            resultsContainerSubir.style.display = 'block';
            filtrados.forEach(art => {
                const div = document.createElement('div');
                div.className = 'p-2 text-white-50 hover-bg-carmesi';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = art.nombre;
                
                div.addEventListener('click', function() {
                    agregarEtiquetaArtistaSubir(art.id, art.nombre);
                    searchInputSubir.value = '';
                    resultsContainerSubir.style.display = 'none';
                    searchInputSubir.focus(); 
                });
                
                resultsContainerSubir.appendChild(div);
            });
        } else {
            resultsContainerSubir.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!searchInputSubir.contains(e.target) && !resultsContainerSubir.contains(e.target)) {
            resultsContainerSubir.style.display = 'none';
        }
    });

    function agregarEtiquetaArtistaSubir(id, nombre) {
        const idStr = id.toString();
        subirArtistasSeleccionados.add(idStr);

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'artista_ids[]'; // El array que PHP espera
        hiddenInput.value = idStr;
        hiddenInput.id = `subir_hidden_art_${idStr}`;
        hiddenInputsContainerSubir.appendChild(hiddenInput);

        const tag = document.createElement('span');
        tag.className = 'badge d-flex align-items-center p-2 rounded-pill';
        tag.style.backgroundColor = '#1a1a1a';
        tag.style.border = '1px solid var(--sistema-carmesí)';
        tag.style.color = '#ffffff';
        tag.style.fontSize = '0.8rem';
        tag.id = `subir_tag_art_${idStr}`;

        tag.innerHTML = `
            ${nombre} 
            <i class="bi bi-x-circle-fill ms-2 text-danger" style="cursor:pointer; font-size: 0.9rem;"></i>
        `;

        tag.querySelector('i').addEventListener('click', function() {
            tag.remove();
            document.getElementById(`subir_hidden_art_${idStr}`).remove();
            subirArtistasSeleccionados.delete(idStr);
        });

        selectedContainerSubir.appendChild(tag);
    }

    // LIMPIEZA AUTOMÁTICA AL CERRAR EL MODAL
    // Esto evita que las etiquetas se queden pegadas la próxima vez que intentes subir una canción
    const modalSubir = document.getElementById('cancionModal');
    if (modalSubir) {
        modalSubir.addEventListener('hidden.bs.modal', function () {
            selectedContainerSubir.innerHTML = '';
            hiddenInputsContainerSubir.innerHTML = '';
            subirArtistasSeleccionados.clear();
            searchInputSubir.value = '';
            resultsContainerSubir.style.display = 'none';
        });
    }
});

// ==========================================
// ATAJOS DE TECLADO PARA EL REPRODUCTOR
// ==========================================
document.addEventListener('keydown', function(event) {
    // 1. Ignorar si el usuario está escribiendo en inputs o modales
    const elementoActivo = document.activeElement.tagName;
    if (elementoActivo === 'INPUT' || elementoActivo === 'TEXTAREA' || elementoActivo === 'SELECT') {
        return;
    }

    // 2. SHIFT + N (Siguiente Canción)
    if (event.shiftKey && event.code === 'KeyN') {
        event.preventDefault(); 
        const btnNext = document.getElementById('next-btn');
        if (btnNext) btnNext.click(); // Clickea tu botón y ejecuta siguienteCancion()
        return;
    }

    // 3. SHIFT + P (Canción Anterior)
    if (event.shiftKey && event.code === 'KeyP') {
        event.preventDefault(); 
        const btnPrev = document.getElementById('prev-btn');
        if (btnPrev) btnPrev.click(); // Clickea tu botón y ejecuta cancionAnterior()
        return;
    }

    // 4. BARRA ESPACIADORA (Play / Pausa)
    if (event.code === 'Space') {
        event.preventDefault(); // Evita que la página haga scroll hacia abajo
        const btnPlay = document.getElementById('play-btn');
        if (btnPlay) btnPlay.click(); // Esto ejecuta tu togglePlay() y cambia el ícono visual
        return;
    }

    // 5. TECLA M (Mutear / Desmutear)
    if (event.code === 'KeyM') {
        event.preventDefault();
        const reproductor = document.getElementById('audio-player');
        const iconVolumen = document.getElementById('volume-icon');
        const volumeSlider = document.getElementById('volume-slider'); // <-- Capturamos la barra

        if (reproductor && volumeSlider) {
            // Cambiamos el estado de audio del navegador
            reproductor.muted = !reproductor.muted;
            
            if (reproductor.muted) {
                // 1. Guardamos el volumen actual en la "memoria" de la barra antes de bajarlo
                volumeSlider.dataset.volumenGuardado = volumeSlider.value;
                
                // 2. Bajamos la barra visualmente a 0
                volumeSlider.value = 0;
                
                // 3. Ícono rojo de mute
                if (iconVolumen) iconVolumen.className = 'bi bi-volume-mute-fill text-danger fs-5';
            } else {
                // 1. Recuperamos el volumen guardado (si por error era 0, lo ponemos al máximo por defecto)
                let volRecuperado = volumeSlider.dataset.volumenGuardado || 1;
                if (volRecuperado == 0) volRecuperado = 1;
                
                // 2. Restauramos la barra visualmente y el volumen del reproductor
                volumeSlider.value = volRecuperado;
                reproductor.volume = volRecuperado;
                
                // 3. Ícono gris normal
                if (iconVolumen) iconVolumen.className = 'bi bi-volume-up text-secondary fs-5';
            }
        }
        return;
    }
});

// ==========================================
// CONTROL MAESTRO DE VOLUMEN Y MUTE
// ==========================================
let volumenAnterior = 1; // Memoria para saber a qué volumen regresar
const reproductor = document.getElementById('audio-player');
const volumeSlider = document.getElementById('volume-slider');
const iconVolumen = document.getElementById('volume-icon');

// Escuchamos cuando arrastras la barra de volumen
if (volumeSlider) {
    volumeSlider.addEventListener('input', function() {
        const val = parseFloat(this.value);
        reproductor.volume = val;

        if (val === 0) {
            reproductor.muted = true;
            actualizarIconoVolumen(true, 0);
        } else {
            reproductor.muted = false;
            volumenAnterior = val; // Actualizamos la memoria
            actualizarIconoVolumen(false, val);
        }
    });
}

// Función para cambiar los íconos visualmente
function actualizarIconoVolumen(isMuted, val) {
    if (!iconVolumen) return;
    
    if (isMuted || val === 0) {
        iconVolumen.className = 'bi bi-volume-mute-fill text-danger fs-5';
    } else if (val < 0.5) {
        iconVolumen.className = 'bi bi-volume-down text-secondary fs-5';
    } else {
        iconVolumen.className = 'bi bi-volume-up text-secondary fs-5';
    }
}

// Función maestra para mutear/desmutear (Usada por el clic y por la letra M)
function toggleMute() {
    if (!reproductor || !volumeSlider) return;

    if (reproductor.muted || parseFloat(volumeSlider.value) === 0) {
        // Desmutear: Le devolvemos el volumen que tenía en memoria
        reproductor.muted = false;
        let nuevoVol = volumenAnterior > 0 ? volumenAnterior : 1; 
        reproductor.volume = nuevoVol;
        volumeSlider.value = nuevoVol; // Movemos la barra visualmente
        actualizarIconoVolumen(false, nuevoVol);
    } else {
        // Mutear: Guardamos memoria y tiramos la barra a 0
        volumenAnterior = parseFloat(volumeSlider.value);
        reproductor.muted = true;
        volumeSlider.value = 0; // Movemos la barra a cero visualmente
        actualizarIconoVolumen(true, 0);
    }
}

// ==========================================
// DESCARGA INTELIGENTE DE MP3 (CON ETIQUETAS ID3)
// ==========================================
async function descargarCancionConMetadatos(boton, rutaAudio, tituloTrack, artistasTexto, albumTrack) {
    const textoOriginal = boton.querySelector('.texto-btn').innerText;
    const iconoOriginal = boton.querySelector('i').className;
    
    try {
        // 1. Cambiamos el botón visualmente a "Procesando..."
        boton.querySelector('.texto-btn').innerText = " Preparando...";
        boton.querySelector('i').className = "bi bi-hourglass-split text-warning spinner-border spinner-border-sm";
        boton.disabled = true;

        // Limpieza de la ruta (por si guardaste pistas antiguas con "../" en la BD)
        const rutaLimpia = rutaAudio.replace('../', '');

        // 2. Descargamos el archivo físico
        const respuesta = await fetch(rutaLimpia);
        if (!respuesta.ok) throw new Error("Archivo MP3 no encontrado (Error 404). Verifica la ruta física.");
        const buffer = await respuesta.arrayBuffer();

        // 3. Verificamos el nombre correcto de la librería (varía según la versión del CDN)
        let writer;
        if (typeof ID3Writer !== 'undefined') {
            writer = new ID3Writer(buffer);
        } else if (typeof browserID3Writer !== 'undefined') {
            writer = new browserID3Writer(buffer);
        } else {
            throw new Error("La librería de metadatos no cargó. Revisa tu conexión o el CDN en index.php.");
        }

        // Convertimos el texto "Artista 1, Artista 2" en un arreglo de JavaScript
        const arrayArtistas = artistasTexto ? artistasTexto.split(',').map(a => a.trim()) : ['Artista Desconocido'];

        // 4. Inyectamos los datos en la estructura binaria del MP3
        writer.setFrame('TIT2', tituloTrack)        // TIT2 = Título de la canción
              .setFrame('TPE1', arrayArtistas)      // TPE1 = Artistas integrantes
              .setFrame('TALB', albumTrack || 'Sencillo'); // TALB = Nombre del álbum

        writer.addTag();

        // 5. Empaquetamos el archivo final modificado
        const blob = writer.getBlob();
        const urlObjeto = URL.createObjectURL(blob);

        // 6. Forzamos la descarga
        const enlaceDescarga = document.createElement('a');
        enlaceDescarga.href = urlObjeto;
        enlaceDescarga.download = `${tituloTrack.replace(/[<>:"/\\|?*]+/g, '')}.mp3`;
        
        document.body.appendChild(enlaceDescarga);
        enlaceDescarga.click();
        
        // Limpieza de RAM
        document.body.removeChild(enlaceDescarga);
        URL.revokeObjectURL(urlObjeto);

    } catch (error) {
        console.error("Error al inyectar metadatos:", error);
        // AHORA SÍ VEREMOS EL ERROR REAL
        alert("Error: " + error.message); 
    } finally {
        // 7. Devolvemos el botón a la normalidad
        boton.querySelector('.texto-btn').innerText = textoOriginal;
        boton.querySelector('i').className = iconoOriginal;
        boton.disabled = false;
    }
}

// ==========================================
// CONTRAER / EXPANDIR SIDEBAR (PC Y MÓVIL)
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const anchoPantalla = window.innerWidth;

    if (anchoPantalla <= 768) {
        // COMPORTAMIENTO MÓVIL: Desliza el panel entero hacia adentro o afuera
        sidebar.classList.toggle('movil-abierto');
    } else {
        // COMPORTAMIENTO PC: Alterna entre 260px y 80px
        sidebar.classList.toggle('contraido');
        const estaContraido = sidebar.classList.contains('contraido');
        localStorage.setItem('sidebarContraido', estaContraido);
        
        // Si al contraer el acordeón estaba abierto, lo cerramos para evitar bugs visuales
        if (estaContraido) {
            const acordeonesAbiertos = sidebar.querySelectorAll('.accordion-collapse.show');
            acordeonesAbiertos.forEach(acc => {
                let bsCollapse = bootstrap.Collapse.getInstance(acc);
                if (bsCollapse) bsCollapse.hide();
            });
        }
    }
}

// ==========================================
// AUTO-EXPANDIR AL CLIQUEAR UN ACORDEÓN
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Recuperar memoria del sidebar en PC
    const estadoGuardado = localStorage.getItem('sidebarContraido');
    if (window.innerWidth > 768 && estadoGuardado === 'true') {
        sidebar.classList.add('contraido');
    }

    // Auto-expansión inteligente
    const botonesAcordeon = sidebar.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (window.innerWidth > 768 && sidebar.classList.contains('contraido')) {
                // Prevenir que Bootstrap intente abrir el acordeón en estado colapsado
                e.stopPropagation(); 
                // Expande el sidebar principal
                toggleSidebar(); 
                
                // Le damos un milisegundo a la animación para luego abrir el acordeón que el usuario quería
                setTimeout(() => {
                    let targetId = this.getAttribute('data-bs-target');
                    let targetContent = document.querySelector(targetId);
                    if (targetContent) {
                        let bsCollapse = new bootstrap.Collapse(targetContent, { toggle: false });
                        bsCollapse.show();
                    }
                }, 350);
            }
        });
    });
});

// ==========================================
// SISTEMA DE BACKUP EN SEGUNDO PLANO
// ==========================================
let backupInterval;

function iniciarBackup() {
    // 0. Mensaje de confirmación antes de arrancar
    if (!confirm("¿Estás seguro de que deseas generar un backup de toda tu biblioteca?\n\nEste proceso se ejecutará en segundo plano y puede tardar un poco dependiendo de cuánta música tengas.")) {
        return; // Si el usuario hace clic en "Cancelar", la función se detiene aquí.
    }

    const toastEl = document.getElementById('backupToast');
    const toastBody = document.getElementById('backupToastMensaje');
    const toast = new bootstrap.Toast(toastEl);

    // 1. Mostrar notificación de inicio
    toastBody.innerHTML = `<span class="spinner-border spinner-border-sm text-warning" role="status"></span> Empaquetando tu biblioteca. Puedes seguir usando la app...`;
    toast.show();

    // 2. Enviar la orden de iniciar (No esperamos la respuesta con await, la dejamos correr)
    fetch('api/backup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'accion=iniciar'
    }).catch(e => console.error("Error al lanzar proceso:", e));

    // 3. Empezar a vigilar el estado cada 3 segundos
    clearInterval(backupInterval);
    backupInterval = setInterval(revisarEstadoBackup, 3000);
}

async function revisarEstadoBackup() {
    try {
        const respuesta = await fetch('api/backup.php?accion=estado');
        const datos = await respuesta.json();

        if (datos.estado === 'completado') {
            clearInterval(backupInterval); // Detenemos el reloj
            
            // Mostrar botón de descarga en la notificación
            const toastBody = document.getElementById('backupToastMensaje');
            toastBody.innerHTML = `
                <i class="bi bi-check-circle-fill text-success fs-5"></i> 
                <span>¡Backup Listo!</span>
                <a href="${datos.archivo}" download class="btn btn-sm btn-success ms-2">Descargar ZIP</a>
            `;
            
            // Le decimos al servidor que limpie el archivo de estado para el próximo backup
            fetch('api/backup.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'accion=limpiar'
            });
        } 
        else if (datos.estado === 'error') {
            clearInterval(backupInterval);
            document.getElementById('backupToastMensaje').innerHTML = `<i class="bi bi-x-circle-fill text-danger fs-5"></i> Hubo un error al crear el backup.`;
        }
    } catch (error) {
        console.error("Revisando estado...", error);
    }
}

// ==========================================
// INTEGRACIÓN NATIVA: MEDIA SESSION API
// ==========================================

// 1. Configurar los botones físicos y de la pantalla de bloqueo
function inicializarControlesNativos() {
    if ('mediaSession' in navigator) {
        
        // Conectar el botón de PLAY nativo con tu reproductor
        navigator.mediaSession.setActionHandler('play', () => {
            // Reemplaza "togglePlay()" con el nombre real de tu función de Play si se llama distinto
            togglePlay(); 
        });

        // Conectar el botón de PAUSA nativo
        navigator.mediaSession.setActionHandler('pause', () => {
            togglePlay(); 
        });

        // Conectar el botón de CANCIÓN ANTERIOR nativo
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            // Reemplaza con el nombre real de tu función para retroceder
            cancionAnterior(); 
        });

        // Conectar el botón de SIGUIENTE CANCIÓN nativo
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            // Reemplaza con el nombre real de tu función para avanzar
            siguienteCancion(); 
        });
    }
}

// 2. Pintar la carátula y los datos en la pantalla de bloqueo
function actualizarPantallaBloqueo(tituloTrack, artistaTrack, nombreAlbum, rutaImagen) {
    if ('mediaSession' in navigator) {
        
        // Si la canción no tiene carátula, le ponemos una por defecto
        const imagenFinal = rutaImagen && rutaImagen !== '' ? rutaImagen : 'ruta/a/tu/imagen_por_defecto.jpg';

        navigator.mediaSession.metadata = new MediaMetadata({
            title: tituloTrack || 'Canción Desconocida',
            artist: artistaTrack || 'Varios Artistas',
            album: nombreAlbum || 'NebulaPlayer',
            artwork: [
                // Le damos al sistema operativo varios tamaños para que elija el que mejor se adapte a su pantalla
                { src: imagenFinal, sizes: '96x96', type: 'image/jpeg' },
                { src: imagenFinal, sizes: '128x128', type: 'image/jpeg' },
                { src: imagenFinal, sizes: '192x192', type: 'image/jpeg' },
                { src: imagenFinal, sizes: '256x256', type: 'image/jpeg' },
                { src: imagenFinal, sizes: '384x384', type: 'image/jpeg' },
                { src: imagenFinal, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
}

// ==========================================
// RECUPERAR SESIÓN ANTERIOR
// ==========================================
function restaurarSesion() {
    const rutaGuardada = localStorage.getItem('nebula_track_ruta');
    
    // Si hay una ruta guardada, significa que el usuario escuchó algo antes
    if (rutaGuardada) {
        const titulo = localStorage.getItem('nebula_track_titulo');
        const artista = localStorage.getItem('nebula_track_artista');
        const caratula = localStorage.getItem('nebula_track_caratula');
        const tiempoGuardado = localStorage.getItem('nebula_track_tiempo');

        // 1. Cargamos los datos visuales
        audio.src = rutaGuardada;
        window.rutaEnReproduccion = rutaGuardada;
        document.getElementById('current-title').innerText = titulo;
        document.getElementById('current-artist').innerText = artista;

        // 2. Restauramos la carátula
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

        // 3. Restauramos el tiempo exacto (Esperamos a que el navegador cargue el MP3)
        audio.addEventListener('loadedmetadata', function onMetaLoad() {
            if (tiempoGuardado) {
                audio.currentTime = parseFloat(tiempoGuardado);
                
                // Actualizamos la barra de progreso visualmente
                const porcentaje = (audio.currentTime / audio.duration) * 100;
                document.getElementById('progress-bar').value = porcentaje;
                document.getElementById('time-current').innerText = formatearTiempo(audio.currentTime);
            }
            // Limpiamos este evento para que no choque cuando cambies de canción
            audio.removeEventListener('loadedmetadata', onMetaLoad); 
        });

        // 4. Actualizamos la pantalla de bloqueo
        actualizarPantallaBloqueo(titulo, artista, 'NebulaPlayer', caratula);
    }
}
