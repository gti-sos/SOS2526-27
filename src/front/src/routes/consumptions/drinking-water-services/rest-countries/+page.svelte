<script>
    import { onMount } from 'svelte';

    const restCountriesAPI =
        'https://restcountries.com/v3.1/region/europe?fields=name,population,area,region,subregion,capital,cca3';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let datos = $state([]);
    let resumen = $state(null);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 0
        }).format(value);
    }

    async function loadData() {
        try {
            cargando = true;
            mensajeError = '';
            datos = [];
            resumen = null;

            const res = await fetch(restCountriesAPI);

            if (!res.ok) {
                mensajeError = 'No se pudo acceder a REST Countries.';
                cargando = false;
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                mensajeError = 'REST Countries no ha devuelto datos disponibles.';
                cargando = false;
                return;
            }

            const cleanData = data
                .filter((item) => {
                    return (
                        item.name &&
                        item.name.common &&
                        item.population !== undefined &&
                        Number.isFinite(Number(item.population))
                    );
                })
                .map((item) => ({
                    name: item.name.common,
                    code: item.cca3 || '',
                    capital: item.capital ? item.capital[0] : 'Sin capital',
                    region: item.region || 'Sin región',
                    subregion: item.subregion || 'Sin subregión',
                    population: Number(item.population),
                    area: Number(item.area) || 0
                }))
                .sort((a, b) => b.population - a.population);

            if (cleanData.length === 0) {
                mensajeError = 'La API respondió correctamente, pero no hay registros válidos.';
                cargando = false;
                return;
            }

            datos = cleanData;

            const topCountries = cleanData.slice(0, 10);
            const totalPopulation = cleanData.reduce((acc, item) => acc + item.population, 0);
            const averagePopulation = totalPopulation / cleanData.length;

            resumen = {
                totalCountries: cleanData.length,
                totalPopulation,
                averagePopulation,
                mostPopulated: cleanData[0],
                topCountries
            };

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando REST Countries:', error);
            mensajeError = 'Error de conexión o de procesamiento al cargar REST Countries.';
            cargando = false;
        }
    }

    async function renderChart() {
        const Chart = (await import('chart.js/auto')).default;

        const ctx = document.getElementById('rest-countries-chart');

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: resumen.topCountries.map((item) => item.name),
                datasets: [
                    {
                        label: 'Población',
                        data: resumen.topCountries.map((item) => item.population)
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Países europeos con mayor población'
                    },
                    subtitle: {
                        display: true,
                        text: 'Consumo directo de REST Countries API'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label}: ${formatNumber(context.raw)} habitantes`;
                            }
                        }
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    onMount(() => {
        if (typeof window !== 'undefined') {
            loadData();
        }

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });
</script>

<svelte:head>
    <title>Consumo REST Countries</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Países europeos por población</h1>
            <p class="subtitle">
                Consumo directo de la API externa <strong>REST Countries</strong>.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción del uso</h2>
        <p>
            Esta vista consume mediante <strong>fetch</strong> una API RESTful externa,
            recibe datos en formato <strong>JSON</strong> y representa los países europeos
            con mayor población mediante una gráfica y una tabla HTML.
        </p>
    </section>

    {#if cargando}
        <p class="loading-msg">Cargando datos de REST Countries...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    {#if resumen}
        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Países obtenidos</span>
                <strong>{resumen.totalCountries}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Población total</span>
                <strong>{formatNumber(resumen.totalPopulation)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Población media</span>
                <strong>{formatNumber(resumen.averagePopulation)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">País más poblado</span>
                <strong>{resumen.mostPopulated.name}</strong>
            </article>
        </section>
    {/if}

    <section class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <canvas id="rest-countries-chart"></canvas>
    </section>

    {#if datos.length > 0}
        <section class="table-section">
            <h2>Datos obtenidos de REST Countries</h2>

            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Código</th>
                        <th>Capital</th>
                        <th>Región</th>
                        <th>Subregión</th>
                        <th>Población</th>
                        <th>Área</th>
                    </tr>
                </thead>

                <tbody>
                    {#each datos.slice(0, 20) as item (`${item.code}-${item.name}`)}
                        <tr>
                            <td>{item.name}</td>
                            <td>{item.code}</td>
                            <td>{item.capital}</td>
                            <td>{item.region}</td>
                            <td>{item.subregion}</td>
                            <td>{formatNumber(item.population)}</td>
                            <td>{formatNumber(item.area)} km²</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Visualización realizada con <strong>Chart.js</strong>, tipo <strong>doughnut</strong>.
        Los datos se obtienen mediante <strong>fetch</strong>, se procesan como
        <strong>JSON</strong> y se muestran mediante gráfica y tabla HTML.
    </p>
</main>

<style>
    .container {
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
        font-family: sans-serif;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 20px;
        border-bottom: 2px solid #eee;
        padding-bottom: 15px;
    }

    h1 {
        color: #333;
        margin: 0;
        font-size: 1.7rem;
    }

    h2 {
        margin-top: 0;
        color: #333;
        font-size: 1.2rem;
    }

    .subtitle {
        margin: 8px 0 0;
        color: #666;
    }

    .info-box {
        background: #f5f3ff;
        border: 1px solid #ddd6fe;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #4c1d95;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 25px;
    }

    .summary-card {
        background: white;
        padding: 18px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
        border: 1px solid #eee;
    }

    .summary-card .label {
        display: block;
        color: #777;
        font-size: 0.85rem;
        margin-bottom: 8px;
    }

    .summary-card strong {
        font-size: 1.05rem;
        color: #333;
    }

    .chart-container {
        width: 100%;
        height: 560px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        margin-bottom: 25px;
    }

    .btn-back {
        background-color: #6c757d;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        white-space: nowrap;
    }

    .btn-back:hover {
        background-color: #5a6268;
    }

    .loading-msg {
        color: #007bff;
        font-weight: bold;
    }

    .alert {
        padding: 12px;
        border-radius: 4px;
        font-weight: bold;
        margin-bottom: 20px;
    }

    .error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .table-section {
        margin-top: 25px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
    }

    th,
    td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        text-align: left;
        font-size: 0.95rem;
    }

    th {
        background: #f5f5f5;
        color: #333;
    }

    tr:hover {
        background: #fafafa;
    }

    .footer-text {
        color: #777;
        font-size: 0.9rem;
        font-style: italic;
        text-align: center;
        margin-top: 20px;
    }

    @media (max-width: 900px) {
        .summary-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .chart-container {
            height: 500px;
        }
    }

    @media (max-width: 600px) {
        .summary-grid {
            grid-template-columns: 1fr;
        }

        .header {
            flex-direction: column;
        }
    }
</style>