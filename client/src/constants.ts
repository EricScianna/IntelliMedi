import type { DatiForm } from "./types";

export const API_URL = "https://localhost:7223";
export const SESSO_LABELS  = ["Maschio", "Femmina", "Non specificato"]
export const FORM_VUOTO: DatiForm = { nome: "", cognome: "", tipologiaVisite: [], dataNascita: "", sesso: 2, codiceFiscale: "" };