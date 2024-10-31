import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../../servicios/alert.service';
import { Firestore, collection, doc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Disponibilidad } from '../../../interfaces/app.interface';

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


  constructor(private alert: AlertService, private firestore: Firestore) { }

  handleDateSelected(selectedDate: string) {
    this.fechaSeleccionada = selectedDate;
    // Buscar la disponibilidad correspondiente a la fecha seleccionada
    this.disponibilidadSeleccionada = this.fechasDisponibles.find(d => d.fecha === selectedDate) || null;
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      especialidad: new FormControl('', Validators.required),
      especialista: new FormControl('', Validators.required)
    });

    this.buscarEspecialidadesDisponibles();
    console.log(this.especialistasDisponibles)
  }

  // buscarEspecialidadesDisponibles()
  // {
  //   buscar todas las especialidades guardadas en el campo 'especialidades' de los documentos que tengan rol
  //   "Medico" en la coleccion 'usuarios' y guardarlas a modo DISTINCT en this.especialidadesDisponibles, para que no se repitan
  // }

  async buscarEspecialidadesDisponibles() {
    const especialidadesSet = new Set<string>();

    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('rol', '==', 'Medico'));
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        const data = doc.data() as { especialidades?: string[] }; // Tipado para mejorar la seguridad
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

  // buscarEspecialistasDisponibles()
  // {
  //   buscar todos los especialistas en la coleccion 'usuarios' que en los valores del campo 'especialidades' 
  //   contengan la especialidad seleccionada y quedarme con una concatenacion de los campos 'nombre' y 'apellido'.
  //   Guardar los resultados en especialistasDisponibles
  // }

  // async buscarEspecialistasDisponibles() {
  //   const especialidadSeleccionada = this.form.get('especialidad')?.value;
  //   this.especialistasDisponibles = []; // Limpiar antes de cargar nuevos datos

  //   if (!especialidadSeleccionada) return;

  //   const especialistas: string[] = [];

  //   try {
  //     const usuariosRef = collection(this.firestore, 'usuarios');
  //     const q = query(
  //       usuariosRef,
  //       where('rol', '==', 'Medico'),
  //       where('especialidades', 'array-contains', especialidadSeleccionada)
  //     );
  //     const snapshot = await getDocs(q);

  //     snapshot.forEach((doc) => {
  //       const data = doc.data() as { nombre: string; apellido: string };
  //       const nombreCompleto = `${data.nombre} ${data.apellido}`;
  //       especialistas.push(nombreCompleto);
  //     });

  //     this.especialistasDisponibles = especialistas;
  //   } catch (error) {
  //     console.error("Error al obtener especialistas: ", error);
  //     this.alert.mostrarError("Error al obtener especialistas");
  //   }
  // }

  async buscarEspecialistasDisponibles() {
    const especialidadSeleccionada = this.form.get('especialidad')?.value;
    this.especialistasDisponibles = []; // Limpiar antes de cargar nuevos datos

    if (!especialidadSeleccionada) return;

    const especialistas: Especialista[] = []; // Array de objetos de tipo Especialista

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

      // Setea el email del especialista seleccionado
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

        // Guardar la información en `fechasDisponibles`
        this.fechasDisponibles = Object.entries(disponibilidadEspecialidad)
          .filter(([fecha, horario]: [string, any]) => {
            const [day, month, year] = fecha.split('-').map(Number);
            const fechaTurno = new Date(year, month - 1, day);
            fechaTurno.setHours(0, 0, 0, 0);
            return fechaTurno >= fechaActual && fechaTurno <= fechaLimite;
          })
          .map(([fecha, horario]: [string, any]) => ({
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

  get especialidad() {
    return this.form.get('especialidad');
  }

  get especialista() {
    return this.form.get('especialista');
  }

  get fechasDisponiblesStrings(): string[] {
    return this.fechasDisponibles.map(d => d.fecha);
  }
}
