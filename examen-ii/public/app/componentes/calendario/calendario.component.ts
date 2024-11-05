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
  daysInMonth: (number | null)[]; 
  selectedDate: string = '';
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
      today.setHours(0, 0, 0, 0); 

      if (dateToSelect.getDay() === 0) {
        this.alert.mostrarError('No es posible seleccionar un día domingo, ya que no es laborable.');
        return; 
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
    this.currentDay = new Date().getDate(); 
    this.generateDays();
  }

  isDisabled(day: number | null): boolean {
    if (day === null) return true;

    const dateToCheck = new Date(this.currentYear, this.currentMonth, day);
    dateToCheck.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(today);
    fechaLimite.setDate(today.getDate() + 15);

    if (!this.fechasDisponibles) {
      return dateToCheck.getDay() === 0 || dateToCheck < today;
    }

    const enFechasDisponibles = this.fechasDisponibles.some(fechaStr => {
      const [day, month, year] = fechaStr.split('-').map(Number);
      const fechaDisponible = new Date(year, month - 1, day);
      fechaDisponible.setHours(0, 0, 0, 0); 
      return fechaDisponible.getTime() === dateToCheck.getTime();
    });

    return !(enFechasDisponibles && dateToCheck >= today && dateToCheck <= fechaLimite);
  }
}