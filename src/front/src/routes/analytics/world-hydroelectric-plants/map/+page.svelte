<script>
	import { onMount } from 'svelte';
	import Highcharts from 'highcharts/highmaps';
	import worldMap from '@highcharts/map-collection/custom/world.topo.json';

	const API = '/api/v1/world-hydroelectric-plants';
	let plants = [];

	async function loadMap() {
		const res = await fetch(API);
		if (res.ok) {
			plants = await res.json();

			const dataByCountry = plants.reduce((acc, plant) => {
				const countryName = plant.country;
				if (!acc[countryName]) {
					acc[countryName] = 0;
				}
				acc[countryName] += Number(plant.capacity_mw);
				return acc;
			}, {});

			
            const mapData = Object.entries(dataByCountry).map(([country, value]) => ({
            name: country.trim(), 
            value: value
        }));

            Highcharts.mapChart('map-container', {
            chart: { map: worldMap },
            title: { text: 'Capacidad Hidroeléctrica por País' },

    legend: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        width: 600, 
        symbolWidth: 500 
    },

    colorAxis: {
        min: 0,
        minColor: '#EFEFFF',
        maxColor: '#000022',
       
        labels: {
            formatter: function () {
                return this.axis.defaultLabelFormatter.call(this);
            },
            style: {
                textOverflow: 'none' 
            }
        }
    },

    plotOptions: {
        map: {
            allAreas: true, 
            dataLabels: {
                enabled: false 
            }
        }
    },

    series: [{
        data: mapData,
        name: 'Capacidad Total',
        joinBy: ['name', 'name'], 
        states: {
            hover: {
                color: '#a4edba' 
            }
        },
        tooltip: {
            valueSuffix: ' MW'
        }
    }]
});
		}
	}

	onMount(loadMap);
</script>

<main class="container">
	<h1>Visualización Geoespacial</h1>
	
	<div class="actions">
		<button class="btn-back" onclick={() => window.location.href = '/world-hydroelectric-plants'}>
			Volver al listado
		</button>
	</div>

	<div id="map-container"></div>
</main>

<style>
	.container { padding: 20px; }
	#map-container {
		height: 600px;
		width: 100%;
		margin: 0 auto;
		background: #f9f9f9;
		border-radius: 8px;
		border: 1px solid #ccc;
	}
	.actions { margin-bottom: 20px; text-align: center; }
	.btn-back { padding: 8px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; }
</style>