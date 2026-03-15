// 1. Inicialización del array con los 10 datos de la ficha de trabajo
const datos = [
    { grand_id: 1, dam_name: "Terror Lake", river: "Terror river", country: "United States", year: 1984, dam_hgt: 59, dam_len: 747, area_skm: 4, cap_mcm: 121, depth_m: 33.2, dis_avg_ls: 2608 },
    { grand_id: 2, dam_name: "Mayo", river: "Mayo", country: "Canada", year: 1952, dam_hgt: 11, dam_len: 539, area_skm: 8, cap_mcm: 112, depth_m: 64.8, dis_avg_ls: 15463 },
    { grand_id: 3, dam_name: "Blue Lake", river: "Sawmill Creek", country: "United States", year: 1961, dam_hgt: 44, dam_len: 784, area_skm: 8, cap_mcm: 179.1, depth_m: 36.8, dis_avg_ls: 8031 },
    { grand_id: 4, dam_name: "Green Lake", river: "Vodopad River", country: "United States", year: 1982, dam_hgt: 64, dam_len: 141, area_skm: 4, cap_mcm: 115.9, depth_m: 28, dis_avg_ls: 745 },
    { grand_id: 5, dam_name: "Long Lake Dam", river: "Long River", country: "United States", year: 1973, dam_hgt: 9, dam_len: 103, area_skm: 5, cap_mcm: 181.3, depth_m: 30.7, dis_avg_ls: 5865 },
    { grand_id: 6, dam_name: "W.A.C. Bennett", river: "Peace", country: "Canada", year: 1967, dam_hgt: 183, dam_len: 2042, area_skm: 17, cap_mcm: 79743, depth_m: 43.2, dis_avg_ls: 116745 },
    { grand_id: 7, dam_name: "Peace Canyon", river: "Peace", country: "Canada", year: 1980, dam_hgt: 61, dam_len: 533, area_skm: 8, cap_mcm: 215.9, depth_m: 25.2, dis_avg_ls: 117544 },
    { grand_id: 8, dam_name: "Swan Lake", river: "Falls Creek", country: "United States", year: 1984, dam_hgt: 53, dam_len: 146, area_skm: 5, cap_mcm: 15, depth_m: 3, dis_avg_ls: 5639 },
    { grand_id: 9, dam_name: "Master Canyon", river: "Peace", country: "Canada", year: 1988, dam_hgt: 45, dam_len: 241, area_skm: 2, cap_mcm: 5, depth_m: 39, dis_avg_ls: 115831 },
    { grand_id: 10, dam_name: "Spoon Lake", river: "Miley river", country: "United States", year: 1992, dam_hgt: 37, dam_len: 628, area_skm: 5, cap_mcm: 49, depth_m: 27.2, dis_avg_ls: 25193 }
];

// 2. Algoritmo 
// Calculo la media de 'dam_hgt' (altura de las presas) para las filas donde country es 'Canada'
const valorGeografico = "Canada";

const subconjunto = datos.filter(f => f.country === valorGeografico);

let suma = 0;
subconjunto.forEach(f => {
    suma += f.dam_hgt;
});

const media = suma / subconjunto.length;

// 3. Muestro los resultado
console.log(`Análisis para el subconjunto: ${valorGeografico}`);
console.log(`Número de elementos: ${subconjunto.length}`);
console.log(`La media de la altura de las presas (dam_hgt) es: ${media.toFixed(2)}`);