import { Component, Input, OnInit } from '@angular/core';
import { Admin, Medico, Paciente } from '../../../interfaces/app.interface';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AlertService } from '../../../servicios/alert.service';
import { doc, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';

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

  constructor(private alert: AlertService, private firestore: Firestore) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      duracionTurnos: new FormControl(30, [
        Validators.required,
        Validators.min(30),
        Validators.max(60)
      ]),
      horaInicio: new FormControl('', Validators.required),
      horaFin: new FormControl('', Validators.required),
      especialidad: new FormControl('', Validators.required)
    });
  }

  handleDateSelected(selectedDate: string) {
    this.fechaSeleccionada = selectedDate;
    this.ajustarHorariosPorDia();
  }

  ajustarHorariosPorDia() {
    const fecha = this.convertirFecha(this.fechaSeleccionada);
    if (!fecha) return;

    const diaSemana = fecha.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

    let horaInicioMin = '08:00';
    let horaFinMax = '19:00';

    if (diaSemana === 6) { // Sábado
      horaFinMax = '14:00';
    } else if (diaSemana === 0) { // Domingo
      this.form.get('horaInicio')?.disable();
      this.form.get('horaFin')?.disable();
      return;
    } else {
      this.form.get('horaInicio')?.enable();
      this.form.get('horaFin')?.enable();
    }

    this.setearLimitesHorario(horaInicioMin, horaFinMax);
  }

  setearLimitesHorario(horaInicioMin: string, horaFinMax: string) {
    const horaInicio = this.form.get('horaInicio');
    const horaFin = this.form.get('horaFin');

    horaInicio?.setValidators([
      Validators.required,
      this.horaMinimaValidator(horaInicioMin, horaFinMax)
    ]);

    horaFin?.setValidators([
      Validators.required,
      this.horaMaximaValidator(horaInicioMin, horaFinMax),
      this.horaFinMayorQueInicioValidator()
    ]);

    horaInicio?.updateValueAndValidity();
    horaFin?.updateValueAndValidity();
  }

  horaMinimaValidator(min: string, max: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      return value && (value < min || value > max)
        ? { fueraDeRango: true }
        : null;
    };
  }

  horaMaximaValidator(min: string, max: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      return value && (value < min || value > max)
        ? { fueraDeRango: true }
        : null;
    };
  }

  horaFinMayorQueInicioValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const horaInicio = this.form.get('horaInicio')?.value;
      const horaFin = control.value;

      return horaInicio && horaFin && horaFin <= horaInicio
        ? { finMenorQueInicio: true }
        : null;
    };
  }

  convertirFecha(fechaString: string): Date | null {
    const partes = fechaString.split('/');
    if (partes.length !== 3) return null;

    const [dia, mes, anio] = partes.map(Number);
    return new Date(anio, mes - 1, dia); // Los meses en JavaScript van de 0 a 11
  }

  validarHorarios() {
    const horaInicio = this.form.get('horaInicio')?.value;
    const horaFin = this.form.get('horaFin')?.value;

    if (horaInicio && horaFin) {
      this.form.get('horaFin')?.updateValueAndValidity();
    }
  }

  async onSubmit(): Promise<void> {
    console.log('se entro al on submit')
    if (this.form.valid) {
      this.isLoading = true;
      try {
        await this.registrarRespuesta();
      } catch (error) {
        this.alert.mostrarError('Error inesperado');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.alert.mostrarError('El formulario es inválido');
    }
  }

  async registrarRespuesta() {
    if (!this.usuarioLogueadoEntidad || !this.fechaSeleccionada) {
      this.alert.mostrarError('Faltan datos necesarios para registrar la disponibilidad.');
      return;
    }

    const emailMedico = this.usuarioLogueadoEntidad.email;
    const especialidadSeleccionada = this.form.get('especialidad')?.value;
    const fechaSeleccionada = this.fechaSeleccionada.replace(/\//g, "-"); // Cambiar formato de fecha a "31-10-2024"
    const horaInicio = this.form.get('horaInicio')?.value;
    const horaFin = this.form.get('horaFin')?.value;
    const duracionTurnos = this.form.get('duracionTurnos')?.value; // Extrae el valor de duracionTurnos

    try {
      // 1. Crear referencia a la colección de "disponibilidades" usando el email del médico.
      const medicoDocRef = doc(this.firestore, `disponibilidades/${emailMedico}`);

      // 2. Obtener el documento del médico
      const medicoDocSnap = await getDoc(medicoDocRef);

      if (medicoDocSnap.exists()) {
        const disponibilidadExistente = medicoDocSnap.data();

        // 3. Verificar si hay algún solapamiento en la misma fecha para cualquier especialidad
        for (const especialidad in disponibilidadExistente) {
          const disponibilidad = disponibilidadExistente[especialidad]?.[fechaSeleccionada];

          if (disponibilidad) {
            const { horaInicio: inicioExistente, horaFin: finExistente } = disponibilidad;

            // Revisar si hay solapamiento
            if (this.checkSolapamiento(inicioExistente, finExistente, horaInicio, horaFin)) {
              this.alert.mostrarError(
                'Ya existe una disponibilidad en el mismo horario en otra especialidad. Por favor, elige otro horario.'
              );
              return;
            }
          }
        }
      }

      // 4. Crear la estructura de disponibilidad para guardar
      const disponibilidadData = {
        [especialidadSeleccionada]: {
          [fechaSeleccionada]: {
            horaInicio,
            horaFin,
            duracionTurnos // Almacena solo el valor, no el control
          }
        }
      };

      // 5. Guardar o actualizar la disponibilidad
      if (medicoDocSnap.exists()) {
        await updateDoc(medicoDocRef, disponibilidadData);
        this.alert.mostrarSuccess('Disponibilidad guardada o actualizada correctamente.');
      } else {
        await setDoc(medicoDocRef, disponibilidadData);
        this.alert.mostrarSuccess('Disponibilidad guardada exitosamente.');
      }
    } catch (error) {
      console.error('Error al guardar la disponibilidad:', error);
      this.alert.mostrarError('Hubo un problema al guardar la disponibilidad.');
    }
  }

  // Función para verificar solapamientos
  checkSolapamiento(inicioExistente: string, finExistente: string, nuevoInicio: string, nuevoFin: string): boolean {
    return (
      (nuevoInicio >= inicioExistente && nuevoInicio < finExistente) ||
      (nuevoFin > inicioExistente && nuevoFin <= finExistente) ||
      (nuevoInicio <= inicioExistente && nuevoFin >= finExistente)
    );
  }

  get duracionTurnos() {
    return this.form.get('duracionTurnos');
  }

  get horaInicio() {
    return this.form.get('horaInicio');
  }

  get horaFin() {
    return this.form.get('horaFin');
  }

  get especialidad() {
    return this.form.get('especialidad');
  }
}