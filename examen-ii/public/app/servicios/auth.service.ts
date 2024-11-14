import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Rol } from '../enums/enums';
import { Admin, Medico, Paciente } from '../interfaces/app.interface';

interface Usuario {
  email: string;
  rol: Rol;
  aceptado: boolean;
  habilitado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioLogueadoSource = new BehaviorSubject<string | null>(null);
  private pacienteHistoriaClinicaEmail = new BehaviorSubject<string | null>(null);
  private pacienteHistoriaClinicaFechaSolicitud = new BehaviorSubject<Date | null>(null);
  private pacienteHistoriaClinicaEditable = new BehaviorSubject<boolean | null>(null);
  sub!: Subscription;

  usuarioLogueado$ = this.usuarioLogueadoSource.asObservable();
  pacienteHistoriaClinicaEmail$ = this.pacienteHistoriaClinicaEmail.asObservable();
  pacienteHistoriaClinicaFechaSolicitud$ = this.pacienteHistoriaClinicaFechaSolicitud.asObservable();
  pacienteHistoriaClinicaEditable$ = this.pacienteHistoriaClinicaEditable.asObservable();

  constructor(private firestore: Firestore) { }

  get usuarioLogueado(): string | null {
    return this.usuarioLogueadoSource.value;
  }

  obtenerUsuarioLogueado() {
    return this.usuarioLogueado;
  }

  setUsuarioLogueado(usuario: string | null) {
    this.usuarioLogueadoSource.next(usuario);

    console.log('Se seteo el usuario logueado: ' + this.usuarioLogueado)
  }

  setPacienteHistoriaClinica(pacienteEmail: string | null, editable: boolean | null, fechaSolicitud: Date | null = null) {
    this.pacienteHistoriaClinicaEmail.next(pacienteEmail);
    this.pacienteHistoriaClinicaFechaSolicitud.next(fechaSolicitud);
    this.pacienteHistoriaClinicaEditable.next(editable);

    console.log('Se seteo el paciente para la HC: ' + this.usuarioLogueado);
  }

  get pacienteHistoriaClinica(): string | null {
    return this.pacienteHistoriaClinicaEmail.value;
  }

  get pacienteHistoriaClinicaFecha(): Date | null {
    return this.pacienteHistoriaClinicaFechaSolicitud.value;
  }

  get pacienteHistoriaClinicaEditablee(): boolean | null {
    return this.pacienteHistoriaClinicaEditable.value;
  }

  logout() {
    this.usuarioLogueadoSource.next(null);
  }

  async getUserRole(email: string): Promise<Rol | null> {
    const col = collection(this.firestore, 'usuarios');
    const filteredQuery = query(col, where('email', '==', email));
    const querySnapshot = await getDocs(filteredQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0].data() as Usuario;
      return userDoc.rol;
    }

    return null;
  }

  async userWasAccepted(email: string): Promise<boolean | null> {
    const col = collection(this.firestore, 'usuarios');
    const filteredQuery = query(col, where('email', '==', email));
    const querySnapshot = await getDocs(filteredQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0].data() as Usuario;
      return userDoc.aceptado;
    }

    return null;
  }

  async usuarioEstaHabilitado(email: string): Promise<boolean | null> {
    const col = collection(this.firestore, 'usuarios');
    const filteredQuery = query(col, where('email', '==', email));
    const querySnapshot = await getDocs(filteredQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0].data() as Usuario;
      return userDoc.habilitado ?? null;
    }

    return null;
  }

  async getUserEntity(email: string): Promise<Medico | Paciente | Admin | null> {
    try {
      const col = collection(this.firestore, 'usuarios');
      const filteredQuery = query(col, where('email', '==', email));
      const querySnapshot = await getDocs(filteredQuery);

      if (querySnapshot.empty) {
        console.warn(`No se encontró un usuario con el email: ${email}`);
        return null;
      }

      const userDoc = querySnapshot.docs[0].data() as Medico | Paciente | Admin;
      return userDoc;
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      return null;
    }
  }

  async obtenerNombreCompletoDesdeEmail(email: string): Promise<string | null> {
    const col = collection(this.firestore, 'usuarios');
    const filteredQuery = query(col, where('email', '==', email));
    const querySnapshot = await getDocs(filteredQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0].data();
      return `${userDoc['apellido'] ?? ''} ${userDoc['nombre'] ?? ''}`.trim() || null;
    }

    return null;
  }

  isLoggedIn(): boolean {
    const loggedInStatus = this.usuarioLogueadoSource.value !== null;
    console.log('Checking login status:', loggedInStatus);
    return loggedInStatus;
  }
}