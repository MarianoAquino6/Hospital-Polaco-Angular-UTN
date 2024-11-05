import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerfilRoutingModule } from './perfil-routing.module';
import { PerfilComponent } from './perfil/perfil.component';
import { LoadingComponent } from '../../componentes/loading/loading.component';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { DisponibilidadComponent } from './disponibilidad/disponibilidad.component';
import { CalendarioComponent } from '../../componentes/calendario/calendario.component';
import { HistoriaClinicaComponent } from '../../componentes/historia-clinica/historia-clinica.component';


@NgModule({
  declarations: [PerfilComponent, DisponibilidadComponent],
  imports: [
    CommonModule,
    PerfilRoutingModule,
    LoadingComponent,
    FormsModule,
    ReactiveFormsModule,
    CalendarioComponent,
    HistoriaClinicaComponent
  ]
})
export class PerfilModule { }
