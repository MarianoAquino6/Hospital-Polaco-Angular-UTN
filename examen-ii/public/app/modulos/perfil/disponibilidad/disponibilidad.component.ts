import { Component, Input, OnInit } from '@angular/core';
import { Admin, Medico, Paciente } from '../../../interfaces/app.interface';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AlertService } from '../../../servicios/alert.service';
import { collection, doc, Firestore, getDoc, getDocs, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { Router } from '@angular/router';

interface DisponibilidadDia {
  horaInicio: string;
  horaFin: string;
}

interface Disponibilidad {
  [especialidad: string]: {
    [dia: string]: DisponibilidadDia;
  };
}

@Component({
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.component.html',
  styleUrl: './disponibilidad.component.css'
})
export class DisponibilidadComponent implements OnInit {
  @Input() usuarioLogueadoEntidad!: Medico;
  fechaSeleccionada: string = '';
  form!: FormGroup;
  isLoading = false;
  disponibilidadCargada: { [dia: string]: DisponibilidadDia } | null = null;
  modoLectura = true;
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  horarios: string[][] = [];

  constructor(private alert: AlertService, private firestore: Firestore, private router: Router) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      especialidad: new FormControl('', Validators.required),
      duracionTurnos: new FormControl(30, [
        Validators.required,
        Validators.min(30),
        Validators.max(60)
      ]),
      diasDisponibles: new FormArray(
        this.diasSemana.map(() =>
          new FormGroup(
            {
              disponible: new FormControl(true),
              horaInicio: new FormControl('', Validators.required),
              horaFin: new FormControl('', Validators.required)
            },
            this.validarHorario
          )
        )
      )
    });

    this.horarios = this.diasSemana.map((_, index) =>
      index === 5
        ? this.generarHorarios(8, 14)
        : this.generarHorarios(8, 19)
    );

    this.form.get('especialidad')?.valueChanges.subscribe((especialidad) => {
      if (especialidad) {
        this.cargarDisponibilidad(especialidad);
      }
    });
  }

  toggleDisponibilidad(index: number): void {
    const diaControl = this.diasDisponibles.at(index) as FormGroup;
    const disponible = diaControl.get('disponible')?.value;

    if (disponible) {
      diaControl.get('horaInicio')?.enable();
      diaControl.get('horaFin')?.enable();
    } else {
      diaControl.get('horaInicio')?.disable();
      diaControl.get('horaFin')?.disable();
    }
  }

  async cargarDisponibilidad(especialidad: string): Promise<void> {
    if (!this.usuarioLogueadoEntidad || !this.usuarioLogueadoEntidad.email) {
      this.alert.mostrarError('Usuario no logueado o email no disponible.');
      return;
    }

    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('email', '==', this.usuarioLogueadoEntidad.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        this.alert.mostrarError('Usuario no encontrado en la base de datos.');
        return;
      }

      const usuarioDoc = querySnapshot.docs[0];
      const usuarioData = usuarioDoc.data();
      const disponibilidad: Disponibilidad = usuarioData['disponibilidad'] || {};

      this.disponibilidadCargada = disponibilidad[especialidad] || null;
      this.modoLectura = !!this.disponibilidadCargada; 

      if (this.disponibilidadCargada) {
        this.diasSemana.forEach((dia, index) => {
          const diaControl = this.diasDisponibles.at(index) as FormGroup;
          if (this.disponibilidadCargada![dia]) {
            diaControl.get('disponible')?.setValue(true);
            diaControl.get('horaInicio')?.setValue(this.disponibilidadCargada![dia].horaInicio || '');
            diaControl.get('horaFin')?.setValue(this.disponibilidadCargada![dia].horaFin || '');
          } else {
            diaControl.get('disponible')?.setValue(false);
            diaControl.get('horaInicio')?.reset();
            diaControl.get('horaFin')?.reset();
            diaControl.get('horaInicio')?.disable();
            diaControl.get('horaFin')?.disable();
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar la disponibilidad:', error);
      this.alert.mostrarError('Error al cargar la disponibilidad.');
    }
  }

  get diasDisponibles(): FormArray {
    return this.form.get('diasDisponibles') as FormArray;
  }

  generarHorarios(horaInicio: number, horaFin: number): string[] {
    const horarios = [];
    for (let h = horaInicio; h <= horaFin; h++) { 
      for (let m = 0; m < 60; m += 10) {
        if (h === horaFin && m > 0) break; 
        horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return horarios;
  }

  validarHorario: ValidatorFn = (group: AbstractControl): { [key: string]: boolean } | null => {
    const horaInicio = group.get('horaInicio')?.value;
    const horaFin = group.get('horaFin')?.value;
    if (horaInicio && horaFin && horaInicio >= horaFin) {
      return { finMenorQueInicio: true };
    }
    return null;
  };

  async onSubmit(): Promise<void> {
    console.log('se entro al on submit')
    if (this.form.valid) {
      this.isLoading = true;
      try {
        await this.registrarDisponibilidad();
      } catch (error) {
        this.alert.mostrarError('Error inesperado');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.alert.mostrarError('El formulario es inválido');
    }
  }

  async registrarDisponibilidad(): Promise<void> {
    if (!this.usuarioLogueadoEntidad || !this.usuarioLogueadoEntidad.email) {
      this.alert.mostrarError('Usuario no logueado o email no disponible.');
      return;
    }

    const especialidadSeleccionada = this.form.get('especialidad')?.value;
    const diasDisponibles = this.form.get('diasDisponibles')?.value;

    if (!especialidadSeleccionada || !diasDisponibles) {
      this.alert.mostrarError('El formulario está incompleto.');
      return;
    }

    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('email', '==', this.usuarioLogueadoEntidad.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        this.alert.mostrarError('Usuario no encontrado en la base de datos.');
        return;
      }

      const usuarioDoc = querySnapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      const usuarioData = usuarioDoc.data();

      let disponibilidad: Disponibilidad = usuarioData['disponibilidad'] || {};

      const conflictos = this.verificarSuperposicionHorarios(disponibilidad, especialidadSeleccionada, diasDisponibles);
      if (conflictos.length > 0) {
        this.alert.mostrarError(
          `Conflicto detectado con los horarios ya registrados en las especialidades: ${conflictos.join(', ')}.`
        );
        return;
      }

      disponibilidad[especialidadSeleccionada] = {};
      this.diasSemana.forEach((dia, index) => {
        const diaData = diasDisponibles[index];
        if (diaData.disponible) {
          disponibilidad[especialidadSeleccionada][dia] = {
            horaInicio: diaData.horaInicio,
            horaFin: diaData.horaFin
          };
        } else {
          delete disponibilidad[especialidadSeleccionada][dia]; 
        }
      });

      const usuarioDocRef = doc(this.firestore, `usuarios/${usuarioId}`);
      await updateDoc(usuarioDocRef, { disponibilidad });

      this.alert.mostrarSuccess('Disponibilidad guardada correctamente.');

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (error) {
      console.error('Error al registrar la disponibilidad:', error);
      this.alert.mostrarError('Error al registrar la disponibilidad.');
    }
  }

  verificarSuperposicionHorarios(
    disponibilidad: Disponibilidad,
    especialidadSeleccionada: string,
    diasDisponibles: any[]
  ): string[] {
    const conflictos = new Set<string>();

    for (const [especialidad, dias] of Object.entries(disponibilidad)) {
      if (especialidad === especialidadSeleccionada) {
        continue;
      }

      this.diasSemana.forEach((dia, index) => {
        const nuevaHoraInicio = this.convertirHoraEnMinutos(diasDisponibles[index].horaInicio);
        const nuevaHoraFin = this.convertirHoraEnMinutos(diasDisponibles[index].horaFin);

        if (dias[dia]) {
          const horaInicioExistente = this.convertirHoraEnMinutos(dias[dia].horaInicio);
          const horaFinExistente = this.convertirHoraEnMinutos(dias[dia].horaFin);

          if (
            (nuevaHoraInicio >= horaInicioExistente && nuevaHoraInicio < horaFinExistente) ||
            (nuevaHoraFin > horaInicioExistente && nuevaHoraFin <= horaFinExistente) ||
            (nuevaHoraInicio <= horaInicioExistente && nuevaHoraFin >= horaFinExistente)
          ) {
            conflictos.add(especialidad); 
          }
        }
      });
    }

    return Array.from(conflictos); 
  }

  convertirHoraEnMinutos(hora: string | undefined): number {
    if (!hora) {
      console.warn('Hora no definida o inválida:', hora);
      return 0; 
    }

    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  habilitarEdicion(): void {
    this.modoLectura = false;
  }

  get duracionTurnos() {
    return this.form.get('duracionTurnos');
  }

  get especialidad() {
    return this.form.get('especialidad');
  }
}