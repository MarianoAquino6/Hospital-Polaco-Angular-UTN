import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../servicios/auth.service';
import { AlertService } from '../servicios/alert.service';

export const logueadoGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const alert = inject(AlertService);

  const usuarioLogueado = authService.usuarioLogueado;

  if (usuarioLogueado) {
    return true;
  }

  alert.mostrarError('Acceso denegado. Deberás loguearte.');
  return false;
};
