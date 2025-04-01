async function enviarImagen() {
    const inputNombre = document.getElementById("nombreProducto");
    const inputArchivo = document.getElementById("imagenProducto");

    if (!inputNombre.value || !inputArchivo.files.length) {
        alert("Debes proporcionar un nombre y seleccionar una imagen.");
        return;
    }

    nombreImagen = inputArchivo.files[0]['name'];
    extension = nombreImagen.substring(nombreImagen.indexOf("."));

    const formData = new FormData();
    formData.append("nombreProducto", inputNombre.value + extension);
    formData.append("imagenProducto", inputArchivo.files[0]);

    try {
        const response = await fetch("http://127.0.0.1:8000/subir-imagen", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error al subir imagen:", errorData.detail);
            alert("Error al subir imagen: " + errorData.detail);
            return;
        }

        const result = await response.json();
        alert(result.mensaje);

        $('#dataTable').DataTable().destroy();
        cargarImagenes();
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("Error al conectar con la API.");
    }
}

async function cargarImagenes() {
    const respuesta = await fetch("http://127.0.0.1:8000/imagenes");
    const imagenes = await respuesta.json();

    let contenedor = document.getElementById("imagenesContainer");
    contenedor.innerHTML = "";  // Limpiar antes de cargar

    imagenes.forEach(imagen => {
        let img = document.createElement("img");
        img.classList.add("img-fluid", "rounded", "shadow-sm");
        img.src = imagen.url;
        img.alt = imagen.nombre;
        img.style.width = "150px";
        img.style.margin = "10px";
        img.style.cursor = "pointer";
        img.onclick = () => cargarEtiquetasImagen(imagen.nombre);
        contenedor.appendChild(img);
    });

    cargarCategoria("todas");
    initializeDataTable();
}

async function cargarEtiquetasImagen(nombreProducto){
    const response =  await fetch(`http://127.0.0.1:8000/cargar-etiquetas-imagen?nombreProducto=${nombreProducto}`);
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al cargar la información:", errorData.detail);
        alert("Error al cargar la información: " + errorData.detail);
        return;
    }
    const result = await response.json();

    $('#dataTable').DataTable().destroy();
    cargarDataTable(result);
    initializeDataTable();
}

async function cargarCategoria(categoria) {
    const response =  await fetch(`http://127.0.0.1:8000/cargar-etiquetas-categorias?categoria=${categoria}`);

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al cargar las etiquetas de las camisetas:", errorData.detail);
        alert("Error al cargar las etiquetas de las camisetas: " + errorData.detail);
        return;
    }
        
    const result = await response.json();

    $('#dataTable').DataTable().destroy();
    cargarDataTable(result);
    initializeDataTable();
}

async function eliminarImagen(nombreProducto) {
    const response =  await fetch(`http://127.0.0.1:8000/eliminar-imagen/${nombreProducto}`, { method: "DELETE" });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al eliminar la imagen:", errorData.detail);
        alert("Error al eliminar la imagen: " + errorData.detail);
        return; 
    }
        
    const result = await response.json();
    alert(result.mensaje);

    $('#dataTable').DataTable().destroy();
    cargarImagenes();
}

function mostrarImagen(file, nombreProducto) {
    let imagenesContainer = document.getElementById("imagenesContainer");

    let divCol = document.createElement("div");
    divCol.classList.add("col");

    let img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.classList.add("img-fluid", "rounded", "shadow-sm");
    img.style.cursor = "pointer";
    img.title = "Haz clic para analizar";
    img.alt = nombreProducto;
    img.style.width = "150px";
    img.style.margin = "10px";
    img.onclick = () => cargarEtiquetasImagen(nombreProducto);
    

    divCol.appendChild(img);
    imagenesContainer.appendChild(divCol);
}

function cargarDataTable(result) {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";
    
    result.Imagenes.forEach(imagen => {
        const tr = document.createElement("tr");
        
        const tdNombreProducto = document.createElement("td");
        tdNombreProducto.textContent = imagen.nombre.substring(0, imagen.nombre.indexOf("."));
        tr.appendChild(tdNombreProducto);

        for (let i = 0; i < 2; i++) {
            const etiqueta = imagen.etiquetas[i] || {};
            
            const tdName = document.createElement("td");
            tdName.textContent = etiqueta.Name || "-";
            tr.appendChild(tdName);
            
            const tdConfidence = document.createElement("td");
            tdConfidence.textContent = etiqueta.Confidence || "-";
            tr.appendChild(tdConfidence);
            
            const tdCategoryName = document.createElement("td");
            tdCategoryName.textContent = etiqueta.Categories?.[0]?.Name || "-";
            tr.appendChild(tdCategoryName);
        }
        
        const tdButton = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.textContent = "Eliminar";
        deleteButton.onclick = () => eliminarImagen(imagen.nombre);
        tdButton.appendChild(deleteButton);
        tr.appendChild(tdButton);

        tbody.appendChild(tr);
    });
}

function initializeDataTable(){
    $(document).ready(function () {
        $('#dataTable').DataTable({
            language: {
                "decimal": "",
                "emptyTable": "No hay información",
                "info": "Mostrando _START_ a _END_ de _TOTAL_ Entradas",
                "infoEmpty": "Mostrando 0 to 0 of 0 Entradas",
                "infoFiltered": "(Filtrado de _MAX_ total entradas)",
                "infoPostFix": "",
                "thousands": ",",
                "lengthMenu": "Mostrar _MENU_ Entradas",
                "loadingRecords": "Cargando...",
                "processing": "Procesando...",
                "search": "Buscar:",
                "zeroRecords": "Sin resultados encontrados",
                "paginate": {
                    "first": "Primero",
                    "last": "Ultimo",
                    "next": "Siguiente",
                    "previous": "Anterior"
                }
            }
        });
    });
}

// Llamar a la función cuando cargue la página
window.onload = cargarImagenes;
