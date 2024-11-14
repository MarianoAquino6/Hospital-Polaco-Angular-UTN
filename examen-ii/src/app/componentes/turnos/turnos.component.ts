import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Turno } from '../../interfaces/app.interface';
import { collection, doc, Firestore, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { AlertService } from '../../servicios/alert.service';
import { FiltroGenericoPipe } from '../../pipes/filtro-generico.pipe';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { LoadingComponent } from '../loading/loading.component';
import { EstadoTurno } from '../../enums/enums';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FiltroGenericoPipe, FormsModule, LoadingComponent],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css'
})
export class TurnosComponent {
  turnosDisponibles!: Turno[];
  searchText: string = '';
  isLoading: boolean = false;

  constructor(private firestore: Firestore, private alert: AlertService, private auth: AuthService) { }

  ngOnInit() {
    this.obtenerTurnosDisponibles();
  }

  async obtenerTurnosDisponibles() {
    this.isLoading = true;

    try {
      const turnosCollection = collection(this.firestore, 'turnos');
      const turnosSnapshot = await getDocs(turnosCollection);

      if (turnosSnapshot.empty) {
        console.log("No se encontraron turnos en la colección 'turnos'.");
        return;
      }

      console.log('Cantidad de turnos encontrados:', turnosSnapshot.size);

      const turnos = await Promise.all(turnosSnapshot.docs.map(async (doc) => {
        const turnoData = doc.data();
        console.log('Datos del turno:', turnoData);

        const medicoNombreCompleto = await this.auth.obtenerNombreCompletoDesdeEmail(turnoData['medico']);
        const pacienteNombreCompleto = await this.auth.obtenerNombreCompletoDesdeEmail(turnoData['paciente']);

        const turno: Turno = {
          medico: turnoData['medico'] || '',
          medicoNombreCompleto: medicoNombreCompleto || '',
          fecha: turnoData['fecha'] || '',
          horario: turnoData['horario'] || '',
          especialidad: turnoData['especialidad'] || '',
          paciente: turnoData['paciente'] || '',
          pacienteNombreCompleto: pacienteNombreCompleto || '',
          estado: turnoData['estado'] || ''
        };

        console.log('Turno agregado:', turno);
        return turno;
      }));

      const ahora = new Date(); 
      this.turnosDisponibles = turnos.filter(turno => {
        const [year, month, day] = turno.fecha.split('-').map(Number); 
        const [startHour, endHour] = turno.horario.split(' - '); 
        const fechaHoraTurno = new Date(year, month - 1, day, ...startHour.split(':').map(Number));
        console.log('Fecha y hora del turno:', fechaHoraTurno); 
        return fechaHoraTurno > ahora; 
      });

      console.log('Turnos disponibles filtrados:', this.turnosDisponibles);
    } catch (error) {
      console.error("Error al obtener turnos:", error);
    } finally {
      this.isLoading = false;
    }
  }

  async cancelarTurno(turno: Turno) {
    const motivo = await this.alert.mostrarDialogoMotivo();

    if (motivo) {
      turno.estado = EstadoTurno.Cancelado;

      try {
        this.isLoading = true;

        const turnosCollection = collection(this.firestore, 'turnos');
        const q = query(
          turnosCollection,
          where('medico', '==', turno.medico),
          where('fecha', '==', turno.fecha),
          where('horario', '==', turno.horario)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const turnoDoc = snapshot.docs[0];
          const turnoDocRef = doc(this.firestore, `turnos/${turnoDoc.id}`);

          console.log("Intentando cancelar el turno en:", turnoDocRef.path);

          await updateDoc(turnoDocRef, {
            estado: EstadoTurno.Cancelado,
            motivoCancelacion: motivo
          });

          this.alert.mostrarSuccess('El turno ha sido cancelado con éxito.');
        } else {
          console.log("No se encontró el documento del turno para cancelar.");
          this.alert.mostrarError('No se pudo cancelar el turno. No se encontró el turno.');
        }
      } catch (error) {
        console.error("Error al cancelar el turno:", error);
        this.alert.mostrarError('No se pudo cancelar el turno. Intente de nuevo.');
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log("La cancelación fue cancelada por el usuario.");
    }
  }

}
