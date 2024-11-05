import { Component } from '@angular/core';
import { LoadingComponent } from '../loading/loading.component';
import { CommonModule } from '@angular/common';
import { Paciente } from '../../interfaces/app.interface';
import { collection, collectionData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { AlertService } from '../../servicios/alert.service';
import { AuthService } from '../../servicios/auth.service';
import { EstadoTurno } from '../../enums/enums';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [LoadingComponent, CommonModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent {
  isLoading: boolean = false;
  objetos!: Paciente[];
  usuarioLogueado: string | null = null;

  constructor(private firestore: Firestore, private alert: AlertService, private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.auth.usuarioLogueado$.subscribe((usuario) => {
      this.usuarioLogueado = usuario;
      console.log('Usuario logueado:', this.usuarioLogueado);
    });
    this.obtenerObjetos();
  }

  async obtenerObjetos() {
    this.isLoading = true;

    try {
      const col = collection(this.firestore, 'turnos');
      const filteredQuery = query(
        col,
        where('medico', '==', this.usuarioLogueado),
        where('estado', '==', EstadoTurno.Finalizado)
      );

      // Realizar la consulta para obtener los turnos finalizados
      const turnoSnapshot = await getDocs(filteredQuery);
      const pacientesEmails = new Set<string>();

      turnoSnapshot.forEach(doc => {
        const turnoData = doc.data();
        if (turnoData['paciente']) {
          pacientesEmails.add(turnoData['paciente']);
        }
      });

      const pacientesArray: Paciente[] = [];

      for (const email of pacientesEmails) {
        const userQuery = query(
          collection(this.firestore, 'usuarios'),
          where('email', '==', email)
        );

        const userSnapshot = await getDocs(userQuery);
        userSnapshot.forEach(userDoc => {
          const pacienteData = userDoc.data() as Paciente;
          pacientesArray.push(pacienteData);
        });
      }

      this.objetos = pacientesArray;
    } catch (error) {
      this.alert.mostrarError('Error al obtener los pacientes');
      console.error('Error al obtener los pacientes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  verHistoriaClinica(pacienteEmail: string)
  {
    this.auth.setPacienteHistoriaClinica(pacienteEmail);
    this.router.navigate(['/historia-clinica']);
  }
}