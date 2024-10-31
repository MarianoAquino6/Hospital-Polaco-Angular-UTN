import { Component, Input, SimpleChanges } from '@angular/core';
import { Disponibilidad } from '../../../interfaces/app.interface';

@Component({
  selector: 'app-horarios-disponibles',
  templateUrl: './horarios-disponibles.component.html',
  styleUrl: './horarios-disponibles.component.css'
})
export class HorariosDisponiblesComponent {
  @Input() disponibilidad!: Disponibilidad | null;
  turnos: string[] = []; // Lista de turnos generados

  ngOnChanges(changes: SimpleChanges) {
    if (changes['disponibilidad'] && this.disponibilidad) {
      this.generarTurnos();
    }
  }

  private generarTurnos() {
    this.turnos = [];
    if (!this.disponibilidad) return;

    const horaInicio = this.convertirATiempo(this.disponibilidad.horaInicio);
    const horaFin = this.convertirATiempo(this.disponibilidad.horaFin);
    const duracionTurnos = this.disponibilidad.duracionTurnos;

    let turnoActual = new Date(horaInicio);

    while (turnoActual < horaFin) {
      const siguienteTurno = new Date(turnoActual);
      siguienteTurno.setMinutes(turnoActual.getMinutes() + duracionTurnos);

      // Verifica que el siguiente turno no se extienda más allá de la hora de fin
      if (siguienteTurno <= horaFin) {
        const turnoTexto = `De ${this.formatearHora(turnoActual)} hs a ${this.formatearHora(siguienteTurno)} hs`;
        this.turnos.push(turnoTexto);
      }

      turnoActual = siguienteTurno; // Avanza al próximo turno
    }
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
}
