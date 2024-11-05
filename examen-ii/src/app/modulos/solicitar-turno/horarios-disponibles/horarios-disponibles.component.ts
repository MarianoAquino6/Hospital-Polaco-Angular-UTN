import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Disponibilidad } from '../../../interfaces/app.interface';
import { collection, getDocs, query, where } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-horarios-disponibles',
  templateUrl: './horarios-disponibles.component.html',
  styleUrl: './horarios-disponibles.component.css'
})
export class HorariosDisponiblesComponent {
  @Input() disponibilidad!: Disponibilidad | null;
  @Output() turnoSeleccionado = new EventEmitter<string>();
  turnos: string[] = [];

  constructor(private firestore: Firestore) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['disponibilidad'] && this.disponibilidad) {
      this.generarTurnos();
    }
  }

  private async generarTurnos() {
    this.turnos = [];
    if (!this.disponibilidad) return;

    const horaInicio = this.convertirATiempo(this.disponibilidad.horaInicio);
    const horaFin = this.convertirATiempo(this.disponibilidad.horaFin);
    const duracionTurnos = this.disponibilidad.duracionTurnos;

    const turnosOcupados = await this.obtenerTurnosOcupados(this.disponibilidad.fecha);

    console.log("Turnos ocupados:", turnosOcupados);

    let turnoActual = new Date(horaInicio);

    while (turnoActual < horaFin) {
      const siguienteTurno = new Date(turnoActual);
      siguienteTurno.setMinutes(turnoActual.getMinutes() + duracionTurnos);

      if (siguienteTurno <= horaFin) {
        const turnoTexto = `De ${this.formatearHora(turnoActual)} hs a ${this.formatearHora(siguienteTurno)} hs`;
        console.log("Generando turno:", turnoTexto);

        if (!turnosOcupados.includes(turnoTexto)) {
          this.turnos.push(turnoTexto);
        } else {
          console.log(`Turno ocupado omitido: ${turnoTexto}`);
        }
      }

      turnoActual = siguienteTurno;
    }
  }

  private async obtenerTurnosOcupados(fecha: string): Promise<string[]> {
    const turnosOcupados: string[] = [];
    try {
      console.log("Iniciando consulta para obtener turnos ocupados.");

      const fechaQuery = query(
        collection(this.firestore, 'turnos'),
        where('fecha', '==', fecha)
      );
      console.log("Consultando Firestore para la fecha:", fecha);

      const fechaSnapshot = await getDocs(fechaQuery);

      console.log("Documentos encontrados para la fecha:", fechaSnapshot.size);
      console.log("Disponibilidad actual:", this.disponibilidad);

      fechaSnapshot.forEach((doc) => {
        const data = doc.data();

        console.log("Documento procesado:", data);

        if (
          data['medico'] === this.disponibilidad?.especialista &&
          data['estado'] !== 'Cancelado'
        ) {
          const rango = data['horario'];
          const [horaInicio, horaFin] = rango.split(" - ");
          const turnoTexto = `De ${horaInicio} hs a ${horaFin} hs`;

          console.log("Turno ocupado encontrado en Firestore:", turnoTexto);
          turnosOcupados.push(turnoTexto);
        } else {
          console.log("Turno omitido:", data);
        }
      });

      console.log("Total de turnos ocupados encontrados:", turnosOcupados.length);

    } catch (error) {
      console.error("Error al obtener turnos ocupados:", error);
    }

    return turnosOcupados;
  }

  private convertirATiempo(hora: string): Date {
    const [horas, minutos] = hora.split(':').map(Number);
    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);
    return fecha;
  }

  private formatearHora(date: Date): string {
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  seleccionarTurno(turno: string) {
    this.turnoSeleccionado.emit(turno);
  }
}