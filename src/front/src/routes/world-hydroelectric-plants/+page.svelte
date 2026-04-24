<script>
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	// Usamos ruta relativa para que funcione tanto en local como en Render [cite: 1]
	const API = '/api/v1/world-hydroelectric-plants';

	let plants = $state([]);
	// Nueva variable derivada que se mantiene siempre ordenada [cite: 1]
	let sortedPlants = $derived([...plants].sort((a, b) =>
		a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
	));
	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');
	let primeraCargaPasada = $state(false);

	// Objeto con los 9 campos requeridos para creación [cite: 1]
	let form = $state({
		country: '', name: '', year: '', river: '',
		plant_type: '', capacity_mw: '', head_m: '',
		dam_name: '', res_vol_km3: ''
	});

	// --- NUEVO: Objeto de búsqueda (13 parámetros) [cite: 1] ---
	let search = $state({
		country: '', name: '', year: '', river: '', plant_type: '',
		capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '',
		from: '', to: '', limit: '', offset: ''
	});

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(() => { if(mensaje === texto) mensaje = ''; }, 3000); }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(() => { if(mensaje === texto) mensaje = ''; }, 3000); }

	// FUNCIÓN ACTUALIZADA: Ahora soporta búsquedas sin romper el listado [cite: 1]
	async function loadPlants() {
		cargando = true;
		const queryParams = new SvelteURLSearchParams();

		// Filtros (los 13 parámetros)
		Object.entries(search).forEach(([key, value]) => {
			if (value !== null && String(value).trim() !== '') {
				queryParams.set(key, String(value).trim());
			}
		});

		const queryString = queryParams.toString();
		const url = queryString ? `${API}?${queryString}` : API;

		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error();
			plants = await res.json();
			
			// Solo mostramos mensaje automático si hay una BÚSQUEDA activa
			if (queryString !== "") {
				if (plants.length === 0) {
					mostrarError('No se han encontrado resultados para esos filtros.');
				} else {
					mostrarExito(`¡Operación exitosa! Encontradas ${plants.length} centrales.`);
				}
			} 
			// Si no hay búsqueda y la lista está vacía (Error F07)
			else if (plants.length === 0 && primeraCargaPasada && mensaje === '') {
				mostrarError('La lista está vacía. Pulsa "Cargar datos iniciales".');
			}
		} catch {
			mostrarError('Error al conectar con el servidor.');
		} finally {
			cargando = false;
			primeraCargaPasada = true;
		}
	}

	// --- NUEVO: Función para resetear búsqueda ---
	function resetSearch() {
		search = { country: '', name: '', year: '', river: '', plant_type: '', 
				   capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '',
				   from: '', to: '', limit: '', offset: '' };
		loadPlants();
	}

	// FUNCIÓN CLAVE: Cargar datos iniciales desde el backend [cite: 1]
	async function loadInitialData() {
		cargando = true;
		try {
			const res = await fetch(`${API}/loadInitialData`);
			if (res.ok) {
				await loadPlants(); // Refrescamos tabla
				mostrarExito('¡Datos de ejemplo cargados con éxito!'); 
			} else {
				mostrarError('No se han podido cargar los datos.');
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
				await loadPlants(); // Refrescamos
				mostrarExito('Central añadida correctamente.'); 
				form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
			}
		} catch { mostrarError('Error al crear.'); }
	}

	async function deleteOne(name, year) {
		if(!confirm(`¿Eliminar la central ${name}?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) { 
				await loadPlants(); // Refrescamos
				mostrarExito('Dato eliminado correctamente.'); 
			}
		} catch { mostrarError('Error al borrar.'); }
	}

	async function deleteAll() {
		if(!confirm("¿Borrar TODOS los recursos?")) return;
		try {
			const res = await fetch(API, { method: 'DELETE' });
			if (res.ok) { 
				await loadPlants(); // Refrescamos
				mostrarExito('Base de datos vaciada correctamente.'); 
			}
		} catch { mostrarError('Error al vaciar la base de datos.'); }
	}

	onMount(loadPlants);
</script>

<main class="container">
	<header class="main-header">
    <h1>Gestión de Centrales Hidroeléctricas  <div class="header-buttons">
        <button class="btn-analytics" onclick={() => window.location.href = '/analytics/world-hydroelectric-plants'}>
            📊 Ver Gráfica
        </button>
    </div></h1>
	</header>

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
		<div class="search-header-flex">
			<h3>🔍 Buscador y Filtros Avanzados</h3>
			<div class="search-btns">
				<button class="btn-search-action" onclick={loadPlants}>Aplicar Filtros</button>
				<button class="btn-reset-action" onclick={resetSearch}>Limpiar</button>
			</div>
		</div>

		<div class="search-groups-container">
			<div class="search-subgroup">
				<span class="group-title">Filtros por campos exactos</span>
				<div class="form-grid">
					<input bind:value={search.country} placeholder="País" />
					<input bind:value={search.name} placeholder="Nombre Central" />
					<input bind:value={search.year} type="number" placeholder="Año exacto" />
					<input bind:value={search.river} placeholder="Río" />
					<input bind:value={search.plant_type} placeholder="Tipo" />
					<input bind:value={search.capacity_mw} type="number" step="any" placeholder="Capacidad (MW)" />
					<input bind:value={search.head_m} type="number" step="any" placeholder="Salto (m)" />
					<input bind:value={search.dam_name} placeholder="Nombre Presa" />
					<input bind:value={search.res_vol_km3} type="number" step="any" placeholder="Volumen (km3)" />
				</div>
			</div>

			<div class="search-inline-groups">
				<div class="search-subgroup flex-1">
					<span class="group-title">Rango de años</span>
					<div class="grid-2-col">
						<input bind:value={search.from} type="number" placeholder="Desde (año)" />
						<input bind:value={search.to} type="number" placeholder="Hasta (año)" />
					</div>
				</div>
				<div class="search-subgroup flex-1">
					<span class="group-title">Paginación</span>
					<div class="grid-2-col">
						<input bind:value={search.limit} type="number" placeholder="Límite (Limit)" />
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

	/* ESTILOS DEL BUSCADOR ORGANIZADO [cite: 1] */
	.search-box { background: #e9f5ff !important; border: 2px solid #007bff !important; margin-bottom: 20px; }
	.search-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #b3d7ff; padding-bottom: 10px; }
	.search-header-flex h3 { margin: 0; color: #0056b3; }
	.search-groups-container { display: flex; flex-direction: column; gap: 20px; }
	.search-subgroup { background: white; padding: 15px; border-radius: 6px; border: 1px solid #ced4da; }
	.group-title { display: block; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: #495057; margin-bottom: 10px; background: #f8f9fa; padding: 2px 8px; width: fit-content; border-radius: 3px; }
	.search-inline-groups { display: flex; gap: 15px; flex-wrap: wrap; }
	.flex-1 { flex: 1; min-width: 280px; }
	.grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.btn-search-action { background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
	.btn-reset-action { background: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }

	.form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 30px; }
	.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
	input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
	.btn-add { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }

	.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	.styled-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
	.styled-table th { background: #343a40; color: white; padding: 12px; text-align: left; }
	.styled-table td { padding: 10px; border-bottom: 1px solid #eee; }
	.actions { display: flex; gap: 5px; }
	.btn-edit { background: #ffc107; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: bold; }
	.btn-delete { background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: bold; }
</style>