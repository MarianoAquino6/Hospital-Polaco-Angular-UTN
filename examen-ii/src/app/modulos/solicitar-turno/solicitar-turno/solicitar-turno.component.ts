import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../../servicios/alert.service';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from '@angular/fire/firestore';
import { Disponibilidad, Paciente } from '../../../interfaces/app.interface';
import { AuthService } from '../../../servicios/auth.service';
import { EstadoTurno, Rol } from '../../../enums/enums';
import { Router } from '@angular/router';

interface Especialista {
  nombreCompleto: string;
  email: string;
}

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrl: './solicitar-turno.component.css'
})
export class SolicitarTurnoComponent {
  fechaSeleccionada: string = '';
  form!: FormGroup;
  isLoading = false;
  mostrarCalendario = false;
  especialidadesDisponibles!: string[];
  especialistasDisponibles: Especialista[] = [];
  especialistaSeleccionadoEmail: string = '';
  fechasDisponibles: Disponibilidad[] = [];
  disponibilidadSeleccionada: Disponibilidad | null = null;
  turnoSeleccionado: string = '';
  emailPaciente!: string;
  isAdmin: boolean = false;
  pacientesDisponibles!: Paciente[];
  horaInicioSeleccionada!: string;
  horaFinSeleccionada!: string;

  constructor(private alert: AlertService, private firestore: Firestore, private auth: AuthService, private router: Router) { }

  handleDateSelected(selectedDate: string) {
    this.fechaSeleccionada = selectedDate;
    this.disponibilidadSeleccionada = this.fechasDisponibles.find(d => d.fecha === selectedDate) || null;
  }

  handleAppointmentSelected(turnoSeleccionado: string) {
    const regex = /De (\d{1,2}:\d{2}) hs a (\d{1,2}:\d{2}) hs/;
    const match = turnoSeleccionado.match(regex);

    if (match) {
      this.horaInicioSeleccionada = match[1];
      this.horaFinSeleccionada = match[2];
    }
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      especialidad: new FormControl('', Validators.required),
      especialista: new FormControl('', Validators.required)
    });

    this.buscarEspecialidadesDisponibles();
    const emailUsuarioLogueado = this.auth.obtenerUsuarioLogueado();

    if (emailUsuarioLogueado) {
      this.auth.getUserRole(emailUsuarioLogueado).then(rolUsuarioLogueado => {
        if (rolUsuarioLogueado === Rol.Admin) {
          this.isAdmin = true;
          this.buscarPacientesDisponibles();
          this.form.addControl('paciente', new FormControl('', Validators.required));
          this.form.get('paciente')?.valueChanges.subscribe((email) => {
            this.emailPaciente = email;
          });
        }

        if (rolUsuarioLogueado === Rol.Paciente) {
          this.emailPaciente = emailUsuarioLogueado;
        }
      });
    }

    console.log(this.especialistasDisponibles);
  }

  async buscarEspecialidadesDisponibles() {
    const especialidadesSet = new Set<string>();

    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('rol', '==', 'Medico'));
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        const data = doc.data() as { especialidades?: string[] }; 
        const especialidades = data.especialidades || [];

        if (Array.isArray(especialidades)) {
          especialidades.forEach((especialidad: string) => especialidadesSet.add(especialidad));
        }
      });

      this.especialidadesDisponibles = Array.from(especialidadesSet);
    } catch (error) {
      console.error("Error al obtener especialidades: ", error);
      this.alert.mostrarError("Error al obtener especialidades");
    }
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

  async buscarEspecialistasDisponibles() {
    const especialidadSeleccionada = this.form.get('especialidad')?.value;
    this.especialistasDisponibles = []; 

    if (!especialidadSeleccionada) return;

    const especialistas: Especialista[] = []; 

    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(
        usuariosRef,
        where('rol', '==', 'Medico'),
        where('especialidades', 'array-contains', especialidadSeleccionada)
      );
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        const data = doc.data() as { nombre: string; apellido: string; email: string };
        const nombreCompleto = `${data.nombre} ${data.apellido}`;
        const email = data.email;
        especialistas.push({ nombreCompleto, email });
      });

      this.especialistasDisponibles = especialistas;
    } catch (error) {
      console.error("Error al obtener especialistas: ", error);
      this.alert.mostrarError("Error al obtener especialistas");
    }
  }

  async onSubmit(): Promise<void> {
    console.log('se entro al on submit')

    if (this.form.valid) {
      this.isLoading = true;

      const especialistaSeleccionado = this.form.get('especialista')?.value;
      const especialista = this.especialistasDisponibles.find(e => e.email === especialistaSeleccionado);
      this.especialistaSeleccionadoEmail = especialista ? especialista.email : '';

      try {
        this.mostrarCalendario = true;
        await this.buscarDisponibilidad();
      } catch (error) {
        this.alert.mostrarError('Error inesperado');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.alert.mostrarError('El formulario es inválido');
    }
  }

  async buscarDisponibilidad() {
    const especialistaSeleccionado = this.especialistaSeleccionadoEmail;
    const especialidadSeleccionada = this.form.get('especialidad')?.value;

    if (!especialistaSeleccionado || !especialidadSeleccionada) return;

    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaActual.getDate() + 15);
    fechaLimite.setHours(0, 0, 0, 0);

    try {
      console.log("Especialista seleccionado:", especialistaSeleccionado);

      const disponibilidadRef = doc(this.firestore, `disponibilidades/${especialistaSeleccionado}`);
      const disponibilidadSnap = await getDoc(disponibilidadRef);

      if (disponibilidadSnap.exists()) {
        const disponibilidadData = disponibilidadSnap.data() as Record<string, any>;
        const disponibilidadEspecialidad = disponibilidadData[especialidadSeleccionada] || {};

        this.fechasDisponibles = Object.entries(disponibilidadEspecialidad)
          .filter(([fecha, horario]: [string, any]) => {
            const [day, month, year] = fecha.split('-').map(Number);
            const fechaTurno = new Date(year, month - 1, day);
            fechaTurno.setHours(0, 0, 0, 0);
            return fechaTurno >= fechaActual && fechaTurno <= fechaLimite;
          })
          .map(([fecha, horario]: [string, any]) => ({
            especialista: especialistaSeleccionado,
            especialidad: especialidadSeleccionada,
            fecha: fecha,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            duracionTurnos: horario.duracionTurnos,
          }));

        console.log("Fechas disponibles estructuradas:", this.fechasDisponibles);
      } else {
        this.alert.mostrarError("No se encontró disponibilidad para el especialista seleccionado");
      }
    } catch (error) {
      console.error("Error al buscar disponibilidad:", error);
      this.alert.mostrarError("Error al buscar disponibilidad");
    }
  }

  isFormValid(): boolean {
    console.log(this.emailPaciente)
    console.log(this.especialistaSeleccionadoEmail)
    console.log(this.form.get('especialidad')?.value)
    console.log(this.fechaSeleccionada)
    console.log(this.horaInicioSeleccionada)
    console.log(this.horaFinSeleccionada)
    
    return !!(
      this.emailPaciente &&
      this.especialistaSeleccionadoEmail &&
      this.form.get('especialidad')?.value &&
      this.fechaSeleccionada &&
      this.horaInicioSeleccionada &&
      this.horaFinSeleccionada
    );
  }

  async onSolicitarTurno() {
    if (!this.isFormValid()) {
      console.log("Formulario inválido, faltan campos requeridos.");
      return;
    }

    try {
      this.isLoading = true;

      console.log("Iniciando solicitud de turno...");

      const turnosRef = collection(this.firestore, 'turnos');

      const fechaSolo = this.fechaSeleccionada.includes('T')
        ? this.fechaSeleccionada.split('T')[0]
        : this.fechaSeleccionada;

      console.log("Valor de fechaSolo (debe ser solo la fecha):", fechaSolo);

      const q = query(
        turnosRef,
        where('fecha', '==', fechaSolo),
        where('paciente', '==', this.emailPaciente),
        where('especialidad', '==', this.form.get('especialidad')?.value)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        this.alert.mostrarError("Solo es posible reservar un turno por día para esta especialidad");
        return;
      }

      const turnoData = {
        medico: this.especialistaSeleccionadoEmail,
        fecha: fechaSolo,
        horario: `${this.horaInicioSeleccionada} - ${this.horaFinSeleccionada}`,
        paciente: this.emailPaciente,
        especialidad: this.form.get('especialidad')?.value,
        estado: EstadoTurno.Pendiente,
        fechaSolicitud: new Date()
      };

      await addDoc(turnosRef, turnoData);

      console.log("Turno solicitado exitosamente.");
      this.alert.mostrarSuccess("Turno solicitado exitosamente");
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (error) {
      console.error("Error al solicitar turno:", error);
      this.alert.mostrarError("Error al solicitar turno");
    } finally {
      this.isLoading = false;
    }
  }

  get especialidad() {
    return this.form.get('especialidad');
  }

  get especialista() {
    return this.form.get('especialista');
  }

  get paciente() {
    return this.form.get('paciente');
  }

  get fechasDisponiblesStrings(): string[] {
    return this.fechasDisponibles.map(d => d.fecha);
  }
}
