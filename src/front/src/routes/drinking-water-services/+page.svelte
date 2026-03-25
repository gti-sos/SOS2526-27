<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';

    const API = '/api/v1/drinking-water-services';

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

    let filtros = $state({
        from: '',
        to: ''
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
            const res = await fetch(resolve(API));

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
            const res = await fetch(resolve(API), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newService)
            });

            if (res.status === 400) {
                mostrarError('No se pudo crear el recurso porque los datos no son válidos.');
                return;
            }

            if (res.status === 409) {
                mostrarError(`Ya existe un recurso para "${form.entity}" en el año ${form.year}.`);
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

            await loadServices();
            mostrarExito('Recurso creado correctamente.');
        } catch {
            mostrarError('Ha ocurrido un error al crear el recurso.');
        }
    }

    async function deleteAll() {
        limpiarMensaje();

        try {
            const res = await fetch(resolve(API), { method: 'DELETE' });

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
            const res = await fetch(
                resolve(`${API}/${encodeURIComponent(entity)}/${year}`),
                {
                    method: 'DELETE'
                }
            );

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
        } catch {
            mostrarError('Ha ocurrido un error al borrar el recurso.');
        }
    }

    async function loadInitialData() {
        limpiarMensaje();

        try {
            const res = await fetch(resolve(`${API}/loadInitialData`));

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
        goto(resolve(`/drinking-water-services/${encodeURIComponent(entity)}/${year}`));
    }

    /** @param {SubmitEvent} event */
    function handleSubmit(event) {
        event.preventDefault();
        createService();
    }

    // Búsqueda de servicios con los filtros de año
    async function searchServices(event) {
        event.preventDefault();
        cargando = true;
        limpiarMensaje();

        try {
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
            const params = new URLSearchParams();

            if (filtros.from !== '') params.append('from', filtros.from);
            if (filtros.to !== '') params.append('to', filtros.to);

            const url = `${API}?${params.toString()}`;

            const res = await fetch(resolve(url));

            if (!res.ok) {
                throw new Error();
            }

            services = await res.json();
        } catch {
            mostrarError('No se pudieron cargar los resultados de la búsqueda.');
        } finally {
            cargando = false;
        }
    }

    onMount(loadServices);
</script>

<svelte:head>
    <title>Servicios de agua potable</title>
</svelte:head>

<main class="container">
    <h1>Servicios de agua potable</h1>

    <div class="toolbar">
        <button class="btn-refresh" onclick={loadServices}>Actualizar listado</button>
        <button class="btn-load" onclick={loadInitialData}>Cargar datos iniciales</button>
        <button class="btn-danger-all" onclick={deleteAll}>Borrar todos los recursos</button>
    </div>

    {#if mensaje}
        <div class="alert {tipoMensaje}">{mensaje}</div>
    {/if}

    {#if cargando}
        <p class="loading-msg">Cargando datos...</p>
    {/if}

    <section class="form-box">
        <h2>Buscar recursos por año</h2>

        <form onsubmit={searchServices}>
            <div class="form-grid">
                <input bind:value={filtros.from} type="number" placeholder="Año desde" />
                <input bind:value={filtros.to} type="number" placeholder="Año hasta" />
            </div>
            <button type="submit" class="btn-add">Buscar</button>
        </form>
    </section>

    <!-- Crear nuevo recurso -->
    <section class="form-box">
        <h2>Crear nuevo recurso</h2>

        <form onsubmit={handleSubmit}>
            <div class="form-grid">
                <input bind:value={form.entity} placeholder="País o entidad" required />
                <input bind:value={form.code} placeholder="Código" required />
                <input bind:value={form.year} type="number" placeholder="Año" required />
                <input
                    bind:value={form.wat_bas_pop_residence_urban}
                    type="number"
                    step="any"
                    placeholder="Población urbana con servicio básico"
                />
            </div>
            <button type="submit" class="btn-add">Crear recurso</button>
        </form>
    </section>

    <h2>Listado de recursos</h2>

    {#if services.length === 0}
        <p>No hay recursos disponibles.</p>
    {:else}
        <div class="table-container">
            <table class="styled-table">
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
                            <td>{s.wat_bas_pop_residence_urban ?? '-'}</td>
                            <td class="actions">
                                <button class="btn-edit" onclick={() => goToEdit(s.entity, s.year)}>Editar</button>
                                <button class="btn-delete" onclick={() => deleteOne(s.entity, s.year)}>Borrar</button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</main>

<style>
    /* Contenedor principal de la página */
    .container { 
        max-width: 1200px; 
        margin: 0 auto; 
        font-family: sans-serif; 
        padding: 20px;
    }

    /* Barra de herramientas con botones de acción */
    .toolbar { 
        display: flex; 
        gap: 10px; 
        margin-bottom: 20px; 
    }

    .btn-refresh, .btn-load, .btn-danger-all {
        padding: 10px;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
        text-align: center;
        color: white;
        font-weight: bold;
    }

    .btn-refresh {
        background: #6c757d;
    }

    .btn-load {
        background: #17a2b8;
    }

    .btn-danger-all {
        background: #343a40;
    }

    /* Mensajes de carga y de error */
    .loading-msg { 
        color: #007bff; 
        font-weight: bold; 
    }

    .alert { 
        padding: 12px; 
        margin-bottom: 20px; 
        border-radius: 4px; 
        font-weight: bold; 
        text-align: center; 
    }

    .exito { 
        background: #d4edda; 
        color: #155724; 
        border: 1px solid #c3e6cb; 
    }

    .error { 
        background: #f8d7da; 
        color: #721c24; 
        border: 1px solid #f5c6cb; 
    }

    /* Sección del formulario de agregar una nueva central */
    .form-box { 
        background: #f8f9fa; 
        padding: 20px; 
        border: 1px solid #ddd; 
        border-radius: 8px; 
        margin-bottom: 30px; 
    }

    .form-grid { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 10px; 
        margin-bottom: 15px; 
    }

    input { 
        padding: 10px; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
    }

    .btn-add { 
        width: 100%; 
        padding: 12px; 
        background: #007bff; 
        color: white; 
        border: none; 
        border-radius: 4px; 
        cursor: pointer; 
        font-weight: bold; 
    }

    /* Estilos para la tabla */
    .table-container { 
        overflow-x: auto; 
        background: white; 
        border-radius: 8px; 
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
    }

    .styled-table { 
        width: 100%; 
        border-collapse: collapse; 
        font-size: 0.9em; 
    }

    .styled-table th { 
        background: #343a40; 
        color: white; 
        padding: 12px; 
        text-align: left; 
    }

    .styled-table td { 
        padding: 10px; 
        border-bottom: 1px solid #eee; 
    }

    .actions { 
        display: flex; 
        gap: 5px; 
    }

    .btn-edit { 
        background: #ffc107; 
        border: none; 
        padding: 5px 10px; 
        cursor: pointer; 
        border-radius: 3px; 
    }

    .btn-delete { 
        background: #dc3545; 
        color: white; 
        border: none; 
        padding: 5px 10px; 
        cursor: pointer; 
        border-radius: 3px; 
    }
</style>