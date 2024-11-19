import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'genero',
  standalone: true
})
export class GeneroPipe implements PipeTransform {

  transform(nombreCompleto: string | null | undefined): string {
    if (!nombreCompleto) {
      return ''; // Devuelve una cadena vacía si el nombre es null o undefined
    }

    // Asumimos que el primer elemento es el apellido y lo ignoramos, nos quedamos con el resto para los nombres
    const partesNombre = nombreCompleto.trim().split(' ');
    const nombre = partesNombre.length > 1 ? partesNombre.slice(1).join(' ').toLowerCase() : '';

    // Obtener el primer nombre real para aplicar las reglas
    const primerNombre = nombre.split(' ')[0];

    // Reglas avanzadas para inferir el género
    let esFemenino = false;

    // Regla 1: Si el nombre termina en "a" o "á", es probable que sea femenino
    if (primerNombre.endsWith('a') || primerNombre.endsWith('á')) {
      esFemenino = true;
    }

    // Regla 2: Excepciones de nombres masculinos que terminan en "a" o vocal fuerte
    const excepcionesMasculinas = [
      'nicolás', 'elías', 'josé', 'noé', 'ismael', 'miguel', 'rafael', 'manuel'
    ];
    if (excepcionesMasculinas.includes(primerNombre)) {
      esFemenino = false;
    }

    // Regla 3: Nombres terminados en "e" (ej. "Valerie" suele ser femenino, pero "José" es masculino)
    if (primerNombre.endsWith('e') && !excepcionesMasculinas.includes(primerNombre)) {
      esFemenino = primerNombre.endsWith('ie') || primerNombre === 'valerie';
    }

    // Regla 4: Nombres que terminan en "o" son típicamente masculinos
    if (primerNombre.endsWith('o')) {
      esFemenino = false;
    }

    // Regla 5: Nombres comunes femeninos que terminan en consonante
    const comunesFemeninosConsonante = [
      'carmen', 'mercedes', 'luz', 'cruz', 'margarit'
    ];
    if (comunesFemeninosConsonante.includes(primerNombre)) {
      esFemenino = true;
    }

    // Regla 6: Nombres comunes masculinos que terminan en vocal o consonante
    const comunesMasculinos = [
      'david', 'axel', 'daniel', 'gabriel', 'samuel', 'pascual', 'raúl'
    ];
    if (comunesMasculinos.includes(primerNombre)) {
      esFemenino = false;
    }

    // Regla 7: Si el nombre termina en "i", es muy probable que sea femenino (ej. "Noemí", "Nati")
    if (primerNombre.endsWith('i')) {
      esFemenino = true;
    }

    // Regla 8: Nombres que terminan en "l", "n", "r" o "s" pueden ser femeninos o masculinos, pero aquí agregaremos algunos casos
    if (primerNombre.endsWith('l') || primerNombre.endsWith('n') || primerNombre.endsWith('r') || primerNombre.endsWith('s')) {
      if (['marisol', 'raquel', 'belen', 'soledad', 'yolanda'].includes(primerNombre)) {
        esFemenino = true;
      }
    }

    // Aplicar título
    const titulo = esFemenino ? 'Dra.' : 'Dr.';
    return `${titulo} ${nombreCompleto}`;
  }

}
