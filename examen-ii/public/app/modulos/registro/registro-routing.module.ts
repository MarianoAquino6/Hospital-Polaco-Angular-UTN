import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PacientesComponent } from './pacientes/pacientes.component';
import { MedicosComponent } from './medicos/medicos.component';
import { RegistroComponent } from './registro/registro.component';

const routes: Routes = [
  {path: '', component: RegistroComponent},
  {path: 'pacientes',  component: PacientesComponent},
  {path: 'medicos', component: MedicosComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistroRoutingModule { }
