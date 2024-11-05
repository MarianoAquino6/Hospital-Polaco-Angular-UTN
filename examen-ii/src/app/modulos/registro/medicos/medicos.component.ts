import { Component } from '@angular/core';
import { addDoc, collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../../servicios/alert.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { Rol } from '../../../enums/enums';
import { getAuth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, sendEmailVerification } from '@firebase/auth';

@Component({
  selector: 'app-medicos',
  templateUrl: './medicos.component.html',
  styleUrl: './medicos.component.css'
})
export class MedicosComponent {
  formulario!: FormGroup;
  isLoading = false;
  especialidades: string[] = ['Cardiología', 'Dermatología', 'Pediatría', 'Neurología'];
  especialidadesSeleccionadas: string[] = [];
  especialidadActual: string = ''; 
  captchaValido: boolean = false;

  constructor(private firestore: Firestore, private router: Router, private alert: AlertService) { }

  ngOnInit() {
    this.formulario = new FormGroup(
      {
        nombre: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]),
        apellido: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]),
        edad: new FormControl('', [Validators.required, Validators.min(18), Validators.max(80)]),
        documento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(7), Validators.maxLength(8)]),
        especialidad: new FormControl('', Validators.required),
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
    if (this.formulario.valid && this.captchaValido) {
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
    const selectedValue = selectElement.value;
    this.especialidadActual = selectedValue; 

    this.formulario.get('especialidad')?.setValue(selectedValue);

    if (selectedValue !== 'otra' && !this.especialidadesSeleccionadas.includes(selectedValue)) {
      this.especialidadesSeleccionadas.push(selectedValue);
    }

    this.formulario.get('otraEspecialidad')?.updateValueAndValidity();
  }

  agregarOtraEspecialidad() {
    const otra = this.formulario.get('otraEspecialidad')?.value;
    if (otra && !this.especialidadesSeleccionadas.includes(otra)) {
      this.especialidadesSeleccionadas.push(otra);
    }
  }

  eliminarEspecialidad(index: number) {
    this.especialidadesSeleccionadas.splice(index, 1);
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
        input.value = ''; 
      }
    }
  }

  async uploadImages(): Promise<string[]> {
    const storage = getStorage();
    const imageUrls: string[] = [];

    const file = this.formulario.get('imagen1')?.value;
    if (file) {
      const storageRef = ref(storage, `imagenes/medicos/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      imageUrls.push(url);
    }

    return imageUrls;
  }

  async registrarRespuesta(urls: string[]) {
    try {
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
        especialidades: this.especialidadesFiltradas,
        email: email,
        imagen1: urls[0],
        rol: Rol.Medico,
        aceptado: false, 
        habilitado: true, 
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

  onCaptchaResolved(captchaResponse: string | null) {
    if (captchaResponse) {
      console.log('Captcha resuelto:', captchaResponse);
      this.captchaValido = true;
    } else {
      console.log('Captcha no resuelto o inválido.');
      this.captchaValido = false;
    }
  }

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

  get especialidadesFiltradas(): string[] {
    return this.especialidadesSeleccionadas.filter(especialidad => especialidad !== 'otra');
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