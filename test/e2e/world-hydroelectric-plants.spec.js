import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:10000/world-hydroelectric-plants';

test.describe('Pruebas E2E - APS', () => {

    //Borra y lista antes de cada test
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        
        page.on('dialog', dialog => dialog.accept());

        await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();
        await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
        
        await expect(page.locator('.styled-table tbody tr').first()).toBeVisible({ timeout: 10000 });
    });

    // 1. CREAR RECURSO
    test('Debe permitir crear una nueva central', async ({ page }) => {
        const uniqueName = `Central_${Date.now()}`;
        const createBox = page.locator('.form-box').last();
        
        await createBox.getByPlaceholder('País').fill('Testland');
        await createBox.getByPlaceholder('Nombre Central').fill(uniqueName);
        await createBox.locator('input[type="number"]').first().fill('2026'); 
        
        await page.getByRole('button', { name: 'Guardar en la lista' }).click();

        const alerta = page.locator('.alert.exito');
        await expect(alerta).toContainText('Central añadida correctamente', { timeout: 7000 });
        await expect(page.getByText(uniqueName)).toBeVisible();
    });

    // 2. LISTAR TODOS LOS RECURSOS
    test('Debe listar los recursos iniciales correctamente', async ({ page }) => {
        const filas = page.locator('.styled-table tbody tr');
        await expect(filas).not.toHaveCount(0);
    });

    // 3. BORRAR RECURSO
    test('Debe permitir borrar una central específica', async ({ page }) => {
        const primerNombre = page.locator('.styled-table tbody tr td strong').first();
        const textoBorrar = await primerNombre.innerText();

        await page.locator('.btn-delete').first().click();

        await expect(page.locator('.alert.exito')).toContainText('Dato eliminado correctamente');
        await expect(page.locator('.styled-table')).not.toContainText(textoBorrar);
    });

    // 4. BORRAR TODOS
    test('Debe vaciar la base de datos y mostrar mensaje de éxito', async ({ page }) => {

        await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();

        // Verificamos el mensaje de éxito
        const alertaExito = page.locator('.alert.exito');
        await expect(alertaExito).toBeVisible({ timeout: 7000 });
        await expect(alertaExito).toContainText('Base de datos vaciada correctamente');

        // Verificamos que la tabla está vacía
        const filas = page.locator('.styled-table tbody tr');
        await expect(filas).toHaveCount(0);
    });

    // 5. EDITAR RECURSO 
    test('Debe editar una central y ver los cambios reflejados en la tabla', async ({ page }) => {

        const btnEdit = page.locator('.btn-edit').first();
        await expect(btnEdit).toBeVisible({ timeout: 10000 });
        await btnEdit.click();

        await page.waitForURL(url => url.pathname.includes('/world-hydroelectric-plants/'));

        const inputRio = page.getByLabel('Río:');
        await expect(inputRio).toBeVisible();
        
        await inputRio.clear();
        await inputRio.fill('Río Editado E2E');

        await page.getByRole('button', { name: 'Guardar cambios' }).click();

        const alertaExito = page.locator('.alert.exito');
        await expect(alertaExito).toContainText('¡Operación exitosa!');

        await page.getByRole('button', { name: 'Volver al listado' }).click();
        
        await page.waitForURL(BASE_URL);

        //COMPROBAR QUE EL CAMBIO SE MUESTRA EN LA TABLA
        await expect(page.getByText('Río Editado E2E')).toBeVisible();
    });

    // 6. BUSCADOR
    test('Debe filtrar resultados por país', async ({ page }) => {
        const searchBox = page.locator('.search-box');
        await searchBox.getByPlaceholder('País').fill('Canada');
        await page.getByRole('button', { name: 'Aplicar Filtros' }).click();

        await expect(page.locator('.alert.exito')).toContainText('¡Operación exitosa!');
    });

});