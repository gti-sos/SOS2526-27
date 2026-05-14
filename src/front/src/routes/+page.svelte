<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const equipo = [
		{
			nombre: 'Alejandro Campos Sánchez-Cruzado',
			recurso: 'drinking-water-services',
			frontend: '/drinking-water-services',
			api: '/api/v1/drinking-water-services',
			docs: 'https://documenter.getpostman.com/view/52242576/2sBXieqtPa',
			github: 'https://github.com/alecamsan1',
			usuarioGithub: '@alecamsan1',
			video: 'https://youtu.be/P8GjzIzxnnI'
		},
		{
			nombre: 'Alejandro Catalán Noviembre',
			recurso: 'water-dams',
			frontend: '/water-dams',
			api: '/api/v1/water-dams',
			docs: 'https://documenter.getpostman.com/view/52243900/2sBXigNZbh',
			github: 'https://github.com/alecn-us',
			usuarioGithub: '@alecn-us',
			video: 'https://youtu.be/cJR-4DP7FfQ'
		},
		{
			nombre: 'Adrián Pérez Sánchez',
			recurso: 'world-hydroelectric-plants',
			frontend: '/world-hydroelectric-plants',
			api: '/api/v1/world-hydroelectric-plants',
			docs: 'https://documenter.getpostman.com/view/52298948/2sBXigMDpo',
			github: 'https://github.com/adrianperez17',
			usuarioGithub: '@adrianperez17',
			video: 'https://youtu.be/_MhJ3sr_JB4'
		}
	];

	const repositorioEquipo = 'https://github.com/gti-sos/SOS2526-27';

	function irA(ruta) {
		goto(resolve(ruta));
	}

	function abrirExterno(url) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function abrirApi(ruta) {
		window.open(resolve(ruta), '_blank', 'noopener,noreferrer');
	}

	function irAAbout() {
		goto(resolve('/about'));
	}
</script>

<svelte:head>
	<title>SOS2526-27</title>
</svelte:head>

<div class="container">
	<header>
		<div>
			<h1>SOS2526-27</h1>
			<p class="subtitle">
				Portal del equipo con acceso a frontends, APIs, documentación, integraciones,
				consumiciones, vídeos D03 y repositorio.
			</p>
		</div>

		<button class="link-button" onclick={irAAbout}>Sobre el equipo</button>
	</header>

	<section class="card">
		<h2>Repositorio del equipo</h2>

		<p>
			<button class="primary-button" onclick={() => abrirExterno(repositorioEquipo)}>
				Ir al repositorio de GitHub
			</button>
		</p>
	</section>

	<section class="card highlight">
		<h2>Dashboard Grupal</h2>

		<p>
			Accede a la visualización integrada de todos los datos del equipo en una única matriz global.
		</p>

		<button class="primary-button" onclick={() => irA('/analytics')}>
			Ir a la integración grupal
		</button>
	</section>

	<section class="card navigation-card">
		<h2>Entregable D03</h2>

		<p class="section-description">
			Accede a las integraciones y consumiciones realizadas para el entregable.
		</p>

		<div class="main-buttons">
			<button class="primary-button green" onclick={() => irA('/integrations')}>
				Ver integraciones
			</button>
		</div>
	</section>

	<section class="card video-section">
		<h2>Vídeos individuales D03</h2>

		<p class="section-description">
			Cada miembro del equipo dispone de un vídeo individual, narrado o comentado, explicando
			las funcionalidades y aspectos principales del entregable D03.
		</p>

		<div class="video-grid">
			{#each equipo as persona (persona.usuarioGithub)}
				<button class="video-card" onclick={() => abrirExterno(persona.video)}>
					<span class="play-icon">▶</span>

					<span class="video-info">
						<strong>{persona.nombre}</strong>
						<small>{persona.recurso} · {persona.usuarioGithub}</small>
					</span>
				</button>
			{/each}
		</div>

	</section>

	<section class="card">
		<h2>Componentes del equipo y recursos</h2>

		<table>
			<thead>
				<tr>
					<th>Miembro</th>
					<th>Fuente de datos / recurso</th>
					<th>Frontend</th>
					<th>API base</th>
					<th>Documentación Postman</th>
					<th>GitHub</th>
					<th>Vídeo D03</th>
				</tr>
			</thead>

			<tbody>
				{#each equipo as persona (persona.recurso)}
					<tr>
						<td>{persona.nombre}</td>
						<td>{persona.recurso}</td>

						<td>
							<button class="link-button" onclick={() => irA(persona.frontend)}>
								Abrir frontend
							</button>
						</td>

						<td>
							<button class="link-button" onclick={() => abrirApi(persona.api)}>
								Abrir API
							</button>
						</td>

						<td>
							<button class="link-button" onclick={() => abrirExterno(persona.docs)}>
								Ver documentación
							</button>
						</td>

						<td>
							<button class="link-button" onclick={() => abrirExterno(persona.github)}>
								Perfil GitHub
							</button>
						</td>

						<td>
							<button class="link-button youtube-link" onclick={() => abrirExterno(persona.video)}>
								Ver vídeo
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: Inter, system-ui, sans-serif;
		background: #f8fafc;
		color: #1e293b;
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		margin-bottom: 28px;
		border-bottom: 2px solid #2563eb;
		padding-bottom: 16px;
	}

	h1 {
		margin: 0 0 8px 0;
		font-size: 2rem;
	}

	h2 {
		margin-top: 0;
		font-size: 1.25rem;
	}

	.subtitle {
		margin: 0;
		color: #64748b;
	}

	.card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.highlight {
		border-left: 4px solid #2563eb;
		background-color: #eff6ff;
	}

	.navigation-card {
		border-left: 4px solid #0f172a;
	}

	.video-section {
		border-left: 4px solid #ef4444;
	}

	.section-description {
		margin: 6px 0 18px 0;
		color: #475569;
	}

	.main-buttons {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
	}

	.primary-button {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		margin-top: 10px;
		white-space: nowrap;
	}

	.primary-button:hover {
		background-color: #1d4ed8;
	}

	.primary-button.green {
		background-color: #16a34a;
	}

	.primary-button.green:hover {
		background-color: #15803d;
	}

	



	.link-button {
		background: none;
		border: none;
		padding: 0;
		color: #2563eb;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.link-button:hover {
		text-decoration: underline;
	}

	.youtube-link {
		color: #dc2626;
	}

	.video-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
		margin-top: 16px;
	}

	.video-card {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		padding: 16px;
		border: none;
		border-radius: 12px;
		background: #ff0000;
		color: white;
		cursor: pointer;
		text-align: left;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			box-shadow 0.2s ease;
	}

	.video-card:hover {
		background: #cc0000;
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
	}

	.play-icon {
		font-size: 1.6rem;
		line-height: 1;
	}

	.video-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.video-info strong {
		font-size: 1rem;
	}

	.video-info small {
		font-size: 0.85rem;
		opacity: 0.9;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 12px;
	}

	th,
	td {
		text-align: left;
		padding: 12px;
		border-bottom: 1px solid #e2e8f0;
		vertical-align: top;
	}

	th {
		background: #f8fafc;
		font-weight: 700;
	}

	@media (max-width: 900px) {
		header {
			flex-direction: column;
		}

		table,
		thead,
		tbody,
		tr,
		th,
		td {
			display: block;
		}

		thead {
			display: none;
		}

		tr {
			border: 1px solid #e2e8f0;
			border-radius: 10px;
			padding: 10px;
			margin-bottom: 12px;
			background: white;
		}

		td {
			border-bottom: none;
			padding: 6px 0;
		}
	}
</style>