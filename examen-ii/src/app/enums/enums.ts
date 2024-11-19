export enum Rol {
    Admin = 'Admin',
    Paciente = 'Paciente',
    Medico = 'Medico',
}

export enum EstadoTurno {
    Pendiente = 'Pendiente',
    Aceptado = 'Aceptado',
    Rechazado = 'Rechazado',
    Finalizado = 'Finalizado',
    Cancelado = 'Cancelado'
}

export enum Informe {
    Ingresos = 0,
    TurnosPorEspecialidad = 1,
    TurnosPorDia = 2,
    TurnosSolicitadosPorMedicoEnTiempo = 3,
    TurnosFinalizadosPorMedicoEnTiempo = 4
}