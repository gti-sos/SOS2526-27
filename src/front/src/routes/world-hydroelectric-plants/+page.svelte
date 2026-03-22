<script>
	import { onMount } from 'svelte';

	const API = 'http://localhost:10000/api/v1/world-hydroelectric-plants';

	let plants = $state([]); 
	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let form = $state({
		country: '', name: '', year: '', river: '', 
		plant_type: '', capacity_mw: '', head_m: '', 
		dam_name: '', res_vol_km3: ''
	});

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(limpiarMensaje, 3000); }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(limpiarMensaje, 3000); }
	function limpiarMensaje() { mensaje = ''; tipoMensaje = ''; }

	async function loadPlants() {
		cargando = true;
		limpiarMensaje();
		try {
			const res = await fetch(API);
			if (!res.ok) throw new Error();
			plants = await res.json();
		} catch {
			mostrarError('No se pudieron cargar los datos de la base de datos.');
		} finally {
			cargando = false;
		}
	}

	async function createPlant() {
		limpiarMensaje();
		const newPlant = { 
			...form, 
			year: Number(form.year), 
			capacity_mw: form.capacity_mw === '' ? null : Number(form.capacity_mw) 
		};
		try {
			const res = await fetch(API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newPlant)
			});
			if (res.status === 409) return mostrarError('Error: Ya existe una central con ese nombre y año.');
			if (!res.ok) return mostrarError('Error: Compruebe que todos los campos son correctos.');
			
			mostrarExito('¡Central añadida correctamente!');
			form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
			await loadPlants();
		} catch {
			mostrarError('Error de conexión con el servidor.');
		}
	}

	async function deleteOne(name, year) {
		if(!confirm(`¿Seguro que quiere eliminar ${name}?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) {
				mostrarExito('Central eliminada con éxito.');
				await loadPlants();
			}
		} catch { mostrarError('No se pudo eliminar la central.'); }
	}

	function goToEdit(name, year) {
		window.location.href = `/world-hydroelectric-plants/${encodeURIComponent(name)}/${year}`;
	}

	onMount(loadPlants);
</script>

<main class="container">
	<h1>Gestión de Centrales Hidroeléctricas</h1>

	{#if cargando}
		<p class="loading">Cargando datos...</p>
	{/if}

	{#if mensaje}
		<div class="alert {tipoMensaje}">{mensaje}</div>
	{/if}

	<section class="form-box">
		<h3>Añadir Nueva Central</h3>
		<form onsubmit={(e) => { e.preventDefault(); createPlant(); }}>
			<div class="input-group">
				<input bind:value={form.country} placeholder="País" required />
				<input bind:value={form.name} placeholder="Nombre de la central" required />
				<input bind:value={form.year} type="number" placeholder="Año" required />
			</div>
			<button type="submit" class="btn-add">Añadir Central</button>
		</form>
	</section>

	<table class="styled-table">
		<thead>
			<tr>
				<th>Nombre de la Central</th>
				<th>Año</th>
				<th>País</th>
				<th>Acciones</th>
			</tr>
		</thead>
		<tbody>
			{#each plants as p (p.name + '-' + p.year)}
				<tr>
					<td>{p.name}</td>
					<td>{p.year}</td>
					<td>{p.country}</td>
					<td class="actions">
						<button class="btn-edit" onclick={() => goToEdit(p.name, p.year)}>Editar</button>
						<button class="btn-delete" onclick={() => deleteOne(p.name, p.year)}>Borrar</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style>
	.container { max-width: 900px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
	.loading { color: #666; font-style: italic; }
	.alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; }
	.exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
	
	.form-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #dee2e6; }
	.input-group { display: flex; gap: 10px; margin-bottom: 10px; }
	input { padding: 8px; border: 1px solid #ced4da; border-radius: 4px; flex: 1; }
	
	.btn-add { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; width: 100%; }
	.btn-edit { background: #ffc107; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
	.btn-delete { background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
	
	.styled-table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
	.styled-table th { background-color: #343a40; color: white; padding: 12px; text-align: left; }
	.styled-table td { padding: 12px; border-bottom: 1px solid #ddd; }
	.actions { display: flex; gap: 5px; }
</style>