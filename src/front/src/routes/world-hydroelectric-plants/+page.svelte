<script>
	import { onMount } from 'svelte';

	const API = '/api/v1/world-hydroelectric-plants';

	let plants = $state([]); 
	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	// Objeto con los 9 campos de tu API
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
			mostrarError('No se pudo cargar la lista de centrales.');
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
			if (res.status === 409) return mostrarError('Error: Ya existe esta central.');
			if (res.ok) {
				mostrarExito('¡Central añadida con éxito!');
				form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
				await loadPlants();
			}
		} catch { mostrarError('Error de conexión.'); }
	}

	async function deleteOne(name, year) {
		if(!confirm(`¿Seguro que quiere eliminar la central ${name}?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) {
				mostrarExito('Central eliminada.');
				await loadPlants();
			}
		} catch { mostrarError('No se pudo borrar el recurso.'); }
	}

	async function deleteAll() {
		if(!confirm("¿Borrar todos los recursos?")) return;
		const res = await fetch(API, { method: 'DELETE' });
		if (res.ok) { mostrarExito('Base de datos vaciada.'); await loadPlants(); }
	}

	onMount(loadPlants);
</script>

<main class="container">
	<h1>Gestión de Centrales Hidroeléctricas</h1>

	<div class="toolbar">
		<button class="btn-refresh" onclick={loadPlants}>Listar todos</button>
		<button class="btn-danger" onclick={deleteAll}>Borrar todos</button>
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
				<input bind:value={form.capacity_mw} type="number" step="any" placeholder="Capacidad (MW)" />
				<input bind:value={form.head_m} type="number" step="any" placeholder="Salto (m)" />
				<input bind:value={form.dam_name} placeholder="Nombre Presa" />
				<input bind:value={form.res_vol_km3} type="number" step="any" placeholder="Volumen (km3)" />
			</div>
			<button type="submit" class="btn-add">Guardar en la lista</button>
		</form>
	</section>

	{#if cargando}
		<p class="loading">Cargando datos...</p>
	{/if}

	<div class="table-container">
		<table class="styled-table">
			<thead>
				<tr>
					<th>País</th><th>Nombre</th><th>Año</th><th>Río</th><th>Tipo</th>
					<th>Potencia</th><th>Salto</th><th>Presa</th><th>Vol.</th><th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each plants as p (p.name + p.year)}
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
	</div>
</main>

<style>
	.container { max-width: 1200px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
	.toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
	.alert { padding: 12px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; text-align: center; }
	.exito { background: #d4edda; color: #155724; }
	.error { background: #f8d7da; color: #721c24; }
	
	.form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 30px; }
	.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
	input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
	.btn-add { width: 100%; padding: 12px; background: #007bff; color: white; border: none; cursor: pointer; border-radius: 4px; }

	.table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	.styled-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
	.styled-table th { background: #343a40; color: white; padding: 12px; text-align: left; }
	.styled-table td { padding: 10px; border-bottom: 1px solid #eee; }
	
	.actions { display: flex; gap: 5px; }
	.btn-edit { background: #ffc107; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; }
	.btn-delete { background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; }
</style>