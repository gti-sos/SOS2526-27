<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores"; // Para leer los parámetros de la URL

    // Extraemos los parámetros de la ruta dinámica
    let name = $page.params.name;
    let year = $page.params.year;

    let plant = {}; // Objeto donde cargaremos los datos de la API
    let message = "";
    let messageType = "";

    // --- FUNCIÓN: OBTENER DATOS DE UNA CENTRAL CONCRETA (GET) ---
    async function getPlant() {
        // Usamos encodeURIComponent porque el nombre puede tener espacios
        const res = await fetch(`/api/v2/world-hydroelectric-plants/${encodeURIComponent(name)}/${year}`);
        
        if (res.ok) {
            plant = await res.json();
            console.log("Datos cargados:", plant);
        } else {
            message = `No se ha encontrado la central '${name}' para el año ${year}.`;
            messageType = "danger";
        }
    }

    // --- FUNCIÓN: ACTUALIZAR DATOS (PUT) ---
    async function updatePlant() {
        const res = await fetch(`/api/v2/world-hydroelectric-plants/${encodeURIComponent(name)}/${year}`, {
            method: "PUT",
            body: JSON.stringify(plant),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            message = "¡Los datos se han actualizado correctamente!";
            messageType = "success";
        } else if (res.status === 400) {
            message = "Error: Los datos no coinciden o la estructura es incorrecta.";
            messageType = "danger";
        } else {
            message = "Error inesperado al intentar actualizar la central.";
            messageType = "danger";
        }
    }

    onMount(getPlant);
</script>

<main class="container">
    <h2>Editando: {name} ({year})</h2>

    {#if message}
        <div class="alert alert-{messageType}">{message}</div>
    {/if}

    {#if plant.name}
        <section class="edit-card">
            <div class="field">
                <label for="country">País:</label>
                <input id="country" bind:value={plant.country} />
            </div>
            <div class="field">
                <label for="river">Río:</label>
                <input id="river" bind:value={plant.river} />
            </div>
            <div class="field">
                <label for="type">Tipo de Planta:</label>
                <input id="type" bind:value={plant.plant_type} />
            </div>
            <div class="field">
                <label for="cap">Capacidad (MW):</label>
                <input id="cap" type="number" bind:value={plant.capacity_mw} />
            </div>
            <div class="field">
                <label for="head">Salto (m):</label>
                <input id="head" type="number" bind:value={plant.head_m} />
            </div>
            <div class="field">
                <label for="dam">Nombre de la Presa:</label>
                <input id="dam" bind:value={plant.dam_name} />
            </div>
            <div class="field">
                <label for="vol">Volumen (km3):</label>
                <input id="vol" type="number" bind:value={plant.res_vol_km3} />
            </div>

            <div class="button-group">
                <button class="btn-save" on:click={updatePlant}>Guardar Cambios</button>
                <a href="#/world-hydroelectric-plants" class="btn-back">Volver al Listado</a>
            </div>
        </section>
    {/if}
</main>

<style>
    .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    .alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; }
    .alert-success { background: #d4edda; color: #155724; }
    .alert-danger { background: #f8d7da; color: #721c24; }
    
    .edit-card { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .field { margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    label { font-weight: bold; width: 40%; }
    input { width: 55%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    
    .button-group { display: flex; gap: 10px; margin-top: 20px; }
    button, .btn-back { padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; text-align: center; font-size: 1em; flex: 1; }
    .btn-save { background-color: #28a745; color: white; }
    .btn-back { background-color: #6c757d; color: white; }
</style>