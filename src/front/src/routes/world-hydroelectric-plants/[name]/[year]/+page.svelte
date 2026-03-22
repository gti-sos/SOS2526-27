<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	const API = '/api/v1/world-hydroelectric-plants';

	let nameParam = $page.params.name;
	let yearParam = $page.params.year;

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
		if (res.ok) alert("Actualizado correctamente");
	}

	onMount(loadResource);
</script>

<main class="container">
	<h1>Editar Central</h1>
	
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
			<label>Capacidad (MW): <input bind:value={form.capacity_mw} type="number" /></label>
			<label>Salto (m): <input bind:value={form.head_m} type="number" /></label>
			<label>Presa: <input bind:value={form.dam_name} /></label>
			<label>Volumen (km3): <input bind:value={form.res_vol_km3} type="number" /></label>
		</div>
		<button type="submit" class="btn-save">Guardar cambios</button>
	</form>
</main>

<style>
	.container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
	.edit-form { background: white; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
	label { display: flex; flex-direction: column; font-weight: bold; }
	input { padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; }
	input:disabled { background: #eee; }
	.btn-save { width: 100%; padding: 12px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; }
	.btn-back { margin-bottom: 15px; padding: 8px 15px; cursor: pointer; }
</style>