<script>
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const API = '/api/v1/world-hydroelectric-plants';

	// ESTADOS PRINCIPALES
	let plants = $state([]); 
	let cargando = $state(false); 
	let mensaje = $state('');
	let tipoMensaje = $state('');
	let primeraCargaPasada = $state(false);

	// 1. OBJETO DE BÚSQUEDA (Los 13 parámetros de tu API)
	let search = $state({
		country: '', name: '', year: '', river: '', plant_type: '', 
		capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '',
		from: '', to: '', limit: '', offset: ''
	});

	// 2. OBJETO DE CREACIÓN (9 campos) 
	let form = $state({
		country: '', name: '', year: '', river: '', plant_type: '', 
		capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: ''
	});

	// 3. ORDENACIÓN AUTOMÁTICA 
	let sortedPlants = $derived([...plants].sort((a, b) => 
		a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
	));

	// FUNCIONES DE APOYO (REQUISITO F07) 
	function mostrarExito(texto) { 
		mensaje = texto; tipoMensaje = 'exito'; 
		setTimeout(() => { if(mensaje === texto) mensaje = ''; }, 3000); 
	}
	function mostrarError(texto) { 
		mensaje = texto; tipoMensaje = 'error'; 
		setTimeout(() => { if(mensaje === texto) mensaje = ''; }, 3000); 
	}

	// 4. LISTAR Y BUSCAR (Sincronizado con tu backend)
	async function loadPlants() {
		cargando = true;
		const queryParams = new SvelteURLSearchParams();

		// Añadimos solo los filtros que tengan contenido 
		Object.entries(search).forEach(([key, value]) => {
			if (value !== '') queryParams.set(key, value);
		});

		const queryString = queryParams.toString();
		const url = queryString ? `${API}?${queryString}` : API;

		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error();
			plants = await res.json();
			
			// Mensajes Informativos (F07) 
			if (queryString !== "") {
				if (plants.length === 0) {
					mostrarError('No se han encontrado resultados para esos filtros.');
				} else {
					mostrarExito(`¡Operación exitosa! Encontradas ${plants.length} centrales.`);
				}
			} else if (plants.length === 0 && mensaje === '' && primeraCargaPasada) {
				mostrarError('La lista está vacía. Pulsa "Cargar datos iniciales".');
			}
		} catch {
			mostrarError('Error al conectar con el servidor.');
		} finally {
			cargando = false;
			primeraCargaPasada = true;
		}
	}

	function resetSearch() {
		search = { country: '', name: '', year: '', river: '', plant_type: '', 
				   capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '',
				   from: '', to: '', limit: '', offset: '' };
		loadPlants();
	}

	// 5. OPERACIONES CRUD
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
			if (res.status === 409) return mostrarError('Error: Esta central ya existe para ese año.');
			if (res.status === 400) return mostrarError('Error: Faltan campos obligatorios o formato incorrecto.');
			if (res.ok) {
				mostrarExito('¡Operación exitosa! Central añadida correctamente.');
				form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
				await loadPlants();
			}
		} catch { mostrarError('Error de red al intentar crear.'); }
	}

	async function deleteOne(name, year) {
		if(!confirm(`¿Eliminar la central ${name}?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) { mostrarExito('¡Operación exitosa! Recurso eliminado.'); await loadPlants(); }
		} catch { mostrarError('Error al borrar.'); }
	}

	async function deleteAll() {
		if(!confirm("¿Borrar TODOS los recursos de la base de datos?")) return;
		try {
			const res = await fetch(API, { method: 'DELETE' });
			if (res.ok) { mostrarExito('¡Operación exitosa! Base de datos vaciada.'); await loadPlants(); }
		} catch { mostrarError('Error al vaciar la base de datos.'); }
	}

	async function loadInitialData() {
		try {
			const res = await fetch(`${API}/loadInitialData`);
			if (res.ok) {
				mostrarExito('¡Operación exitosa! Datos de ejemplo cargados.');
				await loadPlants();
			} else {
				mostrarError('No se han podido cargar datos iniciales.');
			}
		} catch { mostrarError('Error de red al cargar iniciales.'); }
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

	<section class="search-container">
    <div class="search-top-bar">
        <h3>🔍 Panel de Búsqueda</h3>
        <div class="main-actions">
            <button class="btn-apply" onclick={loadPlants}>Aplicar Filtros</button>
            <button class="btn-clear" onclick={resetSearch}>Limpiar</button>
        </div>
    </div>

    <div class="search-sections-wrapper">
        <div class="inner-section">
            <span class="tag">Filtros de datos</span>
            <div class="grid-fields">
                <input bind:value={search.country} placeholder="País" />
                <input bind:value={search.name} placeholder="Nombre Central" />
                <input bind:value={search.river} placeholder="Río" />
                <input bind:value={search.plant_type} placeholder="Tipo" />
                <input bind:value={search.dam_name} placeholder="Nombre Presa" />
                <input bind:value={search.year} type="number" placeholder="Año exacto" />
                <input bind:value={search.capacity_mw} type="number" step="any" placeholder="Potencia (MW)" />
                <input bind:value={search.head_m} type="number" step="any" placeholder="Salto (m)" />
                <input bind:value={search.res_vol_km3} type="number" step="any" placeholder="Volumen (km3)" />
            </div>
        </div>

        <div class="bottom-row">
            <div class="inner-section half">
                <span class="tag">Rango de Años (From/To)</span>
                <div class="grid-2">
                    <input bind:value={search.from} type="number" placeholder="Desde el año" />
                    <input bind:value={search.to} type="number" placeholder="Hasta el año" />
                </div>
            </div>

            <div class="inner-section half">
                <span class="tag">Control de Paginación</span>
                <div class="grid-2">
                    <input bind:value={search.limit} type="number" placeholder="Límite (Cantidad)" />
                    <input bind:value={search.offset} type="number" placeholder="Salto (Offset)" />
                </div>
            </div>
        </div>
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
					<th>País</th><th>Nombre</th><th>Año</th><th>Río</th><th>Cap. (MW)</th><th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedPlants as p (p.name + p.year)}
					<tr>
						<td>{p.country}</td>
						<td><strong>{p.name}</strong></td>
						<td>{p.year}</td>
						<td>{p.river || '-'}</td>
						<td>{p.capacity_mw || '-'}</td>
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
	.btn-refresh, .btn-load, .btn-danger-all { border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; color: white; font-weight: bold; }
	.btn-refresh { background: #6c757d; }
	.btn-load { background: #17a2b8; }
	.btn-danger-all { background: #343a40; }
	
	.alert { padding: 12px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; text-align: center; }
	.exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
	
	.form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
	.search-box { background: #e9f5ff; border: 1px dashed #007bff; }
	.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 15px; }
	input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
	.btn-add { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }

	.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	.styled-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
	.styled-table th { background: #343a40; color: white; padding: 12px; text-align: left; }
	.styled-table td { padding: 10px; border-bottom: 1px solid #eee; }
	.actions { display: flex; gap: 5px; }
	.btn-edit { background: #ffc107; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: bold; }
	.btn-delete { background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: bold; }

    /* DISEÑO DEL BUSCADOR ORGANIZADO  */
.search-container {
    background: #f1f5f9;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 30px;
}

.search-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #3b82f6;
}

.search-top-bar h3 { margin: 0; color: #1e3a8a; font-size: 1.2rem; }

.main-actions { display: flex; gap: 10px; }
.btn-apply { background: #2563eb; color: white; padding: 8px 16px; border-radius: 6px; }
.btn-clear { background: #94a3b8; color: white; padding: 8px 16px; border-radius: 6px; }

.inner-section {
    background: white;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    margin-bottom: 15px;
}

.tag {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 10px;
    background: #f8fafc;
    padding: 2px 8px;
    border-radius: 4px;
}

.grid-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
}

.bottom-row { display: flex; gap: 15px; flex-wrap: wrap; }
.half { flex: 1; min-width: 280px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

input {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font-size: 0.9rem;
}
</style>