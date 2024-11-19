import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appMostrarSiCumpleCondicion]',
  standalone: true
})
export class MostrarSiCumpleCondicionDirective {
  private _mostrar: boolean = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input()
  set appMostrarSiCumpleCondicion(condicion: boolean) {
    this._mostrar = condicion;
    this._actualizarVista();
  }

  private _actualizarVista() {
    if (this._mostrar) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
