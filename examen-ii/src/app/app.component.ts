import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './servicios/auth.service';
import { Rol } from './enums/enums';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'examen-ii';
  isAdmin = false;

  usuarioLogueadoGeneral: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.usuarioLogueado$.subscribe(async (usuario) => {
      this.usuarioLogueadoGeneral = usuario;

      if (this.usuarioLogueadoGeneral) {
        const userRole = await this.authService.getUserRole(this.usuarioLogueadoGeneral);
        this.isAdmin = userRole === Rol.Admin; 
      }
    });
  }

  // Llamo al metodo logout del AuthService para que cambie el valor del usuario logueado a null
  logout() {
    this.authService.logout();
  }
}
