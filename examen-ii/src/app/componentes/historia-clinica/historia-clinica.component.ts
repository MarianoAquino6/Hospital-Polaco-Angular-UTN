import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Rol } from '../../enums/enums';
import { Firestore, Timestamp, addDoc, collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { AlertService } from '../../servicios/alert.service';
import { LoadingComponent } from '../loading/loading.component';
import { Router } from '@angular/router';
import { UnidadesHcPipe } from '../../pipes/unidades-hc.pipe';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, UnidadesHcPipe],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent {
  historiaClinica: {
    altura: number | null;
    peso: number | null;
    temperatura: number | null;
    presion: string | null;
    datosDinamicos: { clave: string; valor: string }[];
  } = {
      altura: null,
      peso: null,
      temperatura: null,
      presion: null,
      datosDinamicos: []
    };

  maxDatosDinamicos = 3;
  usuarioLogueado: string | null = null;
  isAdmin = false;
  isMedico = false;
  isPaciente = false;
  pacienteEmail: string | null = null;
  fechaSolicitud: Date | null = null;
  editable: boolean | null = null;
  isLoading: boolean = false;
  historiasClinicasPaciente: any[] = [];

  constructor(private auth: AuthService, private firestore: Firestore, private alert: AlertService, private router: Router) { }

  async ngOnInit() {
    this.auth.usuarioLogueado$.subscribe((usuario) => {
      this.usuarioLogueado = usuario;
    });

    this.auth.pacienteHistoriaClinicaEditable$.subscribe((editable) => {
      this.editable = editable;
    });

    this.auth.pacienteHistoriaClinicaEmail$.subscribe(async (paciente) => {
      this.pacienteEmail = paciente;
    });

    if (!this.editable) {
      await this.cargarHistoriaClinicaLectura(this.pacienteEmail);
    }
    else {
      this.auth.pacienteHistoriaClinicaFechaSolicitud$.subscribe(async (fecha) => {
        this.fechaSolicitud = fecha;
      });

      if (this.pacienteEmail && this.fechaSolicitud) {
        await this.cargarHistoriaClinicaEditable(this.pacienteEmail, this.fechaSolicitud);
      } else {
        console.log('El email del paciente es null, undefined o inválido.');
      }
    }
  }

  // Método para cargar la historia clínica desde la colección de turnos
  private async cargarHistoriaClinicaLectura(emailPaciente: string | null) {
    try {
      this.isLoading = true;
  
      // Referencia a la colección 'turnos'
      const turnosRef = collection(this.firestore, 'turnos');
  
      // Consulta para obtener los turnos del paciente sin ordenar
      const q = query(turnosRef, where('paciente', '==', emailPaciente));
  
      // Obtener los documentos de la consulta
      const querySnapshot = await getDocs(q);
  
      // Limpiar las historias clínicas previas
      this.historiasClinicasPaciente = [];
  
      // Iterar sobre los documentos obtenidos
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const historiaClinicaData = data['historiaClinica'];
  
        if (historiaClinicaData) {
          // Aseguramos que la historia clínica tiene la estructura correcta
          const historiaClinicaFormateada = {
            altura: historiaClinicaData.altura || null,
            peso: historiaClinicaData.peso || null,
            temperatura: historiaClinicaData.temperatura || null,
            presion: historiaClinicaData.presion || null,
            datosDinamicos: historiaClinicaData.datosDinamicos || [],
            fechaCreacion: historiaClinicaData.fechaCreacion
          };
  
          // Guardamos cada historia clínica formateada en la variable this.historiasClinicasPaciente
          this.historiasClinicasPaciente.push({
            fechaCreacion: data['fechaCreacion'], // Fecha de creación del turno
            historiaClinica: historiaClinicaFormateada
          });
        }
      });
  
      // Ordenar en memoria por fecha de creación de manera descendente
      this.historiasClinicasPaciente.sort((a, b) => {
        return b.fechaCreacion.seconds - a.fechaCreacion.seconds;  // Ordenar según el campo fechaCreacion
      });
    } catch (error) {
      console.error('Error al cargar las historias clínicas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Método para cargar la historia clínica desde los turnos de un médico y un paciente específico
  private async cargarHistoriaClinicaEditable(emailPaciente: string, fechaSolicitud: Date) {
    try {
      this.isLoading = true;

      const turnosRef = collection(this.firestore, 'turnos');
      const q = query(turnosRef,
        where('paciente', '==', emailPaciente),
        where('fechaSolicitud', '==', fechaSolicitud)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        const historiaClinicaData = data['historiaClinica'];

        if (historiaClinicaData) {
          this.historiaClinica = {
            altura: historiaClinicaData.altura || null,
            peso: historiaClinicaData.peso || null,
            temperatura: historiaClinicaData.temperatura || null,
            presion: historiaClinicaData.presion || null,
            datosDinamicos: historiaClinicaData.datosDinamicos || []
          };
        } else {
          console.log('No se encontró historia clínica para este paciente.');
        }
      } else {
        console.log('No se encontró un turno para este paciente en esta fecha.');
      }
    } catch (error) {
      console.error('Error al obtener la historia clínica:', error);
    } finally {
      this.isLoading = false;
    }
  }

  agregarDatoDinamico() {
    if (this.historiaClinica.datosDinamicos.length < this.maxDatosDinamicos) {
      this.historiaClinica.datosDinamicos.push({ clave: '', valor: '' });
    }
  }

  // Método para guardar la historia clínica
  async guardarHistoriaClinica() {
    if (this.pacienteEmail && this.fechaSolicitud) {
      if (this.validarHistoriaClinica()) {
        const historiaClinicaData = {
          altura: this.historiaClinica.altura,
          peso: this.historiaClinica.peso,
          temperatura: this.historiaClinica.temperatura,
          presion: this.historiaClinica.presion,
          datosDinamicos: this.historiaClinica.datosDinamicos,
          fechaCreacion: Timestamp.now() // Fecha de modificación actual
        };

        try {
          this.isLoading = true;

          // Buscar el turno en la colección de turnos
          const turnosRef = collection(this.firestore, 'turnos');
          const q = query(turnosRef,
            where('paciente', '==', this.pacienteEmail),
            where('fechaSolicitud', '==', this.fechaSolicitud)  // Usamos la fecha de solicitud tal cual
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Si el turno existe, obtenemos el documento
            const turnoDoc = querySnapshot.docs[0];
            const turnoDocRef = doc(this.firestore, `turnos/${turnoDoc.id}`);

            // Guardamos la historia clínica directamente en el campo 'historiaClinica'
            await updateDoc(turnoDocRef, {
              historiaClinica: historiaClinicaData
            });

            this.alert.mostrarSuccess('Historia clínica guardada con éxito');

            setTimeout(() => {
              this.router.navigate(['/mis-turnos/medicos']);
            }, 1500);
          } else {
            // Si no existe el turno, mostramos un mensaje de error
            this.alert.mostrarError('No se encontró el turno para este paciente en esta fecha');
          }
        } catch (error) {
          this.alert.mostrarError('Error al guardar la historia clínica');
          console.error('Error:', error);
        } finally {
          this.isLoading = false;
        }
      } else {
        this.alert.mostrarError('Por favor complete todos los campos obligatorios');
      }
    } else {
      console.log('No se puede guardar la historia clínica, el email del paciente o la fecha son inválidos.');
    }
  }

  validarHistoriaClinica(): boolean {
    return !!(this.historiaClinica.altura && this.historiaClinica.peso &&
      this.historiaClinica.temperatura && this.historiaClinica.presion);
  }
}