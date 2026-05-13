<script>
    import { onMount } from 'svelte';

    let chartDiv;

    async function loadData() {
        const API_MY = "/api/v1/world-hydroelectric-plants";
        const API_PROXY = "/api/v1/nobel-prize";

        try {
            const resMy = await fetch(API_MY);
            const myData = await resMy.json();

            const resNobel = await fetch(API_PROXY);
            const nobelData = await resNobel.json();

            if (!myData.length || !nobelData.laureates) return;

            // 1. AGRUPAR POR PAÍS
            const grouped = myData.reduce((acc, current) => {
                const country = current.country.trim();
                if (!acc[country]) acc[country] = 0;
                acc[country] += current.capacity_mw;
                return acc;
            }, {});

            const sortedCountries = Object.keys(grouped).sort().slice(0, 8); 

            // 2. CONSTRUIR ESTRUCTURA JERÁRQUICA PARA SUNBURST
            const sunburstData = sortedCountries.map(country => {
                const nCount = nobelData.laureates.filter(l => 
                    l.bornCountry && l.bornCountry.toLowerCase().includes(country.toLowerCase())
                ).length;

                return {
                    name: country,
                    children: [
                        {
                            name: 'Potencia',
                            value: Math.round(grouped[country]),
                            itemStyle: { color: '#008FFB' } // Azul
                        },
                        {
                            name: 'Nobel',
                            value: nCount * 100, // Escalamos para que sea visible frente a los MW
                            realValue: nCount,
                            itemStyle: { color: '#FEB019' } // Dorado
                        }
                    ]
                };
            });

            renderSunburst(sunburstData);
        } catch (e) {
            console.error("Error en la integración:", e);
        }
    }

    function renderSunburst(data) {
        // @ts-ignore
        if (!window.echarts || !chartDiv) return;
        // @ts-ignore
        const myChart = window.echarts.init(chartDiv);

        const option = {
            title: {
                text: 'Distribución Nobel & Energy',
                left: 'center',
                textStyle: { fontSize: 20 }
            },
            tooltip: {
                formatter: function (params) {
                    const node = params.data;
                    if (node.children) return `<b>${node.name}</b>`;
                    const val = node.name === 'Nobel' ? node.realValue : node.value.toLocaleString();
                    return `${params.treePathInfo[1].name}<br/>${node.name}: <b>${val}</b>`;
                }
            },
            series: {
                type: 'sunburst',
                data: data,
                radius: [0, '90%'],
                label: { rotate: 'radial' },
                levels: [
                    {}, 
                    { r0: '0%', r: '35%', itemStyle: { borderWidth: 2 }, label: { align: 'right' } }, // Países
                    { r0: '35%', r: '70%', label: { position: 'outside', padding: 3, silent: false } } // Datos
                ]
            }
        };

        myChart.setOption(option);
    }

    onMount(loadData);
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
</svelte:head>

<main class="page-container">
    <div class="top-header">
        <h1 class="main-title">Uso de Proxy: Nobel & Energy Stats</h1>
        <button class="back-btn" on:click={() => window.location.href = "/integrations"}>
            ← Volver
        </button>
    </div>

    <div class="main-card">
        <div bind:this={chartDiv} class="chart-box"></div>
    </div>

    <div class="analysis-box">
        <p>
            <span class="icon">☀️</span> 
            <strong>Identificación de los campos:</strong> Esta visualización de <strong>Rayos de Sol (Sunburst)</strong> 
            organiza la información de forma concéntrica para distinguir las fuentes de datos. 
            El <strong>núcleo</strong> identifica al país, mientras que el <strong>anillo exterior</strong> se divide en dos: 
            los sectores <strong>azules</strong> cuantifican la capacidad hidroeléctrica (MW) y los sectores 
            <strong>dorados</strong> representan el volumen de Premios Nobel obtenidos. 
            La amplitud de cada arco permite comparar visualmente el peso de la industria técnica frente al 
            impacto del capital intelectual.
        </p>
    </div>
</main>

<style>
    /* ESTILO WINE-STATS CALCADO */
    :global(body) {
        background-color: #f8f9fa;
        margin: 0;
        font-family: -apple-system, system-ui, sans-serif;
    }

    .page-container {
        padding: 40px;
        max-width: 1100px;
        margin: 0 auto;
    }

    .top-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .main-title {
        font-size: 28px;
        font-weight: bold;
        margin: 0;
    }

    .back-btn {
        background-color: #64748b;
        color: white;
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }

    .main-card {
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 35px;
    }

    .chart-box {
        width: 100%;
        height: 550px;
    }

    /* EL CUADRO ROSADO CON BORDE ROJO DE 6PX */
    .analysis-box {
        background-color: #fff5f5;
        border-left: 6px solid #ff4d4d;
        padding: 25px;
        border-radius: 4px;
        color: #333;
        font-size: 16px;
        line-height: 1.6;
    }

    .icon {
        margin-right: 10px;
    }
</style>