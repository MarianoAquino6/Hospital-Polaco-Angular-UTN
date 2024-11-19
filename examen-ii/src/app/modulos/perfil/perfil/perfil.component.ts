import { jsPDF } from 'jspdf';
import { Component } from '@angular/core';
import { Admin, Medico, Paciente, Turno } from '../../../interfaces/app.interface';
import { AuthService } from '../../../servicios/auth.service';
import { Rol } from '../../../enums/enums';
import { collection, Firestore, getDocs, orderBy, query, where } from '@angular/fire/firestore';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { AlertService } from '../../../servicios/alert.service';

interface MedicoDetails {
  nombre: string;
  apellido: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {
  usuarioLogueadoEntidad: Medico | Paciente | Admin | null = null;
  emailUsuarioLogueado: string | null = null;
  isLoading = false;
  tieneHistoriaClinica: boolean = false;
  esPaciente: boolean = false;
  filtroEspecialistaON: boolean = false;
  medicos: Medico[] = [];
  mailEspecialistaSeleccionado: string | null = null;

  constructor(private authService: AuthService, private firestore: Firestore, private alert: AlertService) { }

  async ngOnInit(): Promise<void> {
    this.authService.usuarioLogueado$.subscribe(async (usuario) => {
      this.emailUsuarioLogueado = usuario;

      if (this.emailUsuarioLogueado) {
        this.usuarioLogueadoEntidad = await this.authService.getUserEntity(this.emailUsuarioLogueado);
      }

      if (this.usuarioLogueadoEntidad?.rol == Rol.Paciente) {
        this.verificarHistoriaClinica();
      }
    });
  }

  async verificarHistoriaClinica() {
    this.isLoading = true;

    if (this.usuarioLogueadoEntidad?.rol === Rol.Paciente) {
      try {
        const historiasClinicasRef = collection(this.firestore, 'turnos');
        const q = query(historiasClinicasRef, where('paciente', '==', this.usuarioLogueadoEntidad.email));

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          let historiaEncontrada = false;
          const medicosSet = new Set<string>();

          querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data['historiaClinica']) {
              if (Object.keys(data['historiaClinica']).length > 0) {
                historiaEncontrada = true;
                this.authService.setPacienteHistoriaClinica(this.usuarioLogueadoEntidad!.email, false)
              }
            }
            const medicoEmail = data['medico'];
            medicosSet.add(medicoEmail);
          });

          if (medicosSet.size > 0) {
            for (let email of medicosSet) {
              const medicoData = await this.getMedicoDetails(email);
              if (medicoData) {
                this.medicos.push(medicoData);
              }
            }
          }

          this.tieneHistoriaClinica = historiaEncontrada;
        } else {
          this.tieneHistoriaClinica = false;
        }
      } catch (error) {
        console.error('Error al verificar la historia clínica:', error);
      }
    } else {
      console.log('El usuario no es un paciente, rol actual:', this.usuarioLogueadoEntidad?.rol);
    }

    this.isLoading = false;
  }

  async getMedicoDetails(email: string): Promise<Medico | null> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const medicoDoc = querySnapshot.docs[0];
      return medicoDoc.data() as Medico;
    }
    return null;
  }

  async dispararSweetAlert() {
    const result = await this.alert.mostrarFiltroEspecialistaDialogo();

    if (result) {
      this.filtroEspecialistaON = true;
    } else {
      this.filtroEspecialistaON = false;
      this.downloadHistoriaClinicaPDFGeneral();
    }
  }

  async downloadHistoriaClinicaPDFGeneral() {
    if (this.usuarioLogueadoEntidad?.rol === Rol.Paciente) {
      const doc = new jsPDF();

      // Encabezado
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20);
      doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20);

      // Título del documento
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 0, 0);
      doc.setFontSize(22);
      doc.text("HISTORIA CLÍNICA", 105, 50, { align: "center" });
      doc.setFontSize(18);
      doc.text(`${this.usuarioLogueadoEntidad?.nombre} ${this.usuarioLogueadoEntidad?.apellido}`, 105, 60, { align: "center" });

      const fechaCreacion = new Date();
      const fechaFormateada = `${fechaCreacion.getDate()}/${fechaCreacion.getMonth() + 1}/${fechaCreacion.getFullYear()}`;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      let yPosition = 80;

      // Consulta para obtener los turnos con historia clínica
      const historiasClinicasRef = collection(this.firestore, 'turnos');
      const q = query(
        historiasClinicasRef,
        where('paciente', '==', this.usuarioLogueadoEntidad.email)
      );

      try {
        const querySnapshot = await getDocs(q);

        // Procesar cada turno
        querySnapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          const historiaClinica = data['historiaClinica'];

          // Filtrar solo los turnos con historia clínica
          if (historiaClinica && Object.keys(historiaClinica).length > 0) {
            const fechaTurno = historiaClinica.fechaCreacion;
            const fechaTurnoFormateada = fechaTurno && fechaTurno.toDate
              ? `${fechaTurno.toDate().getDate()}/${fechaTurno.toDate().getMonth() + 1}/${fechaTurno.toDate().getFullYear()}`
              : 'Fecha no disponible';

            // Agregar fecha del turno
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`FECHA DEL TURNO: ${fechaTurnoFormateada} | ${data['especialidad']}`, 20, yPosition);
            yPosition += 10;

            // Agregar datos en formato "Clave: valor" con colores diferenciados
            Object.entries(historiaClinica).forEach(([key, value]: [string, any]) => {
              if (key !== 'datosDinamicos' && key !== 'fechaCreacion') {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);

                let valueWithUnit = `${value}`;
                switch (key) {
                  case 'altura':
                    valueWithUnit = `${value} cm`;
                    break;
                  case 'peso':
                    valueWithUnit = `${value} kg`;
                    break;
                  case 'temperatura':
                    valueWithUnit = `${value} °C`;
                    break;
                  case 'presion':
                    valueWithUnit = `${value} mmHg`;
                    break;
                  default:
                    break;
                }

                // Clave en rojo
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(139, 0, 0);
                doc.text(`- ${formattedKey}:`, 20, yPosition);

                // Calcular el espacio para el valor y evitar superposición
                const keyWidth = doc.getTextWidth(`- ${formattedKey}:`);
                const valuePosX = 20 + keyWidth + 2;  // Espacio para el valor

                // Verificar si el valor cabe en la línea
                const pageWidth = doc.internal.pageSize.width - 20;
                if (valuePosX > pageWidth) {
                  // Si no cabe, saltamos a la siguiente línea
                  yPosition += 7;
                  doc.text(`${valueWithUnit}`, 20, yPosition);
                } else {
                  // Si cabe, colocamos el valor en la misma línea
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(0, 0, 0);
                  doc.text(`${valueWithUnit}`, valuePosX, yPosition);
                }

                yPosition += 7; // Incrementar para la siguiente línea
              }
            });

            // Agregar datos dinámicos
            if (historiaClinica.datosDinamicos) {
              historiaClinica.datosDinamicos.forEach((item: any) => {
                const formattedKey = item.clave.charAt(0).toUpperCase() + item.clave.slice(1);

                // Clave en rojo
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(139, 0, 0);
                doc.text(`- ${formattedKey}:`, 20, yPosition);

                // Calcular el espacio para el valor y evitar superposición
                const keyWidth = doc.getTextWidth(`- ${formattedKey}:`);
                const valuePosX = 20 + keyWidth + 2;  // Espacio para el valor

                // Verificar si el valor cabe en la línea
                const pageWidth = doc.internal.pageSize.width - 20;
                if (valuePosX > pageWidth) {
                  // Si no cabe, saltamos a la siguiente línea
                  yPosition += 7;
                  doc.text(`${item.valor}`, 20, yPosition);
                } else {
                  // Si cabe, colocamos el valor en la misma línea
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(0, 0, 0);
                  doc.text(`${item.valor}`, valuePosX, yPosition);
                }

                yPosition += 7; // Incrementar para la siguiente línea
              });
            }

            yPosition += 10;
          }
        });

        // Pie de página
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Fecha de generación del PDF: ${fechaFormateada}`, 20, 290);

        // Descargar PDF
        doc.save('historia_clinica.pdf');
      } catch (error) {
        console.error("Error al obtener la historia clínica: ", error);
      }
    } else {
      console.error('El paciente no tiene historia clínica o no es un paciente.');
    }
  }

  async downloadHistoriaClinicaPDFFiltrada() {
    if (this.usuarioLogueadoEntidad?.rol === Rol.Paciente) {
      const doc = new jsPDF();
      let nombreMedico = ''; // Declaramos la variable fuera del bloque

      // Verificamos que mailEspecialistaSeleccionado no sea null antes de pasarlo a getMedicoDetails
      if (this.mailEspecialistaSeleccionado) {
        const medico = await this.getMedicoDetails(this.mailEspecialistaSeleccionado);

        if (medico) {
          nombreMedico = `${medico.nombre} ${medico.apellido}`;  // Asignamos el nombre y apellido del médico
        } else {
          console.error('Médico no encontrado');
          // Aquí puedes manejar el caso donde no se encuentra el médico
        }
      } else {
        console.error('No se ha seleccionado un especialista');
        // Manejo si mailEspecialistaSeleccionado es null
      }

      // Encabezado
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20);
      doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20);

      // Título del documento
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 0, 0);
      doc.setFontSize(22);
      doc.text("HISTORIA CLÍNICA", 105, 50, { align: "center" });
      doc.setFontSize(18);
      doc.text(`${this.usuarioLogueadoEntidad?.nombre} ${this.usuarioLogueadoEntidad?.apellido}`, 105, 60, { align: "center" });
      doc.text(`Médico: ${nombreMedico}`, 105, 70, { align: "center" });  // Mostrar nombre del médico

      const fechaCreacion = new Date();
      const fechaFormateada = `${fechaCreacion.getDate()}/${fechaCreacion.getMonth() + 1}/${fechaCreacion.getFullYear()}`;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      let yPosition = 100;

      // Consulta para obtener los turnos con historia clínica
      const historiasClinicasRef = collection(this.firestore, 'turnos');
      const q = query(
        historiasClinicasRef,
        where('paciente', '==', this.usuarioLogueadoEntidad.email),
        where('medico', '==', this.mailEspecialistaSeleccionado)
      );

      try {
        const querySnapshot = await getDocs(q);

        // Procesar cada turno
        querySnapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          const historiaClinica = data['historiaClinica'];

          // Filtrar solo los turnos con historia clínica
          if (historiaClinica && Object.keys(historiaClinica).length > 0) {
            const fechaTurno = historiaClinica.fechaCreacion;
            const fechaTurnoFormateada = fechaTurno && fechaTurno.toDate
              ? `${fechaTurno.toDate().getDate()}/${fechaTurno.toDate().getMonth() + 1}/${fechaTurno.toDate().getFullYear()}`
              : 'Fecha no disponible';

            // Agregar fecha del turno
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`FECHA DEL TURNO: ${fechaTurnoFormateada} | ${data['especialidad']}`, 20, yPosition);
            yPosition += 10;

            // Agregar datos en formato "Clave: valor" con colores diferenciados
            Object.entries(historiaClinica).forEach(([key, value]: [string, any]) => {
              if (key !== 'datosDinamicos' && key !== 'fechaCreacion') {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);

                let valueWithUnit = `${value}`;
                switch (key) {
                  case 'altura':
                    valueWithUnit = `${value} cm`;
                    break;
                  case 'peso':
                    valueWithUnit = `${value} kg`;
                    break;
                  case 'temperatura':
                    valueWithUnit = `${value} °C`;
                    break;
                  case 'presion':
                    valueWithUnit = `${value} mmHg`;
                    break;
                  default:
                    break;
                }

                // Clave en rojo
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(139, 0, 0);
                doc.text(`- ${formattedKey}:`, 20, yPosition);

                // Calcular el espacio para el valor y evitar superposición
                const keyWidth = doc.getTextWidth(`- ${formattedKey}:`);
                const valuePosX = 20 + keyWidth + 2;  // Espacio para el valor

                // Verificar si el valor cabe en la línea
                const pageWidth = doc.internal.pageSize.width - 20;
                if (valuePosX > pageWidth) {
                  // Si no cabe, saltamos a la siguiente línea
                  yPosition += 7;
                  doc.text(`${valueWithUnit}`, 20, yPosition);
                } else {
                  // Si cabe, colocamos el valor en la misma línea
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(0, 0, 0);
                  doc.text(`${valueWithUnit}`, valuePosX, yPosition);
                }

                yPosition += 7; // Incrementar para la siguiente línea
              }
            });

            // Agregar datos dinámicos
            if (historiaClinica.datosDinamicos) {
              historiaClinica.datosDinamicos.forEach((item: any) => {
                const formattedKey = item.clave.charAt(0).toUpperCase() + item.clave.slice(1);

                // Clave en rojo
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(139, 0, 0);
                doc.text(`- ${formattedKey}:`, 20, yPosition);

                // Calcular el espacio para el valor y evitar superposición
                const keyWidth = doc.getTextWidth(`- ${formattedKey}:`);
                const valuePosX = 20 + keyWidth + 2;  // Espacio para el valor

                // Verificar si el valor cabe en la línea
                const pageWidth = doc.internal.pageSize.width - 20;
                if (valuePosX > pageWidth) {
                  // Si no cabe, saltamos a la siguiente línea
                  yPosition += 7;
                  doc.text(`${item.valor}`, 20, yPosition);
                } else {
                  // Si cabe, colocamos el valor en la misma línea
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(0, 0, 0);
                  doc.text(`${item.valor}`, valuePosX, yPosition);
                }

                yPosition += 7; // Incrementar para la siguiente línea
              });
            }

            yPosition += 10;
          }
        });

        // Pie de página
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Fecha de generación del PDF: ${fechaFormateada}`, 20, 290);

        // Descargar PDF
        doc.save('historia_clinica.pdf');
      } catch (error) {
        console.error("Error al obtener la historia clínica: ", error);
      }
    } else {
      console.error('El paciente no tiene historia clínica o no es un paciente.');
    }
  }

  getImagenPerfil(): string {
    return this.usuarioLogueadoEntidad?.imagen1 || '';
  }

  seleccionarEspecialista(email: string) {
    this.mailEspecialistaSeleccionado = email;
    console.log("especialista seleccionado: " + email)
  }

  isMedico(usuario: any): usuario is Medico {
    return usuario && (usuario as Medico).especialidades !== undefined;
  }

  isPaciente(usuario: any): usuario is Paciente {
    return usuario && (usuario as Paciente).obraSocial !== undefined;
  }

  isAdmin(usuario: any): usuario is Admin {
    return usuario && (usuario as Admin).rol === 'Admin';
  }
}