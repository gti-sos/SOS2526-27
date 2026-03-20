<script>
	import { onMount } from 'svelte';

	const API = 'http://localhost:10000/api/v1/drinking-water-services';

	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('');

	let entityParam = $state('');
	let yearParam = $state('');

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

	function getParamsFromUrl() {
		const parts = window.location.pathname.split('/');
		yearParam = parts[parts.length - 1];
		entityParam = decodeURIComponent(parts[parts.length - 2]);
	}

	async function loadResource() {
		cargando = true;
		limpiarMensaje();

		try {
			getParamsFromUrl();

			const res = await fetch(
				`${API}/${encodeURIComponent(entityParam)}/${yearParam}`
			);

			if (res.status === 404) {
				mostrarError(`No existe un recurso para "${entityParam}" en el año ${yearParam}.`);
				return;
			}

			if (!res.ok) {
				mostrarError('No se pudo cargar el recurso.');
				return;
			}

			const data = await res.json();

			form = {
				entity: data.entity,
				code: data.code,
				year: String(data.year),
				wat_bas_pop_residence_urban:
					data.wat_bas_pop_residence_urban === null
						? ''
						: String(data.wat_bas_pop_residence_urban)
			};
		} catch  {
			mostrarError('Ha ocurrido un error al cargar el recurso.');
		} finally {
			cargando = false;
		}
	}

	async function updateResource() {
		limpiarMensaje();

		const updated = {
			entity: form.entity,
			code: form.code,
			year: Number(form.year),
			wat_bas_pop_residence_urban:
				form.wat_bas_pop_residence_urban === ''
					? null
					: Number(form.wat_bas_pop_residence_urban)
		};

		try {
			const res = await fetch(
				`${API}/${encodeURIComponent(entityParam)}/${yearParam}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(updated)
				}
			);

			if (res.status === 400) {
				mostrarError('No se pudo actualizar el recurso porque los datos no son válidos.');
				return;
			}

			if (res.status === 404) {
				mostrarError(`No existe un recurso para "${entityParam}" en el año ${yearParam}.`);
				return;
			}

			if (!res.ok) {
				mostrarError('No se pudo actualizar el recurso.');
				return;
			}

			mostrarExito('El recurso se ha actualizado correctamente.');
		} catch  {
			mostrarError('Ha ocurrido un error al actualizar el recurso.');
		}
	}

	function backToList() {
		window.location.href = '/drinking-water-services';
	}

	/** @param {SubmitEvent} event */
	function handleSubmit(event) {
		event.preventDefault();
		updateResource();
	}

	onMount(loadResource);
</script>

<svelte:head>
	<title>Editar recurso</title>
</svelte:head>

<h1>Editar recurso</h1>

<button onclick={backToList}>Volver al listado</button>

{#if cargando}
	<p>Cargando datos...</p>
{/if}

{#if mensaje}
	<p style="color: {tipoMensaje === 'error' ? 'red' : 'green'};">{mensaje}</p>
{/if}

<form onsubmit={handleSubmit}>
	<p>
		<label>
			País o entidad:
			<input bind:value={form.entity} disabled />
		</label>
	</p>

	<p>
		<label>
			Código:
			<input bind:value={form.code} required />
		</label>
	</p>

	<p>
		<label>
			Año:
			<input bind:value={form.year} type="number" disabled />
		</label>
	</p>

	<p>
		<label>
			Población urbana con servicio básico:
			<input bind:value={form.wat_bas_pop_residence_urban} type="number" step="any" />
		</label>
	</p>

	<button type="submit">Guardar cambios</button>
</form>