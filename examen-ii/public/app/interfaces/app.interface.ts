import { Rol } from "../enums/enums";

export interface Medico {
    email: string;
    nombre: string;
    apellido: string;
    documento: number;
    especialidades: string[];
    edad: number;
    imagen1: string;
    rol: Rol;
}

export interface Admin {
    email: string;
    nombre: string;
    apellido: string;
    documento: number;
    edad: number;
    imagen1: string;
    rol: Rol;
}

export interface Paciente {
    email: string;
    nombre: string;
    apellido: string;
    documento: number;
    obraSocial: string;
    edad: number;
    imagen1: string;
    imagen2: string;
    rol: Rol;
}

export interface UsuarioStandard {
    email: string;
    nombre: string;
    apellido: string;
    documento: number;
    rol: Rol;
}

export interface Disponibilidad {
    especialidad: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    duracionTurnos: number;
}