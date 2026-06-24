export type DatiForm = Omit<User, "id" | "username" | "password">;

export interface TipologiaVisita {
  id: number;
  descrizione: string;
}

export interface User {
  id: number;
  nome: string;
  cognome: string;
  tipologiaVisite?: TipologiaVisita[];
  dataNascita: string;
  sesso: number;
  codiceFiscale?: string;
  username?: string;
  password?: string;
}

export interface DisponibilitaMedico {
  id: number;
  medicoId: number;
  medico?: User;
  giorno: number;
  oraInizio: string;
  oraFine: string;
}

export interface Appuntamento {
  id: number;
  data: string;
  tipologiaVisitaId:number;
  pazienteId: number;
  paziente?: User;
  medicoId: number;
  medico?: User;
  descrizione?: string;
}