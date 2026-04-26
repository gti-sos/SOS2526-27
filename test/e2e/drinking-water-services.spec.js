import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:10000/drinking-water-services';

test.describe('Pruebas E2E - Servicios de agua potable', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BASE_URL);

		page.on('dialog', dialog => dialog.accept());

		await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();
		await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();

		await expect(page.locator('.styled-table tbody tr').first()).toBeVisible({ timeout: 10000 });
	});

	// 1. CREAR RECURSO
	test('Debe permitir crear un nuevo recurso', async ({ page }) => {
		const uniqueEntity = `Testland_${Date.now()}`;
		const createBox = page.locator('.form-box').last();

		await createBox.getByPlaceholder('País o entidad').fill(uniqueEntity);
		await createBox.getByPlaceholder('Código').fill('TST');
		await createBox.getByPlaceholder('Año').fill('2026');
		await createBox.getByPlaceholder('Población urbana con servicio básico').fill('88.5');

		await page.getByRole('button', { name: 'Crear recurso' }).click();

		const alerta = page.locator('.alert.exito');
		await expect(alerta).toContainText('Recurso creado correctamente.', { timeout: 7000 });
		await expect(page.getByText(uniqueEntity)).toBeVisible();
	});

	// 2. LISTAR TODOS LOS RECURSOS
	test('Debe listar los recursos iniciales correctamente', async ({ page }) => {
		const filas = page.locator('.styled-table tbody tr');
		await expect(filas).not.toHaveCount(0);
		await expect(page.locator('main').getByRole('heading', { name: 'Servicios de agua potable', exact: true })).toBeVisible();
	});

	// 3. BORRAR RECURSO
	test('Debe permitir borrar un recurso concreto', async ({ page }) => {
		const filas = page.locator('.styled-table tbody tr');
		const filasAntes = await filas.count();

		await page.locator('.btn-delete').first().click();

		const alerta = page.locator('.alert.exito');
		await expect(alerta).toBeVisible({ timeout: 7000 });

		await expect(filas).toHaveCount(filasAntes - 1);
	});

	// 4. BORRAR TODOS
	test('Debe permitir borrar todos los recursos', async ({ page }) => {
		await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();

		const alertaExito = page.locator('.alert.exito');
		await expect(alertaExito).toBeVisible({ timeout: 7000 });
		await expect(alertaExito).toContainText('Todos los recursos se han borrado correctamente.');

		const filas = page.locator('.styled-table tbody tr');
		await expect(filas).toHaveCount(0);
	});

	// 5. EDITAR RECURSO
	test('Debe editar un recurso y ver los cambios reflejados en la tabla', async ({ page }) => {
		const btnEdit = page.locator('.btn-edit').first();
		await expect(btnEdit).toBeVisible({ timeout: 10000 });
		await btnEdit.click();

		await page.waitForURL(url => url.pathname.includes('/drinking-water-services/'));

		const inputPoblacion = page.getByLabel('Población urbana con servicio básico:');
		await expect(inputPoblacion).toBeVisible({ timeout: 7000 });

		await inputPoblacion.clear();
		await inputPoblacion.fill('77.7');

		await page.getByRole('button', { name: 'Guardar cambios' }).click();

		await expect(page.getByText('El recurso se ha actualizado correctamente.')).toBeVisible({ timeout: 7000 });

		await page.getByRole('button', { name: 'Volver al listado' }).click();
		await page.waitForURL(BASE_URL);

		await expect(page.locator('.styled-table')).toContainText('77.7');
	});

	// 6. BUSCADOR POR CÓDIGO
	test('Debe filtrar resultados por código', async ({ page }) => {
		const searchBox = page.locator('.search-box');

		await searchBox.getByPlaceholder('Código').fill('ESP');
		await page.getByRole('button', { name: 'Aplicar filtros' }).click();

		const alerta = page.locator('.alert.exito, .alert.error');
		await expect(alerta).toBeVisible({ timeout: 7000 });
	});

	// 7. BUSCADOR POR RANGO DE AÑOS
	test('Debe permitir buscar recursos por rango de años', async ({ page }) => {
		const searchBox = page.locator('.search-box');

		await searchBox.getByPlaceholder('Desde (año)').fill('2000');
		await searchBox.getByPlaceholder('Hasta (año)').fill('2010');

		await page.getByRole('button', { name: 'Aplicar filtros' }).click();

		const alerta = page.locator('.alert.exito, .alert.error');
		await expect(alerta).toBeVisible({ timeout: 7000 });
	});
});