<script>
	import { onMount } from 'svelte';

	const API = 'http://localhost:10000/api/v1/world-hydroelectric-plants';

	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let nameParam = $state('');
	let yearParam = $state('');

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

	function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; }
	function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; }

	function getParamsFromUrl() {
		const parts = window.location.pathname.split('/');
		yearParam = parts[parts.length - 1];
		nameParam = decodeURIComponent(parts[parts.length - 2]);
	}

	async function loadResource() {
		cargando = true;
		try {
			getParamsFromUrl();
			const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`);
			if (!res.ok) throw new Error();
			const data = await res.json();
			form = {
				...data,
				year: String(data.year),
				capacity_mw: data.capacity_mw === null ? '' : String(data.capacity_mw)
			};
		} catch {
			mostrarError('No se pudo cargar el recurso.');
		} finally {
			cargando = false;
		}
	}

	async function updateResource() {
		try {
			const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...form, year: Number(form.year), capacity_mw: Number(form.capacity_mw) })
			});
			if (!res.ok) throw new Error();
			mostrarExito('Actualizado correctamente.');
		} catch {
			mostrarError('Error al actualizar.');
		}
	}

	onMount(loadResource);
</script>

<h1>Editar Central</h1>

{#if cargando}
	<p>Obteniendo información de la central...</p>
{/if}

<button onclick={() => window.location.href = '/world-hydroelectric-plants'}>Volver</button>

<button onclick={() => window.location.href = '/world-hydroelectric-plants'}>Volver</button>

{#if mensaje}
	<p style="color: {tipoMensaje === 'error' ? 'red' : 'green'};">{mensaje}</p>
{/if}

<form onsubmit={(e) => { e.preventDefault(); updateResource(); }}>
	<p><label>Nombre: <input bind:value={form.name} disabled /></label></p>
	<p><label>Año: <input bind:value={form.year} disabled /></label></p>
	<p><label>País: <input bind:value={form.country} /></label></p>
	<button type="submit">Guardar cambios</button>
</form>