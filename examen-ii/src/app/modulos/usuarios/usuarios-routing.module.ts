import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { GestionAccesoComponent } from './gestion-acceso/gestion-acceso.component';
import { RegistroAdminComponent } from './registro-admin/registro-admin.component';

const routes: Routes = [
  { path: '', component: UsuariosComponent }, 
  { path: 'gestion-acceso', component: GestionAccesoComponent },
  { path: 'registro-admin', component: RegistroAdminComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsuariosRoutingModule { }
