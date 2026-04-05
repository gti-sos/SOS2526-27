<script>
	import { onMount } from 'svelte';

	// Usamos ruta relativa para que funcione en Render
	const API = '/api/v1/water-dams';

	let dams = $state([]);
	// Lista derivada y siempre ordenada por país y nombre
	let sortedDams = $derived([...dams].sort((a, b) =>
		a.country.localeCompare(b.country) || a.dam_name.localeCompare(b.dam_name)
	));

	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');
	let primeraCargaPasada = $state(false);

	// Objeto para creación (11 campos)
	let form = $state({
		grand_id: '', dam_name: '', river: '', country: '', 
		year: '', dam_hgt: '', dam_len: '', area_skm: '', 
		cap_mcm: '', depth_m: '', dis_avg_ls: ''
	});

	// Objeto de búsqueda (Incluye filtros exactos + rangos + paginación)
	let search = $state({
		grand_id: '', dam_name: '', river: '', country: '', 
		year: '', dam_hgt: '', dam_len: '', area_skm: '', 
		cap_mcm: '', depth_m: '', dis_avg_ls: '',
		from: '', to: '', limit: '', offset: ''
	});

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(() => { if(mensaje === texto) mensaje = ''; }, 3000); }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(() => { if(mensaje === texto) mensaje = ''; }, 3000); }

	// Carga de datos con soporte para filtros
	async function loadDams() {
		cargando = true;
		const queryParams = new URLSearchParams();

		// Añadimos solo los campos que tengan contenido
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
			dams = await res.json();
			
			if (queryString !== "") {
				if (dams.length === 0) {
					mostrarError('No se han encontrado presas con esos filtros.');
				} else {
					mostrarExito(`¡Búsqueda exitosa! Encontradas ${dams.length} presas.`);
				}
			} 
			else if (dams.length === 0 && primeraCargaPasada && mensaje === '') {
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
		search = { grand_id: '', dam_name: '', river: '', country: '', 
		           year: '', dam_hgt: '', dam_len: '', area_skm: '', 
		           cap_mcm: '', depth_m: '', dis_avg_ls: '',
		           from: '', to: '', limit: '', offset: '' };
		loadDams();
	}

	async function loadInitialData() {
		cargando = true;
		try {
			const res = await fetch(`${API}/loadInitialData`);
			if (res.ok) {
				await loadDams();
				mostrarExito('¡Datos de ejemplo cargados con éxito!'); 
			} else {
				mostrarError('No se han podido cargar los datos iniciales.');
			}
		} catch {
			mostrarError('Error de red al intentar cargar datos.');
		} finally {
			cargando = false;
		}
	}

	async function createDam() {
		const newDam = {
			...form,
			grand_id: Number(form.grand_id),
			year: Number(form.year),
			dam_hgt: form.dam_hgt === '' ? null : Number(form.dam_hgt),
			dam_len: form.dam_len === '' ? null : Number(form.dam_len),
			area_skm: form.area_skm === '' ? null : Number(form.area_skm),
			cap_mcm: form.cap_mcm === '' ? null : Number(form.cap_mcm),
			depth_m: form.depth_m === '' ? null : Number(form.depth_m),
			dis_avg_ls: form.dis_avg_ls === '' ? null : Number(form.dis_avg_ls)
		};
		try {
			const res = await fetch(API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newDam)
			});
			if (res.status === 409) return mostrarError('Error: Esta presa ya existe (Nombre y Año duplicados).');
			if (res.status === 400) return mostrarError('Error: Datos incorrectos o incompletos.');
			if (res.ok) {
				await loadDams();
				mostrarExito('Presa añadida correctamente.'); 
				form = { grand_id: '', dam_name: '', river: '', country: '', year: '', dam_hgt: '', dam_len: '', area_skm: '', cap_mcm: '', depth_m: '', dis_avg_ls: '' };
			}
		} catch { mostrarError('Error al crear el recurso.'); }
	}

	async function deleteOne(name, year) {
		if(!confirm(`¿Eliminar la presa ${name} (${year})?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) { 
				await loadDams();
				mostrarExito('Presa eliminada.'); 
			}
		} catch { mostrarError('Error al borrar.'); }
	}

	async function deleteAll() {
		if(!confirm("¿Borrar TODAS las presas?")) return;
		try {
			const res = await fetch(API, { method: 'DELETE' });
			if (res.ok) { 
				await loadDams();
				mostrarExito('Base de datos vaciada.'); 
			}
		} catch { mostrarError('Error al vaciar la base de datos.'); }
	}

	onMount(loadDams);
</script>

<main class="container">
	<h1>Gestión de Presas (Water Dams)</h1>

	<div class="toolbar">
		<button class="btn-refresh" onclick={loadDams}>Actualizar Lista</button>
		<button class="btn-load" onclick={loadInitialData}>Cargar Datos Iniciales</button>
		<button class="btn-danger-all" onclick={deleteAll}>Borrar Todo</button>
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
				<button class="btn-search-action" onclick={loadDams}>Aplicar Filtros</button>
				<button class="btn-reset-action" onclick={resetSearch}>Limpiar</button>
			</div>
		</div>

		<div class="search-groups-container">
			<div class="search-subgroup">
				<span class="group-title">Filtros por campos exactos</span>
				<div class="form-grid">
					<input bind:value={search.dam_name} placeholder="Nombre Presa" />
					<input bind:value={search.country} placeholder="País" />
					<input bind:value={search.year} type="number" placeholder="Año exacto" />
					<input bind:value={search.river} placeholder="Río" />
					<input bind:value={search.grand_id} type="number" placeholder="Grand ID" />
					<input bind:value={search.dam_hgt} type="number" step="any" placeholder="Altura (m)" />
					<input bind:value={search.cap_mcm} type="number" step="any" placeholder="Capacidad (mcm)" />
					<input bind:value={search.depth_m} type="number" step="any" placeholder="Profundidad (m)" />
					<input bind:value={search.dis_avg_ls} type="number" step="any" placeholder="Descarga (l/s)" />
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
		<h3>Añadir Nueva Presa</h3>
		<form onsubmit={(e) => { e.preventDefault(); createDam(); }}>
			<div class="form-grid">
				<input bind:value={form.dam_name} placeholder="Nombre Presa" required />
				<input bind:value={form.country} placeholder="País" required />
				<input bind:value={form.year} type="number" placeholder="Año" required />
				<input bind:value={form.river} placeholder="Río" />
				<input bind:value={form.grand_id} type="number" placeholder="Grand ID" required />
				<input bind:value={form.dam_hgt} type="number" step="any" placeholder="Altura (m)" />
				<input bind:value={form.dam_len} type="number" step="any" placeholder="Longitud (m)" />
				<input bind:value={form.area_skm} type="number" step="any" placeholder="Área (km2)" />
				<input bind:value={form.cap_mcm} type="number" step="any" placeholder="Capacidad (mcm)" />
				<input bind:value={form.depth_m} type="number" step="any" placeholder="Profundidad (m)" />
				<input bind:value={form.dis_avg_ls} type="number" step="any" placeholder="Descarga (l/s)" />
			</div>
			<button type="submit" class="btn-add">Guardar Presa</button>
		</form>
	</section>

	<div class="table-container">
		<table class="styled-table">
			<thead>
				<tr>
					<th>País</th><th>Nombre</th><th>Año</th><th>Río</th><th>ID</th>
					<th>Alt.</th><th>Cap.</th><th>Prof.</th><th>Desc. (l/s)</th><th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedDams as d (d.dam_name + d.year)}
					<tr>
						<td>{d.country}</td>
						<td><strong>{d.dam_name}</strong></td>
						<td>{d.year}</td>
						<td>{d.river || '-'}</td>
						<td>{d.grand_id}</td>
						<td>{d.dam_hgt ? d.dam_hgt + 'm' : '-'}</td>
						<td>{d.cap_mcm ? d.cap_mcm + ' mcm' : '-'}</td>
						<td>{d.depth_m ? d.depth_m + 'm' : '-'}</td>
						<td>{d.dis_avg_ls ? d.dis_avg_ls + ' l/s' : '-'}</td>
						<td class="actions">
							<button class="btn-edit" onclick={() => window.location.href = `/water-dams/${encodeURIComponent(d.dam_name)}/${d.year}`}>Editar</button>
							<button class="btn-delete" onclick={() => deleteOne(d.dam_name, d.year)}>Borrar</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>

<style>
	.container { max-width: 1400px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
	.toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
	.btn-refresh { background: #6c757d; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
	.btn-load { background: #17a2b8; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
	.btn-danger-all { background: #343a40; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }

	.loading-msg { color: #007bff; font-weight: bold; text-align: center; }
	.alert { padding: 12px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; text-align: center; }
	.exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

	/* ESTILOS DEL BUSCADOR INTEGRADOS */
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
	.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px; }
	input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
	.btn-add { width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }

	.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	.styled-table { width: 100%; border-collapse: collapse; font-size: 0.85em; }
	.styled-table th { background: #2563eb; color: white; padding: 12px 8px; text-align: center; }
	.styled-table td { padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; }
	.actions { display: flex; gap: 5px; justify-content: center; }
	.btn-edit { background: #ffc107; border: none; padding: 5px 8px; cursor: pointer; border-radius: 3px; font-weight: bold; }
	.btn-delete { background: #dc3545; color: white; border: none; padding: 5px 8px; cursor: pointer; border-radius: 3px; font-weight: bold; }
</style>