import { Component } from '@angular/core';
import { addDoc, collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, Validators, FormControl, AbstractControl } from '@angular/forms';
import { AlertService } from '../../servicios/alert.service';
import { CommonModule } from '@angular/common';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { Rol } from '../../enums/enums';
import { getAuth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, sendEmailVerification } from '@firebase/auth';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-registro-paciente',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoadingComponent],
  templateUrl: './registro-paciente.component.html',
  styleUrl: './registro-paciente.component.css'
})
export class RegistroPacienteComponent {
  formulario!: FormGroup;
  isLoading = false;

  constructor(private firestore: Firestore, private router: Router, private alert: AlertService) { }

  ngOnInit() {
    this.formulario = new FormGroup(
      {
        nombre: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]),
        apellido: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]),
        edad: new FormControl('', [Validators.required, Validators.min(5), Validators.max(120)]),
        documento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(7), Validators.maxLength(8)]),
        obraSocial: new FormControl('', Validators.required),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6)
        ]),
        imagen1: new FormControl('', Validators.required),
        imagen2: new FormControl('', Validators.required)
      }
    );
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

  async uploadImages(): Promise<string[]> {
    const storage = getStorage();
    const imageUrls: string[] = [];

    for (let i = 1; i <= 2; i++) {
      const imageControl = this.formulario.get(`imagen${i}`);
      const file = imageControl?.value;

      if (file) {
        const storageRef = ref(storage, `imagenes/pacientes/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
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
        obraSocial: this.formulario.get('obraSocial')?.value,
        email: this.formulario.get('email')?.value,
        imagen1: urls[0],
        imagen2: urls[1],
        rol: Rol.Paciente,
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

  onImageSelected(event: Event, imageField: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Verificar que sea una imagen
      if (file.type.startsWith('image/')) {
        this.formulario.get(imageField)?.setValue(file); // Almacena el archivo en el FormControl
      } else {
        this.alert.mostrarError('El archivo debe ser una imagen.');
        input.value = ''; // Resetea el input
      }
    }
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

  get obraSocial() {
    return this.formulario.get('obraSocial');
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

  get imagen2() {
    return this.formulario.get('imagen2');
  }
}