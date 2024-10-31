import { Component } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
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

  autocompletarPaciente() {
    this.usernameLogin = "pacientehosplaboiv@outlook.com";
    this.passLogin = "123456Paciente";
  }

  autocompletarMedico() {
    this.usernameLogin = "medicohosplaboivv@outlook.com";
    this.passLogin = "123456Medico";
  }

  autocompletarAdmin() {
    this.usernameLogin = "admnhosplaboiv@outlook.com";
    this.passLogin = "123456Admin";
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

      this.alert.mostrarSuccess('Bienvenido');
      this.authService.setUsuarioLogueado(user.email || "");

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);

    } catch (e) {
      // Use type assertion to specify the error type
      const error = e as FirebaseError;

      // Handle errors
      switch (error.code) {
        case "auth/invalid-email":
          this.mensajeError = "Email inválido";
          break;
        case "auth/wrong-password":
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
}
