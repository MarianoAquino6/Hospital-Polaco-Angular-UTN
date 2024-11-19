import { Directive, HostListener, Input } from '@angular/core';
import { LoginComponent } from '../componentes/login/login.component';

@Directive({
  selector: '[appAutocompletar]',
  standalone: true
})
export class AutocompletarDirective {

  @Input() appAutocompletar!: { username: string, password: string };

  constructor(private loginComponent: LoginComponent) {} // Inyectamos el componente

  @HostListener('click') onClick() {
    if (this.appAutocompletar) {
      this.loginComponent.usernameLogin = this.appAutocompletar.username;
      this.loginComponent.passLogin = this.appAutocompletar.password;
    }
  }

}
