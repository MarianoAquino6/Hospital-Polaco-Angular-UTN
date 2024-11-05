import { AlertService } from './../../../servicios/alert.service';
import { Component } from '@angular/core';
import { UsuarioStandard } from '../../../interfaces/app.interface';
import { Observable, Subscription } from 'rxjs';
import { collection, collectionData, doc, Firestore, getDocs, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { AuthService } from '../../../servicios/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tabla-usuarios',
  templateUrl: './tabla-usuarios.component.html',
  styleUrl: './tabla-usuarios.component.css'
})
export class TablaUsuariosComponent {
  objetos!: UsuarioStandard[];
  objetoSeleccionado!: string;
  sub!: Subscription;
  isLoading: boolean = false;

  constructor(private firestore: Firestore, private alert: AlertService, private auth: AuthService, private router: Router) { }

  async ngOnInit() {
    console.log('Iniciando carga de usuarios...');
    await this.obtenerObjetos();
    console.log('Carga de usuarios finalizada.');
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  async obtenerObjetos() {
    console.log('Configurando loading a true');
    this.isLoading = true; 
    console.log('isLoading:', this.isLoading); 


    try {
      let col = collection(this.firestore, 'usuarios');
      const filteredQuery = query(col, orderBy('rol', 'asc'));

      const observable: Observable<UsuarioStandard[]> = collectionData(filteredQuery, { idField: 'id' });

      this.sub = observable.subscribe(async (respuesta: UsuarioStandard[]) => {
        for (const usuario of respuesta) {
          const tieneHC = await this.verificarHistoriaClinica(usuario.email);
          usuario.tieneHC = tieneHC;
        }

        this.objetos = respuesta;
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      console.log('Configurando loading a false');
      this.isLoading = false; 
      console.log('isLoading:', this.isLoading); 
    }
  }

  private async verificarHistoriaClinica(email: string): Promise<boolean> {
    const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');
    const q = query(historiasClinicasRef, where('pacienteEmail', '==', email));

    const querySnapshot = await getDocs(q); 

    return !querySnapshot.empty;
  }

  async cambiarHabilitacionUsuario(activarUsuario: boolean, usuario: UsuarioStandard): Promise<void> {
    this.isLoading = true;

    try {
      const usuariosCollection = collection(this.firestore, 'usuarios');
      const q = query(
        usuariosCollection,
        where('email', '==', usuario.email),
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const usuarioAHabilitar = snapshot.docs[0];
        const turnoDocRef = doc(this.firestore, `usuarios/${usuarioAHabilitar.id}`);

        if (activarUsuario) {
          await updateDoc(turnoDocRef, {
            habilitado: true
          });
          this.alert.mostrarSuccess('El usuario ha sido habilitado con exito.');
        }
        else {
          await updateDoc(turnoDocRef, {
            habilitado: false
          });
          this.alert.mostrarSuccess('El usuario ha sido deshabilitado con exito.');
        }
      }
    } catch (error) {
      this.alert.mostrarError('No se cambiar la habilitacion del usuario. Comuniquese con el equipo de soporte');
    }
    finally {
      this.isLoading = false;
    }
  }

  verHistoriaClinica(pacienteEmail: string) {
    console.log('seteo a ' + pacienteEmail)
    this.auth.setPacienteHistoriaClinica(pacienteEmail);
    this.router.navigate(['/historia-clinica']);
  }
}