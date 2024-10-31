import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SolicitarTurnoRoutingModule } from './solicitar-turno-routing.module';
import { SolicitarTurnoComponent } from './solicitar-turno/solicitar-turno.component';
import { HorariosDisponiblesComponent } from './horarios-disponibles/horarios-disponibles.component';
import { CalendarioComponent } from '../../componentes/calendario/calendario.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [SolicitarTurnoComponent, HorariosDisponiblesComponent],
  imports: [
    CommonModule,
    SolicitarTurnoRoutingModule,
    CalendarioComponent,
    ReactiveFormsModule
  ]
})
export class SolicitarTurnoModule { }
