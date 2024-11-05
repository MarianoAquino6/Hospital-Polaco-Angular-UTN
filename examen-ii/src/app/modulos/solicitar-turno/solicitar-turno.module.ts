import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SolicitarTurnoRoutingModule } from './solicitar-turno-routing.module';
import { SolicitarTurnoComponent } from './solicitar-turno/solicitar-turno.component';
import { HorariosDisponiblesComponent } from './horarios-disponibles/horarios-disponibles.component';
import { CalendarioComponent } from '../../componentes/calendario/calendario.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingComponent } from '../../componentes/loading/loading.component';


@NgModule({
  declarations: [SolicitarTurnoComponent, HorariosDisponiblesComponent],
  imports: [
    CommonModule,
    SolicitarTurnoRoutingModule,
    CalendarioComponent,
    ReactiveFormsModule,
    LoadingComponent
  ]
})
export class SolicitarTurnoModule { }
