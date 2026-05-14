<script>
	import { resolve } from '$app/paths';

	const videosD03 = [
		{
			nombre: 'Alejandro Campos Sánchez-Cruzado',
			recurso: 'Drinking Water Services',
			github: '@alecamsan1',
			urlGithub: 'https://github.com/alecamsan1',
			video: 'https://youtu.be/P8GjzIzxnnI'
		},
		{
			nombre: 'Alejandro Catalán Noviembre',
			recurso: 'Water Dams',
			github: '@alecn-us',
			urlGithub: 'https://github.com/alecn-us',
			video: 'https://youtu.be/cJR-4DP7FfQ'
		},
		{
			nombre: 'Adrián Pérez Sánchez',
			recurso: 'World Hydroelectric Plants',
			github: '@adrianperez17',
			urlGithub: 'https://github.com/adrianperez17',
			video: 'https://youtu.be/_MhJ3sr_JB4'
		}
	];

	function abrirExterno(url) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

<svelte:head>
	<title>About | SOS2526-27</title>
</svelte:head>

<div class="container">
	<header>
		<h1>SOS2526-27</h1>

		<a href={resolve('/')} class="back-link">&larr; Volver al inicio</a>
	</header>

	<div class="section-card">
		<h2>Team</h2>

		<ul>
			{#each videosD03 as persona (persona.github)}
				<li>
					<span>{persona.nombre}</span>

					<button class="github-tag" onclick={() => abrirExterno(persona.urlGithub)}>
						{persona.github}
					</button>
				</li>
			{/each}
		</ul>
	</div>

	<div class="section-card">
		<h2>Project Description</h2>

		<p>
			Our project analyzes global hydraulic infrastructure, drinking water services, dams,
			reservoirs and hydroelectric plants to study their geographical distribution, temporal
			evolution and relation with water management around the world.
		</p>
	</div>

	<div class="section-card">
		<h2>Access Links</h2>

		<ul>
			<li>
				<strong>Repository:</strong>

				<button
					class="text-link"
					onclick={() => abrirExterno('https://github.com/gti-sos/SOS2526-27')}
				>
					gti-sos/SOS2526-27
				</button>
			</li>

			<li>
				<strong>Live URL:</strong>

				<button
					class="text-link"
					onclick={() => abrirExterno('https://sos2526-27.onrender.com')}
				>
					sos2526-27.onrender.com
				</button>
			</li>
		</ul>
	</div>

	<div class="section-card">
		<h2>Developed APIs</h2>

		<ul>
			<li>
				<a
					href={resolve('/api/v1/drinking-water-services')}
					class="api-link"
					target="_blank"
					rel="noopener noreferrer"
				>
					Drinking Water Services API
				</a>
			</li>

			<li>
				<a
					href={resolve('/api/v1/water-dams')}
					class="api-link"
					target="_blank"
					rel="noopener noreferrer"
				>
					Water Dams API
				</a>
			</li>

			<li>
				<a
					href={resolve('/api/v1/world-hydroelectric-plants')}
					class="api-link"
					target="_blank"
					rel="noopener noreferrer"
				>
					World Hydroelectric Plants API
				</a>
			</li>
		</ul>
	</div>

	<div class="section-card videos-section">
		<h2>Vídeos D03</h2>

		<p class="videos-description">
			Enlaces a los vídeos individuales de cada componente del grupo. Cada vídeo comenta las
			funcionalidades y aspectos principales del entregable D03.
		</p>

		<div class="videos-grid">
			{#each videosD03 as persona (persona.github)}
				<article class="video-card">
					<div>
						<h3>{persona.nombre}</h3>
						<p>{persona.recurso}</p>
						<span>{persona.github}</span>
					</div>

					<button class="youtube-button" onclick={() => abrirExterno(persona.video)}>
						▶ Ver vídeo en YouTube
					</button>
				</article>
			{/each}
		</div>
	</div>

	<footer>
		Sistemas Orientados a Servicios | 2026
	</footer>
</div>

<style>
	:global(body) {
		font-family: Inter, system-ui, sans-serif;
		background-color: #f8fafc;
		color: #1e293b;
		line-height: 1.6;
		margin: 0;
		padding: 40px 20px;
		display: flex;
		justify-content: center;
	}

	.container {
		max-width: 900px;
		width: 100%;
	}

	header {
		border-bottom: 2px solid #2563eb;
		margin-bottom: 40px;
		padding-bottom: 10px;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
		letter-spacing: -1px;
	}

	.back-link {
		text-decoration: none;
		color: #2563eb;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h2 {
		font-size: 1.25rem;
		color: #1e293b;
		margin-top: 0;
		margin-bottom: 16px;
	}

	.section-card {
		background: #ffffff;
		padding: 25px;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		margin-bottom: 20px;
	}

	p {
		margin: 0;
		font-size: 1rem;
		color: #1e293b;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		padding: 10px 0;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	li:last-child {
		border-bottom: none;
	}

	a {
		color: #2563eb;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	a:hover {
		opacity: 0.7;
		text-decoration: underline;
	}

	.api-link {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.github-tag {
		background: #f1f5f9;
		padding: 4px 10px;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.85rem;
		color: #334155;
		white-space: nowrap;
		border: none;
		cursor: pointer;
	}

	.github-tag:hover {
		opacity: 0.7;
		text-decoration: underline;
	}

	.text-link {
		background: none;
		border: none;
		padding: 0;
		color: #2563eb;
		font: inherit;
		cursor: pointer;
		text-align: left;
	}

	.text-link:hover {
		opacity: 0.7;
		text-decoration: underline;
	}

	.videos-section {
		border-left: 4px solid #ef4444;
	}

	.videos-description {
		color: #475569;
		margin-bottom: 18px;
	}

	.videos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
	}

	.video-card {
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 18px;
		background: #f8fafc;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 16px;
	}

	.video-card h3 {
		margin: 0 0 8px 0;
		font-size: 1rem;
		color: #1e293b;
	}

	.video-card p {
		color: #475569;
		font-size: 0.95rem;
		margin-bottom: 6px;
	}

	.video-card span {
		color: #64748b;
		font-family: monospace;
		font-size: 0.85rem;
	}

	.youtube-button {
		display: inline-block;
		background: #ff0000;
		color: white;
		padding: 10px 14px;
		border-radius: 8px;
		font-weight: 700;
		text-align: center;
		border: none;
		cursor: pointer;
	}

	.youtube-button:hover {
		background: #cc0000;
		color: white;
		text-decoration: none;
		opacity: 1;
	}

	footer {
		text-align: center;
		margin-top: 50px;
		color: #64748b;
		font-size: 0.85rem;
	}

	@media (max-width: 700px) {
		header {
			flex-direction: column;
			align-items: flex-start;
		}

		li {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>