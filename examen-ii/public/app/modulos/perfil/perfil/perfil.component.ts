import { jsPDF } from 'jspdf';
import { Component } from '@angular/core';
import { Admin, Medico, Paciente, Turno } from '../../../interfaces/app.interface';
import { AuthService } from '../../../servicios/auth.service';
import { Rol } from '../../../enums/enums';
import { collection, Firestore, getDocs, orderBy, query, where } from '@angular/fire/firestore';

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

  constructor(private authService: AuthService, private firestore: Firestore) { }

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

          querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data['historiaClinica']) {
              if (Object.keys(data['historiaClinica']).length > 0) {
                historiaEncontrada = true;
                this.authService.setPacienteHistoriaClinica(this.usuarioLogueadoEntidad!.email, false)
              }
            }
          });

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

  async downloadHistoriaClinicaPDF() {
    if (this.usuarioLogueadoEntidad?.rol === Rol.Paciente && this.tieneHistoriaClinica) {
      const doc = new jsPDF();

      doc.setFillColor(0, 0, 0); 
      doc.rect(0, 0, 210, 30, 'F'); 
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(16);
      doc.text("HOSPITAL POLACO DE BUENOS AIRES", 20, 20); 
      doc.addImage('assets/img/logo-hover.png', 'PNG', 160, 5, 40, 20); 

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 0, 0); 
      doc.setFontSize(22);
      doc.text("HISTORIA CLINICA", 105, 50, { align: "center" });
      doc.setFontSize(18);
      doc.text(`${this.usuarioLogueadoEntidad?.nombre} ${this.usuarioLogueadoEntidad?.apellido}`, 105, 60, { align: "center" });

      const fechaCreacion = new Date();
      const fechaFormateada = `${fechaCreacion.getDate()}/${fechaCreacion.getMonth() + 1}/${fechaCreacion.getFullYear()}`;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      let yPosition = 80;

      const historiasClinicasRef = collection(this.firestore, 'turnos');
      const q = query(historiasClinicasRef,
        where('paciente', '==', this.usuarioLogueadoEntidad.email)
      );

      try {
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();  
          const fechaTurno = data['historiaClinica']?.fechaCreacion;

          const fechaTurnoFormateada = fechaTurno && fechaTurno.toDate ?
            `${fechaTurno.toDate().getDate()}/${fechaTurno.toDate().getMonth() + 1}/${fechaTurno.toDate().getFullYear()}` :
            'Fecha no disponible';

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0); 
          doc.text(`FECHA DEL TURNO: ${fechaTurnoFormateada}`, 20, yPosition);
          yPosition += 10;

          const historiaClinica = data['historiaClinica'];

          if (historiaClinica) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(139, 0, 0); 

            Object.entries(historiaClinica).forEach(([key, value]: [string, any]) => {
              if (key !== 'datosDinamicos' && key !== 'fechaCreacion') {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(139, 0, 0); 
                doc.text(`- ${formattedKey}:`, 20, yPosition); 
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0); 

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

                doc.text(`${valueWithUnit}`, 60, yPosition); 
                yPosition += 5; 
              }
            });

            if (historiaClinica.datosDinamicos) {
              historiaClinica.datosDinamicos.forEach((item: any) => {
                const formattedKey = item.clave.charAt(0).toUpperCase() + item.clave.slice(1);

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(139, 0, 0); 
                doc.text(`- ${formattedKey}:`, 20, yPosition); 
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0); 
                doc.text(`${item.valor}`, 60, yPosition); 
                yPosition += 5; 
              });
            }

            yPosition += 10;
          }
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); 
        doc.text(`Fecha de generación del PDF: ${fechaFormateada}`, 20, 290);

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