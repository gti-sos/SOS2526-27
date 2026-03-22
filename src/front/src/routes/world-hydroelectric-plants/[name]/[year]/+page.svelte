<script>
    import { onMount } from "svelte";

    // Variables de estado
    let plants = [];
    let message = "";
    let messageType = ""; // "success" para verde, "danger" para rojo

    // Objeto para la nueva central con los 9 campos que exige tu POST
    let newPlant = {
        country: "",
        name: "",
        year: null,
        river: "",
        plant_type: "",
        capacity_mw: null,
        head_m: null,
        dam_name: "",
        res_vol_km3: null
    };

    // 1. OBTENER TODAS LAS CENTRALES (GET)
    async function getPlants() {
        const res = await fetch("/api/v2/world-hydroelectric-plants");
        if (res.ok) {
            plants = await res.json();
        } else {
            showMsg("Error al cargar la lista de centrales.", "danger");
        }
    }

    // 2. AÑADIR NUEVA CENTRAL (POST)
    async function createPlant() {
        const res = await fetch("/api/v2/world-hydroelectric-plants", {
            method: "POST",
            body: JSON.stringify(newPlant),
            headers: { "Content-Type": "application/json" }
        });

        if (res.status === 201) {
            showMsg(`¡La central '${newPlant.name}' se ha guardado con éxito!`, "success");
            // Reiniciar formulario
            newPlant = { country: "", name: "", year: null, river: "", plant_type: "", capacity_mw: null, head_m: null, dam_name: "", res_vol_km3: null };
            getPlants();
        } else if (res.status === 409) {
            showMsg(`Error: Ya existe un registro para '${newPlant.name}' en el año ${newPlant.year}.`, "danger");
        } else if (res.status === 400) {
            showMsg("Error: Asegúrate de completar los 9 campos con datos válidos.", "danger");
        } else {
            showMsg("Error inesperado al intentar guardar.", "danger");
        }
    }

    // 3. BORRAR UNA CENTRAL (DELETE)
    async function deletePlant(name, year) {
        if (!confirm(`¿Estás seguro de que deseas eliminar la central '${name}' (${year})?`)) return;

        const res = await fetch(`/api/v2/world-hydroelectric-plants/${encodeURIComponent(name)}/${year}`, {
            method: "DELETE"
        });

        if (res.ok) {
            showMsg("Central eliminada correctamente.", "success");
            getPlants();
        } else {
            showMsg("No se ha podido eliminar el recurso seleccionado.", "danger");
        }
    }

    // 4. BORRAR TODO (DELETE TOTAL)
    async function deleteAll() {
        if (confirm("¡PELIGRO! Vas a borrar TODA la base de datos. ¿Deseas continuar?")) {
            const res = await fetch("/api/v2/world-hydroelectric-plants", { method: "DELETE" });
            if (res.ok) {
                showMsg("Base de datos vaciada con éxito.", "success");
                getPlants();
            }
        }
    }

    // 5. CARGAR DATOS INICIALES
    async function loadInitialData() {
        const res = await fetch("/api/v2/world-hydroelectric-plants/loadInitialData");
        if (res.ok) {
            showMsg("Datos de ejemplo cargados correctamente.", "success");
            getPlants();
        } else {
            showMsg("La base de datos ya contiene información.", "danger");
        }
    }

    // Función auxiliar para alertas temporales
    function showMsg(text, type) {
        message = text;
        messageType = type;
        setTimeout(() => { message = ""; }, 4000);
    }

    onMount(getPlants);
</script>

<main>
    <h1>Gestión de Centrales Hidroeléctricas (APS)</h1>

    {#if message}
        <div class="alert alert-{messageType}">{message}</div>
    {/if}

    <div class="toolbar">
        <button class="btn-load" on:click={loadInitialData}>Cargar datos de ejemplo</button>
        <button class="btn-danger" on:click={deleteAll}>Limpiar base de datos</button>
    </div>

    <section class="form-container">
        <h3>Registrar Nueva Central</h3>
        <div class="form-grid">
            <input placeholder="País" bind:value={newPlant.country} />
            <input placeholder="Nombre de la planta" bind:value={newPlant.name} />
            <input type="number" placeholder="Año" bind:value={newPlant.year} />
            <input placeholder="Río" bind:value={newPlant.river} />
            <input placeholder="Tipo (STO/ROR...)" bind:value={newPlant.plant_type} />
            <input type="number" placeholder="Capacidad (MW)" bind:value={newPlant.capacity_mw} />
            <input type="number" placeholder="Salto de agua (m)" bind:value={newPlant.head_m} />
            <input placeholder="Nombre de la presa" bind:value={newPlant.dam_name} />
            <input type="number" placeholder="Volumen embalse (km3)" bind:value={newPlant.res_vol_km3} />
        </div>
        <button class="btn-add" on:click={createPlant}>Añadir a la lista</button>
    </section>

    <table>
        <thead>
            <tr>
                <th>Planta</th>
                <th>Año</th>
                <th>País</th>
                <th>Capacidad (MW)</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each plants as p (p.name + p.year)}
                <tr>
                    <td>{p.name}</td>
                    <td>{p.year}</td>
                    <td>{p.country}</td>
                    <td>{p.capacity_mw}</td>
                    <td>
                        <a href={`#/world-hydroelectric-plants/${encodeURIComponent(p.name)}/${p.year}`} class="btn-edit">
                            Editar
                        </a>
                        <button class="btn-delete" on:click={() => deletePlant(p.name, p.year)}>
                            Eliminar
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    main { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    .alert { padding: 15px; margin-bottom: 20px; border-radius: 5px; font-weight: bold; }
    .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .alert-danger { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    
    .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
    .form-container { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 30px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
    input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    
    button { cursor: pointer; border: none; border-radius: 4px; padding: 10px 15px; }
    .btn-add { background-color: #28a745; color: white; width: 100%; font-size: 1.1em; }
    .btn-load { background-color: #007bff; color: white; }
    .btn-danger { background-color: #dc3545; color: white; }
    .btn-edit { background-color: #ffc107; color: black; text-decoration: none; padding: 5px 10px; border-radius: 4px; display: inline-block; font-size: 0.9em; }
    .btn-delete { background-color: #bd2130; color: white; padding: 5px 10px; font-size: 0.9em; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #343a40; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
</style>