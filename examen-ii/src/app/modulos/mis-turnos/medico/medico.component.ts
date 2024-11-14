import { ChangeDetectorRef, Component } from '@angular/core';
import { Turno } from '../../../interfaces/app.interface';
import { collection, doc, Firestore, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { AlertService } from '../../../servicios/alert.service';
import { AuthService } from '../../../servicios/auth.service';
import { EstadoTurno } from '../../../enums/enums';
import { Router } from '@angular/router';

@Component({
  selector: 'app-medico',
  templateUrl: './medico.component.html',
  styleUrl: './medico.component.css'
})
export class MedicoComponent {
  isLoading: boolean = false;
  turnosDisponibles!: Turno[];
  searchText: string = '';
  usuarioLogueado: string | null = null;

  constructor(private firestore: Firestore, private alert: AlertService, private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.auth.usuarioLogueado$.subscribe((usuario) => {
      this.usuarioLogueado = usuario;
      console.log('Usuario logueado:', this.usuarioLogueado);
    });
    this.obtenerTurnosDisponibles();
  }

  async obtenerTurnosDisponibles() {
    this.isLoading = true;

    try {
      const turnosCollection = collection(this.firestore, 'turnos');

      console.log('Valor de this.usuarioLogueado antes de la consulta:', this.usuarioLogueado);

      const q = query(turnosCollection, where('medico', '==', this.usuarioLogueado));

      const allTurnosSnapshot = await getDocs(turnosCollection);
      console.log('Cantidad total de turnos en la colección:', allTurnosSnapshot.size);

      const turnosSnapshot = await getDocs(q);

      if (turnosSnapshot.empty) {
        console.log("No se encontraron turnos para el médico con el email:", this.usuarioLogueado);
        return;
      }

      console.log('Cantidad de turnos encontrados para el médico:', turnosSnapshot.size);

      this.turnosDisponibles = await Promise.all(turnosSnapshot.docs.map(async (doc) => {
        const turnoData = doc.data();
        console.log('Datos del turno encontrado:', turnoData);

        console.log(`Comparando email almacenado "${turnoData['medico']}" con email logueado "${this.usuarioLogueado}"`);

        const medicoNombreCompleto = await this.auth.obtenerNombreCompletoDesdeEmail(turnoData['medico']);
        const pacienteNombreCompleto = await this.auth.obtenerNombreCompletoDesdeEmail(turnoData['paciente']);
        const historiaClinica = turnoData['historiaClinica'] || {};

        const turno: Turno = {
          medico: turnoData['medico'] || '',
          medicoNombreCompleto: medicoNombreCompleto || '',
          fecha: turnoData['fecha'] || '',
          horario: turnoData['horario'] || '',
          especialidad: turnoData['especialidad'] || '',
          paciente: turnoData['paciente'] || '',
          pacienteNombreCompleto: pacienteNombreCompleto || '',
          estado: turnoData['estado'] || '',
          resenia: turnoData['resenia'],
          altura: historiaClinica['altura'] || null,
          peso: historiaClinica['peso'] || null,
          temperatura: historiaClinica['temperatura'] || null,
          presion: historiaClinica['presion'] || null,
          datosDinamicos: historiaClinica['datosDinamicos'] || [],
          fechaSolicitud: turnoData['fechaSolicitud']
        };

        console.log('Turno procesado:', turno);
        return turno;
      }));

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

  async rechazarTurno(turno: Turno) {
    const motivo = await this.alert.mostrarDialogoMotivoRechazo();

    if (motivo) {
      turno.estado = EstadoTurno.Rechazado;

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

          console.log("Intentando rechazar el turno en:", turnoDocRef.path);

          await updateDoc(turnoDocRef, {
            estado: EstadoTurno.Rechazado,
            motivoRechazo: motivo
          });

          this.alert.mostrarSuccess('El turno ha sido rechazado con éxito.');
        } else {
          console.log("No se encontró el documento del turno para rechazar.");
          this.alert.mostrarError('No se pudo rechazar el turno. No se encontró el turno.');
        }
      } catch (error) {
        console.error("Error al rechazar el turno:", error);
        this.alert.mostrarError('No se pudo rechazar el turno. Intente de nuevo.');
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log("El rechazo fue cancelado por el usuario.");
    }
  }

  async aceptarTurno(turno: Turno) {
    try {
      turno.estado = EstadoTurno.Aceptado;
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

        console.log("Intentando aceptar el turno en:", turnoDocRef.path);

        await updateDoc(turnoDocRef, {
          estado: EstadoTurno.Aceptado
        });

        this.alert.mostrarSuccess('El turno ha sido aceptado con éxito.');
      } else {
        console.log("No se encontró el documento del turno para aceptar.");
        this.alert.mostrarError('No se pudo aceptar el turno. No se encontró el turno.');
      }
    } catch (error) {
      console.error("Error al aceptar el turno:", error);
      this.alert.mostrarError('No se pudo aceptar el turno. Intente de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  async finalizarTurno(turno: Turno) {
    const resultado = await this.alert.mostrarFormularioReseña();

    if (resultado) {
      try {
        turno.estado = EstadoTurno.Finalizado;
        this.isLoading = true;
        const { resenia, diagnostico } = resultado;

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

          console.log("Guardando resenia y diagnostico en:", turnoDocRef.path);

          await updateDoc(turnoDocRef, {
            resenia: {
              resenia: resenia,
              diagnostico: diagnostico
            },
            estado: EstadoTurno.Finalizado,
            fechaFinalizacion: new Date()
          });

          this.alert.mostrarSuccess('La reseña y el diagnostico se han guardado con éxito.');
        } else {
          console.log("No se encontró el documento del turno para guardar la reseña.");
          this.alert.mostrarError('No se pudo guardar la reseña ni el diagnostico. No se encontró el turno.');
        }
      } catch (error) {
        console.error("Error al guardar la reseña:", error);
        this.alert.mostrarError('No se pudo guardar la reseña. Intente de nuevo.');
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log("La reseña fue cancelada por el usuario.");
    }
  }

  async leerResenia(turno: Turno) {
    this.alert.leerResenia(turno);
  }

  verHistoriaClinica(pacienteEmail: string, fechaSolicitud: Date | null | undefined) {
    // Aquí puedes manejar el caso de que fechaSolicitud sea null o undefined
    if (fechaSolicitud) {
      this.auth.setPacienteHistoriaClinica(pacienteEmail, true, fechaSolicitud);
      this.router.navigate(['/historia-clinica']);
    } else {
      // Si fechaSolicitud es null o undefined, tomar alguna acción
      console.log('Fecha de solicitud no válida');
    }
  }
}