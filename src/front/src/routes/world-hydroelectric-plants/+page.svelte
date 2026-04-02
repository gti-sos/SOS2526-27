<script>
    import { onMount } from 'svelte';
    import { SvelteURLSearchParams } from 'svelte/reactivity';

    // Usamos ruta relativa para que funcione tanto en local como en Render
    const API = '/api/v1/world-hydroelectric-plants';

    let plants = $state([]); 
	// Nueva variable derivada que se mantiene siempre ordenada 
	let sortedPlants = $derived([...plants].sort((a, b) => 
		a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
	));
    let cargando = $state(false); 
    let mensaje = $state('');
    let tipoMensaje = $state('');
    let primeraCargaPasada = $state(false);

    // Objeto con los 9 campos requeridos
    let form = $state({
        country: '', name: '', year: '', river: '', 
        plant_type: '', capacity_mw: '', head_m: '', 
        dam_name: '', res_vol_km3: ''
    });

    let search = $state({
        country: '',
        river: '',
        plant_type: '',
        from: '',
        to: ''
    });

    function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(() => mensaje = '', 3000); }
    function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(() => mensaje = '', 3000); }

    // Función para listar todos los recursos
    
    async function loadPlants() {
		cargando = true;
		
		// 1. Construimos los parámetros de búsqueda 
		const queryParams = new SvelteURLSearchParams();
		if (search.country) queryParams.set("country", search.country);
		if (search.river) queryParams.set("river", search.river);
		if (search.plant_type) queryParams.set("plant_type", search.plant_type);
		if (search.from) queryParams.set("from", search.from);
		if (search.to) queryParams.set("to", search.to);

		const queryString = queryParams.toString();
		const url = queryString ? `${API}?${queryString}` : API;

		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error();
			
			const data = await res.json();
			plants = data; // Actualización reactiva de la tabla 
			
			// --- USO DE primeraCargaPasada PARA ELIMINAR EL AVISO ---
			if (plants.length === 0 && queryString === "" && mensaje === "" && primeraCargaPasada) {
				mostrarError('La lista está vacía. Pulsa "Cargar datos iniciales".');
			} 
			// --- LÓGICA DE BÚSQUEDA (F07) ---
			else if (queryString !== "") {
				if (plants.length === 0) {
					mostrarError('No se han encontrado resultados para esta búsqueda.');
				} else {
					mostrarExito(`¡Operación exitosa! Se han encontrado ${plants.length} centrales.`);
				}
			}
		} catch { 
			// FIX: Eliminamos (err) porque no se usa, desaparece el aviso 
			mostrarError('Error al conectar con el servidor.');
		} finally {
			cargando = false;
			primeraCargaPasada = true; // Se marca como cargada tras el primer intento
		}
	}

    // Función para limpiar la búsqueda
    function resetSearch() {
        search = { country: '', river: '', plant_type: '', from: '', to: '' };
        loadPlants();
    }

    // FUNCIÓN CLAVE: Cargar datos iniciales desde el backend
    async function loadInitialData() {
        cargando = true;
        try {
            const res = await fetch(`${API}/loadInitialData`);
            if (res.ok) {
                mostrarExito('¡Datos de ejemplo cargados con éxito!');
                await loadPlants(); // Refrescamos la tabla para ver los nuevos datos
            } else {
                mostrarError('No se han podido cargar los datos (posiblemente la base de datos no está vacía).');
            }
        } catch {
            mostrarError('Error de red al intentar cargar datos iniciales.');
        } finally {
            cargando = false;
        }
    }

    async function createPlant() {
        const newPlant = { 
            ...form, 
            year: Number(form.year),
            capacity_mw: form.capacity_mw === '' ? null : Number(form.capacity_mw),
            head_m: form.head_m === '' ? null : Number(form.head_m),
            res_vol_km3: form.res_vol_km3 === '' ? null : Number(form.res_vol_km3)
        };
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPlant)
            });
            if (res.status === 409) return mostrarError('Error: Esta central ya existe.');
            if (res.ok) {
                mostrarExito('Central añadida correctamente.');
                form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
                await loadPlants();
            }
        } catch { mostrarError('Error al crear.'); }
    }

    async function deleteOne(name, year) {
        if(!confirm(`¿Eliminar la central ${name}?`)) return;
        try {
            const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
            if (res.ok) { mostrarExito('Central eliminada.'); await loadPlants(); }
        } catch { mostrarError('Error al borrar.'); }
    }

    async function deleteAll() {
        if(!confirm("¿Borrar TODOS los recursos?")) return;
        try {
            const res = await fetch(API, { method: 'DELETE' });
            if (res.ok) { mostrarExito('Base de datos vaciada.'); await loadPlants(); }
        } catch { mostrarError('Error al vaciar la base de datos.'); }
    }

    onMount(loadPlants);
</script>

<main class="container">
    <h1>Gestión de Centrales Hidroeléctricas</h1>

    <div class="toolbar">
        <button class="btn-refresh" onclick={loadPlants}>Listar todos</button>
        <button class="btn-load" onclick={loadInitialData}>Cargar datos iniciales</button>
        <button class="btn-danger-all" onclick={deleteAll}>Borrar todos los recursos</button>
    </div>

    {#if mensaje}
        <div class="alert {tipoMensaje}">{mensaje}</div>
    {/if}

    {#if cargando}
        <p class="loading-msg">Procesando solicitud...</p>
    {/if}

    <section class="form-box search-box">
        <h3>🔍 Filtrar y Buscar</h3>
        <div class="form-grid">
            <input bind:value={search.country} placeholder="País" />
            <input bind:value={search.river} placeholder="Río" />
            <input bind:value={search.plant_type} placeholder="Tipo (STO/ROR...)" />
            <input bind:value={search.from} type="number" placeholder="Año desde" />
            <input bind:value={search.to} type="number" placeholder="Año hasta" />
        </div>
        <div class="toolbar" style="margin-top: 10px;">
            <button class="btn-load" onclick={loadPlants}>Buscar con filtros</button>
            <button class="btn-refresh" onclick={resetSearch}>Limpiar búsqueda</button>
        </div>
    </section>

    <section class="form-box">
        <h3>Añadir Nueva Central</h3>
        <form onsubmit={(e) => { e.preventDefault(); createPlant(); }}>
            <div class="form-grid">
                <input bind:value={form.country} placeholder="País" required />
                <input bind:value={form.name} placeholder="Nombre Central" required />
                <input bind:value={form.year} type="number" placeholder="Año" required />
                <input bind:value={form.river} placeholder="Río" />
                <input bind:value={form.plant_type} placeholder="Tipo" />
                <input bind:value={form.capacity_mw} type="number" step="any" placeholder="Capacidad (MW)" />
                <input bind:value={form.head_m} type="number" step="any" placeholder="Salto/Altura (m)" />
                <input bind:value={form.dam_name} placeholder="Nombre Presa" />
                <input bind:value={form.res_vol_km3} type="number" step="any" placeholder="Volumen (km3)" />
            </div>
            <button type="submit" class="btn-add">Guardar en la lista</button>
        </form>
    </section>

    <div class="table-container">
        <table class="styled-table">
            <thead>
                <tr>
                    <th>País</th><th>Nombre</th><th>Año</th><th>Río</th><th>Tipo</th>
                    <th>Capacidad (MW)</th><th>Salto (m)</th><th>Presa</th><th>Vol. (km3)</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#each sortedPlants as p (p.name + p.year)}
                    <tr>
                        <td>{p.country}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.year}</td>
                        <td>{p.river || '-'}</td>
                        <td>{p.plant_type || '-'}</td>
                        <td>{p.capacity_mw || '-'}</td>
                        <td>{p.head_m || '-'}</td>
                        <td>{p.dam_name || '-'}</td>
                        <td>{p.res_vol_km3 || '-'}</td>
                        <td class="actions">
                            <button class="btn-edit" onclick={() => window.location.href = `/world-hydroelectric-plants/${encodeURIComponent(p.name)}/${p.year}`}>Editar</button>
                            <button class="btn-delete" onclick={() => deleteOne(p.name, p.year)}>Borrar</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</main>

<style>
    .container { max-width: 1200px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
    .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
    .btn-refresh { background: #6c757d; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
    .btn-load { background: #17a2b8; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
    .btn-danger-all { background: #343a40; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
    
    .loading-msg { color: #007bff; font-weight: bold; }
    .alert { padding: 12px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; text-align: center; }
    .exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    
    .form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 30px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
    input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .btn-add { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }

    .table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .styled-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
    .styled-table th { background: #343a40; color: white; padding: 12px; text-align: left; }
    .styled-table td { padding: 10px; border-bottom: 1px solid #eee; }
    .actions { display: flex; gap: 5px; }
    .btn-edit { background: #ffc107; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; }
    .btn-delete { background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; }
    .search-box {
        background: #e9ecef; /* Un gris diferente para el buscador */
        border: 1px dashed #6c757d;
    }
</style>