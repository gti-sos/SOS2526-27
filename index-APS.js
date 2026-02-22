
const datos = [
    {country:"Afghanistan", name: "Kajaki Hydroelectric Power Plant Afghanistan", year: 1975, river: "Helmand", plant_type: "STO", capacity_mw: 151, head_m: 90, dam_name: "Kajakai", res_vol_km3: 2.68},
    {country:"Afghanistan", name: "Mahipar Hydroelectric Power Plant Afghanistan", year: 1967, river: "Kabul", plant_type: "STO", capacity_mw: 66, head_m: 334, dam_name: "Mahipar dam", res_vol_km3: 0.0002},
    {country:"Afghanistan", name: "Naghlu Dam Hydroelectric Power Plant Afghanistan", year: 1967, river: "Kabul", plant_type: "ROR", capacity_mw: 100, head_m: 61, dam_name: "Naghlu", res_vol_km3: 0.5},
    {country:"Argentina", name: "NIHUIL II", year: 1968, river: "Atuel", plant_type: "STO", capacity_mw: 133.12, head_m: 179.75, dam_name: "Nihuil II", res_vol_km3: 0.00067},
    {country:"Argentina", name: "NIHUIL III", year: 1972, river: "Rio Atuel", plant_type: "STO", capacity_mw: 52, head_m: 75.75, dam_name: "NIHUIL III", res_vol_km3: 0.0008},
    {country:"Austria", name: "Obervermuntwerk II", year: 2019, river: null, plant_type: "PS", capacity_mw: 360, head_m: 291, dam_name: "Silvrettasee dam", res_vol_km3: 0.00731},
    {country:"Austria", name: "Roßhag Rosshag-KW - Rosshag Pumped Storage Power Plant Austria", year: 1972, river: "Zamser Bach", plant_type: "STO", capacity_mw: 231, head_m: 630, dam_name: "Schlegeis", res_vol_km3: 129},
    {country:"Brazil", name: "Bariri (Álvaro de Souza Lima)", year: 1969, river: "Tiete", plant_type: "ROR", capacity_mw: 136.8, head_m: 24, dam_name: "Bariri", res_vol_km3: 0.96},
    {country:"Brazil", name: "Barra Grande", year: 2005, river: "Petolas", plant_type: "STO", capacity_mw: 698.25, head_m: 154, dam_name: "Barra Grande", res_vol_km3: 5},
    {country:"Canada", name: "Waneta", year: 1954, river: "Pend d'Oreille", plant_type: "ROR", capacity_mw: 493.2, head_m: 63.2, dam_name: "Waneta", res_vol_km3: 0.0376},
    {country:"Canada", name: "Waneta Expansion", year: 2015, river: "Pend d'Oreille", plant_type: "ROR", capacity_mw: 335, head_m: 63.2, dam_name: "Waneta", res_vol_km3: 0.0376},
    
];

const pais = "Afghanistan";

let filtrar_por_pais = datos.filter(d => 
    d.country===pais && d.capacity_mw!=null);

let media = filtrar_por_pais.reduce((a,d) =>
    a+d.capacity_mw,0)/filtrar_por_pais.length;

console.log("La media de capacity_mw en " + pais + " es: " + media);
    