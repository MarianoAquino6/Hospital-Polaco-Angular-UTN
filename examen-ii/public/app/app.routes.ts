import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { LoginComponent } from './componentes/login/login.component';
import { adminGuard } from './guards/admin.guard';
import { PageNotFoundComponent } from './componentes/page-not-found/page-not-found.component';
import { TurnosComponent } from './componentes/turnos/turnos.component';
import { HistoriaClinicaComponent } from './componentes/historia-clinica/historia-clinica.component';
import { PacientesComponent } from './componentes/pacientes/pacientes.component';
import { medicoGuard } from './guards/medico.guard';
import { logueadoGuard } from './guards/logueado.guard';
import { pacienteGuard } from './guards/paciente.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'turnos', component: TurnosComponent, canActivate: [adminGuard]},
    { path: 'historia-clinica', component: HistoriaClinicaComponent, canActivate: [logueadoGuard] },
    { path: 'pacientes', component: PacientesComponent, canActivate: [medicoGuard] },
    {
        path: 'usuarios',
        loadChildren: () => import('./modulos/usuarios/usuarios.module').then(c => c.UsuariosModule),
        canActivate: [adminGuard]
    },
    {
        path: 'perfil',
        loadChildren: () => import('./modulos/perfil/perfil.module').then(c => c.PerfilModule),
        canActivate: [logueadoGuard]
    },
    {
        path: 'solicitar-turnos',
        loadChildren: () => import('./modulos/solicitar-turno/solicitar-turno.module').then(c => c.SolicitarTurnoModule),
        canActivate: [adminGuard, pacienteGuard]
    },
    {
        path: 'registro',
        loadChildren: () => import('./modulos/registro/registro.module').then(c => c.RegistroModule)
    },
    {
        path: 'mis-turnos',
        loadChildren: () => import('./modulos/mis-turnos/mis-turnos.module').then(c => c.MisTurnosModule),
        canActivate: [medicoGuard, pacienteGuard]
    },

    { path: '**', component: PageNotFoundComponent }
];
