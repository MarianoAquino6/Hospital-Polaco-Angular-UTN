import { Component } from '@angular/core';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AlertService } from '../../servicios/alert.service';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseError } from '@angular/fire/app';
import { Rol } from '../../enums/enums';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  usernameLogin: string = "";
  passLogin: string = "";

  usuarioLogeado: string = "";
  mensajeError: string = "";
  rolUsuario!: Rol;
  isLoading = false;

  constructor(public auth: Auth, private router: Router, private firestore: Firestore, private alert: AlertService, private authService: AuthService) {

  }

  autocompletarPaciente1() {
    this.usernameLogin = "xejafes529@acroins.com";
    this.passLogin = "123456";
  }
  autocompletarPaciente2() {
    this.usernameLogin = "jebivix505@acroins.com";
    this.passLogin = "123456";
  }
  autocompletarPaciente3() {
    this.usernameLogin = "yojew10349@edectus.com";
    this.passLogin = "123456";
  }
  autocompletarMedico1() {
    this.usernameLogin = "pidek10164@aqqor.com";
    this.passLogin = "123456";
  }
  autocompletarMedico2() {
    this.usernameLogin = "telep63719@aleitar.com";
    this.passLogin = "123456";
  }
  autocompletarAdmin() {
    this.usernameLogin = "ramey54405@aqqor.com";
    this.passLogin = "123456";
  }

  async login() {
    try {
      this.isLoading = true;
      const userCredential = await signInWithEmailAndPassword(this.auth, this.usernameLogin, this.passLogin);
      const user = userCredential.user;
      this.mensajeError = "";

      if (!user.emailVerified) {
        this.alert.mostrarError('No ha verificado su cuenta');
        return;
      }

      if (await this.authService.getUserRole(user.email || "") == Rol.Medico) {
        if (!await this.authService.userWasAccepted(user.email || "")) {
          this.alert.mostrarError('Debes ser aceptado por un administrador');
          return;
        }
      }

      if (!await this.authService.usuarioEstaHabilitado(user.email || "")) {
        this.alert.mostrarError('Su usuario ha sido deshabilitado');
        return;
      }

      await this.dejarRegistroLog();

      this.alert.mostrarSuccess('Bienvenido');
      this.authService.setUsuarioLogueado(user.email || "");

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);

    } catch (e) {
      const error = e as FirebaseError;

      switch (error.code) {
        case "auth/invalid-email":
          this.mensajeError = "Email inválido";
          break;
        case "auth/invalid-credential":
          this.mensajeError = "Credenciales incorrectas";
          break;
        case "auth/network-request-failed":
          this.mensajeError = "Error de red. Intenta nuevamente.";
          break;
        default:
          this.mensajeError = "Error desconocido: " + error.message;
          break;
      }

      this.alert.mostrarError(this.mensajeError);
    }
    finally {
      this.isLoading = false;
    }
  }

  async dejarRegistroLog() {
    try {
      const logData = {
        usuario: this.usernameLogin,
        fechaYHora: new Date(),
      };

      const logsCollection = collection(this.firestore, 'logs');
      await addDoc(logsCollection, logData);
    } catch (error) {
      console.error('Error al guardar el registro de log:', error);
    }
  }
}
