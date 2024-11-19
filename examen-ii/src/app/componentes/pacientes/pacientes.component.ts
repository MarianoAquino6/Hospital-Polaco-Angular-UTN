import { Component } from '@angular/core';
import { LoadingComponent } from '../loading/loading.component';
import { CommonModule } from '@angular/common';
import { Paciente, Turno } from '../../interfaces/app.interface';
import { collection, collectionData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { AlertService } from '../../servicios/alert.service';
import { AuthService } from '../../servicios/auth.service';
import { EstadoTurno } from '../../enums/enums';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [LoadingComponent, CommonModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css',
  animations: [
    // Animación para la pantalla de pacientes (cuando se presiona ATRÁS)
    trigger('slideInOutPatients', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),  // Pantalla de pacientes entra desde la izquierda
        animate('0.5s ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('0.5s ease-in', style({ transform: 'translateX(-100%)' }))  // Sale hacia la izquierda
      ])
    ]),
    // Animación para la pantalla de detalles de los turnos (cuando se selecciona paciente)
    trigger('slideInOutDetails', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),  // Pantalla de detalles entra desde la derecha
        animate('0.5s ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('0.5s ease-in', style({ transform: 'translateX(100%)' }))  // Sale hacia la izquierda
      ])
    ])
  ]
})
export class PacientesComponent {
  isLoading: boolean = false;
  objetos!: Paciente[];
  usuarioLogueado: string | null = null;
  pacienteSeleccionado: Paciente | null = null;
  turnosPaciente: Turno[] = [];
  pantallaActual!: string;
  animacionSalida!: boolean;

  constructor(private firestore: Firestore, private alert: AlertService, private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.auth.usuarioLogueado$.subscribe((usuario) => {
      this.usuarioLogueado = usuario;
    });
    this.obtenerObjetos();
    this.pantallaActual = 'pacientes';
    this.animacionSalida = false;
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

  mostrarDetalles(pacienteEmail: string) {
    this.pacienteSeleccionado = this.objetos.find(objeto => objeto.email === pacienteEmail) || null;
    if (this.pacienteSeleccionado) {
      this.cargarTurnosPaciente(pacienteEmail);
    }
    this.pantallaActual = 'detalles-turnos';
  }

  async cargarTurnosPaciente(email: string) {
    const col = collection(this.firestore, 'turnos');
    const filteredQuery = query(
      col,
      where('paciente', '==', email)
    );

    const turnoSnapshot = await getDocs(filteredQuery);
    this.turnosPaciente = [];
    turnoSnapshot.forEach(doc => {
      const turnoData = doc.data() as Turno;
      this.turnosPaciente.push(turnoData);
    });
  }

  verHistoriaClinica(pacienteEmail: string) {
    this.auth.setPacienteHistoriaClinica(pacienteEmail, false);
    this.router.navigate(['/historia-clinica']);
  }

  async leerResenia(turno: Turno) {
    this.alert.leerResenia(turno);
  }

  regresar() {
    this.animacionSalida = true;
    this.pantallaActual = 'pacientes';
  }
}