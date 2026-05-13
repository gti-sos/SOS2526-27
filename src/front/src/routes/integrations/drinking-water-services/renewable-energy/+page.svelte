<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';
    import Chart from 'chart.js/auto';


    let myAPI = '/api/v1/drinking-water-services';

    if (dev) {
        myAPI = 'http://localhost:10000' + myAPI;
    }


    const g17API = 'https://sos2526-17.onrender.com/api/v1/renewable-energy-consumptions';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatCountry(country) {
        if (!country) return 'Sin país';

        return country
            .toString()
            .trim()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';
            tablaDatos = [];

            const [resMine, resG17] = await Promise.all([
                fetch(myAPI),
                fetch(g17API)
            ]);

            if (!resMine.ok || !resG17.ok) {
                throw new Error('No se pudieron descargar los datos de una o ambas APIs.');
            }

            const myData = await resMine.json();
            const g17Data = await resG17.json();

            if (!Array.isArray(myData) || !Array.isArray(g17Data)) {
                mensajeError = 'Alguna de las APIs no ha devuelto un array válido.';
                cargando = false;
                return;
            }

            if (myData.length === 0 || g17Data.length === 0) {
                mensajeError = 'Faltan datos. Asegúrate de que ambas APIs tienen datos cargados.';
                cargando = false;
                return;
            }

          
            const myProcessedData = {};

            myData.forEach((d) => {
                if (
                    !d.entity ||
                    d.year === undefined ||
                    d.wat_bas_pop_residence_urban === null ||
                    d.wat_bas_pop_residence_urban === undefined
                ) {
                    return;
                }

                const country = formatCountry(d.entity);

                if (!myProcessedData[country]) {
                    myProcessedData[country] = {
                        waterPopulation: 0,
                        years: new Set()
                    };
                }

                myProcessedData[country].waterPopulation += Number(d.wat_bas_pop_residence_urban) || 0;
                myProcessedData[country].years.add(Number(d.year));
            });

            // 2. Procesamos G17: consumo total de energías renovables
            const g17ProcessedData = {};

            g17Data.forEach((d) => {
                if (
                    !d.country ||
                    d.year === undefined ||
                    d.wind === undefined ||
                    d.hydro === undefined ||
                    d.solar === undefined ||
                    d.other === undefined
                ) {
                    return;
                }

                const country = formatCountry(d.country);

                const wind = Number(d.wind) || 0;
                const hydro = Number(d.hydro) || 0;
                const solar = Number(d.solar) || 0;
                const other = Number(d.other) || 0;

                const renewableTotal = wind + hydro + solar + other;

                if (renewableTotal <= 0) {
                    return;
                }

                if (!g17ProcessedData[country]) {
                    g17ProcessedData[country] = {
                        renewableConsumption: 0,
                        years: new Set()
                    };
                }

                g17ProcessedData[country].renewableConsumption += renewableTotal;
                g17ProcessedData[country].years.add(Number(d.year));
            });

            // 3. Cruzamos solo países/entidades que existen en ambas APIs
            const labels = Object.keys(myProcessedData).filter((country) => {
                return g17ProcessedData[country];
            });

            if (labels.length === 0) {
                mensajeError =
                    'No hay países coincidentes entre mi API y la API del Grupo 17 para poder integrarlos.';
                cargando = false;
                return;
            }

            const waterSeries = labels.map((country) => {
                return myProcessedData[country].waterPopulation;
            });

            const renewableSeries = labels.map((country) => {
                return g17ProcessedData[country].renewableConsumption;
            });

            tablaDatos = labels.map((country, index) => {
                return {
                    country,
                    waterPopulation: waterSeries[index],
                    renewableConsumption: renewableSeries[index],
                    myYears: Array.from(myProcessedData[country].years).sort((a, b) => a - b).join(', '),
                    g17Years: Array.from(g17ProcessedData[country].years).sort((a, b) => a - b).join(', ')
                };
            });

            // 4. Dibujamos la gráfica
            const ctx = document.getElementById('integration-chart');

            if (chart) {
                chart.destroy();
            }

            chart = new Chart(ctx, {
                type: 'polarArea',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Población urbana con agua potable básica',
                            data: waterSeries,
                            backgroundColor: 'rgba(52, 152, 219, 0.8)',
                            yAxisID: 'y'
                        },
                        {
                            label: 'Consumo total de energías renovables G17',
                            data: renewableSeries,
                            backgroundColor: 'rgba(46, 204, 113, 0.8)',
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Integración: agua potable urbana y energías renovables'
                        },
                        subtitle: {
                            display: true,
                            text: 'Comparación entre mi API drinking-water-services y la API renewable-energy-consumptions del Grupo 17'
                        },
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${formatNumber(value)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Población urbana con agua potable básica'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: 'Consumo renovable total'
                            }
                        }
                    }
                }
            });

            cargando = false;
        } catch (error) {
            console.error('Error cargando la integración con G17:', error);
            mensajeError = 'Error al cargar la integración. Verifica las conexiones de red y las rutas de las APIs.';
            cargando = false;
        }
    }

    onMount(() => {
        loadIntegration();

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });
</script>

<svelte:head>
    <title>Integración con G17</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración: agua potable y energías renovables</h1>
            <p class="subtitle">
                Comparación entre mi API <strong>drinking-water-services</strong> y la API
                <strong>renewable-energy-consumptions</strong> del Grupo 17.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver a la pagina de integraciones
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción de la integración</h2>


        <p>
            En mi API se suma la variable
            <strong>wat_bas_pop_residence_urban</strong>, que representa la población urbana con
            servicios básicos de agua potable. En la API del Grupo 17 se suman las variables
            <strong>wind</strong>, <strong>hydro</strong>, <strong>solar</strong> y
            <strong>other</strong> para obtener el consumo renovable total.
        </p>

    </section>

    {#if cargando}
        <p class="loading-msg">Haciendo fetch a las APIs y procesando datos...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    <div class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <canvas id="integration-chart"></canvas>
    </div>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <h2>Datos integrados</h2>

            <table>
                <thead>
                    <tr>
                        <th>País / entidad</th>
                        <th>Población urbana con agua potable básica</th>
                        <th>Consumo renovable total G17</th>
                        <th>Años en mi API</th>
                        <th>Años en G17</th>
                    </tr>
                </thead>

                <tbody>
                    {#each tablaDatos as item (item.country)}
                        <tr>
                            <td>{item.country}</td>
                            <td>{formatNumber(item.waterPopulation)}</td>
                            <td>{formatNumber(item.renewableConsumption)}</td>
                            <td>{item.myYears}</td>
                            <td>{item.g17Years}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Integración realizada con <strong>Chart.js</strong>, tipo <strong>polarArea</strong>.
        
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
        font-size: 1.5rem;
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
        background: #ecfdf5;
        border: 1px solid #bbf7d0;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #166534;
    }

    .chart-container {
        width: 100%;
        height: 520px;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        margin-bottom: 20px;
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

    @media (max-width: 700px) {
        .header {
            flex-direction: column;
        }

        .chart-container {
            height: 430px;
        }
    }
</style>