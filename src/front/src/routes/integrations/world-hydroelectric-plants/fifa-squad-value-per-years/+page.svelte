<script>
    import { onMount } from 'svelte';
    import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

    // Registramos los componentes necesarios de Chart.js
    Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

    async function loadChart() {
        const resMy = await fetch('/api/v1/world-hydroelectric-plants');
        const resOther = await fetch('https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years');

        if (resMy.ok && resOther.ok) {
            const myData = await resMy.json();
            const fifaData = await resOther.json();

            // 1. Procesamiento: Sumamos TU capacidad por país
            const myByCountry = myData.reduce((acc, d) => {
                const country = d.country.toLowerCase().trim();
                acc[country] = (acc[country] || 0) + Number(d.capacity_mw);
                return acc;
            }, {});

            // 2. Procesamiento: Media del VALOR FIFA por país (entre todos sus años)
            const otherStats = fifaData.reduce((acc, d) => {
                const country = d.country.toLowerCase().trim();
                if (!acc[country]) acc[country] = { total: 0, count: 0 };
                acc[country].total += Number(d.total_market_value);
                acc[country].count += 1;
                return acc;
            }, {});

            // 3. Cruzamos datos: Solo países que están en ambas APIs
            const commonCountries = Object.keys(myByCountry).filter(c => otherStats[c]);

            const labels = commonCountries.map(c => c.toUpperCase());
            const dataCapacidad = commonCountries.map(c => myByCountry[c]);
            const dataValor = commonCountries.map(c => (otherStats[c].total / otherStats[c].count).toFixed(2));

            // 4. Configuración del Widget (Chart.js - Horizontal Bar)
            const ctx = document.getElementById('canvas-fifa-final').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Capacidad Hidroeléctrica (MW)',
                            data: dataCapacidad,
                            backgroundColor: 'rgba(52, 152, 219, 0.7)',
                            borderColor: 'rgba(52, 152, 219, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Valor Mercado FIFA (M€)',
                            data: dataValor,
                            backgroundColor: 'rgba(241, 196, 15, 0.7)',
                            borderColor: 'rgba(241, 196, 15, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    indexAxis: 'y', // Gráfica Horizontal
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { 
                            display: true, 
                            text: 'Relación: Infraestructura Energética vs Potencia Futbolística' 
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    onMount(loadChart);
</script>

<main class="container">
    <header class="header">
        <h1>Integración SOS: FIFA Squad Value (G26)</h1>
        <button class="btn-back" on:click={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div class="chart-box">
        <canvas id="canvas-fifa-final"></canvas>
    </div>
    
    <div class="info-box">
        <p>⚽ <strong>Análisis detallado:</strong> En esta gráfica comparamos dos pilares de la economía nacional: la inversión en <b>Capacidad Hidroeléctrica (MW)</b> y el <b>Valor de Mercado de sus Selecciones (M€)</b>. Los datos de FIFA se han promediado para compensar la variabilidad anual frente a nuestra base de datos industrial.</p>
    </div>
</main>

<style>
    .container { padding: 30px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    
    .chart-box { 
        background: white; 
        padding: 25px; 
        border-radius: 12px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    /* ESTILO UNIFICADO DEL BOTÓN VOLVER */
    .btn-back { 
        background: #6c757d; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 6px; 
        cursor: pointer;
        font-weight: bold;
    }

    .btn-back:hover {
        background: #5a6268;
    }

    .info-box { 
        margin-top: 25px; 
        background: #e1f5fe; 
        padding: 15px; 
        border-left: 5px solid #03a9f4; 
        border-radius: 4px;
        color: #01579b;
    }
</style>