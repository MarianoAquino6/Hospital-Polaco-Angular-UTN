import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroGenerico',
  standalone: true
})
export class FiltroGenericoPipe implements PipeTransform {

  transform<T>(items: T[], searchText: string, fields: (keyof T)[] = []): T[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();

    return items.filter(item => {
      return fields.some(field => {
        const value = item[field];

        if (field === 'datosDinamicos' && Array.isArray(value)) {
          return value.some(dynamicData => {
            return dynamicData.clave.toLowerCase().includes(searchText) || dynamicData.valor.toLowerCase().includes(searchText);
          });
        }

        return value && value.toString().toLowerCase().includes(searchText);
      });
    });
  }
}
