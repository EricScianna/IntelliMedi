# IntelliMedi
## Web Application per la prenotazione di visite mediche
> Caso di studio: **Medisport** — Centro Medico Sportivo

---

**Autore:** Eric Diego Scianna  
**Università:** Università Telematica Pegaso  
**Corso di Laurea:** Informatica per le Aziende Digitali (L-31)  
**Anno Accademico:** 2025/2026

---

## Descrizione

IntelliMedi è una Web Application per la prenotazione di visite mediche sviluppata come caso di studio per il centro medico sportivo **Medisport**.

Il sistema offre:
- All'**amministratore** la possibilità di registrare l'anagrafica dei medici e definire un calendario di disponibilità per tipologia di visita
- Al **paziente** la possibilità di registrare la propria anagrafica e prenotare visite mediche per tipologia

---

## Tecnologie Utilizzate

### Backend
| Tecnologia | Versione | Ruolo |
|---|---|---|
| C# / .NET | 10.0 | Linguaggio e runtime |
| ASP.NET Core Web API | 10.0 | Framework REST API |
| Entity Framework Core | 10.0 | ORM per l'accesso al database |
| SQLite | — | Database relazionale |
| BCrypt.Net | — | Hashing delle password |
| JWT Bearer | — | Autenticazione stateless |
| Scalar | — | Documentazione e test API |

### Frontend
| Tecnologia | Ruolo |
|---|---|
| HTML5 / CSS3 | Struttura e stile |
| JavaScript (ES6+) | Logica client-side |
| Bootstrap 5 | Framework UI responsivo |

---

## Architettura

```
IntelliMedi/
├── IntelliMedi.API/          # Backend ASP.NET Core
│   ├── Controllers/          # Endpoint REST
│   ├── Models/               # Entità del dominio
│   ├── Data/                 # DbContext (EF Core)
│   ├── Migrations/           # Migration del database
│   ├── Properties/           # Configurazione di avvio
│   ├── appsettings.json      # Configurazione applicazione
│   └── Program.cs            # Entry point e pipeline HTTP
└── frontend/                 # Frontend statico
    ├── index.html            # Homepage
    ├── appuntamenti.html     # Calendario prenotazioni
    ├── medici.html           # Elenco medici
    ├── visite.html           # Tipologie di visite
    ├── area-personale.html   # Profilo e appuntamenti utente
    ├── admin.html            # Pannello amministratore
    └── login.html            # Login e registrazione
```

---

## Modello dei Dati

Il sistema gestisce le seguenti entità:

- **Utente** *(classe astratta)* — base per Paziente e Medico
- **Paziente** — anagrafica paziente, appuntamenti e recensioni
- **Medico** — anagrafica medico, disponibilità e tipologie di visita
- **TipologiaVisita** — categoria di visita medica (es. ortopedia, cardiologia)
- **DisponibilitaMedico** — giorni e orari di disponibilità ricorrente
- **Appuntamento** — prenotazione tra paziente, medico e tipologia di visita
- **Recensione** — valutazione del paziente per un medico

---

## API Endpoints

### Autenticazione
| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login utente, restituisce JWT | No |

### Pazienti
| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/pazienti` | Lista tutti i pazienti | Sì |
| GET | `/api/pazienti/{id}` | Dettaglio paziente | Sì |
| POST | `/api/pazienti` | Crea nuovo paziente | Sì |
| PUT | `/api/pazienti/{id}` | Aggiorna paziente | Sì |
| DELETE | `/api/pazienti/{id}` | Elimina paziente | Sì |

### Medici
| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/medici` | Lista tutti i medici | Sì |
| GET | `/api/medici/{id}` | Dettaglio medico | Sì |
| POST | `/api/medici` | Crea nuovo medico | Sì |
| PUT | `/api/medici/{id}` | Aggiorna medico | Sì |
| DELETE | `/api/medici/{id}` | Elimina medico | Sì |

### Appuntamenti
| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/appuntamenti` | Lista tutti gli appuntamenti | Sì |
| GET | `/api/appuntamenti/{id}` | Dettaglio appuntamento | Sì |
| POST | `/api/appuntamenti` | Crea appuntamento | Sì |
| PUT | `/api/appuntamenti/{id}` | Aggiorna appuntamento | Sì |
| DELETE | `/api/appuntamenti/{id}` | Elimina appuntamento | Sì |

> Gli stessi endpoint CRUD sono disponibili per: **Recensioni**, **TipologieVisita**, **DisponibilitaMedico**

---

## Autenticazione

Il sistema utilizza **JWT (JSON Web Token)** per l'autenticazione stateless.

**Flusso:**
1. Il client invia `username` e `password` a `POST /api/auth/login`
2. Il server verifica le credenziali con **BCrypt**
3. Se corrette, il server restituisce un token JWT con scadenza di 8 ore
4. Il client include il token in ogni richiesta nell'header: `Authorization: Bearer <token>`
5. Il server valida il token ad ogni richiesta protetta

Le password non sono mai salvate in chiaro — vengono hashate con BCrypt prima della persistenza.

---

## Installazione e Avvio

### Prerequisiti
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org) *(opzionale, per live server frontend)*

### Backend

```bash
# Clona il repository
git clone https://github.com/tuo-username/intellimedi.git
cd intellimedi

# Ripristina le dipendenze
dotnet restore

# Applica le migration al database
dotnet ef database update --project IntelliMedi.API

# Avvia il server
dotnet run --project IntelliMedi.API
```

Il server sarà disponibile su `https://localhost:7223`.  
La documentazione API interattiva è disponibile su `https://localhost:7223/scalar/v1`.

### Frontend

Apri `frontend/index.html` nel browser oppure usa un live server.

---

## Documentazione API

Con il server avviato in modalità Development, la documentazione interattiva completa è disponibile tramite **Scalar** all'indirizzo:

```
https://localhost:7223/scalar/v1
```

---

## Funzionalità Principali

- Registrazione e autenticazione utenti (Pazienti e Medici)
- Gestione anagrafica medici con tipologie di visita associate
- Definizione disponibilità ricorrente dei medici (giorno e fascia oraria)
- Prenotazione appuntamenti per tipologia di visita
- Sistema di recensioni dei pazienti per i medici
- Pannello amministratore per la gestione del sistema
- API REST completamente documentata con Scalar

---

## Licenza

Progetto sviluppato a scopo accademico.  
© 2026 Eric Diego Scianna — Università Telematica Pegaso
