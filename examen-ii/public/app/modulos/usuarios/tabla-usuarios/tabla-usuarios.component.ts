import { Component } from '@angular/core';
import { UsuarioStandard } from '../../../interfaces/app.interface';
import { Observable, Subscription } from 'rxjs';
import { collection, collectionData, Firestore, orderBy, query } from '@angular/fire/firestore';



@Component({
  selector: 'app-tabla-usuarios',
  templateUrl: './tabla-usuarios.component.html',
  styleUrl: './tabla-usuarios.component.css'
})
export class TablaUsuariosComponent {
  objetos!: UsuarioStandard[]; // Modificar Actor[]
  objetoSeleccionado!: string;
  sub!: Subscription;

  constructor(private firestore: Firestore) {}

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
      orderBy('rol', 'asc') // Modificar 'nombreApellido'
    );

    // Modificar <Actor[]>
    const observable: Observable<UsuarioStandard[]> = collectionData(filteredQuery, { idField: 'id' });

    // Modificar Actor[]
    this.sub = observable.subscribe((respuesta: UsuarioStandard[]) => {
      this.objetos = respuesta;
    });
  }
}