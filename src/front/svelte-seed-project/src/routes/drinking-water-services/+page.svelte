<script>
	import { onMount } from 'svelte';

	const API = 'http://localhost:10000/api/v1/drinking-water-services';

	/** @type {Array<{entity:string, code:string, year:number, wat_bas_pop_residence_urban:number|null}>} */
	let services = $state([]);

	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let form = $state({
		entity: '',
		code: '',
		year: '',
		wat_bas_pop_residence_urban: ''
	});
    /** @param {string} texto */
	function mostrarExito(texto) {
		mensaje = texto;
		tipoMensaje = 'exito';
	}
    /** @param {string} texto */
	function mostrarError(texto) {
		mensaje = texto;
		tipoMensaje = 'error';
	}

	function limpiarMensaje() {
		mensaje = '';
		tipoMensaje = '';
	}

	async function loadServices() {
		cargando = true;
		limpiarMensaje();

		try {
			const res = await fetch(API);

			if (!res.ok) {
				throw new Error('No se pudieron cargar los datos');
			}

			services = await res.json();
		} catch {
			mostrarError('No se pudieron cargar los datos de servicios de agua.');
		} finally {
			cargando = false;
		}
	}

	async function createService() {
		limpiarMensaje();

		const newService = {
			entity: form.entity,
			code: form.code,
			year: Number(form.year),
			wat_bas_pop_residence_urban:
				form.wat_bas_pop_residence_urban === ''
					? null
					: Number(form.wat_bas_pop_residence_urban)
		};

		try {
			const res = await fetch(API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newService)
			});

			if (res.status === 400) {
				mostrarError('No se pudo crear el recurso porque los datos no son válidos.');
				return;
			}

			if (res.status === 409) {
				mostrarError(
					`Ya existe un recurso para "${form.entity}" en el año ${form.year}.`
				);
				return;
			}

			if (!res.ok) {
				mostrarError('No se pudo crear el recurso.');
				return;
			}

			form = {
				entity: '',
				code: '',
				year: '',
				wat_bas_pop_residence_urban: ''
			};

			mostrarExito('Recurso creado correctamente.');
			await loadServices();
			mostrarExito('Recurso creado correctamente.');
		} catch  {
			mostrarError('Ha ocurrido un error al crear el recurso.');
		}
	}

	async function deleteAll() {
		limpiarMensaje();

		try {
			const res = await fetch(API, { method: 'DELETE' });

			if (!res.ok) {
				mostrarError('No se pudieron borrar todos los recursos.');
				return;
			}

			await loadServices();
			mostrarExito('Todos los recursos se han borrado correctamente.');
		} catch {
			mostrarError('Ha ocurrido un error al borrar todos los recursos.');
		}
	}

	/**
	 * @param {string} entity
	 * @param {number} year
	 */
	async function deleteOne(entity, year) {
		limpiarMensaje();

		try {
			const res = await fetch(`${API}/${encodeURIComponent(entity)}/${year}`, {
				method: 'DELETE'
			});

			if (res.status === 404) {
				mostrarError(`No existe un recurso para "${entity}" en el año ${year}.`);
				return;
			}

			if (!res.ok) {
				mostrarError(`No se pudo borrar el recurso de "${entity}" del año ${year}.`);
				return;
			}

			await loadServices();
			mostrarExito(`El recurso de "${entity}" del año ${year} se ha borrado correctamente.`);
		} catch  {
			mostrarError('Ha ocurrido un error al borrar el recurso.');
		}
	}

	async function loadInitialData() {
		limpiarMensaje();

		try {
			const res = await fetch(`${API}/loadInitialData`);

			if (res.status === 409) {
				mostrarError('Los datos iniciales ya estaban cargados.');
				return;
			}

			if (!res.ok) {
				mostrarError('No se pudieron cargar los datos iniciales.');
				return;
			}

			await loadServices();
			mostrarExito('Los datos iniciales se han cargado correctamente.');
		} catch {
			mostrarError('Ha ocurrido un error al cargar los datos iniciales.');
		}
	}

	/**
	 * @param {string} entity
	 * @param {number} year
	 */
	function goToEdit(entity, year) {
		window.location.href =
			'/drinking-water-services/' + encodeURIComponent(entity) + '/' + year;
	}

	/** @param {SubmitEvent} event */
	function handleSubmit(event) {
		event.preventDefault();
		createService();
	}

	onMount(loadServices);
</script>

<svelte:head>
	<title>Servicios de agua potable</title>
</svelte:head>

<h1>Servicios de agua potable</h1>

<h2>Crear nuevo recurso</h2>

<form onsubmit={handleSubmit}>
	<input bind:value={form.entity} placeholder="País o entidad" required />
	<input bind:value={form.code} placeholder="Código" required />
	<input bind:value={form.year} type="number" placeholder="Año" required />
	<input
		bind:value={form.wat_bas_pop_residence_urban}
		type="number"
		step="any"
		placeholder="Población urbana con servicio básico"
	/>
	<button type="submit">Crear recurso</button>
</form>

<br />

<button onclick={loadServices}>Actualizar listado</button>
<button onclick={loadInitialData}>Cargar datos iniciales</button>
<button onclick={deleteAll}>Borrar todos los recursos</button>

{#if cargando}
	<p>Cargando datos...</p>
{/if}

{#if mensaje}
	<p style="color: {tipoMensaje === 'error' ? 'red' : 'green'};">{mensaje}</p>
{/if}

<h2>Listado de recursos</h2>

{#if services.length === 0}
	<p>No hay recursos disponibles.</p>
{:else}
	<table border="1" cellpadding="6">
		<thead>
			<tr>
				<th>País o entidad</th>
				<th>Código</th>
				<th>Año</th>
				<th>Población urbana con servicio básico</th>
				<th>Acciones</th>
			</tr>
		</thead>
		<tbody>
			{#each services as s (s.entity + '-' + s.year)}
				<tr>
					<td>{s.entity}</td>
					<td>{s.code}</td>
					<td>{s.year}</td>
					<td>{s.wat_bas_pop_residence_urban}</td>
					<td>
						<button onclick={() => goToEdit(s.entity, s.year)}>Editar</button>
						<button onclick={() => deleteOne(s.entity, s.year)}>Borrar</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}