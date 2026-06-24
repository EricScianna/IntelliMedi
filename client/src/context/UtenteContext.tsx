import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

//context  comunica a tutti chi è l'utente loggato in quel momento. lo fa una volta sola a tutti i componenti
//cosa espone
interface Utente {
  id: string;
  ruolo: string;
  nome: string;
  cognome: string;
}

interface ValoreContext {
  utente: Utente | null;
  isPaziente: boolean;
  isMedico: boolean;
  isAdmin: boolean;
  setUtente: (u: Utente | null) => void;
}

//valore di default
const UtenteContext = createContext<ValoreContext>({
  utente: null,
  isPaziente: false,
  isMedico: false,
  isAdmin: false,
  setUtente: () => {},
});

//setta l'utente al login. lo setta null al logout
export function UtenteProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [utente, setUtente] = useState<Utente | null>(() => {
    if (!localStorage.getItem("token")) return null;
    return {
      id: localStorage.getItem("id") ?? "",
      ruolo: localStorage.getItem("ruolo") ?? "",
      nome: localStorage.getItem("nome") ?? "",
      cognome: localStorage.getItem("cognome") ?? "",
    };
  });
  //annuncia un nuovo utente solo quando cambia
  const valore = useMemo(() => {
    const ruolo = utente?.ruolo ?? "";
    return {
      utente,
      setUtente,
      isPaziente: ruolo === "Paziente",
      isMedico: ruolo === "Medico",
      isAdmin: ruolo === "Amministratore",
    };
  }, [utente]);
  return <UtenteContext.Provider value={valore}>{children}</UtenteContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useUtente = () => useContext(UtenteContext);
