import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroRoutingModule } from './registro-routing.module';
import { LoadingComponent } from '../../componentes/loading/loading.component';
import { MedicosComponent } from './medicos/medicos.component';
import { PacientesComponent } from './pacientes/pacientes.component';
import { RegistroComponent } from './registro/registro.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RecaptchaModule } from 'ng-recaptcha-2';

@NgModule({
  declarations: [MedicosComponent, PacientesComponent, RegistroComponent],
  imports: [
    CommonModule,
    RegistroRoutingModule,
    LoadingComponent,
    ReactiveFormsModule,
    RecaptchaModule
  ]
})
export class RegistroModule { }
