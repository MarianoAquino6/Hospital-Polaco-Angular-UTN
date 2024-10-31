import { Component } from '@angular/core';
import { Admin, Medico, Paciente } from '../../../interfaces/app.interface';
import { AuthService } from '../../../servicios/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {
  usuarioLogueadoEntidad: Medico | Paciente | Admin | null = null;
  emailUsuarioLogueado: string | null = null;
  isLoading = false;

  constructor(private authService: AuthService) { }

  async ngOnInit(): Promise<void> {
    this.authService.usuarioLogueado$.subscribe(async (usuario) => {
      this.emailUsuarioLogueado = usuario;

      if (this.emailUsuarioLogueado) {
        this.usuarioLogueadoEntidad = await this.authService.getUserEntity(this.emailUsuarioLogueado);
      }
    });
  }

  getImagenPerfil(): string {
    return this.usuarioLogueadoEntidad?.imagen1 || '';
  }

  // Type Guard para verificar si el usuario es Medico
  isMedico(usuario: any): usuario is Medico {
    return usuario && (usuario as Medico).especialidades !== undefined;
  }

  // Type Guard para verificar si el usuario es Paciente
  isPaciente(usuario: any): usuario is Paciente {
    return usuario && (usuario as Paciente).obraSocial !== undefined;
  }

  // Type Guard para verificar si el usuario es Admin
  isAdmin(usuario: any): usuario is Admin {
    return usuario && (usuario as Admin).rol === 'Admin';
  }
}