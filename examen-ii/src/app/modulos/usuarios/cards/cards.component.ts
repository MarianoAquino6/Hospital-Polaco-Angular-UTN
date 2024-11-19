import { Rol } from './../../../enums/enums';
import { Component, Input } from '@angular/core';
import { Paciente } from '../../../interfaces/app.interface';
import { collection, getDocs, query, where } from '@firebase/firestore';
import { Firestore } from '@angular/fire/firestore';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css'
})
export class CardsComponent {
  pacientes!: Paciente[];

  constructor(private firestore: Firestore) { }

  async ngOnInit() {
    this.fetchPacientes();
  }

  async fetchPacientes() {
    const usuariosRef = collection(this.firestore, 'usuarios');

    const q = query(usuariosRef, where('rol', '==', Rol.Paciente));

    const querySnapshot = await getDocs(q);

    this.pacientes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data['email'],
        nombre: data['nombre'] || '',
        apellido: data['apellido'] || '',
        documento: data['documento'] || '',
        edad: data['edad'] || 0,
        habilitado: data['habilitado'] || false,
        especialidades: data['especialidades'] || [],
        aceptado: data['aceptado'] || false,
        obraSocial: data['obraSocial'] || '',
        imagen1: data['imagen1'] || '',
      };
    });
  }

  async descargarExcel(emailPaciente: string) {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('paciente', '==', emailPaciente));  
    const querySnapshot = await getDocs(q);  

    const turnos: any[] = [];

    for (const doc of querySnapshot.docs) {
      const turnoData = doc.data();
      const medicoEmail = turnoData['medico'];  

      const medicoData = await this.getMedicoData(medicoEmail);

      turnos.push({
        especialidad: turnoData['especialidad'] || 'No especificada',
        fecha: turnoData['fecha'] || 'No disponible',
        horario: turnoData['horario'] || 'No disponible',
        estado: turnoData['estado'] || 'No disponible',
        medico: `${medicoData.nombre} ${medicoData.apellido}`, 
      });
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(turnos, {
      header: ['especialidad', 'fecha', 'horario', 'estado', 'medico'],
    });

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos del Paciente');
    XLSX.writeFile(wb, `${emailPaciente}_turnos.xlsx`);
  }

  async getMedicoData(email: string) {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));  
    const querySnapshot = await getDocs(q);  

    if (!querySnapshot.empty) {
      const medicoData = querySnapshot.docs[0].data();
      return {
        nombre: medicoData['nombre'] || 'No disponible',
        apellido: medicoData['apellido'] || 'No disponible',
      };
    } else {
      return {
        nombre: 'No disponible',
        apellido: 'No disponible',
      };
    }
  }
}