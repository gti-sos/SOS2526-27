<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    let myAPI = '/api/v1/drinking-water-services';

    if (dev) {
        myAPI = 'http://localhost:10000' + myAPI;
    }

    const g11API = 'https://sos2526-11.onrender.com/api/v2/alcohol-consumptions-per-capita';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 2
        }).format(value);
    }

    function normalizeCountry(name) {
        if (!name) return '';

        let country = name.toString().trim();

        const replacements = {
            'United States of America': 'United States',
            'USA': 'United States',
            'UK': 'United Kingdom',
            'Russian Federation': 'Russia',
            'Viet Nam': 'Vietnam'
        };

        return replacements[country] || country;
    }

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';
            tablaDatos = [];

            const [resMine, resG11] = await Promise.all([
                fetch(myAPI),
                fetch(g11API)
            ]);

            if (!resMine.ok || !resG11.ok) {
                throw new Error('No se pudieron descargar los datos de una o ambas APIs.');
            }

            const myData = await resMine.json();
            const g11Data = await resG11.json();

            if (!Array.isArray(myData) || !Array.isArray(g11Data)) {
                mensajeError = 'Alguna de las APIs no ha devuelto un array válido.';
                cargando = false;
                return;
            }

            if (myData.length === 0 || g11Data.length === 0) {
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

                const country = normalizeCountry(d.entity);
                const waterValue = Number(d.wat_bas_pop_residence_urban) || 0;

                if (waterValue <= 0) {
                    return;
                }

                if (!myProcessedData[country]) {
                    myProcessedData[country] = {
                        waterPopulation: 0,
                        years: new Set()
                    };
                }

                myProcessedData[country].waterPopulation += waterValue;
                myProcessedData[country].years.add(Number(d.year));
            });

            // 2. Procesamos API G11: consumo de alcohol per cápita
            const g11ProcessedData = {};

            g11Data.forEach((d) => {
                if (
                    !d.nation ||
                    d.date_year === undefined ||
                    d.alcohol_litre === undefined ||
                    !Number.isFinite(Number(d.alcohol_litre))
                ) {
                    return;
                }

                const country = normalizeCountry(d.nation);
                const alcoholValue = Number(d.alcohol_litre) || 0;
                const recorded = Number(d.recorded_consumption) || 0;
                const unrecorded = Number(d.unrecorded_consumption) || 0;

                if (alcoholValue <= 0) {
                    return;
                }

                if (!g11ProcessedData[country]) {
                    g11ProcessedData[country] = {
                        alcoholTotal: 0,
                        recordedConsumption: 0,
                        unrecordedConsumption: 0,
                        records: 0,
                        years: new Set()
                    };
                }

                g11ProcessedData[country].alcoholTotal += alcoholValue;
                g11ProcessedData[country].recordedConsumption += recorded;
                g11ProcessedData[country].unrecordedConsumption += unrecorded;
                g11ProcessedData[country].records += 1;
                g11ProcessedData[country].years.add(Number(d.date_year));
            });

            // 3. Cruzamos solo países que aparezcan en ambas APIs
            const labels = Object.keys(myProcessedData).filter((country) => {
                return g11ProcessedData[country];
            });

            if (labels.length === 0) {
                mensajeError =
                    'No hay países coincidentes entre mi API y la API del Grupo 11 para poder integrarlos.';
                cargando = false;
                return;
            }

            tablaDatos = labels
                .map((country) => {
                    const water = myProcessedData[country];
                    const alcohol = g11ProcessedData[country];

                    return {
                        country,
                        waterPopulation: water.waterPopulation,
                        alcoholAverage: alcohol.alcoholTotal / alcohol.records,
                        recordedAverage: alcohol.recordedConsumption / alcohol.records,
                        unrecordedAverage: alcohol.unrecordedConsumption / alcohol.records,
                        myYears: Array.from(water.years).sort((a, b) => a - b).join(', '),
                        g11Years: Array.from(alcohol.years).sort((a, b) => a - b).join(', ')
                    };
                })
                .sort((a, b) => b.waterPopulation - a.waterPopulation);

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando la integración con G11:', error);
            mensajeError = 'Error al cargar la integración. Verifica las conexiones de red y las rutas de las APIs.';
            cargando = false;
        }
    }

    async function renderChart() {
        const ApexCharts = (await import('apexcharts')).default;

        const chartData = tablaDatos.slice(0, 20).map((item) => {
            return {
                x: Number(item.waterPopulation.toFixed(2)),
                y: Number(item.alcoholAverage.toFixed(2)),
                z: Math.max(5, Math.sqrt(item.waterPopulation) / 1000),
                country: item.country,
                recordedAverage: item.recordedAverage,
                unrecordedAverage: item.unrecordedAverage,
                myYears: item.myYears,
                g11Years: item.g11Years
            };
        });

        const options = {
            series: [
                {
                    name: 'Países integrados',
                    data: chartData
                }
            ],
            chart: {
                type: 'bubble',
                height: 540,
                toolbar: {
                    show: true
                }
            },
            title: {
                text: 'Integración: agua potable urbana y consumo de alcohol',
                align: 'center'
            },
            subtitle: {
                text: 'Comparación entre mi API drinking-water-services y la API alcohol-consumptions-per-capita del Grupo 11',
                align: 'center'
            },
            xaxis: {
                title: {
                    text: 'Población urbana con agua potable básica'
                },
                labels: {
                    formatter: function (value) {
                        return formatNumber(value);
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Alcohol per cápita medio'
                },
                labels: {
                    formatter: function (value) {
                        return formatNumber(value) + ' L';
                    }
                }
            },
            dataLabels: {
                enabled: false
            },
            tooltip: {
                custom: function ({ dataPointIndex }) {
                    const item = chartData[dataPointIndex];

                    return `
                        <div style="padding:10px; background:white; border:1px solid #ccc;">
                            <strong>${item.country}</strong><br>
                            <span>Población urbana con agua potable: ${formatNumber(item.x)}</span><br>
                            <span>Alcohol per cápita medio: ${formatNumber(item.y)} L</span><br>
                            <span>Consumo registrado medio: ${formatNumber(item.recordedAverage)} L</span><br>
                            <span>Consumo no registrado medio: ${formatNumber(item.unrecordedAverage)} L</span><br>
                            <span>Años en mi API: ${item.myYears}</span><br>
                            <span>Años en G11: ${item.g11Years}</span>
                        </div>
                    `;
                }
            }
        };

        const divChart = document.getElementById('apex-chart');

        if (chart) {
            chart.destroy();
        }

        chart = new ApexCharts(divChart, options);
        chart.render();
    }

    onMount(() => {
        if (typeof window !== 'undefined') {
            loadIntegration();
        }

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });
</script>

<svelte:head>
    <title>Integración con G11</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración: agua potable y consumo de alcohol</h1>
            <p class="subtitle">
                Comparación entre mi API <strong>drinking-water-services</strong> y la API
                <strong>alcohol-consumptions-per-capita</strong> del Grupo 11.
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
            servicios básicos de agua potable. En la API del Grupo 11 se calcula la media de
            <strong>alcohol_litre</strong>, que representa el consumo de alcohol per cápita.
        </p>

       
    </section>

    {#if cargando}
        <p class="loading-msg">Haciendo fetch a las APIs y procesando datos...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    <section class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <div id="apex-chart"></div>
    </section>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <h2>Datos integrados</h2>

            <table>
                <thead>
                    <tr>
                        <th>País / entidad</th>
                        <th>Población urbana con agua potable básica</th>
                        <th>Alcohol per cápita medio</th>
                        <th>Consumo registrado medio</th>
                        <th>Consumo no registrado medio</th>
                        <th>Años en mi API</th>
                        <th>Años en G11</th>
                    </tr>
                </thead>

                <tbody>
                    {#each tablaDatos as item (`${item.country}-${item.myYears}-${item.g11Years}`)}
                        <tr>
                            <td>{item.country}</td>
                            <td>{formatNumber(item.waterPopulation)}</td>
                            <td>{formatNumber(item.alcoholAverage)} L</td>
                            <td>{formatNumber(item.recordedAverage)} L</td>
                            <td>{formatNumber(item.unrecordedAverage)} L</td>
                            <td>{item.myYears}</td>
                            <td>{item.g11Years}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Integración realizada con <strong>ApexCharts</strong>, tipo <strong>bubble</strong>.
       
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
        background: #fff6e6;
        border: 1px solid #ffe0a3;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #6b4700;
    }

    .chart-container {
        width: 100%;
        min-height: 580px;
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

    @media (max-width: 700px) {
        .header {
            flex-direction: column;
        }

        .chart-container {
            min-height: 460px;
        }
    }
</style>