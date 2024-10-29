import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroPacienteComponent } from './componentes/registro-paciente/registro-paciente.component';
import { RegistroMedicoComponent } from './componentes/registro-medico/registro-medico.component';
import { adminGuard } from './guards/admin.guard';
import { PageNotFoundComponent } from './componentes/page-not-found/page-not-found.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro-pacientes', component: RegistroPacienteComponent },
    { path: 'registro-medicos', component: RegistroMedicoComponent },
    {
        path: 'usuarios',
        loadChildren: () => import('./modulos/usuarios/usuarios.module').then(c => c.UsuariosModule),
        canActivate: [adminGuard]
    },


    { path: '**', component: PageNotFoundComponent }
];
