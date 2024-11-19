import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsuariosRoutingModule } from './usuarios-routing.module';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { GestionAccesoComponent } from './gestion-acceso/gestion-acceso.component';
import { RegistroAdminComponent } from './registro-admin/registro-admin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TablaUsuariosComponent } from './tabla-usuarios/tabla-usuarios.component';
import { LoadingComponent } from '../../componentes/loading/loading.component';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { CardsComponent } from './cards/cards.component';


@NgModule({
  declarations: [UsuariosComponent, GestionAccesoComponent, RegistroAdminComponent, TablaUsuariosComponent, CardsComponent],
  imports: [
    CommonModule,
    UsuariosRoutingModule,
    ReactiveFormsModule,
    LoadingComponent,
    RecaptchaModule
  ]
})
export class UsuariosModule { }
