import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Rol } from '../../enums/enums';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { AlertService } from '../../servicios/alert.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
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
  isLoading: boolean = false;

  constructor(private auth: AuthService, private firestore: Firestore, private alert: AlertService) { }

  async ngOnInit() {
    this.auth.usuarioLogueado$.subscribe((usuario) => {
      this.usuarioLogueado = usuario;
      console.log('Usuario logueado:', this.usuarioLogueado);
    });

    if (this.usuarioLogueado) {
      const userRole = await this.auth.getUserRole(this.usuarioLogueado);
      this.isAdmin = userRole === Rol.Admin;
      this.isMedico = userRole === Rol.Medico;
      this.isPaciente = userRole === Rol.Paciente;
    }

    if (this.isPaciente) {
      this.auth.setPacienteHistoriaClinica(this.usuarioLogueado);
      if (this.usuarioLogueado) {
        await this.cargarHistoriaClinica(this.usuarioLogueado);
      }
    }
    else {
      this.auth.pacienteHistoriaClinicaEmail$.subscribe(async (paciente) => {
        this.pacienteEmail = paciente;
        console.log('Paciente HC:', this.pacienteEmail);

        if (this.pacienteEmail) {
          await this.cargarHistoriaClinica(this.pacienteEmail);
        } else {
          console.log('El email del paciente es null, undefined o inválido.');
        }
      });
    }
  }
  

  private async cargarHistoriaClinica(emailPaciente: string) {
    try {
      this.isLoading = true;
      const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');
      const q = query(historiasClinicasRef, where('pacienteEmail', '==', emailPaciente)); 

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data(); 
        this.historiaClinica = {
          altura: data['altura'] || null,
          peso: data['peso'] || null,
          temperatura: data['temperatura'] || null,
          presion: data['presion'] || null,
          datosDinamicos: data['datosDinamicos'] || []
        };
      } else {
        console.log('No se encontró una historia clínica para este paciente.');
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

  async guardarHistoriaClinica() {
    if (this.isMedico && this.pacienteEmail) {
      if (this.validarHistoriaClinica()) {
        const historiaClinicaData = {
          pacienteEmail: this.pacienteEmail,
          ...this.historiaClinica,
          fechaModificacion: new Date()
        };

        try {
          this.isLoading = true;

          const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');
          const q = query(historiasClinicasRef, where('pacienteEmail', '==', this.pacienteEmail));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const docRef = doc(this.firestore, 'historiasClinicas', querySnapshot.docs[0].id);
            await updateDoc(docRef, historiaClinicaData);
            this.alert.mostrarSuccess('Historia clínica actualizada con éxito');
          } else {
            const historiaClinicaCollection = collection(this.firestore, 'historiasClinicas');
            await addDoc(historiaClinicaCollection, historiaClinicaData);
            this.alert.mostrarSuccess('Historia clínica guardada con éxito');
          }
        } catch (error: any) {
          this.alert.mostrarError('Error al guardar la historia clínica');
          console.error('Error:', error);
        } finally {
          this.isLoading = false;
        }
      } else {
        this.alert.mostrarError('Por favor complete todos los campos obligatorios');
      }
    } else {
      console.log('No se puede guardar la historia clínica, el email del paciente es inválido.');
    }
  }

  validarHistoriaClinica(): boolean {
    return !!(this.historiaClinica.altura && this.historiaClinica.peso &&
      this.historiaClinica.temperatura && this.historiaClinica.presion);
  }
}