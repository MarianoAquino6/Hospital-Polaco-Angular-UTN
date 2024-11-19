import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { Turno } from '../interfaces/app.interface';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

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

  mostrarDialogoMotivo(): Promise<string | null> {
    return Swal.fire({
      title: 'Cancelar Turno',
      input: 'text',
      inputLabel: 'Ingrese el motivo de la cancelación:',
      inputPlaceholder: 'Motivo de cancelación',
      showCancelButton: true,
      confirmButtonText: 'Cancelar Turno',
      cancelButtonText: 'Cancelar',
      background: '#333',
      color: '#fff',
      icon: 'warning',
      iconColor: '#FF0000',
      customClass: {
        popup: 'colored-toast',
        confirmButton: 'confirm-button',
        cancelButton: 'cancel-button'
      },
      inputAttributes: {
        style: 'color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px;'
      }
    }).then(result => {
      if (result.isConfirmed) {
        return result.value || null;
      }
      return null;
    });
  }

  mostrarDialogoMotivoRechazo(): Promise<string | null> {
    return Swal.fire({
      title: 'Rechazar Turno',
      input: 'text',
      inputLabel: 'Ingrese el motivo del rechazo:',
      inputPlaceholder: 'Motivo del rechazo',
      showCancelButton: true,
      confirmButtonText: 'Rechazar Turno',
      cancelButtonText: 'Cancelar',
      background: '#333',
      color: '#fff',
      icon: 'warning',
      iconColor: '#FF0000',
      customClass: {
        popup: 'colored-toast',
        confirmButton: 'confirm-button',
        cancelButton: 'cancel-button'
      },
      inputAttributes: {
        style: 'color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px;'
      }
    }).then(result => {
      if (result.isConfirmed) {
        return result.value || null;
      }
      return null;
    });
  }

  mostrarDialogoCalificacion(): Promise<string | null> {
    return Swal.fire({
      title: 'Calificar Turno',
      input: 'text',
      inputLabel: 'Ingrese un comentario sobre el turno',
      inputPlaceholder: 'Calificar el turno',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      background: '#333',
      color: '#fff',
      icon: 'info',
      iconColor: '#FF0000',
      customClass: {
        popup: 'colored-toast',
        confirmButton: 'confirm-button',
        cancelButton: 'cancel-button'
      },
      inputAttributes: {
        style: 'color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px;'
      }
    }).then(result => {
      if (result.isConfirmed) {
        return result.value || null;
      }
      return null;
    });
  }

  leerResenia(turno: Turno) {
    return Swal.fire({
      title: 'Reseña del Turno',
      html: `
            <div style="margin-bottom: 10px;">
                <label style="color: #FF0000">Reseña:</label><br>
                <span style="color: #fff;">${turno.resenia?.resenia}</span>
            </div>
            <div>
                <label style="color: #FF0000">Diagnóstico:</label><br>
                <span style="color: #fff;">${turno.resenia?.diagnostico}</span>
            </div>
        `,
      icon: 'info',
      iconColor: '#FF0000',
      background: '#333',
      color: '#fff',
      confirmButtonText: 'Cerrar',
      customClass: {
        popup: 'colored-toast',
        confirmButton: 'confirm-button'
      }
    });
  }

  async mostrarFormularioEncuesta(): Promise<{ recomendacion: string, instalaciones: number, consejo: string } | null> {
    return Swal.fire({
      title: 'Completar Encuesta',
      html: `
            <form id="form-encuesta">
                <label for="recomendacion" style="color: #FF0000; display: block; margin-bottom: 5px; margin-top: 20px;">¿Recomendarías el hospital a tus conocidos?</label>
                <select id="recomendacion" class="swal2-input" style="color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px; width: calc(100% - 22px); box-sizing: border-box;">
                    <option value="" disabled selected>Selecciona una opción</option>
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                </select>

                <label for="instalaciones" style="color: #FF0000; display: block; margin-top: 20px;">Del 1 al 10, ¿qué te parecieron nuestras instalaciones?</label>
                <input id="instalaciones" type="number" class="swal2-input" min="1" max="10" placeholder="1-10" style="color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px; width: 80px; box-sizing: border-box;">

                <label for="consejo" style="color: #FF0000; display: block; margin-top: 20px;">Deja un consejo de mejora:</label>
                <textarea id="consejo" class="swal2-input" placeholder="Escribe tu consejo" style="color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px; width: calc(100% - 22px); height: 100px; box-sizing: border-box;"></textarea>
            </form>
        `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      background: '#333',
      color: '#fff',
      icon: 'question',
      iconColor: '#FF0000',
      customClass: {
        popup: 'colored-toast',
        confirmButton: 'confirm-button',
        cancelButton: 'cancel-button',
      },
      preConfirm: () => {
        const recomendacion = (document.getElementById('recomendacion') as HTMLSelectElement).value;
        const instalaciones = parseInt((document.getElementById('instalaciones') as HTMLInputElement).value, 10);
        const consejo = (document.getElementById('consejo') as HTMLTextAreaElement).value;

        if (!recomendacion) {
          Swal.showValidationMessage('Por favor, selecciona si recomendarías el hospital.');
          return null;
        }
        if (!instalaciones || instalaciones < 1 || instalaciones > 10) {
          Swal.showValidationMessage('Por favor, ingresa una calificación de 1 a 10 para las instalaciones.');
          return null;
        }
        if (!consejo) {
          Swal.showValidationMessage('Por favor, deja un consejo de mejora.');
          return null;
        }

        return { recomendacion, instalaciones, consejo };
      }
    }).then(result => {
      if (result.isConfirmed) {
        return result.value || null;
      }
      return null;
    });
  }

  async mostrarFormularioReseña(): Promise<{ resenia: string, diagnostico: string } | null> {
    return Swal.fire({
      title: 'Completar Reseña',
      html: `
            <form id="form-encuesta" style="text-align: left; margin-top: 20px;">
                <div style="margin-bottom: 15px;">
                    <label for="resenia" style="color: #FF0000; display: block; margin-bottom: 5px;">Reseña:</label>
                    <textarea id="resenia" class="swal2-input" placeholder="Escribe tu reseña" style="color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px; width: 100%; resize: none; height: 100px;"></textarea>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="diagnostico" style="color: #FF0000; display: block; margin-bottom: 5px;">Diagnóstico:</label>
                    <input id="diagnostico" type="text" class="swal2-input" placeholder="Escribe el diagnóstico" style="color: #fff; background-color: #444; border: 1px solid #555; padding: 10px; border-radius: 4px; width: 80%; ">
                </div>
            </form>
        `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      background: '#333',
      color: '#fff',
      icon: 'question',
      iconColor: '#FF0000',
      customClass: {
        popup: 'colored-toast',
        confirmButton: 'confirm-button',
        cancelButton: 'cancel-button'
      },
      preConfirm: () => {
        const resenia = (document.getElementById('resenia') as HTMLTextAreaElement).value;
        const diagnostico = (document.getElementById('diagnostico') as HTMLInputElement).value;

        if (!resenia) {
          Swal.showValidationMessage('Por favor, deja una reseña');
          return null;
        }
        if (!diagnostico) {
          Swal.showValidationMessage('Por favor, deja un diagnóstico');
          return null;
        }

        return { resenia, diagnostico };
      }
    }).then(result => {
      if (result.isConfirmed) {
        return result.value || null;
      }
      return null;
    });
  }

  mostrarFiltroEspecialistaDialogo(): Promise<boolean> {
    return Swal.fire({
      title: '¿Deseas aplicar un filtro según especialista?',
      showDenyButton: true,
      confirmButtonText: 'Sí',
      denyButtonText: 'No',
      background: '#333',
      color: '#fff',
      icon: 'question',
      iconColor: '#FF0000'
    }).then((result) => {
      if (result.isConfirmed) {
        return true;
      } else {
        return false;
      }
    });
  }
}
