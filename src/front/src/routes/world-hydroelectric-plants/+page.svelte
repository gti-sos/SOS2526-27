<script>
	import { onMount } from 'svelte';

	const API = '/api/v1/world-hydroelectric-plants';

	let plants = $state([]); 
	let cargando = $state(false); // [cite: 3]
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let form = $state({
		country: '', name: '', year: '', river: '', 
		plant_type: '', capacity_mw: '', head_m: '', 
		dam_name: '', res_vol_km3: ''
	});

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(() => mensaje = '', 3000); }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(() => mensaje = '', 3000); }

	async function loadPlants() {
		cargando = true; // [cite: 6]
		try {
			const res = await fetch(API);
			if (!res.ok) throw new Error();
			plants = await res.json();
		} catch { mostrarError('Error al cargar la lista.'); }
		finally { cargando = false; } // [cite: 10]
	}

	async function loadInitialData() {
		try {
			const res = await fetch(`${API}/loadInitialData`);
			if (res.ok) { mostrarExito('Datos iniciales cargados.'); await loadPlants(); }
		} catch { mostrarError('Error de conexión.'); }
	}

	async function deleteAll() {
		if(!confirm("¿Borrar todos los recursos?")) return;
		try {
			const res = await fetch(API, { method: 'DELETE' });
			if (res.ok) { mostrarExito('Base de datos vaciada.'); await loadPlants(); }
		} catch { mostrarError('Error al borrar todo.'); }
	}

	async function createPlant() {
		const newPlant = { ...form, year: Number(form.year), capacity_mw: Number(form.capacity_mw) };
		try {
			const res = await fetch(API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newPlant)
			});
			if (res.ok) {
				mostrarExito('¡Central añadida!');
				form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
				await loadPlants();
			} else { mostrarError('Error al añadir central.'); }
		} catch { mostrarError('Error de conexión.'); }
	}

	onMount(loadPlants);
</script>

<main class="container">
	<h1>Gestión de Centrales Hidroeléctricas</h1>

	<div class="toolbar">
		<button onclick={loadPlants} class="btn-refresh">Listar todos</button>
		<button onclick={loadInitialData} class="btn-load">Cargar datos iniciales</button>
		<button onclick={deleteAll} class="btn-danger">Borrar todos los recursos</button>
	</div>

	{#if cargando}
		<p class="loading-msg">Consultando base de datos...</p>
	{/if}

	{#if mensaje}
		<div class="alert {tipoMensaje}">{mensaje}</div>
	{/if}

	<section class="form-box">
		<h3>Añadir Nueva Central</h3>
		<form onsubmit={(e) => { e.preventDefault(); createPlant(); }}>
			<div class="form-grid">
				<input bind:value={form.country} placeholder="País" required />
				<input bind:value={form.name} placeholder="Nombre Central" required />
				<input bind:value={form.year} type="number" placeholder="Año" required />
				<input bind:value={form.river} placeholder="Río" />
				<input bind:value={form.plant_type} placeholder="Tipo" />
				<input bind:value={form.capacity_mw} type="number" placeholder="Capacidad (MW)" />
				<input bind:value={form.head_m} type="number" placeholder="Salto (m)" />
				<input bind:value={form.dam_name} placeholder="Presa" />
				<input bind:value={form.res_vol_km3} type="number" placeholder="Volumen (km3)" />
			</div>
			<button type="submit" class="btn-add">Añadir a la lista</button>
		</form>
	</section>

	<div class="table-container">
		<table class="styled-table">
			<thead>
				<tr>
					<th>País</th><th>Nombre</th><th>Año</th><th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each plants as p (p.name + p.year)}
					<tr>
						<td>{p.country}</td><td>{p.name}</td><td>{p.year}</td>
						<td>
							<button onclick={() => window.location.href = `/world-hydroelectric-plants/${encodeURIComponent(p.name)}/${p.year}`}>Editar</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>

<style>
	.container { max-width: 1000px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
	.toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
	.loading-msg { color: #007bff; font-weight: bold; }
	.alert { padding: 10px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; }
	.exito { background: #d4edda; color: #155724; }
	.error { background: #f8d7da; color: #721c24; }
	.form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
	.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
	input { padding: 8px; border: 1px solid #ccc; }
	.btn-add { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
	.styled-table { width: 100%; border-collapse: collapse; }
	.styled-table th { background: #343a40; color: white; padding: 10px; text-align: left; }
	.styled-table td { padding: 10px; border-bottom: 1px solid #ddd; }
</style>