// assets/js/uiController.js

let paginaActual = 1;
const cancionesPorPagina = 20;
let filasFiltradasGlobal = []; 
let filtroPlaylistActivo = "";
let sortableCola = null;
let volumenAnterior = 1;

function formatearTiempo(segundos) {
    if (isNaN(segundos)) return "0:00";
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
}

// ==========================================
// RENDERIZADO VISUAL Y PAGINACIÓN
// ==========================================
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
    filtrarBiblioteca(); 
}

function limpiarBuscador() {
    const input = document.getElementById('buscadorInput');
    input.value = ''; 
    filtrarBiblioteca(); 
    input.focus(); 
}

function filtrarBiblioteca() {
    const textoFiltro = document.getElementById('buscadorInput').value.toLowerCase();
    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    if (btnLimpiar) btnLimpiar.classList.toggle('d-none', textoFiltro.length === 0);

    const todasLasFilas = Array.from(document.querySelectorAll('.target-row'));
    filasFiltradasGlobal = []; 

    todasLasFilas.forEach(fila => {
        const titulo = fila.querySelector('.title-col').innerText.toLowerCase();
        const album = fila.querySelector('.album-col').innerText.toLowerCase();
        const artistas = fila.querySelector('.artist-col').innerText.toLowerCase();
        const playlistsAsociadas = fila.getAttribute('data-playlists').toLowerCase();
        
        const coincideTexto = titulo.includes(textoFiltro) || album.includes(textoFiltro) || artistas.includes(textoFiltro) || playlistsAsociadas.includes(textoFiltro);
        const coincidePlaylist = (filtroPlaylistActivo === "") || playlistsAsociadas.includes(filtroPlaylistActivo.toLowerCase());
        
        if (coincideTexto && coincidePlaylist) filasFiltradasGlobal.push(fila);
        fila.style.display = 'none'; 
    });

    const badgeContador = document.getElementById('contador-dinamico');
    if (badgeContador) badgeContador.innerText = filtroPlaylistActivo === "" ? `${filasFiltradasGlobal.length} canciones totales` : `${filasFiltradasGlobal.length} en "${filtroPlaylistActivo}"`;
    
    paginaActual = 1; 
    renderizarPaginaActual();

    if (typeof actualizarColaReproduccion === 'function') actualizarColaReproduccion();
}

function renderizarPaginaActual() {
    document.querySelectorAll('.target-row').forEach(fila => fila.style.display = 'none');
    const inicio = (paginaActual - 1) * cancionesPorPagina;
    const fin = inicio + cancionesPorPagina;
    const filasAMostrar = filasFiltradasGlobal.slice(inicio, fin);
    filasAMostrar.forEach(fila => fila.style.display = ''); 

    const totalPaginas = Math.ceil(filasFiltradasGlobal.length / cancionesPorPagina);
    const infoPaginacion = document.getElementById('info-paginacion');
    const ulPaginacion = document.getElementById('botones-paginacion');

    if(infoPaginacion) {
        const inicioText = filasFiltradasGlobal.length > 0 ? inicio + 1 : 0;
        const finText = fin > filasFiltradasGlobal.length ? filasFiltradasGlobal.length : fin;
        infoPaginacion.innerText = `Mostrando ${inicioText} a ${finText} de ${filasFiltradasGlobal.length} canciones`;
    }

    if(ulPaginacion) {
        ulPaginacion.innerHTML = '';
        const liPrev = document.createElement('li');
        liPrev.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
        liPrev.innerHTML = `<a class="page-link bg-dark border-secondary text-white shadow-none" href="#" onclick="cambiarPagina(${paginaActual - 1}); return false;">&laquo;</a>`;
        ulPaginacion.appendChild(liPrev);

        for(let i = 1; i <= totalPaginas; i++) {
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

        const liNext = document.createElement('li');
        liNext.className = `page-item ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''}`;
        liNext.innerHTML = `<a class="page-link bg-dark border-secondary text-white shadow-none" href="#" onclick="cambiarPagina(${paginaActual + 1}); return false;">&raquo;</a>`;
        ulPaginacion.appendChild(liNext);
    }
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(filasFiltradasGlobal.length / cancionesPorPagina);
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        renderizarPaginaActual();
        document.getElementById('tablaCanciones').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==========================================
// GESTIÓN DEL SIDEBAR Y MODALES
// ==========================================
function filtrarPorPlaylist(nombrePlaylist) {
    filtroPlaylistActivo = nombrePlaylist;
    if (nombrePlaylist === "") document.getElementById('buscadorInput').value = "";
    filtrarBiblioteca();
    const enlaces = document.querySelectorAll('#acordeonSidebar .nav-link, #acordeonSidebar a');
    enlaces.forEach(enlace => { enlace.classList.remove('text-success', 'fw-bold'); enlace.classList.add('text-secondary'); });
    const eventoOrigen = window.event?.target;
    if (eventoOrigen && eventoOrigen.tagName === 'A') { eventoOrigen.classList.remove('text-secondary'); eventoOrigen.classList.add('text-success', 'fw-bold'); }
}

function filtrarMenuCatalogo() {
    const texto = document.getElementById('inputBuscarCatalogo').value.toLowerCase();
    document.querySelectorAll('#acordeonSubArtistas > .accordion-item').forEach(block => {
        const spanArtista = block.querySelector('.text-white.fw-medium.text-truncate');
        if (!spanArtista) return;
        const coincideArtista = spanArtista.innerText.toLowerCase().includes(texto);
        let algunAlbumCoincide = false;

        block.querySelectorAll('ul > li.item-con-opciones').forEach(li => {
            const spanAlbum = li.querySelector('.text-white-50.text-truncate');
            if (!spanAlbum) return;
            if (coincideArtista || spanAlbum.innerText.toLowerCase().includes(texto)) {
                li.classList.replace('d-none', 'd-flex');
                if (spanAlbum.innerText.toLowerCase().includes(texto)) algunAlbumCoincide = true;
            } else {
                li.classList.replace('d-flex', 'd-none');
            }
        });

        const collapseDiv = block.querySelector('.accordion-collapse');
        if (coincideArtista || algunAlbumCoincide) {
            block.style.display = '';
            if (texto.length > 0 && collapseDiv) collapseDiv.classList.add('show');
            else if (texto.length === 0 && collapseDiv) collapseDiv.classList.remove('show');
        } else block.style.display = 'none';
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (window.innerWidth <= 768) sidebar.classList.toggle('movil-abierto');
    else {
        sidebar.classList.toggle('contraido');
        localStorage.setItem('sidebarContraido', sidebar.classList.contains('contraido'));
        if (sidebar.classList.contains('contraido')) {
            sidebar.querySelectorAll('.accordion-collapse.show').forEach(acc => {
                let bsCollapse = bootstrap.Collapse.getInstance(acc);
                if (bsCollapse) bsCollapse.hide();
            });
        }
    }
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

function cargarModalCancion(id, titulo, album_id, duracion, ruta) {
    document.getElementById('edit_can_id').value = id;
    document.getElementById('edit_can_titulo').value = titulo;
    const inputRutaActual = document.getElementById('edit_can_ruta_actual');
    if(inputRutaActual) inputRutaActual.value = ruta;
    const inputArchivo = document.getElementById('edit_can_archivo');
    if(inputArchivo) inputArchivo.value = '';
    document.getElementById('edit_can_album').value = album_id || '';
    
    let min = Math.floor(duracion / 60);
    let sec = duracion % 60;
    let inputDuracion = document.getElementById('edit_can_duracion_texto');
    if(inputDuracion) inputDuracion.value = min + ':' + (sec < 10 ? '0' + sec : sec) + ' min';
}

function cargarModalAlbum(id, titulo, anio) {
    document.getElementById('edit_alb_id').value = id;
    document.getElementById('edit_alb_titulo').value = titulo;
    document.getElementById('edit_alb_anio').value = anio || '';
}

// SISTEMA DE ETIQUETAS (TAGS) GENERALIZADO
function inicializarBuscadorEtiquetas(config) {
    const { idContenedor, idSearch, idResults, idSelected, idHidden, setGlobal, prefix } = config;
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    const listaArtistas = JSON.parse(contenedor.dataset.artistas || '[]');
    const searchInput = document.getElementById(idSearch);
    const resultsContainer = document.getElementById(idResults);

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        if (query.length === 0) { resultsContainer.style.display = 'none'; return; }

        const filtrados = listaArtistas.filter(art => art.nombre.toLowerCase().includes(query) && !setGlobal.has(art.id.toString()));
        if (filtrados.length > 0) {
            resultsContainer.style.display = 'block';
            filtrados.forEach(art => {
                const div = document.createElement('div');
                div.className = 'p-2 text-white-50 hover-bg-carmesi';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = art.nombre;
                
                div.addEventListener('click', function() {
                    if (prefix === 'alb') window.agregarEtiquetaAlbum(art.id, art.nombre);
                    else if (prefix === 'can') window.agregarEtiquetaCancion(art.id, art.nombre);
                    else if (prefix === 'sub') window.agregarEtiquetaSubir(art.id, art.nombre);
                    
                    searchInput.value = '';
                    resultsContainer.style.display = 'none';
                    searchInput.focus(); 
                });
                resultsContainer.appendChild(div);
            });
        } else resultsContainer.style.display = 'none';
    });

    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) resultsContainer.style.display = 'none';
    });
}

function creadorDeEtiquetas(id, nombre, setGlobal, prefix, hiddenContainerId, selectedContainerId) {
    const idStr = id.toString();
    setGlobal.add(idStr);

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'artista_ids[]';
    hiddenInput.value = idStr;
    hiddenInput.id = `${prefix}_hidden_art_${idStr}`;
    document.getElementById(hiddenContainerId).appendChild(hiddenInput);

    const tag = document.createElement('span');
    tag.className = 'badge d-flex align-items-center p-2 rounded-pill';
    tag.style.cssText = 'background-color: #1a1a1a; border: 1px solid var(--sistema-carmesí); color: #ffffff; font-size: 0.8rem;';
    tag.id = `${prefix}_tag_art_${idStr}`;
    tag.innerHTML = `${nombre} <i class="bi bi-x-circle-fill ms-2 text-danger" style="cursor:pointer; font-size: 0.9rem;"></i>`;

    tag.querySelector('i').addEventListener('click', function() {
        tag.remove();
        document.getElementById(`${prefix}_hidden_art_${idStr}`).remove();
        setGlobal.delete(idStr);
    });
    document.getElementById(selectedContainerId).appendChild(tag);
}

// Inicialización de Sets globales
window.editAlbArtistasSeleccionados = new Set();
window.editArtistasSeleccionados = new Set();
window.subirArtistasSeleccionados = new Set();

window.agregarEtiquetaAlbum = (id, nombre) => creadorDeEtiquetas(id, nombre, window.editAlbArtistasSeleccionados, 'alb', 'edit_alb_hidden_inputs', 'edit_alb_selected_artists');
window.agregarEtiquetaCancion = (id, nombre) => creadorDeEtiquetas(id, nombre, window.editArtistasSeleccionados, 'can', 'edit_can_hidden_inputs', 'edit_can_selected_artists');
window.agregarEtiquetaSubir = (id, nombre) => creadorDeEtiquetas(id, nombre, window.subirArtistasSeleccionados, 'sub', 'subir_can_hidden_inputs', 'subir_can_selected_artists');

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
// GESTIÓN VISUAL DEL VOLUMEN
// ==========================================
function actualizarIconoVolumen(isMuted, val) {
    const iconVolumen = document.getElementById('volume-icon');
    if (!iconVolumen) return;
    if (isMuted || val === 0) iconVolumen.className = 'bi bi-volume-mute-fill text-danger fs-5';
    else if (val < 0.5) iconVolumen.className = 'bi bi-volume-down text-secondary fs-5';
    else iconVolumen.className = 'bi bi-volume-up text-secondary fs-5';
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
    } else {
        volumenAnterior = parseFloat(volumeSlider.value);
        reproductor.muted = true;
        volumeSlider.value = 0; 
        actualizarIconoVolumen(true, 0);
    }
}