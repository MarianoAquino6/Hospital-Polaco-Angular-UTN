import { Component } from '@angular/core';
import { LoadingComponent } from '../loading/loading.component';
import { Informe } from '../../enums/enums';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { collection, CollectionReference, DocumentData, Firestore, getDocs, Timestamp, where } from '@angular/fire/firestore';
import { ChartConfiguration, ChartData } from 'chart.js';
import { animate, query, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [LoadingComponent, CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './informes.component.html',
  styleUrl: './informes.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class InformesComponent {
  isLoading = false;
  informeAMostrar: Informe | null = null;
  Informe = Informe;
  // chartData: ChartConfiguration<'bar'> | null = null;  // Usamos ChartConfiguration
  chartData: ChartConfiguration<'bar' | 'pie'> | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;

  ingresosStats: any = {};
  turnosPorEspecialidadStats: any = {};
  turnosPorDiaStats: any = {};
  turnosSolicitadosPorMedicoStats: any = {};
  turnosFinalizadosPorMedicoStats: any = {};

  constructor(private firestore: Firestore) { }

  mostrarInforme(informe: number) {
    console.log(`Informe seleccionado: ${informe}`);

    // Limpiar el estado de chartData antes de cambiar el informe
    this.chartData = null;

    switch (informe) {
      case 0:
        this.informeAMostrar = Informe.Ingresos;
        this.obtenerIngresos(); // Llamamos al método para obtener los ingresos
        break;
      case 1:
        this.informeAMostrar = Informe.TurnosPorEspecialidad;
        this.obtenerTurnosPorEspecialidad(); // Llamamos al método para obtener turnos por especialidad
        break;
      case 2:
        this.informeAMostrar = Informe.TurnosPorDia;
        this.obtenerTurnosPorDia(); // Llamamos al método para obtener turnos por día
        break;
      case 3:
        this.informeAMostrar = Informe.TurnosSolicitadosPorMedicoEnTiempo;
        break;
      case 4:
        this.informeAMostrar = Informe.TurnosFinalizadosPorMedicoEnTiempo;
        break;
    }

    console.log(`Informe a mostrar: ${this.informeAMostrar}`);
  }

  calculateIngresosStats(ingresosData: { [key: string]: number }) {
    const sortedIngresos = Object.entries(ingresosData).sort((a, b) => b[1] - a[1]);

    const maxIngresosUser = sortedIngresos[0];
    const minIngresosUser = sortedIngresos[sortedIngresos.length - 1];

    // Suponiendo que los ingresos están por día, calculamos también los días con más/menos ingresos
    const sortedIngresosByDay = Object.entries(ingresosData).sort((a, b) => b[1] - a[1]);

    const maxIngresosDay = sortedIngresosByDay[0];
    const minIngresosDay = sortedIngresosByDay[sortedIngresosByDay.length - 1];

    return {
      maxIngresosUser,
      minIngresosUser,
      maxIngresosDay,
      minIngresosDay,
    };
  }

  // Función para calcular estadísticas detalladas de turnos por especialidad
  calculateTurnosPorEspecialidadStats(turnosData: { [key: string]: number }) {
    const sortedTurnos = Object.entries(turnosData).sort((a, b) => b[1] - a[1]);

    const maxTurnosEspecialidad = sortedTurnos[0];
    const minTurnosEspecialidad = sortedTurnos[sortedTurnos.length - 1];

    return {
      maxTurnosEspecialidad,
      minTurnosEspecialidad,
    };
  }

  // Función para calcular estadísticas detalladas de turnos por día
  calculateTurnosPorDiaStats(turnosData: { [key: string]: number }) {
    const sortedTurnos = Object.entries(turnosData).sort((a, b) => b[1] - a[1]);

    const maxTurnosDia = sortedTurnos[0];
    const minTurnosDia = sortedTurnos[sortedTurnos.length - 1];

    // Promedio de turnos por día
    const totalTurnos = Object.values(turnosData).reduce((sum, value) => sum + value, 0);
    const avgTurnosDia = totalTurnos / Object.keys(turnosData).length;

    return {
      maxTurnosDia,
      minTurnosDia,
      avgTurnosDia,
    };
  }

  async obtenerIngresos() {
    const logsCollection = collection(this.firestore, 'logs');
    const logsSnapshot = await getDocs(logsCollection);
    const logs = logsSnapshot.docs.map(doc => doc.data());

    const ingresosData: { [key: string]: number } = {};

    // Procesar los logs
    logs.forEach(log => {
      const usuario = log['usuario'];
      const fechaYHora = log['fechaYHora'];  // Usar el campo correcto 'fechaYHora'

      // Asegurarse de que 'fechaYHora' sea un objeto Date válido
      if (fechaYHora instanceof Timestamp) {
        const fecha = fechaYHora.toDate();  // Convertir de Timestamp a Date si es necesario
        const dateStr = fecha.toLocaleDateString();  // Formatear la fecha para usarla como clave

        if (ingresosData[dateStr]) {
          ingresosData[dateStr]++;
        } else {
          ingresosData[dateStr] = 1;
        }
      }
    });

    this.ingresosStats = this.calculateIngresosStats(ingresosData);

    this.chartData = {
      type: 'bar',
      data: {
        labels: Object.keys(ingresosData),
        datasets: [{
          label: 'Ingresos por Día',
          data: Object.values(ingresosData),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    console.log('Ingresos stats:', this.ingresosStats);
    this.isLoading = false;
  }

  async obtenerTurnosPorEspecialidad() {
    const turnosCollection = collection(this.firestore, 'turnos');
    const turnosSnapshot = await getDocs(turnosCollection);
    const turnos = turnosSnapshot.docs.map(doc => doc.data());

    const especialidadesData: { [key: string]: number } = {};
    turnos.forEach(turno => {
      const especialidad = turno['especialidad'];
      if (especialidadesData[especialidad]) {
        especialidadesData[especialidad]++;
      } else {
        especialidadesData[especialidad] = 1;
      }
    });

    this.turnosPorEspecialidadStats = this.calculateTurnosPorEspecialidadStats(especialidadesData);

    this.chartData = {
      type: 'pie',
      data: {
        labels: Object.keys(especialidadesData),
        datasets: [{
          label: 'Turnos por Especialidad',
          data: Object.values(especialidadesData),
          backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    };
    this.isLoading = false;
  }

  // Obtener turnos por día
  // Obtener turnos por día y calcular estadísticas
  async obtenerTurnosPorDia() {
    const turnosCollection = collection(this.firestore, 'turnos');
    const turnosSnapshot = await getDocs(turnosCollection);
    const turnos = turnosSnapshot.docs.map(doc => doc.data());

    const turnosData: { [key: string]: number } = {};

    turnos.forEach(turno => {
      const fecha = turno['fecha'];
      const fechaStr = new Date(fecha).toLocaleDateString();
      if (turnosData[fechaStr]) {
        turnosData[fechaStr]++;
      } else {
        turnosData[fechaStr] = 1;
      }
    });

    this.turnosPorDiaStats = this.calculateTurnosPorDiaStats(turnosData);

    this.chartData = {
      type: 'bar',
      data: {
        labels: Object.keys(turnosData),
        datasets: [{
          label: 'Turnos por Día',
          data: Object.values(turnosData),
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    };
    this.isLoading = false;
  }

  async obtenerTurnosSolicitadosPorMedico() {
    console.log('Obteniendo turnos solicitados por médico...');
    this.isLoading = true;

    // Verificar si las fechas de inicio y fin son válidas
    console.log('Verificando fechas...');
    console.log('startDate:', this.startDate);
    console.log('endDate:', this.endDate);

    // Asegurarse que startDate y endDate sean objetos Date válidos
    if (this.startDate && this.endDate) {  // Verificamos que no sean null
      // Aseguramos que startDate y endDate sean objetos Date válidos
      const fechaInicio = this.startDate instanceof Date ? this.startDate : new Date(this.startDate);
      const fechaFin = this.endDate instanceof Date ? this.endDate : new Date(this.endDate);

      // Si las fechas son válidas
      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        console.error("Fechas inválidas.");
        this.isLoading = false;
        return;
      }

      const turnosCollection = collection(this.firestore, 'turnos');
      const turnosSnapshot = await getDocs(turnosCollection);
      const turnos = turnosSnapshot.docs.map(doc => doc.data());

      const turnosPorMedico: { [key: string]: number } = {};

      turnos.forEach((turno: DocumentData) => {
        const medico = turno['medico'];
        let fechaTurno: Date | null = null;

        // Convertir 'fechaSolicitud' a un objeto Date
        console.log('Procesando turno:', turno);

        if (turno['fechaSolicitud'] && typeof turno['fechaSolicitud'] === 'string') {
          fechaTurno = new Date(turno['fechaSolicitud']); // Convertir la fecha a un objeto Date
          console.log('fechaSolicitud convertida:', fechaTurno);
        } else {
          console.error('Fecha de solicitud inválida:', turno['fechaSolicitud']);
        }

        // Verificación de que 'medico' y 'fechaTurno' no sean null
        if (medico && fechaTurno) {
          console.log('Verificando fechas...');
          console.log('startDate:', fechaInicio);
          console.log('endDate:', fechaFin);

          // Comparar las fechas
          if (fechaTurno >= fechaInicio && fechaTurno <= fechaFin) {
            console.log('Fecha dentro del rango. Médico:', medico);
            if (turnosPorMedico[medico]) {
              turnosPorMedico[medico]++;
            } else {
              turnosPorMedico[medico] = 1;
            }
          } else {
            console.log('Fecha fuera del rango');
          }
        } else {
          console.error('Datos inválidos en turno:', turno);
        }
      });

      console.log('Datos de turnos solicitados por médico: ', turnosPorMedico);

      // Calcular estadísticas de turnos por médico
      this.turnosSolicitadosPorMedicoStats = this.calculateTurnosPorMedicoStats(turnosPorMedico);

      // Actualizar los datos del gráfico
      this.chartData = {
        type: 'bar',
        data: {
          labels: Object.keys(turnosPorMedico),
          datasets: [
            {
              label: 'Turnos Solicitados por Médico',
              data: Object.values(turnosPorMedico),
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      };

      console.log('chartData después de obtener turnos solicitados por médico:', this.chartData);

      this.isLoading = false;
    } else {
      console.error("Las fechas de inicio y fin no están definidas correctamente.");
      this.isLoading = false;
    }
  }

  // Función para calcular estadísticas de turnos por médico
  calculateTurnosPorMedicoStats(turnosData: { [key: string]: number }) {
    const sortedTurnos = Object.entries(turnosData).sort((a, b) => b[1] - a[1]);

    const maxTurnosMedico = sortedTurnos[0];
    const minTurnosMedico = sortedTurnos[sortedTurnos.length - 1];

    return {
      maxTurnosMedico,
      minTurnosMedico,
    };
  }

  // Obtener turnos finalizados por médico en un periodo
  async obtenerTurnosFinalizadosPorMedico() {
    console.log('Obteniendo turnos finalizados por médico...');
    this.isLoading = true;

    // Asegurarse de que las fechas de inicio y fin sean válidas
    if (this.startDate && this.endDate) {
      // Asegurarse que startDate y endDate sean objetos Date válidos
      const fechaInicio = this.startDate instanceof Date ? this.startDate : new Date(this.startDate);
      const fechaFin = this.endDate instanceof Date ? this.endDate : new Date(this.endDate);

      // Ajustar el final del rango a las 23:59:59 del último día
      fechaFin.setHours(23, 59, 59, 999);

      // Si las fechas son válidas
      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        console.error("Fechas inválidas.");
        this.isLoading = false;
        return;
      }

      // Obtener los turnos de Firestore
      const turnosCollection = collection(this.firestore, 'turnos');
      const turnosSnapshot = await getDocs(turnosCollection);
      const turnos = turnosSnapshot.docs.map(doc => doc.data());

      const turnosFinalizadosPorMedico: { [key: string]: number } = {};

      turnos.forEach((turno: DocumentData) => {
        const estado = turno['estado'];
        const medico = turno['medico'];
        const fechaTurno = turno['fecha'];

        // Verificar si el turno está finalizado y dentro del rango de fechas
        if (estado === 'Finalizado' && medico && fechaTurno) {
          const fechaTurnoDate = new Date(fechaTurno); // Convertir fecha a objeto Date

          if (fechaTurnoDate >= fechaInicio && fechaTurnoDate <= fechaFin) {
            if (turnosFinalizadosPorMedico[medico]) {
              turnosFinalizadosPorMedico[medico]++;
            } else {
              turnosFinalizadosPorMedico[medico] = 1;
            }
          }
        }
      });

      console.log('Datos de turnos finalizados por médico:', turnosFinalizadosPorMedico);

      // Calcular las estadísticas de los turnos finalizados por médico
      this.turnosFinalizadosPorMedicoStats = this.calculateTurnosFinalizadosPorMedicoStats(turnosFinalizadosPorMedico);

      // Actualizar el gráfico con los datos
      this.chartData = {
        type: 'bar',
        data: {
          labels: Object.keys(turnosFinalizadosPorMedico),
          datasets: [
            {
              label: 'Turnos Finalizados por Médico',
              data: Object.values(turnosFinalizadosPorMedico),
              backgroundColor: 'rgba(255, 159, 64, 0.2)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      };

      this.isLoading = false;
    } else {
      console.error("Las fechas de inicio y fin no están definidas correctamente.");
      this.isLoading = false;
    }
  }

  calculateTurnosFinalizadosPorMedicoStats(turnosData: { [key: string]: number }) {
    const sortedTurnos = Object.entries(turnosData).sort((a, b) => b[1] - a[1]);

    const maxTurnosMedico = sortedTurnos[0];
    const minTurnosMedico = sortedTurnos[sortedTurnos.length - 1];

    return {
      maxTurnosMedico,
      minTurnosMedico,
    };
  }

  generatePDF() {
    this.isLoading = true; // Activar la pantalla de carga
  
    const doc = new jsPDF();
  
    // Verifica el informe actual y llama a la función correspondiente
    console.log('Generando PDF para el informe:', this.informeAMostrar);
    const promises = [];
  
    switch (this.informeAMostrar) {
      case 0: // Ingresos
        console.log('Generando PDF para el informe de Ingresos');
        promises.push(this.generateIngresosPDF(doc));
        break;
      case 1: // Turnos por Especialidad
        console.log('Generando PDF para el informe de Turnos por Especialidad');
        promises.push(this.generateTurnosPorEspecialidadPDF(doc));
        break;
      case 2: // Turnos por Día
        console.log('Generando PDF para el informe de Turnos por Día');
        promises.push(this.generateTurnosPorDiaPDF(doc));
        break;
      case 3: // Turnos Solicitados por Médico en Tiempo
        console.log('Generando PDF para el informe de Turnos Solicitados por Médico en Tiempo');
        promises.push(this.generateTurnosSolicitadosPorMedicoPDF(doc));
        break;
      case 4: // Turnos Finalizados por Médico en Tiempo
        console.log('Generando PDF para el informe de Turnos Finalizados por Médico en Tiempo');
        promises.push(this.generateTurnosFinalizadosPorMedicoPDF(doc));
        break;
      default:
        console.error('Informe no reconocido para generar PDF');
        this.isLoading = false; // Desactivar la pantalla de carga si el informe no es reconocido
        return;
    }
  
    // Esperar que todas las promesas se resuelvan antes de continuar
    Promise.all(promises)
      .then(() => {
        this.isLoading = false; // Desactivar la pantalla de carga una vez que todo esté listo
        doc.save('informe.pdf'); // Descargar el PDF
      })
      .catch((error) => {
        console.error('Error al generar el PDF:', error);
        this.isLoading = false; // Desactivar la pantalla de carga en caso de error
      });
  }


  // Generar PDF para Ingresos
  private async generateIngresosPDF(doc: jsPDF): Promise<void> {
    // Encabezado
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20);
    doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20);
  
    // Título del documento
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.setFontSize(22);
    doc.text("INFORME DE INGRESOS", 105, 50, { align: "center" });
  
    // Agregar texto "GRAFICO"
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GRAFICO', 20, 75);  // Cambié la posición para que no se solape
  
    // Intentamos capturar el gráfico de Ingresos con un retraso para asegurarnos de que se haya renderizado
    const canvas = document.getElementById('ingresosChart') as HTMLCanvasElement;
  
    if (canvas) {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          html2canvas(canvas, {
            logging: true,
            useCORS: true,
          }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 180;  
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
            // Añadir el gráfico al PDF sin tapar el banner
            doc.addImage(imgData, 'PNG', 10, 85, imgWidth, imgHeight);
  
            // Posición de las estadísticas
            const yPosition = 95 + imgHeight + 10; 
  
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('ESTADISTICAS', 20, yPosition);
  
            doc.setFontSize(15);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
  
            const stats = [
              `Máximo de ingresos por día: ${this.ingresosStats.maxIngresosDay[0]} (${this.ingresosStats.maxIngresosDay[1]} ingresos)`,
              `Mínimo de ingresos por día: ${this.ingresosStats.minIngresosDay[0]} (${this.ingresosStats.minIngresosDay[1]} ingresos)`,
              `Máximo de ingresos por usuario: ${this.ingresosStats.maxIngresosUser[0]} (${this.ingresosStats.maxIngresosUser[1]} ingresos)`,
              `Mínimo de ingresos por usuario: ${this.ingresosStats.minIngresosUser[0]} (${this.ingresosStats.minIngresosUser[1]} ingresos)`
            ];
  
            stats.forEach((stat, index) => {
              doc.text(stat, 20, yPosition + (index + 1) * 10); 
            });
  
            resolve();
          }).catch((error) => {
            console.error('Error al capturar el gráfico de Ingresos:', error);
            reject(error);
          });
        }, 1500); // Retraso antes de capturar el gráfico
      });
  
    } else {
      console.error('No se encontró el canvas del gráfico de Ingresos');
      return Promise.reject('Canvas no encontrado');
    }
  }

  // Generar PDF para Turnos por Especialidad
  private generateTurnosPorEspecialidadPDF(doc: jsPDF): Promise<void> {
    // Encabezado
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20);
    doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20);
  
    // Título del documento
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.setFontSize(22);
    doc.text("INFORME DE TURNOS POR ESPECIALIDAD", 105, 50, { align: "center" });
  
    // Agregar texto "GRAFICO"
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GRAFICO', 20, 75); // Cambié la posición para que no se solape
  
    // Intentamos capturar el gráfico de Turnos por Especialidad
    const canvas = document.getElementById('especialidadChart') as HTMLCanvasElement;
  
    if (canvas) {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          html2canvas(canvas, {
            logging: true,
            useCORS: true,
          }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 100;
            const imgHeight = 100;
  
            // Añadir el gráfico al PDF
            doc.addImage(imgData, 'PNG', 10, 85, imgWidth, imgHeight);
  
            // Posición de las estadísticas
            const yPosition = 95 + imgHeight + 10;
  
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('ESTADISTICAS', 20, yPosition);
  
            doc.setFontSize(15);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
  
            const stats = [
              `Especialidad con más turnos: ${this.turnosPorEspecialidadStats.maxTurnosEspecialidad[0]} (${this.turnosPorEspecialidadStats.maxTurnosEspecialidad[1]} turnos)`,
              `Especialidad con menos turnos: ${this.turnosPorEspecialidadStats.minTurnosEspecialidad[0]} (${this.turnosPorEspecialidadStats.minTurnosEspecialidad[1]} turnos)`
            ];
  
            stats.forEach((stat, index) => {
              doc.text(stat, 20, yPosition + (index + 1) * 10); 
            });
  
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }, 1500); // Retraso antes de capturar el gráfico
      });
    } else {
      return Promise.reject('No se encontró el canvas de Turnos por Especialidad');
    }
  }

  // Generar PDF para Turnos por Día
  private generateTurnosPorDiaPDF(doc: jsPDF): Promise<void> {
    // Encabezado
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20);
    doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20);
  
    // Título del documento
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.setFontSize(22);
    doc.text("INFORME DE TURNOS POR DÍA", 105, 50, { align: "center" });
  
    // Agregar texto "GRAFICO"
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GRAFICO', 20, 75);  // Cambié la posición para que no se solape
  
    // Intentamos capturar el gráfico de Turnos por Día
    const canvas = document.getElementById('diaChart') as HTMLCanvasElement;
  
    if (canvas) {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          html2canvas(canvas, {
            logging: true,
            useCORS: true,
          }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 180;  
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
            // Añadir el gráfico al PDF
            doc.addImage(imgData, 'PNG', 10, 85, imgWidth, imgHeight);
  
            // Posición de las estadísticas
            const yPosition = 95 + imgHeight + 10;
  
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('ESTADISTICAS', 20, yPosition);
  
            doc.setFontSize(15);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
  
            const stats = [
              `Día con más turnos: ${this.turnosPorDiaStats.maxTurnosDia[0]} (${this.turnosPorDiaStats.maxTurnosDia[1]} turnos)`,
              `Día con menos turnos: ${this.turnosPorDiaStats.minTurnosDia[0]} (${this.turnosPorDiaStats.minTurnosDia[1]} turnos)`,
              `Promedio de turnos por día: ${this.turnosPorDiaStats.avgTurnosDia}`
            ];
  
            stats.forEach((stat, index) => {
              doc.text(stat, 20, yPosition + (index + 1) * 10); 
            });
  
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }, 1500); // Retraso antes de capturar el gráfico
      });
    } else {
      return Promise.reject('No se encontró el canvas de Turnos por Día');
    }
  }

  private generateTurnosSolicitadosPorMedicoPDF(doc: jsPDF): Promise<void> {
    // Encabezado
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20);
    doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20);
  
    // Título del documento
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.setFontSize(22);
    doc.text("INFORME DE TURNOS SOLICITADOS POR MÉDICO", 105, 50, { align: "center" });
  
    // Agregar texto "GRAFICO"
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GRAFICO', 20, 75);
  
    // Intentamos capturar el gráfico de Turnos Solicitados por Médico
    const canvas = document.getElementById('turnosSolicitadosChart') as HTMLCanvasElement;
  
    if (canvas) {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          html2canvas(canvas, {
            logging: true,
            useCORS: true,
          }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 180;  
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
            // Añadir el gráfico al PDF
            doc.addImage(imgData, 'PNG', 10, 85, imgWidth, imgHeight);
  
            // Posición de las estadísticas
            const yPosition = 95 + imgHeight + 10;
  
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('ESTADISTICAS', 20, yPosition);
  
            doc.setFontSize(15);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
  
            const stats = [
              `Máximo de turnos solicitados por médico: ${this.turnosSolicitadosPorMedicoStats.maxTurnosMedico[0]} (${this.turnosSolicitadosPorMedicoStats.maxTurnosMedico[1]} turnos)`,
              `Mínimo de turnos solicitados por médico: ${this.turnosSolicitadosPorMedicoStats.minTurnosMedico[0]} (${this.turnosSolicitadosPorMedicoStats.minTurnosMedico[1]} turnos)`
            ];
  
            stats.forEach((stat, index) => {
              doc.text(stat, 20, yPosition + (index + 1) * 10); 
            });
  
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }, 1500); // Retraso antes de capturar el gráfico
      });
    } else {
      return Promise.reject('No se encontró el canvas de Turnos Solicitados por Médico');
    }
  }

  // Generar PDF para Turnos Finalizados por Médico en Tiempo
  private generateTurnosFinalizadosPorMedicoPDF(doc: jsPDF): Promise<void> {
    // Encabezado
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20);
    doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20);
  
    // Título del documento
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.setFontSize(22);
    doc.text("INFORME DE TURNOS FINALIZADOS POR MÉDICO", 105, 50, { align: "center" });
  
    // Agregar texto "GRAFICO"
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GRAFICO', 20, 75);
  
    // Intentamos capturar el gráfico de Turnos Finalizados por Médico
    const canvas = document.getElementById('turnosFinalizadosChart') as HTMLCanvasElement;
  
    if (canvas) {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          html2canvas(canvas, {
            logging: true,
            useCORS: true,
          }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 180;  
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
            // Añadir el gráfico al PDF
            doc.addImage(imgData, 'PNG', 10, 85, imgWidth, imgHeight);
  
            // Posición de las estadísticas
            const yPosition = 95 + imgHeight + 10;
  
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('ESTADISTICAS', 20, yPosition);
  
            doc.setFontSize(15);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
  
            const stats = [
              `Máximo de turnos finalizados por médico: ${this.turnosFinalizadosPorMedicoStats.maxTurnosMedico[0]} (${this.turnosFinalizadosPorMedicoStats.maxTurnosMedico[1]} turnos)`,
              `Mínimo de turnos finalizados por médico: ${this.turnosFinalizadosPorMedicoStats.minTurnosMedico[0]} (${this.turnosFinalizadosPorMedicoStats.minTurnosMedico[1]} turnos)`
            ];
  
            stats.forEach((stat, index) => {
              doc.text(stat, 20, yPosition + (index + 1) * 10); 
            });
  
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }, 1500); // Retraso antes de capturar el gráfico
      });
    } else {
      return Promise.reject('No se encontró el canvas de Turnos Finalizados por Médico');
    }
  }
}