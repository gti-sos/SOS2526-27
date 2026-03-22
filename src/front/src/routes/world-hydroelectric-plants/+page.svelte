<script>
	import { onMount } from 'svelte';
    
	const API = 'http://localhost:10000/api/v1/world-hydroelectric-plants';

	let cargando = $state(false); // 
	let mensaje = $state(''); // [cite: 2]
	let tipoMensaje = $state(''); // 

	let nameParam = $state('');
	let yearParam = $state('');

	// Formulario con los 9 campos de tu API
	let form = $state({
		country: '',
		name: '',
		year: '',
		river: '',
		plant_type: '',
		capacity_mw: '',
		head_m: '',
		dam_name: '',
		res_vol_km3: ''
	});

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; } // [cite: 4]
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; } // [cite: 5]

	function getParamsFromUrl() {
		const parts = window.location.pathname.split('/');
		yearParam = parts[parts.length - 1];
		nameParam = decodeURIComponent(parts[parts.length - 2]);
	}

	async function loadResource() {
		cargando = true; // [cite: 7]
		try {
			getParamsFromUrl(); // [cite: 7]
			const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`);
			if (!res.ok) throw new Error();
			const data = await res.json();
			
			// Cargamos todos los campos asegurando que los números sean strings para el input
			form = {
				...data,
				year: String(data.year),
				capacity_mw: data.capacity_mw === null ? '' : String(data.capacity_mw),
				head_m: data.head_m === null ? '' : String(data.head_m),
				res_vol_km3: data.res_vol_km3 === null ? '' : String(data.res_vol_km3)
			};
		} catch {
			mostrarError('No se pudo cargar la información de la central.'); // [cite: 11]
		} finally {
			cargando = false; // [cite: 11]
		}
	}

	async function updateResource() {
		try {
			const updated = {
				...form,
				year: Number(form.year),
				capacity_mw: form.capacity_mw === '' ? null : Number(form.capacity_mw),
				head_m: form.head_m === '' ? null : Number(form.head_m),
				res_vol_km3: form.res_vol_km3 === '' ? null : Number(form.res_vol_km3)
			};

			const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updated)
			});
			
			if (!res.ok) throw new Error();
			mostrarExito('¡Central actualizada con éxito!'); // [cite: 16]
		} catch {
			mostrarError('Error al guardar los cambios.'); // [cite: 17]
		}
	}

	onMount(loadResource); // [cite: 18]
</script>

<main class="container">
	<h1>Editar Central Hidroeléctrica</h1>
	
	<button class="btn-back" onclick={() => window.location.href = '/world-hydroelectric-plants'}>
		Volver al listado
	</button>

	{#if cargando}
		<p class="loading">Obteniendo datos de la central...</p>
	{/if}

	{#if mensaje}
		<div class="alert {tipoMensaje}">{mensaje}</div>
	{/if}

	{#if form.name && !cargando}
		<form onsubmit={(e) => { e.preventDefault(); updateResource(); }} class="edit-form">
			<div class="form-grid">
				<label>Nombre (ID): <input bind:value={form.name} disabled /></label>
				<label>Año (ID): <input bind:value={form.year} disabled /></label>
				<label>País: <input bind:value={form.country} required /></label>
				<label>Río: <input bind:value={form.river} /></label>
				<label>Tipo: <input bind:value={form.plant_type} /></label>
				<label>Capacidad (MW): <input bind:value={form.capacity_mw} type="number" step="any" /></label>
				<label>Salto (m): <input bind:value={form.head_m} type="number" step="any" /></label>
				<label>Presa: <input bind:value={form.dam_name} /></label>
				<label>Volumen (km3): <input bind:value={form.res_vol_km3} type="number" step="any" /></label>
			</div>
			<button type="submit" class="btn-save">Guardar Cambios</button>
		</form>
	{/if}
</main>

<style>
	.container { max-width: 800px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
	.btn-back { margin-bottom: 20px; padding: 8px 15px; cursor: pointer; }
	.loading { color: #007bff; font-weight: bold; }
	.alert { padding: 15px; margin: 10px 0; border-radius: 4px; }
	.exito { background: #d4edda; color: #155724; }
	.error { background: #f8d7da; color: #721c24; }
	
	.edit-form { background: #fdfdfd; padding: 25px; border: 1px solid #eee; border-radius: 8px; }
	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
	label { display: flex; flex-direction: column; font-weight: bold; font-size: 0.9em; }
	input { padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; }
	input:disabled { background: #e9ecef; cursor: not-allowed; }
	
	.btn-save { background: #28a745; color: white; border: none; padding: 12px; width: 100%; border-radius: 4px; cursor: pointer; font-size: 1.1em; }
</style>