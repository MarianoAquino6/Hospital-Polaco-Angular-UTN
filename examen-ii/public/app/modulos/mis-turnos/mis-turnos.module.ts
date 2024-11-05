import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MisTurnosRoutingModule } from './mis-turnos-routing.module';
import { PacienteComponent } from './paciente/paciente.component';
import { MedicoComponent } from './medico/medico.component';
import { LoadingComponent } from '../../componentes/loading/loading.component';
import { FiltroGenericoPipe } from '../../pipes/filtro-generico.pipe';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [PacienteComponent, MedicoComponent],
  imports: [
    CommonModule,
    MisTurnosRoutingModule,
    LoadingComponent,
    FiltroGenericoPipe,
    FormsModule
  ]
})
export class MisTurnosModule { }
