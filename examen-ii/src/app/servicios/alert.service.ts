import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

    // Método para mostrar un mensaje de éxito
    mostrarSuccess(mensaje: string) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: "Exito",
        text: mensaje,
        showConfirmButton: false,
        timer: 2000,
        background: '#333',
        color: '#fff',
        iconColor: '#28a745',
        customClass: {
          popup: 'colored-toast'
        }
      });
    }
  
    // Método para mostrar un mensaje de error
    mostrarError(mensaje: string) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: "Error",
        text: mensaje,
        showConfirmButton: false,
        timer: 3000,
        background: '#333',
        color: '#fff',
        iconColor: '#ff5f6d',
        customClass: {
          popup: 'colored-toast'
        }
      });
    }
}
