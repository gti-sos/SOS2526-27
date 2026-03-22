<script>
	import { onMount } from 'svelte';

	// Usamos ruta relativa para evitar fallos en Render y Local
	const API = '/api/v1/world-hydroelectric-plants';

	let plants = $state([]); 
	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	// Definimos el formulario con los 9 campos
	let form = $state({
		country: '', name: '', year: '', river: '', 
		plant_type: '', capacity_mw: '', head_m: '', 
		dam_name: '', res_vol_km3: ''
	});

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(() => mensaje = '', 3000); }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(() => mensaje = '', 3000); }

	async function loadPlants() {
		cargando = true;
		try {
			const res = await fetch(API);
			if (!res.ok) throw new Error();
			plants = await res.json();
		} catch {
			mostrarError('No se pudo conectar con la base de datos.');
		} finally {
			cargando = false;
		}
	}

	async function loadInitialData() {
		try {
			const res = await fetch(`${API}/loadInitialData`);
			if (res.ok) {
				mostrarExito('Datos cargados correctamente.');
				await loadPlants();
			} else {
				mostrarError('La base de datos ya tiene datos.');
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
			if (res.status === 409) return mostrarError('Ya existe una central con ese nombre y año.');
			if (res.ok) {
				mostrarExito('¡Central añadida!');
				form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
				await loadPlants();
			} else {
				mostrarError('Error al crear: revise los datos.');
			}
		} catch { mostrarError('Error de conexión.'); }
	}

	async function deleteOne(name, year) {
		if(!confirm(`¿Eliminar ${name}?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) { mostrarExito('Eliminado.'); await loadPlants(); }
		} catch { mostrarError('Error al borrar.'); }
	}

	onMount(loadPlants);
</script>

<main class="container">
	<h1>Gestión de Centrales Hidroeléctricas</h1>

	<div class="toolbar">
		<button onclick={loadInitialData} class="btn-load">Cargar Datos Iniciales</button>
	</div>

	{#if cargando}
		<p class="loading">Consultando base de datos...</p>
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
				<input bind:value={form.capacity_mw} type="number" placeholder="Capacidad (MW)" />
			</div>
			<button type="submit" class="btn-add">Guardar en la lista</button>
		</form>
	</section>

	<table class="styled-table">
		<thead>
			<tr>
				<th>Central</th>
				<th>Año</th>
				<th>Acciones</th>
			</tr>
		</thead>
		<tbody>
			{#each plants as p (p.name + p.year)}
				<tr>
					<td>{p.name}</td>
					<td>{p.year}</td>
					<td>
						<button class="btn-edit" onclick={() => window.location.href = `/world-hydroelectric-plants/${encodeURIComponent(p.name)}/${p.year}`}>
							Editar
						</button>
						<button class="btn-delete" onclick={() => deleteOne(p.name, p.year)}>Borrar</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style>
	.container { max-width: 900px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
	.alert { padding: 10px; margin: 10px 0; border-radius: 4px; font-weight: bold; }
	.exito { background: #d4edda; color: #155724; }
	.error { background: #f8d7da; color: #721c24; }
	.form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; margin-bottom: 20px; }
	.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
	input { padding: 8px; border: 1px solid #ccc; }
	.btn-add { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
	.styled-table { width: 100%; border-collapse: collapse; }
	.styled-table th { background: #343a40; color: white; padding: 10px; text-align: left; }
	.styled-table td { padding: 10px; border-bottom: 1px solid #ddd; }
	.btn-edit { background: #ffc107; border: none; padding: 5px; cursor: pointer; margin-right: 5px; }
	.btn-delete { background: #dc3545; color: white; border: none; padding: 5px; cursor: pointer; }
</style>