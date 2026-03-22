<script>
	import { onMount } from 'svelte';
	const API = '/api/v1/world-hydroelectric-plants';

	let plants = $state([]);
	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	// El objeto form ahora tiene los 9 campos definidos
	let form = $state({
		country: '', name: '', year: '', river: '', 
		plant_type: '', capacity_mw: '', head_m: '', 
		dam_name: '', res_vol_km3: ''
	});

	async function loadPlants() {
		cargando = true;
		try {
			const res = await fetch(API);
			plants = await res.json();
		} catch { /* Error manejado en la UI */ }
		finally { cargando = false; }
	}

	async function createPlant() {
		// Convertimos a número los campos que lo requieren
		const body = {
			...form,
			year: Number(form.year),
			capacity_mw: form.capacity_mw === '' ? null : Number(form.capacity_mw),
			head_m: form.head_m === '' ? null : Number(form.head_m),
			res_vol_km3: form.res_vol_km3 === '' ? null : Number(form.res_vol_km3)
		};

		const res = await fetch(API, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (res.ok) {
			mensaje = "¡Central añadida!"; tipoMensaje = "exito";
			form = { country: '', name: '', year: '', river: '', plant_type: '', capacity_mw: '', head_m: '', dam_name: '', res_vol_km3: '' };
			await loadPlants();
		} else {
			mensaje = "Error al añadir. Revise los datos."; tipoMensaje = "error";
		}
	}

	onMount(loadPlants);
</script>

<main class="container">
	<h1>Gestión de Centrales Hidroeléctricas</h1>

{#if cargando}
    <p class="loading-text">Consultando la base de datos de centrales...</p>
{/if}

{#if mensaje}
    <div class="alert {tipoMensaje}">
        {mensaje}
    </div>
{/if}

<table class="styled-table">
    <thead>
        <tr>
            <th>Nombre</th>
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
                    <button onclick={() => window.location.href = `/world-hydroelectric-plants/${encodeURIComponent(p.name)}/${p.year}`}>
                        Editar
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
	.container { max-width: 1000px; margin: 0 auto; font-family: sans-serif; }
	.form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
	.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
	input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
	.btn-add { background: #007bff; color: white; border: none; padding: 12px; width: 100%; cursor: pointer; border-radius: 4px; }
</style>