<script>
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import Chart from 'chart.js/auto';


	let myAPI = '/api/v1/drinking-water-services';

	if (dev) {
		myAPI = 'http://localhost:10000' + myAPI;
	}

	
	const g23API = 'https://sos2526-23.onrender.com/api/v1/online-sales-popular-marketplaces';

	let chart = null;
	let mensajeError = $state('');
	let cargando = $state(true);
	let tablaDatos = $state([]);

	function formatNumber(value) {
		return new Intl.NumberFormat('es-ES', {
			maximumFractionDigits: 2
		}).format(value);
	}

	async function loadIntegration() {
		try {
			const [resMine, resG23] = await Promise.all([
				fetch(myAPI),
				fetch(g23API)
			]);

			if (!resMine.ok || !resG23.ok) {
				throw new Error('No se pudieron descargar los datos.');
			}

			const myData = await resMine.json();
			const g23Data = await resG23.json();

			if (myData.length === 0 || g23Data.length === 0) {
				mensajeError = 'Faltan datos. Asegúrate de cargar los datos iniciales en ambas APIs.';
				cargando = false;
				return;
			}

			let myProcessedData = {};

			myData.forEach((d) => {
				let nombreEntidad = d.entity;

				if (nombreEntidad === 'Americas (WHO)') {
					nombreEntidad = 'North America';
				}

				if (!myProcessedData[nombreEntidad]) {
					myProcessedData[nombreEntidad] = {
						region: nombreEntidad,
						waterPopulation: 0,
						myYears: new Set()
					};
				}

				myProcessedData[nombreEntidad].waterPopulation += Number(d.wat_bas_pop_residence_urban) || 0;

				if (d.year !== undefined && d.year !== null) {
					myProcessedData[nombreEntidad].myYears.add(d.year);
				}
			});

			// 2. Procesamos los datos del G23
	
                let g23ProcessedData = {};

                g23Data.forEach((d) => {
                    if (!g23ProcessedData[d.region]) {
                        g23ProcessedData[d.region] = {
                            region: d.region,
                            onlineSalesTotal: 0,
                            g23Years: new Set()
                        };
                    }

                    g23ProcessedData[d.region].onlineSalesTotal += Number(d.total) || 0;

                    if (d.date !== undefined && d.date !== null) {
                        const year = new Date(d.date).getFullYear();

                        if (!isNaN(year)) {
                            g23ProcessedData[d.region].g23Years.add(year);
                        }
                    }
                });

			// 3. Juntamos regiones de ambas APIs
			const misEtiquetas = Object.keys(myProcessedData);
			const susEtiquetas = Object.keys(g23ProcessedData);
			const labels = [...new Set([...misEtiquetas, ...susEtiquetas])];

			const mySeries = labels.map((l) => myProcessedData[l]?.waterPopulation || 0);
			const g23Series = labels.map((l) => g23ProcessedData[l]?.onlineSalesTotal || 0);

			// 4. Creamos la tabla de datos integrados
			tablaDatos = labels.map((region) => {
				const myItem = myProcessedData[region];
				const g23Item = g23ProcessedData[region];

				return {
					region,
					waterPopulation: myItem?.waterPopulation || 0,
					onlineSalesTotal: g23Item?.onlineSalesTotal || 0,
					myYears: myItem ? [...myItem.myYears].sort((a, b) => a - b).join(', ') : '-',
					g23Years: g23Item ? [...g23Item.g23Years].sort((a, b) => a - b).join(', ') : '-'
				};
			});

			// 5. Dibujar la gráfica
			const ctx = document.getElementById('integration-chart');

			if (chart) chart.destroy();

			chart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: labels,
					datasets: [
						{
							label: 'Población Urbana con Agua (Mis datos)',
							data: mySeries,
							backgroundColor: 'rgba(52, 152, 219, 0.8)',
							yAxisID: 'y'
						},
						{
							label: 'Ventas Totales $ (G23)',
							data: g23Series,
							backgroundColor: 'rgba(231, 76, 60, 0.8)',
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
					scales: {
						y: {
							type: 'linear',
							display: true,
							position: 'left',
							title: {
								display: true,
								text: 'Nº Habitantes'
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
								text: 'Total Ingresos ($)'
							}
						}
					}
				}
			});

			cargando = false;
		} catch (error) {
			console.error(error);
			mensajeError = 'Error al cargar la integración. Verifica las conexiones de red.';
			cargando = false;
		}
	}

	onMount(loadIntegration);
</script>

<svelte:head>
	<title>Integración con G23</title>
</svelte:head>

<main class="container">
	<header class="header">
		<h1>Integración: Agua Potable vs Ventas Online (G23)</h1>

		<button class="btn-back" onclick={() => (window.location.href = '/integrations')}>
			⬅ Volver a la página de integraciones
		</button>
	</header>

	<section class="description">
		<h2>Descripción de la integración</h2>

		<p>
			En mi API se calcula la población urbana con servicios básicos de agua potable mediante
			<code>wat_bas_pop_residence_urban</code>. En la API del Grupo 23 se calcula la suma de
			<code>total</code>, que representa el volumen total de ventas online en marketplaces populares
			por región.
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

			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Región / entidad</th>
							<th>Población urbana con agua potable básica</th>
							<th>Ventas online totales G23</th>
							<th>Años en mi API</th>
							<th>Años en G23</th>
						</tr>
					</thead>

					<tbody>
						{#each tablaDatos as item (item.region)}
							<tr>
								<td>{item.region}</td>
								<td>{formatNumber(item.waterPopulation)}</td>
								<td>{formatNumber(item.onlineSalesTotal)}</td>
								<td>{item.myYears}</td>
								<td>{item.g23Years}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<p class="footer-text">
		Gráfica de barras usando <strong>Chart.js</strong>. Compara la población total con acceso a
		agua frente al total facturado en ventas online del G23.
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
		align-items: center;
		margin-bottom: 20px;
		border-bottom: 2px solid #eee;
		padding-bottom: 15px;
		gap: 20px;
	}

	h1 {
		color: #333;
		margin: 0;
		font-size: 1.5rem;
	}

	h2 {
		color: #333;
		margin-top: 0;
	}

	.description {
		background: #f8f9fa;
		padding: 18px;
		border-radius: 8px;
		margin-bottom: 20px;
		border-left: 4px solid #3498db;
	}

	.description p {
		margin-bottom: 0;
		line-height: 1.5;
		color: #444;
	}

	code {
		background: #e9ecef;
		padding: 2px 5px;
		border-radius: 4px;
	}

	.chart-container {
		width: 100%;
		height: 500px;
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		margin-bottom: 30px;
	}

	.table-section {
		margin-top: 30px;
		margin-bottom: 30px;
	}

	.table-wrapper {
		overflow-x: auto;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 800px;
	}

	th,
	td {
		padding: 12px 14px;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		background: #f1f3f5;
		color: #333;
		font-weight: bold;
	}

	td {
		color: #444;
	}

	tr:hover {
		background: #f8f9fa;
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

	.footer-text {
		color: #777;
		font-size: 0.9rem;
		font-style: italic;
		text-align: center;
	}
</style>