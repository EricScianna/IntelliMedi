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
  medicoNome: string;
  medicoCognome: string;
  giorno: number;
  oraInizio: string;
  oraFine: string;
}

export interface Appuntamento {
  id: number;
  data: string;
  tipologiaVisitaId:number;
  pazienteId: number;
  medicoId: number;
  medicoNome: string;
  medicoCognome: string;
  tipologiaVisita: string;
  descrizione?: string;
}