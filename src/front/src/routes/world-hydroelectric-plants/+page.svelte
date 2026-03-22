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
				mostrarExito('Central eliminada correctamente.');
				await loadPlants();
			}
		} catch { mostrarError('No se pudo borrar.'); }
	}

	onMount(loadPlants);
</script>

<main class="container">
	<h1>Gestión de Centrales Hidroeléctricas</h1>

	{#if mensaje}
		<div class="alert {tipoMensaje}">{mensaje}</div>
	{/if}

	{#if cargando}
		<p class="loading">Cargando datos...</p>
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
					<td class="name-col">{p.name}</td>
					<td class="year-col">{p.year}</td>
					<td class="actions-col">
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

	<section class="form-box">
		<h3>Añadir Nueva Central</h3>
		<form onsubmit={(e) => { e.preventDefault(); createPlant(); }}>
			<div class="form-grid">
				<input bind:value={form.country} placeholder="País" required />
				<input bind:value={form.name} placeholder="Nombre Central" required />
				<input bind:value={form.year} type="number" placeholder="Año" required />
				<input bind:value={form.river} placeholder="Río" />
				<input bind:value={form.plant_type} placeholder="Tipo (STO/ROR...)" />
				<input bind:value={form.capacity_mw} type="number" placeholder="Capacidad (MW)" />
				<input bind:value={form.head_m} type="number" placeholder="Salto de agua (m)" />
				<input bind:value={form.dam_name} placeholder="Nombre de la presa" />
				<input bind:value={form.res_vol_km3} type="number" placeholder="Volumen embalse (km3)" />
			</div>
			<button type="submit" class="btn-add">Guardar en la lista</button>
		</form>
	</section>
</main>

<style>
	.container { max-width: 1000px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
	
	/* Mensajes de estado */
	.alert { padding: 15px; margin-bottom: 20px; border-radius: 6px; font-weight: bold; text-align: center; }
	.exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
	
	/* Tabla Estilizada */
	.styled-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
	.styled-table th { background: #2c3e50; color: white; padding: 15px; text-align: left; text-transform: uppercase; font-size: 0.85em; letter-spacing: 1px; }
	.styled-table td { padding: 12px 15px; border-bottom: 1px solid #eee; }
	.styled-table tr:hover { background-color: #f9f9f9; }

	.name-col { width: 60%; font-weight: 500; }
	.year-col { width: 15%; color: #666; }
	.actions-col { width: 25%; text-align: right; display: flex; gap: 8px; justify-content: flex-end; }

	/* Botones */
	button { cursor: pointer; border: none; border-radius: 4px; transition: 0.2s; font-weight: bold; }
	.btn-edit { background: #f39c12; color: white; padding: 6px 12px; }
	.btn-edit:hover { background: #e67e22; }
	.btn-delete { background: #e74c3c; color: white; padding: 6px 12px; }
	.btn-delete:hover { background: #c0392b; }

	/* Formulario */
	.form-box { background: #ffffff; padding: 25px; border: 1px solid #e1e4e8; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
	.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 15px; }
	input { padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 0.9em; transition: border 0.3s; }
	input:focus { border-color: #3498db; outline: none; }
	.btn-add { width: 100%; padding: 12px; background: #3498db; color: white; font-size: 1em; }
	.btn-add:hover { background: #2980b9; }
</style>