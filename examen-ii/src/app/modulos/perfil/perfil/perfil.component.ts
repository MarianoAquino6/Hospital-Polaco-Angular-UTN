import { Component } from '@angular/core';
import { Admin, Medico, Paciente } from '../../../interfaces/app.interface';
import { AuthService } from '../../../servicios/auth.service';
import { Rol } from '../../../enums/enums';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {
  usuarioLogueadoEntidad: Medico | Paciente | Admin | null = null;
  emailUsuarioLogueado: string | null = null;
  isLoading = false;
  tieneHistoriaClinica: boolean = false;
  esPaciente: boolean = false;

  constructor(private authService: AuthService, private firestore: Firestore) { }

  async ngOnInit(): Promise<void> {
    this.authService.usuarioLogueado$.subscribe(async (usuario) => {
      this.emailUsuarioLogueado = usuario;

      if (this.emailUsuarioLogueado) {
        console.log("Entro a buscar la entidad")
        this.usuarioLogueadoEntidad = await this.authService.getUserEntity(this.emailUsuarioLogueado);
      }

      if (this.usuarioLogueadoEntidad?.rol == Rol.Paciente) {
        console.log('Es paciente');
        this.verificarHistoriaClinica();
      }
    });
  }

  async verificarHistoriaClinica() {
    console.log('Verificando historia clínica...');

    if (this.usuarioLogueadoEntidad?.rol === Rol.Paciente) {
      console.log('Usuario logueado es un paciente:', this.usuarioLogueadoEntidad.email);

      try {
        const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');
        const q = query(historiasClinicasRef, where('pacienteEmail', '==', this.usuarioLogueadoEntidad.email));
        console.log('Consulta creada:', q);

        const querySnapshot = await getDocs(q);
        console.log('Consulta ejecutada. Resultados:', querySnapshot.docs.length);

        if (!querySnapshot.empty) {
          this.tieneHistoriaClinica = true; 
          console.log('Historia clínica encontrada.');
        } else {
          this.tieneHistoriaClinica = false; 
          console.log('No se encontró ninguna historia clínica para el paciente.');
        }
      } catch (error) {
        console.error('Error al verificar la historia clínica:', error);
      }
    } else {
      console.log('El usuario no es un paciente, rol actual:', this.usuarioLogueadoEntidad?.rol);
    }
  }

  getImagenPerfil(): string {
    return this.usuarioLogueadoEntidad?.imagen1 || '';
  }

  isMedico(usuario: any): usuario is Medico {
    return usuario && (usuario as Medico).especialidades !== undefined;
  }

  isPaciente(usuario: any): usuario is Paciente {
    return usuario && (usuario as Paciente).obraSocial !== undefined;
  }

  isAdmin(usuario: any): usuario is Admin {
    return usuario && (usuario as Admin).rol === 'Admin';
  }
}