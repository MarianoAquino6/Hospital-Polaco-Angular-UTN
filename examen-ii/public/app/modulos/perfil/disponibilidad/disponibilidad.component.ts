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
  horas: string[] = [];

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
    },
      { validators: this.horasValidator() });
  }

  handleDateSelected(selectedDate: string) {
    console.log('Recibi el dia:' + selectedDate)
    this.fechaSeleccionada = selectedDate;
    this.ajustarHorariosPorDia();
  }

  ajustarHorariosPorDia() {
    const fecha = this.convertirFecha(this.fechaSeleccionada);
    if (!fecha) return;

    const diaSemana = fecha.getDay();
    this.generarHoras(diaSemana);

    if (diaSemana === 0) { 
      this.form.get('horaInicio')?.disable();
      this.form.get('horaFin')?.disable();
    } else {
      this.form.get('horaInicio')?.enable();
      this.form.get('horaFin')?.enable();
    }
  }

  generarHoras(diaSemana: number) {
    console.log('Esta generando las horas')
    this.horas = []; 
    let horaInicioMin: string;
    let horaFinMax: string;

    if (diaSemana === 6) { 
      horaInicioMin = '08:00';
      horaFinMax = '14:00';
    } else { 
      horaInicioMin = '08:00';
      horaFinMax = '19:00';
    }

    for (let h = parseInt(horaInicioMin.split(':')[0]); h <= parseInt(horaFinMax.split(':')[0]); h++) {
      for (let m = 0; m < 60; m += 10) { 
        const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        if (h === parseInt(horaFinMax.split(':')[0]) && m > parseInt(horaFinMax.split(':')[1])) {
          break; 
        }

        if (h > parseInt(horaInicioMin.split(':')[0]) || (h === parseInt(horaInicioMin.split(':')[0]) && m >= parseInt(horaInicioMin.split(':')[1]))) {
          this.horas.push(hora);
        }
      }
    }
  }

  convertirFecha(fechaString: string): Date | null {
    const partes = fechaString.split('-');
    if (partes.length !== 3) return null;

    const [dia, mes, anio] = partes.map(Number);
    return new Date(anio, mes - 1, dia); 
  }

  horasValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const horaInicio = control.get('horaInicio')?.value;
      const horaFin = control.get('horaFin')?.value;

      return horaInicio && horaFin && horaFin <= horaInicio
        ? { finMenorQueInicio: true }
        : null;
    };
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
    const fechaSeleccionada = this.fechaSeleccionada.replace(/\//g, "-"); 
    const horaInicio = this.form.get('horaInicio')?.value;
    const horaFin = this.form.get('horaFin')?.value;
    const duracionTurnos = this.form.get('duracionTurnos')?.value; 

    try {
      const medicoDocRef = doc(this.firestore, `disponibilidades/${emailMedico}`);
      const medicoDocSnap = await getDoc(medicoDocRef);

      if (medicoDocSnap.exists()) {
        const disponibilidadExistente = medicoDocSnap.data();

        for (const especialidad in disponibilidadExistente) {
          const disponibilidad = disponibilidadExistente[especialidad]?.[fechaSeleccionada];

          if (disponibilidad) {
            const { horaInicio: inicioExistente, horaFin: finExistente } = disponibilidad;

            if (this.checkSolapamiento(inicioExistente, finExistente, horaInicio, horaFin)) {
              this.alert.mostrarError(
                'Ya existe una disponibilidad en el mismo horario en otra especialidad. Por favor, elige otro horario.'
              );
              return;
            }
          }
        }

        const fieldPath = `${especialidadSeleccionada}.${fechaSeleccionada}`;
        const disponibilidadData = {
          [fieldPath]: {
            horaInicio,
            horaFin,
            duracionTurnos
          }
        };
        await updateDoc(medicoDocRef, disponibilidadData);
        this.alert.mostrarSuccess('Disponibilidad guardada o actualizada correctamente.');
      } else {
        const disponibilidadData = {
          [especialidadSeleccionada]: {
            [fechaSeleccionada]: {
              horaInicio,
              horaFin,
              duracionTurnos
            }
          }
        };
        await setDoc(medicoDocRef, disponibilidadData);
        this.alert.mostrarSuccess('Disponibilidad guardada correctamente.');
      }

    } catch (error) {
      console.error('Error al guardar la disponibilidad:', error);
      this.alert.mostrarError('Hubo un problema al guardar la disponibilidad.');
    }
  }

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