<script>
    import { onMount } from 'svelte';

    // Ruta de tu API
    const API = '/api/v1/water-dams';

    let dams = $state([]); 
    // Mantiene la lista ordenada por país y luego por nombre de presa
    let sortedDams = $derived([...dams].sort((a, b) => 
        a.country.localeCompare(b.country) || a.dam_name.localeCompare(b.dam_name)
    ));

    let cargando = $state(false); 
    let mensaje = $state('');
    let tipoMensaje = $state('');
    let primeraCargaPasada = $state(false);

    // Objeto con tus 11 campos requeridos
    let form = $state({
        grand_id: '', dam_name: '', river: '', country: '', 
        year: '', dam_hgt: '', dam_len: '', area_skm: '', 
        cap_mcm: '', depth_m: '', dis_avg_ls: ''
    });

    function mostrarExito(texto) { mensaje = texto; tipoMensaje = 'exito'; setTimeout(() => mensaje = '', 3000); }
    function mostrarError(texto) { mensaje = texto; tipoMensaje = 'error'; setTimeout(() => mensaje = '', 3000); }

    // Listar recursos
    async function loadDams() {
        cargando = true;
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error();
            dams = await res.json();
            if (dams.length === 0 && mensaje === '' && primeraCargaPasada) {
                mostrarError('La lista está vacía. Pulsa "Cargar datos iniciales".');
            }
        } catch {
            mostrarError('Error al conectar con el servidor.');
        } finally {
            cargando = false;
            primeraCargaPasada = true;
        }
    }

    // Cargar datos iniciales
    async function loadInitialData() {
        cargando = true;
        try {
            const res = await fetch(`${API}/loadInitialData`);
            if (res.ok) {
                mostrarExito('¡Datos de ejemplo cargados con éxito!');
                await loadDams(); 
            } else {
                mostrarError('No se han podido cargar los datos (la base de datos podría no estar vacía).');
            }
        } catch {
            mostrarError('Error de red al intentar cargar datos iniciales.');
        } finally {
            cargando = false;
        }
    }

    async function createDam() {
        const newDam = { ...form, 
            grand_id: Number(form.grand_id), 
            year: Number(form.year) 
            // ... resto de conversiones
        };

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDam)
            });

            if (res.status === 201) {
                // ÉXITO REAL
                mostrarExito('Presa añadida correctamente.');
                form = { grand_id: '', dam_name: '', river: '', country: '', year: '', dam_hgt: '', dam_len: '', area_skm: '', cap_mcm: '', depth_m: '', dis_avg_ls: '' };
                await loadDams();
            } else if (res.status === 409) {
                // ERROR DE DUPLICADO
                mostrarError('Error: Esta presa ya existe (Nombre y Año duplicados).');
            } else if (res.status === 400) {
                // ERROR DE FORMATO
                mostrarError('Error: Datos incorrectos o incompletos.');
            } else {
                // OTROS ERRORES (500, etc)
                mostrarError('Error inesperado en el servidor.');
            }
        } catch (e) {
            mostrarError('Error de conexión con el servidor.');
        }
    }

    // Borrar uno (DELETE)
    async function deleteOne(name, year) {
        if(!confirm(`¿Eliminar la presa ${name} (${year})?`)) return;
        try {
            const res = await fetch(`${API}/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
            if (res.ok) { mostrarExito('Presa eliminada.'); await loadDams(); }
        } catch { mostrarError('Error al borrar.'); }
    }

    // Borrar todos (DELETE)
    async function deleteAll() {
        if(!confirm("¿Borrar TODAS las presas? Esta acción no se puede deshacer.")) return;
        try {
            const res = await fetch(API, { method: 'DELETE' });
            if (res.ok) { mostrarExito('Base de datos vaciada.'); await loadDams(); }
        } catch { mostrarError('Error al vaciar la base de datos.'); }
    }

    onMount(loadDams);
</script>

<main class="container">
    <h1>Gestión de Presas (Water Dams)</h1>

    <div class="toolbar">
        <button class="btn-refresh" onclick={loadDams}>Actualizar Lista</button>
        <button class="btn-load" onclick={loadInitialData}>Cargar Datos Iniciales</button>
        <button class="btn-danger-all" onclick={deleteAll}>Borrar Todo</button>
    </div>

    {#if mensaje}
        <div class="alert {tipoMensaje}">{mensaje}</div>
    {/if}

    {#if cargando}
        <p class="loading-msg">Procesando solicitud...</p>
    {/if}

    <section class="form-box">
        <h3>Añadir Nueva Presa</h3>
        <form onsubmit={(e) => { e.preventDefault(); createDam(); }}>
            <div class="form-grid">
                <input bind:value={form.dam_name} placeholder="Nombre Presa" required />
                <input bind:value={form.country} placeholder="País" required />
                <input bind:value={form.year} type="number" placeholder="Año" required />
                <input bind:value={form.river} placeholder="Río" />
                <input bind:value={form.grand_id} type="number" placeholder="Grand ID" required />
                <input bind:value={form.dam_hgt} type="number" step="any" placeholder="Altura (m)" />
                <input bind:value={form.dam_len} type="number" step="any" placeholder="Longitud (m)" />
                <input bind:value={form.area_skm} type="number" step="any" placeholder="Área (km2)" />
                <input bind:value={form.cap_mcm} type="number" step="any" placeholder="Capacidad (mcm)" />
                <input bind:value={form.depth_m} type="number" step="any" placeholder="Profundidad (m)" />
                <input bind:value={form.dis_avg_ls} type="number" step="any" placeholder="Descarga (l/s)" />
            </div>
            <button type="submit" class="btn-add">Guardar Presa</button>
        </form>
    </section>

    <div class="table-container">
        <table class="styled-table">
            <thead>
                <tr>
                    <th>País</th>
                    <th>Nombre</th>
                    <th>Año</th>
                    <th>Río</th>
                    <th>ID</th>
                    <th>Altura</th>
                    <th>Capacidad</th>
                    <th>Profundidad</th>
                    <th>Descarga (l/s)</th> <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#each sortedDams as d (d.dam_name + d.year)}
                    <tr>
                        <td>{d.country}</td>
                        <td><strong>{d.dam_name}</strong></td>
                        <td>{d.year}</td>
                        <td>{d.river || '-'}</td>
                        <td>{d.grand_id}</td>
                        <td>{d.dam_hgt ? d.dam_hgt + 'm' : '-'}</td>
                        <td>{d.cap_mcm ? d.cap_mcm + ' mcm' : '-'}</td>
                        <td>{d.depth_m ? d.depth_m + 'm' : '-'}</td>
                        <td>{d.dis_avg_ls ? d.dis_avg_ls + ' l/s' : '-'}</td> <td class="actions">
                            <button class="btn-edit" onclick={() => window.location.href = `/water-dams/${encodeURIComponent(d.dam_name)}/${d.year}`}>Editar</button>
                            <button class="btn-delete" onclick={() => deleteOne(d.dam_name, d.year)}>Borrar</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</main>

<style>
    .container { max-width: 1400px; margin: 0 auto; font-family: sans-serif; padding: 20px; }
    .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
    .btn-refresh { background: #6c757d; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
    .btn-load { background: #17a2b8; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
    .btn-danger-all { background: #343a40; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; flex: 1; }
    
    .alert { padding: 12px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; text-align: center; }
    .exito { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    
    .form-box { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 30px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px; }
    input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
    .btn-add { width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }

    .table-container { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .styled-table { width: 100%; border-collapse: collapse; font-size: 0.85em; }
    .styled-table th { background: #2563eb; color: white; padding: 12px 8px; text-align: center; }
    .styled-table td { padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; }
    .actions { display: flex; gap: 5px; justify-content: center; }
    .btn-edit { background: #ffc107; border: none; padding: 5px 8px; cursor: pointer; border-radius: 3px; font-weight: bold; }
    .btn-delete { background: #dc3545; color: white; border: none; padding: 5px 8px; cursor: pointer; border-radius: 3px; }
</style>