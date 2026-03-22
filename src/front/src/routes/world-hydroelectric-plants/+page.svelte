<script>
	import { onMount } from 'svelte';

	const API = '/api/v1/world-hydroelectric-plants';

	let plants = $state([]); 
	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let form = $state({
		country: '', name: '', year: '', river: '', 
		plant_type: '', capacity_mw: '', head_m: '', 
		dam_name: '', res_vol_km3: ''
	});

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(() => mensaje = '', 3000); }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(() => mensaje = '', 3000); }

	// FUNCIÓN 1: Listar todos los recursos
	async function loadPlants() {
		cargando = true;
		try {
			const res = await fetch(API);
			if (!res.ok) throw new Error();
			plants = await res.json();
			if (plants.length === 0) mostrarError('No hay centrales en la lista.');
		} catch {
			mostrarError('Error al conectar con la base de datos.');
		} finally {
			cargando = false;
		}
	}

	// FUNCIÓN 2: Borrar todos los recursos
	async function deleteAll() {
		if(!confirm("¿Está seguro de que desea eliminar TODAS las centrales? Esta acción no se puede deshacer.")) return;
		try {
			const res = await fetch(API, { method: 'DELETE' });
			if (res.ok) {
				mostrarExito('Se han eliminado todos los registros correctamente.');
				await loadPlants();
			}
		} catch { mostrarError('Error al vaciar la base de datos.'); }
	}

	async function loadInitialData() {
		try {
			const res = await fetch(`${API}/loadInitialData`);
			if (res.ok) {
				mostrarExito('Datos de ejemplo cargados con éxito.');
				await loadPlants();
			}
		} catch { mostrarError('Error al cargar datos iniciales.'); }
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
			if (res.status === 409) return mostrarError('Error: Esta central ya existe para ese año.');
			if (res.ok) {
				mostrarExito('¡Nueva central añadida a la lista!');
				form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
				await loadPlants();
			}
		} catch { mostrarError('Error de conexión.'); }
	}

	async function deleteOne(name, year) {
		if(!confirm(`¿Eliminar la central ${name}?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) { mostrarExito('Eliminado.'); await loadPlants(); }
		} catch { mostrarError('Error al borrar.'); }
	}

	onMount(loadPlants);
</script>

<main class="container">
	<h1>Gestión de Centrales Hidroeléctricas</h1>

	<div class="global-actions">
		<button class="btn-refresh" onclick={loadPlants}>Listar todos los recursos</button>
		<button class="btn-load" onclick={loadInitialData}>Cargar datos iniciales</button>
		<button class="btn-danger-all" onclick={deleteAll}>Borrar todos los recursos</button>
	</div>

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
				<input bind:value={form.dam_name} placeholder="Nombre Presa" />
				<input bind:value={form.res_vol_km3} type="number" placeholder="Volumen (km3)" />
			</div>
			<button type="submit" class="btn-add">Añadir a la lista</button>
		</form>
	</section>

	{#if cargando}
		<p class="loading">Consultando datos...</p>
	{/if}

	<table class="styled-table">
		<thead>
			<tr>
				<th>Nombre de la Central</th>
				<th>Año</th>
				<th>Acciones</th>
			</tr>
		</thead>
		<tbody>
			{#each plants as p (p.name + p.year)}
				<tr>
					<td>{p.name}</td>
					<td>{p.year}</td>
					<td class="actions">
						<button class="btn-edit" onclick={() => window.location.href = `/world-hydroelectric-plants/${encodeURIComponent(p.name)}/${p.year}`}>
							Editar
						</button>
						<button class="btn-delete" onclick={() => deleteOne(p.name, p.year)}>
							Borrar
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style>
	.container { max-width: 1000px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
	
	.global-actions { display: flex; gap: 10px; margin-bottom: 25px; }
	.btn-refresh { background: #6c757d; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
	.btn-load { background: #17a2b8; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
	.btn-danger-all { background: #343a40; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
	.btn-danger-all:hover { background: #000; }

	.alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; text-align: center; }
	.exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
	
	.form-box { background: #ffffff; padding: 25px; border: 1px solid #dee2e6; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
	.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 15px; }
	input { padding: 10px; border: 1px solid #ced4da; border-radius: 5px; }
	.btn-add { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }

	.styled-table { width: 100%; border-collapse: collapse; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
	.styled-table th { background: #343a40; color: white; padding: 12px; text-align: left; }
	.styled-table td { padding: 12px; border-bottom: 1px solid #eee; }
	.actions { display: flex; gap: 8px; }
	.btn-edit { background: #ffc107; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
	.btn-delete { background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
</style>