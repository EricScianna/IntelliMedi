import type { DatiForm } from "./types";

export const API_URL = "https://localhost:7223";
export const SESSO_LABELS  = ["Maschio", "Femmina", "Non specificato"]
export const FORM_VUOTO: DatiForm = { nome: "", cognome: "", tipologiaVisite: [], dataNascita: "", sesso: 2, codiceFiscale: "" };
export const GIORNI_SETTIMANA = [
  { indice: 1, nome: "Lunedì" },
  { indice: 2, nome: "Martedì" },
  { indice: 3, nome: "Mercoledì" },
  { indice: 4, nome: "Giovedì" },
  { indice: 5, nome: "Venerdì" },
  { indice: 6, nome: "Sabato" },
  { indice: 0, nome: "Domenica" },
];
