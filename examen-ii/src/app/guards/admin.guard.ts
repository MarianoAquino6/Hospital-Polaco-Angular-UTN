import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../servicios/auth.service';
import { Rol } from '../enums/enums';
import { AlertService } from '../servicios/alert.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService); // Inyectar el AuthService
  const alert = inject(AlertService); 

  const usuarioLogueado = authService.usuarioLogueado; // Obtener el valor actual del BehaviorSubject

  if (usuarioLogueado) {
    const role = await authService.getUserRole(usuarioLogueado); // Obtener el rol del usuario
    if (role === Rol.Admin) {
      return true; // Permitir el acceso si el rol es Admin
    }
  }

  alert.mostrarError('Acceso denegado. Solo para administradores.'); 
  return false; // Denegar el acceso
};
