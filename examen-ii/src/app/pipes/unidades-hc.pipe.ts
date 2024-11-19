import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unidadesHc',
  standalone: true
})
export class UnidadesHcPipe implements PipeTransform {

  transform(valor: number | string | null | undefined, tipo: string): string {
    if (valor === null || valor === undefined || valor === '') {
      return '';
    }

    switch (tipo) {
      case 'altura':
        return `${valor} cm`;
      case 'peso':
        return `${valor} Kg`;
      case 'temperatura':
        return `${valor} °C`;
      case 'presion':
        return `${valor} mmHg`;
      default:
        return `${valor}`;
    }
  }

}
