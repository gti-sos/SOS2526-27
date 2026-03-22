<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	const API = '/api/v1/world-hydroelectric-plants';

	let nameParam = $page.params.name;
	let yearParam = $page.params.year;

	// Variables para mensajes de estado 
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let form = $state({
		country: '', name: '', year: '', river: '', 
		plant_type: '', capacity_mw: '', head_m: '', 
		dam_name: '', res_vol_km3: ''
	});

	async function loadResource() {
		const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`);
		if (res.ok) {
			const data = await res.json();
			form = { ...data, 
				year: String(data.year),
				capacity_mw: data.capacity_mw ?? '',
				head_m: data.head_m ?? '',
				res_vol_km3: data.res_vol_km3 ?? ''
			};
		}
	}

	async function updateResource() {
		const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...form,
				year: Number(form.year),
				capacity_mw: form.capacity_mw === '' ? null : Number(form.capacity_mw),
				head_m: form.head_m === '' ? null : Number(form.head_m),
				res_vol_km3: form.res_vol_km3 === '' ? null : Number(form.res_vol_km3)
			})
		});

		// Gestión de respuestas según código de estado
		if (res.status === 200) {
			mensaje = "¡Operación exitosa! Los cambios se han guardado correctamente.";
			tipoMensaje = 'exito';
		} else if (res.status === 400) {
			mensaje = "Error: Los datos introducidos no son válidos.";
			tipoMensaje = 'error';
		} else if (res.status === 404) {
			mensaje = `Error: No existe la central "${nameParam}" para actualizar.`;
			tipoMensaje = 'error';
		} else {
			mensaje = "Ha ocurrido un error inesperado.";
			tipoMensaje = 'error';
		}
		setTimeout(() => mensaje = '', 3000);
	}

	onMount(loadResource);
</script>

<main class="container">
	<h1>Editar Central</h1>
	
	{#if mensaje}
		<div class="alert {tipoMensaje}">{mensaje}</div>
	{/if}
	
	<button class="btn-back" onclick={() => window.location.href = '/world-hydroelectric-plants'}>
		Volver al listado
	</button>

	<form onsubmit={(e) => { e.preventDefault(); updateResource(); }} class="edit-form">
		<div class="form-grid">
			<label>Nombre: <input bind:value={form.name} disabled /></label>
			<label>Año: <input bind:value={form.year} disabled /></label>
			<label>País: <input bind:value={form.country} required /></label>
			<label>Río: <input bind:value={form.river} /></label>
			<label>Tipo: <input bind:value={form.plant_type} /></label>
			<label>Capacidad (MW): <input bind:value={form.capacity_mw} type="number" step="any" /></label>
			<label>Salto (m): <input bind:value={form.head_m} type="number" step="any" /></label>
			<label>Presa: <input bind:value={form.dam_name} /></label>
			<label>Volumen (km3): <input bind:value={form.res_vol_km3} type="number" step="any" /></label>
		</div>
		<button type="submit" class="btn-save">Guardar cambios</button>
	</form>
</main>

<style>
	.container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
	
	/* Estilos para alertas  */
	.alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; text-align: center; font-weight: bold; }
	.exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

	.edit-form { background: white; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
	label { display: flex; flex-direction: column; font-weight: bold; }
	input { padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; }
	input:disabled { background: #eee; }
	.btn-save { width: 100%; padding: 12px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; }
	.btn-back { margin-bottom: 15px; padding: 8px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; }
</style>