import { createUserWithEmailAndPassword } from '@firebase/auth';
import { Component } from '@angular/core';
import { addDoc, collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { FormControl, FormGroup, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../servicios/alert.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { CommonModule } from '@angular/common';
import { Rol } from '../../enums/enums';
import { getAuth, sendEmailVerification } from '@angular/fire/auth';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-registro-medico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingComponent],
  templateUrl: './registro-medico.component.html',
  styleUrl: './registro-medico.component.css'
})
export class RegistroMedicoComponent {
  formulario!: FormGroup;
  isLoading = false;
  especialidades: string[] = ['Cardiología', 'Dermatología', 'Pediatría', 'Neurología'];
  especialidadSeleccionada: string[] = [];

  constructor(private firestore: Firestore, private router: Router, private alert: AlertService) { }

  ngOnInit() {
    this.formulario = new FormGroup(
      {
        nombre: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]),
        apellido: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]),
        edad: new FormControl('', [Validators.required, Validators.min(18), Validators.max(80)]),
        documento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(7), Validators.maxLength(8)]),
        especialidad: new FormControl([], Validators.required),
        otraEspecialidad: new FormControl(''),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6)
        ]),
        imagen1: new FormControl('', Validators.required)
      }
    );
    this.formulario.get('especialidad')?.setValue([]);
  }

  async onSubmit(): Promise<void> {
    if (this.formulario.valid) {
      this.isLoading = true;
      try {
        const urls = await this.uploadImages();
        await this.registrarRespuesta(urls);
      } catch (error) {
        this.alert.mostrarError('Error al subir las imágenes');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.alert.mostrarError('El formulario es inválido');
    }
  }

  onEspecialidadChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.especialidadSeleccionada = Array.from(selectElement.selectedOptions, (option) => option.value);

    // Controlar la validación del campo 'otraEspecialidad'
    if (this.especialidadSeleccionada.includes('otra')) {
      this.otraEspecialidad?.setValidators([Validators.required]);
    } else {
      this.otraEspecialidad?.clearValidators();
    }
    this.otraEspecialidad?.updateValueAndValidity();
  }

  onImageSelected(event: Event, imageField: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Verificar que sea una imagen
      if (file.type.startsWith('image/')) {
        this.formulario.get(imageField)?.setValue(file);
      } else {
        this.alert.mostrarError('El archivo debe ser una imagen.');
        input.value = ''; // Resetea el input
      }
    }
  }

  async uploadImages(): Promise<string[]> {
    const storage = getStorage();
    const imageUrls: string[] = [];

    const file = this.formulario.get('imagen1')?.value;
    if (file) {
      const storageRef = ref(storage, 'imagenes/medicos/${file.name}');
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      imageUrls.push(url);
    }

    return imageUrls;
  }

  async registrarRespuesta(urls: string[]) {
    try {
      const especialidades = [...this.especialidadSeleccionada];
      if (especialidades.includes('otra') && this.otraEspecialidad?.value) {
        especialidades.push(this.otraEspecialidad.value);
      }

      const email = this.formulario.get('email')?.value;
      const existingUser = await this.checkUserExists(email);
      
      if (existingUser) {
        this.alert.mostrarError('Ya existe un usuario con este correo electrónico.');
        return;
      }

      const col = collection(this.firestore, 'usuarios');
      const obj = {
        nombre: this.formulario.get('nombre')?.value,
        apellido: this.formulario.get('apellido')?.value,
        edad: this.formulario.get('edad')?.value,
        documento: this.formulario.get('documento')?.value,
        especialidad: especialidades.filter((esp) => esp !== 'otra'),
        email: email,
        imagen1: urls[0],
        rol: Rol.Medico,
        aceptado: false,
        fechaCreacion: new Date()
      };

      await addDoc(col, obj);
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, this.formulario.get('password')?.value);
      await sendEmailVerification(userCredential.user);

      this.alert.mostrarSuccess('Se ha enviado el mail de verificación!');

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
      this.alert.mostrarError(errorMessage);
    }
  }

  private async checkUserExists(email: string): Promise<boolean> {
    const col = collection(this.firestore, 'usuarios');
    const querySnapshot = await getDocs(query(col, where('email', '==', email)));
    return !querySnapshot.empty;
  }

  // Modificar getters y setters
  get nombre() {
    return this.formulario.get('nombre');
  }

  get apellido() {
    return this.formulario.get('apellido');
  }

  get edad() {
    return this.formulario.get('edad');
  }

  get documento() {
    return this.formulario.get('documento');
  }

  get especialidad() {
    return this.formulario.get('especialidad');
  }

  get otraEspecialidad() {
    return this.formulario.get('otraEspecialidad');
  }

  get email() {
    return this.formulario.get('email');
  }

  get password() {
    return this.formulario.get('password');
  }

  get imagen1() {
    return this.formulario.get('imagen1');
  }
}