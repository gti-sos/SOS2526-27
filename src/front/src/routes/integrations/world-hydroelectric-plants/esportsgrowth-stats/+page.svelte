<script>
    import { onMount } from 'svelte';
    import bb, { area } from 'billboard.js';
    import "billboard.js/dist/billboard.css";

    async function loadChart() {
        const res = await fetch('https://sos2526-30.onrender.com/api/v1/esportsgrowth-stats');
        
        if (res.ok) {
            const esportsData = await res.json();

            // 1. OBTENER AÑOS ÚNICOS Y ORDENADOS
            const years = [...new Set(esportsData.map(d => d.year))].sort((a, b) => a - b);
            
            // 2. OBTENER LISTA DE PAÍSES
            const countries = [...new Set(esportsData.map(d => d.country))];

            // 3. PREPARAR LAS COLUMNAS PARA BILLBOARD
            // Cada columna debe ser: ['NombrePais', valorAño1, valorAño2, ...]
            const chartColumns = countries.map(country => {
                const row = [country];
                years.forEach(year => {
                    const entry = esportsData.find(d => d.country === country && d.year === year);
                    row.push(entry ? entry.viewership : 0); // Si no hay dato ese año, ponemos 0
                });
                return row;
            });

            // 4. GENERAR EL WIDGET
            bb.generate({
                bindto: "#chart-esports-stacked",
                data: {
                    columns: chartColumns,
                    type: area(), // CUMPLE: Es tipo area (relleno), no line
                    groups: [countries] // ESTO HACE QUE SE APILEN (Stacked)
                },
                axis: {
                    x: {
                        type: "category",
                        categories: years,
                        label: "Evolución Temporal"
                    },
                    y: {
                        label: "Audiencia (Millones)",
                        padding: { bottom: 0 }
                    }
                },
                title: {
                    text: "Audiencia de eSports: Reparto por Países y Años"
                },
                point: {
                    show: true // Muestra puntos en los años para facilitar la lectura
                },
                tooltip: {
                    order: "desc" // Ordena el tooltip de mayor a menor audiencia
                }
            });
        }
    }

    onMount(loadChart);
</script>

<main class="container">
    <header class="header">
        <h1>Uso de Widget: eSports Global (G30)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div id="chart-esports-stacked"></div>
    
    <div class="info-box">
        <p>📊 <strong>Interpretación:</strong> Cada franja de color representa un país. El grosor de la franja en un año concreto indica su volumen de audiencia. Al estar apiladas, la línea superior representa el total global del mercado de eSports.</p>
    </div>
</main>

<style>
    .container { padding: 30px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    
    #chart-esports-stacked { 
        width: 100%; 
        background: white; 
        border-radius: 12px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        padding: 25px;
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
        margin-top: 25px; 
        background: #e8f5e9; 
        padding: 15px; 
        border-left: 5px solid #4caf50; 
        border-radius: 4px;
        color: #2e7d32;
    }
</style>