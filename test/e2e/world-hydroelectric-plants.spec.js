import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:10000/world-hydroelectric-plants';

test.describe('Pruebas E2E Idempotentes - Centrales Hidroeléctricas', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        
        // 1. Configuramos el manejador de diálogos una sola vez para TODO el test
        // Esto evita el error de "already handled"
        page.on('dialog', dialog => dialog.accept());

        // 2. Limpieza inicial: Borramos todo y cargamos datos estándar
        await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();
        await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
        
        // Esperamos a que la tabla tenga datos antes de empezar cada test
        await expect(page.locator('.styled-table tbody tr').first()).toBeVisible({ timeout: 10000 });
    });

    // 1. CREAR
    test('Debe permitir crear una nueva central', async ({ page }) => {
        const uniqueName = `Central_${Date.now()}`;
        const createBox = page.locator('.form-box').last();
        
        await createBox.getByPlaceholder('País').fill('Testland');
        await createBox.getByPlaceholder('Nombre Central').fill(uniqueName);
        await createBox.locator('input[type="number"]').first().fill('2026'); 
        
        await page.getByRole('button', { name: 'Guardar en la lista' }).click();

        // Buscamos la alerta con un poco más de tiempo de espera
        const alerta = page.locator('.alert.exito');
        await expect(alerta).toContainText('Central añadida correctamente', { timeout: 7000 });
        await expect(page.getByText(uniqueName)).toBeVisible();
    });

    // 2. LISTAR
    test('Debe listar los recursos iniciales correctamente', async ({ page }) => {
        const filas = page.locator('.styled-table tbody tr');
        await expect(filas).not.toHaveCount(0);
    });

    // 3. BORRAR CONCRETO
    test('Debe permitir borrar una central específica', async ({ page }) => {
        const primerNombre = page.locator('.styled-table tbody tr td strong').first();
        const textoBorrar = await primerNombre.innerText();

        // No añadimos page.on('dialog') aquí porque ya está en el beforeEach
        await page.locator('.btn-delete').first().click();

        await expect(page.locator('.alert.exito')).toContainText('Dato eliminado correctamente');
        await expect(page.locator('.styled-table')).not.toContainText(textoBorrar);
    });

    // 4. BORRAR TODOS
    test('Debe vaciar la base de datos y mostrar mensaje de éxito', async ({ page }) => {
        // No añadimos page.on('dialog') aquí para evitar el error "already handled"
        await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();

        // Verificamos el mensaje de éxito
        const alertaExito = page.locator('.alert.exito');
        await expect(alertaExito).toBeVisible({ timeout: 7000 });
        await expect(alertaExito).toContainText('Base de datos vaciada correctamente');

        // Verificamos que la tabla está vacía
        const filas = page.locator('.styled-table tbody tr');
        await expect(filas).toHaveCount(0);
    });

    // 5. EDITAR
    test('Debe navegar a la vista de edición', async ({ page }) => {
        const btnEdit = page.locator('.btn-edit').first();
        await btnEdit.click();

        await expect(page.url()).toContain('/world-hydroelectric-plants/');
    });

    // 6. BUSCADOR
    test('Debe filtrar resultados por país', async ({ page }) => {
        const searchBox = page.locator('.search-box');
        await searchBox.getByPlaceholder('País').fill('Canada');
        await page.getByRole('button', { name: 'Aplicar Filtros' }).click();

        await expect(page.locator('.alert.exito')).toContainText('¡Operación exitosa!');
    });

});