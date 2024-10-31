import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Rol } from '../enums/enums';
import { Admin, Medico, Paciente } from '../interfaces/app.interface';

interface Usuario {
  email: string;
  rol: Rol;
  aceptado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Almaceno el estado del usuario logueado en el BehaviorSubject
  private usuarioLogueadoSource = new BehaviorSubject<string | null>(null);
  sub!: Subscription;

  // Observable al que los componentes se pueden suscribir para escuchar cambios (En este caso se suscribe el componente principal)
  usuarioLogueado$ = this.usuarioLogueadoSource.asObservable();

  constructor(private firestore: Firestore) { }

  get usuarioLogueado(): string | null {
    return this.usuarioLogueadoSource.value;
  }

  //Recibo el user y lo meto en usuarioLogueadoSource
  setUsuarioLogueado(usuario: string | null) {
    this.usuarioLogueadoSource.next(usuario);
  }

  //Convierto usuarioLogueadoSource a null
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
      return userDoc.aceptado; // Devolvemos el valor del campo 'aceptado'
    }

    return null; // Retorna null si no se encuentra el usuario
  }

  async getUserEntity(email: string): Promise<Medico | Paciente | Admin | null> {
    try {
      const col = collection(this.firestore, 'usuarios');
      const filteredQuery = query(col, where('email', '==', email));
      const querySnapshot = await getDocs(filteredQuery);

      // Verificamos si se encontró el documento
      if (querySnapshot.empty) {
        console.warn(`No se encontró un usuario con el email: ${email}`);
        return null;
      }

      const userDoc = querySnapshot.docs[0].data() as Medico | Paciente | Admin;
      return userDoc;
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      return null; // Retornar null si hay algún error
    }
  }

  isLoggedIn(): boolean {
    const loggedInStatus = this.usuarioLogueadoSource.value !== null;
    console.log('Checking login status:', loggedInStatus);
    return loggedInStatus;
  }
}