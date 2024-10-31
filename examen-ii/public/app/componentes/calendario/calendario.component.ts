import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService } from '../../servicios/alert.service';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit {
  currentMonth: number;
  currentYear: number;
  currentDay: number;
  daysInMonth: (number | null)[]; // Aceptar null
  selectedDate: string = ''; // Cambia esto para inicializarlo como una cadena vacía
  monthNames: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  @Output() dateSelected: EventEmitter<string> = new EventEmitter<string>();
  @Input() fechasDisponibles?: string[];

  constructor(private alert: AlertService) {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.currentDay = today.getDate();
    this.daysInMonth = [];
  }

  ngOnInit() {
    this.generateDays();
  }

  generateDays() {
    const date = new Date(this.currentYear, this.currentMonth + 1, 0);
    const totalDays = date.getDate();
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();

    this.daysInMonth = [];
    const adjustedFirstDay = (firstDayOfMonth + 6) % 7;

    for (let i = 0; i < adjustedFirstDay; i++) {
      this.daysInMonth.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      this.daysInMonth.push(i);
    }
  }

  selectDate(day: number | null) {
    if (day !== null) {
      const dateToSelect = new Date(this.currentYear, this.currentMonth, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Asegúrate de que la comparación sea solo por fecha sin las horas

      // Verificar si el día seleccionado es domingo (0 = Domingo)
      if (dateToSelect.getDay() === 0) {
        this.alert.mostrarError('No es posible seleccionar un día domingo, ya que no es laborable.');
        return; // Evita que se procese la selección si es domingo.
      }

      if (dateToSelect >= today) {
        this.selectedDate = `${day}-${this.currentMonth + 1}-${this.currentYear}`;
        this.dateSelected.emit(this.selectedDate);
      } else {
        this.alert.mostrarError('No es posible elegir fechas pasadas a la actual')
      }
    }
  }

  changeMonth(increment: number) {
    this.currentMonth += increment;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.currentDay = new Date().getDate(); // Actualizar el día actual cuando el mes cambia
    this.generateDays();
  }

  // isDisabled(day: number | null): boolean {
  //   if (day === null) return true;

  //   const dateToCheck = new Date(this.currentYear, this.currentMonth, day);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   // Verificar si es domingo (0 = Domingo) o si la fecha es anterior a hoy
  //   return dateToCheck.getDay() === 0 || dateToCheck < today;
  // }

  isDisabled(day: number | null): boolean {
    if (day === null) return true;

    const dateToCheck = new Date(this.currentYear, this.currentMonth, day);
    dateToCheck.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(today);
    fechaLimite.setDate(today.getDate() + 15);

    // Si `fechasDisponibles` no está definida, se usa el comportamiento normal
    if (!this.fechasDisponibles) {
      return dateToCheck.getDay() === 0 || dateToCheck < today;
    }

    // Convertir `fechasDisponibles` a objetos `Date` y comparar con `dateToCheck`
    const enFechasDisponibles = this.fechasDisponibles.some(fechaStr => {
      const [day, month, year] = fechaStr.split('-').map(Number);
      const fechaDisponible = new Date(year, month - 1, day);
      fechaDisponible.setHours(0, 0, 0, 0); // Ignorar la hora en la comparación
      return fechaDisponible.getTime() === dateToCheck.getTime();
    });

    // Verificar que la fecha esté en el rango de 15 días y sea una de las fechas disponibles
    return !(enFechasDisponibles && dateToCheck >= today && dateToCheck <= fechaLimite);
  }
}