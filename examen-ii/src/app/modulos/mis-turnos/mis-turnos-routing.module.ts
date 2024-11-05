import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PacienteComponent } from './paciente/paciente.component';
import { MedicoComponent } from './medico/medico.component';

const routes: Routes = [
  {path: 'pacientes',  component: PacienteComponent},
  {path: 'medicos', component: MedicoComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MisTurnosRoutingModule { }
