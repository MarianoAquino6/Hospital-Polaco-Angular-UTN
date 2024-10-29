import { Component } from '@angular/core';
import { collection, collectionData, doc, Firestore, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { Rol } from '../../../enums/enums';
import { Medico } from '../../../interfaces/app.interface';
import { AlertService } from '../../../servicios/alert.service';

@Component({
  selector: 'app-gestion-acceso',
  templateUrl: './gestion-acceso.component.html',
  styleUrl: './gestion-acceso.component.css'
})
export class GestionAccesoComponent {
  objetos!: Medico[];
  objetoSeleccionado!: string;
  sub!: Subscription;
  isLoading = false;

  constructor(private firestore: Firestore, private alert: AlertService) { }

  ngOnInit() {
    this.obtenerObjetos();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  obtenerObjetos() {
    let col = collection(this.firestore, 'usuarios');

    const filteredQuery = query(
      col,
      where('rol', '==', Rol.Medico),
      where('aceptado', '==', false)
    );

    const observable: Observable<Medico[]> = collectionData(filteredQuery, { idField: 'id' });

    // Modificar Actor[]
    this.sub = observable.subscribe((respuesta: Medico[]) => {
      this.objetos = respuesta;
    });
  }

  seleccionarObjeto(email: string) {
    this.objetoSeleccionado = email;
  }

  async aceptarUsuario() {
    // Referencia a la colección
    const col = collection(this.firestore, 'usuarios');

    // Crear una consulta para buscar al usuario por email
    const filteredQuery = query(
      col,
      where('email', '==', this.objetoSeleccionado) // Suponiendo que 'objetoSeleccionado' es el email
    );

    // Obtener los documentos que coinciden con la consulta
    const querySnapshot = await getDocs(filteredQuery);

    if (!querySnapshot.empty) {
      this.isLoading = true;

      // Si se encuentra el usuario
      const userDoc = querySnapshot.docs[0]; // Obtiene el primer documento encontrado

      // Actualizar el campo 'aceptado' a true
      await updateDoc(doc(col, userDoc.id), { aceptado: true });
      this.alert.mostrarSuccess('Usuario aceptado correctamente.');

      this.isLoading = false;
    }
    else {
      this.alert.mostrarError('No se ha podido aceptar al usuario')
    }
  }
}
