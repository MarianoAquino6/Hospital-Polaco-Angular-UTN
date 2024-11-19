import * as XLSX from 'xlsx';
import { Component, EventEmitter, Output } from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent {
  usuarios: any[] = [];

  constructor(private firestore: Firestore) { }

  ngOnInit() {
    this.fetchUsuarios();
  }

  async fetchUsuarios() {
    const usuariosRef = collection(this.firestore, 'usuarios');  
    const querySnapshot = await getDocs(usuariosRef);  
    this.usuarios = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()  
      };
    });
  }

  exportToExcel() {
    const usuariosExport = this.usuarios.map(usuario => {
      return {
        rol: usuario.rol || '',  
        email: usuario.email || '',
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        documento: usuario.documento || '',
        edad: usuario.edad || '',
        habilitado: usuario.habilitado || '',
        especialidades: usuario.especialidades ? usuario.especialidades.join(', ') : '',  
        aceptado: usuario.aceptado || '',
        obraSocial: usuario.obraSocial || ''
      };
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(usuariosExport, {
      header: ['rol', 'email', 'nombre', 'apellido', 'documento', 'edad', 'habilitado', 'especialidades', 'aceptado', 'obraSocial']
    });

    const wb: XLSX.WorkBook = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios'); 
    XLSX.writeFile(wb, 'usuarios.xlsx'); 
  }
}