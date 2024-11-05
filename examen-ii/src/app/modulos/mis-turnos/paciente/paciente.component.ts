import { Component } from '@angular/core';
import { Turno } from '../../../interfaces/app.interface';
import { collection, doc, Firestore, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { AlertService } from '../../../servicios/alert.service';
import { AuthService } from '../../../servicios/auth.service';
import { EstadoTurno } from '../../../enums/enums';

@Component({
  selector: 'app-paciente',
  templateUrl: './paciente.component.html',
  styleUrl: './paciente.component.css'
})
export class PacienteComponent {
  isLoading: boolean = false;
  turnosDisponibles!: Turno[];
  searchText: string = '';
  usuarioLogueado: string | null = null;

  constructor(private firestore: Firestore, private alert: AlertService, private auth: AuthService) { }

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

        const q = query(turnosCollection, where('paciente', '==', this.usuarioLogueado));

        const allTurnosSnapshot = await getDocs(turnosCollection);
        console.log('Cantidad total de turnos en la colección:', allTurnosSnapshot.size);
        allTurnosSnapshot.forEach((doc) => {
            console.log('Documento en la colección turnos:', doc.data());
        });

        const turnosSnapshot = await getDocs(q);

        if (turnosSnapshot.empty) {
            console.log("No se encontraron turnos para el paciente con el email:", this.usuarioLogueado);
            return;
        }

        console.log('Cantidad de turnos encontrados para el paciente:', turnosSnapshot.size);

        this.turnosDisponibles = await Promise.all(turnosSnapshot.docs.map(async (doc) => {
            const turnoData = doc.data();
            console.log('Datos del turno encontrado:', turnoData);

            console.log(`Comparando email almacenado "${turnoData['paciente']}" con email logueado "${this.usuarioLogueado}"`);

            const medicoNombreCompleto = await this.auth.obtenerNombreCompletoDesdeEmail(turnoData['medico']);
            const pacienteNombreCompleto = await this.auth.obtenerNombreCompletoDesdeEmail(turnoData['paciente']);

            const historiaClinicaData = await this.obtenerHistoriaClinica(turnoData['paciente']);

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
                encuesta: turnoData['encuesta'],
                calificacion: turnoData['calificacion'],
                altura: historiaClinicaData.altura, 
                peso: historiaClinicaData.peso, 
                temperatura: historiaClinicaData.temperatura, 
                presion: historiaClinicaData.presion, 
                datosDinamicos: historiaClinicaData.datosDinamicos 
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

private async obtenerHistoriaClinica(pacienteEmail: string): Promise<any> {
    const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');
    const q = query(historiasClinicasRef, where('pacienteEmail', '==', pacienteEmail));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
            altura: data['altura'] || null,
            peso: data['peso'] || null,
            temperatura: data['temperatura'] || null,
            presion: data['presion'] || null,
            datosDinamicos: data['datosDinamicos'] || [] 
        };
    } else {
        console.log('No se encontró historia clínica para el paciente:', pacienteEmail);
        return {
            altura: null,
            peso: null,
            temperatura: null,
            presion: null,
            datosDinamicos: []
        };
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

  async leerResenia(turno: Turno) {
    this.alert.leerResenia(turno);
  }

  async calificarAtencion(turno: Turno) {
    const calificacion = await this.alert.mostrarDialogoCalificacion();

    if (calificacion) {
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

          await updateDoc(turnoDocRef, {
            calificacion: calificacion
          });

          this.alert.mostrarSuccess('El turno ha sido calificado con éxito.');
        } else {
          this.alert.mostrarError('No se pudo calificar el turno. No se encontró el turno.');
        }
      } catch (error) {
        console.error("Error al calificar el turno:", error);
        this.alert.mostrarError('No se pudo calificar el turno. Intente de nuevo.');
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log("La calificacion fue cancelada por el usuario.");
    }
  }

  async completarEncuesta(turno: Turno) {
    const resultado = await this.alert.mostrarFormularioEncuesta();

    if (resultado) {
      try {
        this.isLoading = true;
        const { recomendacion, instalaciones, consejo } = resultado;

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

          console.log("Guardando encuesta en:", turnoDocRef.path);

          await updateDoc(turnoDocRef, {
            encuesta: {
              recomendacion: recomendacion,
              instalaciones: instalaciones,
              consejo: consejo
            }
          });

          this.alert.mostrarSuccess('La encuesta se ha guardado con éxito.');
        } else {
          console.log("No se encontró el documento del turno para guardar la encuesta.");
          this.alert.mostrarError('No se pudo guardar la encuesta. No se encontró el turno.');
        }
      } catch (error) {
        console.error("Error al guardar la encuesta:", error);
        this.alert.mostrarError('No se pudo guardar la encuesta. Intente de nuevo.');
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log("La encuesta fue cancelada por el usuario.");
    }
  }

}