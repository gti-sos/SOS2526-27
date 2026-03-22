<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	const API = '/api/v1/water-dams';

	// Obtenemos los parámetros de la URL (el nombre de la presa y el año)
	let nameParam = $page.params.dam_name;
	let yearParam = $page.params.year;

	// Variables para mensajes de estado con la sintaxis de Svelte 5
	let mensaje = $state('');
	let tipoMensaje = $state('');

	// Objeto con tus 11 campos
	let form = $state({
		grand_id: '', dam_name: '', river: '', country: '', 
		year: '', dam_hgt: '', dam_len: '', area_skm: '', 
		cap_mcm: '', depth_m: '', dis_avg_ls: ''
	});

	async function loadResource() {
		const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`);
		if (res.ok) {
			const data = await res.json();
			// Rellenamos el formulario y nos aseguramos de que los nulos sean strings vacíos para los inputs
			form = { 
				...data, 
				year: String(data.year),
				grand_id: String(data.grand_id),
				dam_hgt: data.dam_hgt ?? '',
				dam_len: data.dam_len ?? '',
				area_skm: data.area_skm ?? '',
				cap_mcm: data.cap_mcm ?? '',
				depth_m: data.depth_m ?? '',
				dis_avg_ls: data.dis_avg_ls ?? ''
			};
		} else {
			mensaje = `Error: No se ha podido cargar la presa "${nameParam}".`;
			tipoMensaje = 'error';
		}
	}

	async function updateResource() {
		const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...form,
				// Convertimos de nuevo a número antes de enviar a la API
				grand_id: Number(form.grand_id),
				year: Number(form.year),
				dam_hgt: form.dam_hgt === '' ? null : Number(form.dam_hgt),
				dam_len: form.dam_len === '' ? null : Number(form.dam_len),
				area_skm: form.area_skm === '' ? null : Number(form.area_skm),
				cap_mcm: form.cap_mcm === '' ? null : Number(form.cap_mcm),
				depth_m: form.depth_m === '' ? null : Number(form.depth_m),
				dis_avg_ls: form.dis_avg_ls === '' ? null : Number(form.dis_avg_ls)
			})
		});

		// Gestión de respuestas "para humanos" como pide el enunciado
		if (res.status === 200) {
			mensaje = "¡Operación exitosa! Los cambios se han guardado correctamente.";
			tipoMensaje = 'exito';
		} else if (res.status === 400) {
			mensaje = "Error: Los datos introducidos no son válidos o están incompletos.";
			tipoMensaje = 'error';
		} else if (res.status === 404) {
			mensaje = `Error: No se encuentra la presa "${nameParam}" para actualizar.`;
			tipoMensaje = 'error';
		} else {
			mensaje = "Ha ocurrido un error inesperado al intentar actualizar.";
			tipoMensaje = 'error';
		}
		
		// Desplazamos hacia arriba para que el usuario vea el mensaje
		window.scrollTo(0, 0);
		setTimeout(() => mensaje = '', 3000);
	}

	onMount(loadResource);
</script>

<main class="container">
	<h1>Editar Presa</h1>
	
	{#if mensaje}
		<div class="alert {tipoMensaje}">{mensaje}</div>
	{/if}
	
	<button class="btn-back" onclick={() => window.location.href = '/water-dams'}>
		Volver al listado
	</button>

	<form onsubmit={(e) => { e.preventDefault(); updateResource(); }} class="edit-form">
		<div class="form-grid">
			<label>Nombre de la presa: <input bind:value={form.dam_name} disabled /></label>
			<label>Año: <input bind:value={form.year} disabled /></label>
			
			<label>País: <input bind:value={form.country} required /></label>
			<label>Río: <input bind:value={form.river} /></label>
			<label>Grand ID: <input bind:value={form.grand_id} type="number" /></label>
			
			<label>Altura (m): <input bind:value={form.dam_hgt} type="number" step="any" /></label>
			<label>Longitud (m): <input bind:value={form.dam_len} type="number" step="any" /></label>
			<label>Área (km2): <input bind:value={form.area_skm} type="number" step="any" /></label>
			
			<label>Capacidad (mcm): <input bind:value={form.cap_mcm} type="number" step="any" /></label>
			<label>Profundidad (m): <input bind:value={form.depth_m} type="number" step="any" /></label>
			<label>Descarga (l/s): <input bind:value={form.dis_avg_ls} type="number" step="any" /></label>
		</div>
		<button type="submit" class="btn-save">Guardar cambios</button>
	</form>
</main>

<style>
	.container { max-width: 850px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
	
	.alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; text-align: center; font-weight: bold; }
	.exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

	.edit-form { background: white; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	
	/* Formulario en dos columnas para que quepan mejor los 11 campos */
	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
	
	label { display: flex; flex-direction: column; font-weight: bold; font-size: 0.9em; }
	input { padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; }
	input:disabled { background: #f0f0f0; color: #666; cursor: not-allowed; }
	
	.btn-save { width: 100%; padding: 14px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 1.1em; }
	.btn-save:hover { background: #218838; }
	
	.btn-back { margin-bottom: 15px; padding: 8px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #f8f9fa; }
	.btn-back:hover { background: #e2e6ea; }

	@media (max-width: 600px) {
		.form-grid { grid-template-columns: 1fr; }
	}
</style>