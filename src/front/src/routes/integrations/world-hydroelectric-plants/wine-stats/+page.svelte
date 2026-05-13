<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';

    async function loadChart() {
        
        const res = await fetch('https://sos2526-29.onrender.com/api/v1/wine-stats');
        
        if (res.ok) {
            const wineData = await res.json();

            const grapeCounts = wineData.reduce((acc, wine) => {
                const name = wine.grape || "Otras";
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {});

            const chartData = Object.entries(grapeCounts).map(([name, value]) => ({
                name,
                value
            }));

            //ECharts - pie

            const chartDom = document.getElementById('chart-wine-simple');
            const myChart = echarts.init(chartDom);
            
            const option = {
                title: {
                    text: 'Distribución por Variedad de Uva',
                    subtext: 'Datos de Wine-stats (G29)',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    type: 'scroll'
                },
                series: [
                    {
                        name: 'Variedad',
                        type: 'pie', 
                        radius: '60%',
                        data: chartData,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };

            myChart.setOption(option);
        }
    }

    onMount(loadChart);
</script>

<main class="container">
    <header class="header">
        <h1>Uso de API SOS: Wine Stats (G29)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div id="chart-wine-simple"></div>
    
    <div class="info-box">
        <p>🍷 <strong>Análisis de los datos:</strong> Este gráfico muestra la variedad de uvas presentes en los vinos.</p>
    </div>
</main>

<style>
    .container { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    
    #chart-wine-simple { 
        width: 100%; 
        height: 550px; 
        background: white; 
        border-radius: 12px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        padding: 20px;
    }

    .btn-back { 
        background: #6c757d; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 6px; 
        cursor: pointer;
    }

    .info-box { 
        margin-top: 20px; 
        background: #fdf2f2; 
        padding: 15px; 
        border-left: 5px solid #e74c3c; 
        border-radius: 4px;
    }
</style>