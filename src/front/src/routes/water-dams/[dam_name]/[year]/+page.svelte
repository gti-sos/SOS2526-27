<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation'; // Usamos goto para navegar mejor

	const API = '/api/v1/water-dams';

	// Parámetros de la URL
	let nameParam = $page.params.dam_name;
	let yearParam = $page.params.year;

	// Estados de Svelte 5
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let form = $state({
		grand_id: '', dam_name: '', river: '', country: '', 
		year: '', dam_hgt: '', dam_len: '', area_skm: '', 
		cap_mcm: '', depth_m: '', dis_avg_ls: ''
	});

	async function loadResource() {
		try {
			const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`);
			if (res.ok) {
				const data = await res.json();
				// Mapeamos los datos asegurando que los nulos sean strings vacíos para el input
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
			} else if (res.status === 404) {
				mensaje = `No existe ninguna presa registrada con el nombre "${nameParam}" en el año ${yearParam}.`;
				tipoMensaje = 'danger';
			}
		} catch (e) {
			mensaje = "Error de conexión al cargar la presa.";
			tipoMensaje = 'danger';
		}
	}

	async function updateResource() {
		try {
			const res = await fetch(`${API}/${encodeURIComponent(nameParam)}/${yearParam}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
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

			if (res.status === 200) {
				mensaje = "¡Operación exitosa! Los cambios se han guardado correctamente.";
				tipoMensaje = 'success';
				setTimeout(() => goto('/water-dams'), 1500); // Redirigir tras éxito
			} else if (res.status === 400) {
				mensaje = "Error: Los datos introducidos no son válidos o están incompletos.";
				tipoMensaje = 'danger';
			} else {
				mensaje = "Ha ocurrido un error inesperado al intentar actualizar.";
				tipoMensaje = 'danger';
			}
		} catch (e) {
			mensaje = "Error de red al intentar actualizar.";
			tipoMensaje = 'danger';
		}
		
		window.scrollTo(0, 0);
	}

	onMount(loadResource);
</script>

<main class="container mt-5">
	<div class="d-flex justify-content-between align-items-center mb-4">
		<h1>Editar Presa</h1>
		<button class="btn btn-outline-secondary" onclick={() => goto('/water-dams')}>
			Volver al listado
		</button>
	</div>

	{#if mensaje}
		<div class="alert alert-{tipoMensaje} alert-dismissible fade show" role="alert">
			{mensaje}
			<button type="button" class="btn-close" onclick={() => mensaje = ''}></button>
		</div>
	{/if}

	<div class="card shadow-sm">
		<div class="card-body">
			<form onsubmit={(e) => { e.preventDefault(); updateResource(); }}>
				<div class="row g-3">
					<div class="col-md-6">
						<label class="form-label fw-bold">Nombre de la presa</label>
						<input class="form-control bg-light" bind:value={form.dam_name} disabled />
					</div>
					<div class="col-md-6">
						<label class="form-label fw-bold">Año</label>
						<input class="form-control bg-light" bind:value={form.year} disabled />
					</div>

					<div class="col-md-6">
						<label class="form-label fw-bold">País</label>
						<input class="form-control" bind:value={form.country} required />
					</div>
					<div class="col-md-6">
						<label class="form-label fw-bold">Río</label>
						<input class="form-control" bind:value={form.river} />
					</div>
					<div class="col-md-4">
						<label class="form-label fw-bold">Grand ID</label>
						<input class="form-control" type="number" bind:value={form.grand_id} required />
					</div>
					<div class="col-md-4">
						<label class="form-label fw-bold">Altura (m)</label>
						<input class="form-control" type="number" step="any" bind:value={form.dam_hgt} />
					</div>
					<div class="col-md-4">
						<label class="form-label fw-bold">Longitud (m)</label>
						<input class="form-control" type="number" step="any" bind:value={form.dam_len} />
					</div>
					<div class="col-md-4">
						<label class="form-label fw-bold">Área (km2)</label>
						<input class="form-control" type="number" step="any" bind:value={form.area_skm} />
					</div>
					<div class="col-md-4">
						<label class="form-label fw-bold">Capacidad (mcm)</label>
						<input class="form-control" type="number" step="any" bind:value={form.cap_mcm} />
					</div>
					<div class="col-md-4">
						<label class="form-label fw-bold">Profundidad (m)</label>
						<input class="form-control" type="number" step="any" bind:value={form.depth_m} />
					</div>
					<div class="col-md-12">
						<label class="form-label fw-bold">Descarga promedio (l/s)</label>
						<input class="form-control" type="number" step="any" bind:value={form.dis_avg_ls} />
					</div>

					<div class="col-12 mt-4">
						<button type="submit" class="btn btn-success btn-lg w-100">
							Guardar cambios
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</main>

<style>
	/* Eliminamos los estilos personalizados pesados para usar los de Bootstrap */
	main {
		max-width: 900px;
	}
	.form-label {
		color: #495057;
	}
</style>