import { bootstrapApplication } from "@angular/platform-browser";
import { EstadoTurno, Rol } from "../enums/enums";

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
    nombre?: string;
    apellido?: string;
    documento?: number;
    obraSocial?: string;
    edad?: number;
    imagen1?: string;
    imagen2?: string;
    rol?: Rol;
}

export interface UsuarioStandard {
    email: string;
    nombre: string;
    apellido: string;
    documento: number;
    rol: Rol;
    habilitado: boolean;
    tieneHC?: boolean;
}

export interface Disponibilidad {
    especialista: string;
    especialidad: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    duracionTurnos: number;
}

export interface Turno {
    medico: string;
    medicoNombreCompleto: string | null;
    pacienteNombreCompleto: string | null;
    fecha: string;
    horario: string;
    especialidad:string;
    paciente: string;
    estado: EstadoTurno;
    resenia?: {resenia: string, diagnostico: string};
    encuesta?: {consejo: string, instalaciones: number, recomendacion: string};
    calificacion?: string;
    altura?: number | null; 
    peso?: number | null; 
    temperatura?: number | null; 
    presion?: string | null;
    datosDinamicos?: Array<{ clave: string; valor: string }>;
}