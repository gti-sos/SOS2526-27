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

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; }
	function limpiarMensaje() { mensaje = ''; tipoMensaje = ''; }

	async function loadPlants() {
		cargando = true;
		limpiarMensaje();
		try {
			const res = await fetch(API);
			if (!res.ok) throw new Error();
			plants = await res.json();
		} catch {
			mostrarError('No se pudieron cargar los datos.');
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
			if (res.status === 409) return mostrarError('Ya existe ese recurso.');
			if (!res.ok) return mostrarError('Error al crear.');
			
			mostrarExito('Recurso creado correctamente.');
			await loadPlants();
		} catch {
			mostrarError('Error de conexión.');
		}
	}

	async function deleteOne(name, year) {
		limpiarMensaje();
		try {
			const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
			if (res.ok) {
				mostrarExito('Eliminado con éxito.');
				await loadPlants();
			}
		} catch { mostrarError('Error al borrar.'); }
	}

	function goToEdit(name, year) {
		window.location.href = `/world-hydroelectric-plants/${encodeURIComponent(name)}/${year}`;
	}

	onMount(loadPlants);
</script>

<h1>Gestión de Centrales Hidroeléctricas</h1>

<h1>Gestión de Centrales Hidroeléctricas</h1>

{#if cargando}
	<p>Consultando la base de datos...</p>
{/if}

{#if mensaje}
	<p style="color: {tipoMensaje === 'error' ? 'red' : 'green'};">{mensaje}</p>
{/if}

{#if mensaje}
	<p style="color: {tipoMensaje === 'error' ? 'red' : 'green'};">{mensaje}</p>
{/if}

<form onsubmit={(e) => { e.preventDefault(); createPlant(); }}>
	<input bind:value={form.country} placeholder="País" required />
	<input bind:value={form.name} placeholder="Nombre" required />
	<input bind:value={form.year} type="number" placeholder="Año" required />
	<button type="submit">Añadir Central</button>
</form>

<table border="1">
	<thead>
		<tr>
			<th>Nombre</th>
			<th>Año</th>
			<th>Acciones</th>
		</tr>
	</thead>
	<tbody>
		{#each plants as p (p.name + '-' + p.year)}
			<tr>
				<td>{p.name}</td>
				<td>{p.year}</td>
				<td>
					<button onclick={() => goToEdit(p.name, p.year)}>Editar</button>
					<button onclick={() => deleteOne(p.name, p.year)}>Borrar</button>
				</td>
			</tr>
		{/each}
	</tbody>
</table>