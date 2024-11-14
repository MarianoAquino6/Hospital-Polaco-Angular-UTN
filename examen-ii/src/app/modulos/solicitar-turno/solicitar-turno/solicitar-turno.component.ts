import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../../servicios/alert.service';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from '@angular/fire/firestore';
import { Disponibilidad, Paciente } from '../../../interfaces/app.interface';
import { AuthService } from '../../../servicios/auth.service';
import { EstadoTurno, Rol } from '../../../enums/enums';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

interface Especialista {
  nombreCompleto: string;
  email: string;
}

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrl: './solicitar-turno.component.css',
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition(':enter', [
        animate('300ms ease-in', style({
          opacity: 1
        }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({
          opacity: 0
        }))
      ])
    ]),
    trigger('slideIn', [
      state('void', style({
        transform: 'translateX(-100%)'
      })),
      transition(':enter', [
        animate('300ms ease-in', style({
          transform: 'translateX(0)'
        }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({
          transform: 'translateX(100%)'
        }))
      ])
    ])
  ]
})
export class SolicitarTurnoComponent {
  isLoading = false;
  medicos: any[] = [];
  medicoSeleccionado: any = null;
  diasDisponibles: string[] = [];
  diaSeleccionado: string | null = null;
  horariosDisponibles: string[] = [];
  especialidadSeleccionada: string | null = null;
  horarioSeleccionado: string | null = null;
  emailPaciente: string | null = null;
  isAdmin: boolean = false;
  pacientesDisponibles!: Paciente[];
  pantallaActual!: string;

  constructor(private firestore: Firestore, private auth: AuthService, private alert: AlertService, private router: Router) { }

  ngOnInit(): void {
    this.cargarMedicos();

    const emailUsuarioLogueado = this.auth.obtenerUsuarioLogueado();

    if (emailUsuarioLogueado) {
      this.auth.getUserRole(emailUsuarioLogueado).then(rolUsuarioLogueado => {
        if (rolUsuarioLogueado === Rol.Admin) {
          this.isAdmin = true;
          this.pantallaActual = 'pacientes';
          this.buscarPacientesDisponibles();
        }

        if (rolUsuarioLogueado === Rol.Paciente) {
          this.emailPaciente = emailUsuarioLogueado;
          this.pantallaActual = 'medicos';
        }
      });
    }
  }

  cambiarPantalla(pantalla: string) {
    this.pantallaActual = pantalla;
  }

  async buscarPacientesDisponibles() {
    const pacientesSet = new Set<Paciente>();

    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('rol', '==', 'Paciente'));
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const paciente: Paciente = {
          email: data['email'],
          nombre: `${data['nombre']} ${data['apellido']}`,
          documento: data['documento']
        };

        pacientesSet.add(paciente)
      });

      this.pacientesDisponibles = Array.from(pacientesSet);
    } catch (error) {
      this.alert.mostrarError("Error al obtener pacientes");
    }
  }

  seleccionarEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    this.cargarDiasDisponibles();
    this.cambiarPantalla('dias');
  }

  seleccionarPaciente(paciente: Paciente) {
    this.emailPaciente = paciente.email;
    this.cambiarPantalla('medicos');
    console.log(`Paciente seleccionado: ${paciente.nombre} ${paciente.apellido}`);
  }

  async cargarMedicos() {
    this.isLoading = true;
    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('rol', '==', 'Medico'));
      const querySnapshot = await getDocs(q);
      this.medicos = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.alert.mostrarError('Error al cargar médicos:' + error);
    } finally {
      this.isLoading = false;
    }
  }

  seleccionarMedico(medico: any) {
    this.medicoSeleccionado = medico;
    this.cambiarPantalla('especialidades');
  }

  getImagenEspecialidad(especialidad: string): string {
    const imagenes: { [key: string]: string } = {
      Cardiología: 'assets/img/cardiologia.png',
      Dermatología: 'assets/img/dermatologia.png',
      Pediatría: 'assets/img/pediatria.png',
      Neurología: 'assets/img/neurologia.png',
    };
    return imagenes[especialidad] || 'assets/img/default.png';
  }

  async cargarDiasDisponibles() {
    const disponibilidad = this.medicoSeleccionado.disponibilidad || {};
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 

    const proximos15Dias = Array.from({ length: 15 }, (_, i) => {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i); 
      return fecha.toISOString().split('T')[0]; 
    });

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const disponibilidadEspecialidad = this.especialidadSeleccionada
      ? disponibilidad[this.especialidadSeleccionada]
      : null;

    if (!disponibilidadEspecialidad) {
      this.alert.mostrarError('No hay disponibilidad para la especialidad seleccionada.');
      this.diasDisponibles = [];
      return;
    }

    this.diasDisponibles = proximos15Dias.filter((fechaISO) => {
      const fecha = new Date(fechaISO); 
      const diaSemanaIndex = fecha.getDay(); 
      const diaSemana = diasSemana[diaSemanaIndex]; 

      const isAvailable = !!disponibilidadEspecialidad[diaSemana]; 

      return isAvailable; 
    });
  }

  async seleccionarDia(dia: string) {
    this.diaSeleccionado = dia;
    this.cargarHorariosDisponibles();
    this.cambiarPantalla('horarios');
  }

  async cargarHorariosDisponibles() {
    if (!this.diaSeleccionado) {
      this.alert.mostrarError('No se ha seleccionado un día.');
      return;
    }

    const fechaSeleccionada = new Date(this.diaSeleccionado);

    const diaSemanaIndex = fechaSeleccionada.getDay();

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const diaSemana = diasSemana[diaSemanaIndex];

    const disponibilidadDia =
      this.especialidadSeleccionada &&
        this.medicoSeleccionado.disponibilidad?.[this.especialidadSeleccionada]
        ? this.medicoSeleccionado.disponibilidad[this.especialidadSeleccionada]
        : {};

    if (!disponibilidadDia[diaSemana]) {
      this.alert.mostrarError('No hay disponibilidad para el día seleccionado.');
      this.horariosDisponibles = [];
      return;
    }

    const horarios: string[] = [];
    const { horaInicio, horaFin } = disponibilidadDia[diaSemana];
    const duracion = this.medicoSeleccionado.duracion || 30;

    let hora = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);

    while (hora < fin) {
      const siguienteHora = new Date(hora);
      siguienteHora.setMinutes(hora.getMinutes() + duracion);
      horarios.push(hora.toTimeString().split(':').slice(0, 2).join(':'));
      hora = siguienteHora;
    }

    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('medico', '==', this.medicoSeleccionado.email));
    const querySnapshot = await getDocs(q);
    const turnosReservados = querySnapshot.docs
      .map((doc) => doc.data())
      .filter((t) => t['fecha'] === this.diaSeleccionado)  
      .filter((t) => t['estado'] !== 'Cancelado' && t['estado'] !== 'Rechazado')
      .map((t) => t['horario']);

    this.horariosDisponibles = horarios.filter((horario) => !turnosReservados.includes(horario));
  }

  seleccionarHorario(horario: string): void {
    this.horarioSeleccionado = horario;
  }

  async guardarTurno(): Promise<void> {
    if (!this.medicoSeleccionado || !this.diaSeleccionado || !this.horarioSeleccionado) {
      this.alert.mostrarError('Debe seleccionar un médico, un día y un horario.');
      return;
    }

    const turnoData = {
      especialidad: this.especialidadSeleccionada,
      estado: "Pendiente", 
      fecha: this.diaSeleccionado, 
      fechaSolicitud: new Date().toISOString(), 
      horario: this.horarioSeleccionado, 
      medico: this.medicoSeleccionado.email, 
      paciente: this.emailPaciente, 
    };

    try {
      const turnosRef = collection(this.firestore, 'turnos');
      await addDoc(turnosRef, turnoData);
      this.alert.mostrarSuccess('Turno guardado correctamente.');
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (error) {
      this.alert.mostrarError('Error al guardar el turno:' + error);
    }
  }
}