verificaAccesso();
costruisciMenuSidebar();
mostraCards();

function verificaAccesso() {
    const token = localStorage.getItem('token');
    if (!token) {
        globalThis.location.href = 'index.html?errore=nonAutenticato';
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

async function mostraCards() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="m-4">
            <div class="row g-0">
                <!-- Card anagrafica -->
                <div class="col-3 p-3 me-4 card-border">
                    <button class="btn p-0 w-100 border-0" id="mostraAnagraficaCards">
                        <div class="card p-0 cardContent">
                            <div class="card-header text-white titleMedisport">
                                <h4 class="card-title text-center">
                                    Anagrafica
                                </h4>
                            </div>
                            <figure class="card-img-top text-center m-0">
                                <i class="bi bi-person d-block" style="font-size: 7rem; color: #08808E;"></i>
                            </figure>
                            <div class="card-body bg-white text-center py-2">
                                <p class="card-text">Visualizzare e modificare l'anagrafica utente</p>
                            </div>
                        </div>
                    </button>
                </div>
                <!-- Card prenotazioni -->
                <div class="col-3 p-3 me-4 card-border">
                    <button class="btn p-0 w-100 border-0" id="mostraPrenotazioniCards">
                        <div class="card p-0 cardContent">
                            <div class="card-header text-white titleMedisport">
                                <h4 class="card-title text-center">
                                    Prenotazioni
                                </h4>
                            </div>
                            <figure class="card-img-top text-center m-0">
                                <i class="bi bi-calendar d-block" style="font-size: 7rem; color: #08808E;"></i>
                            </figure>
                            <div class="card-body bg-white text-center py-2">
                                <p class="card-text">Visualizza, modifica o cancella le prenotazioni</p>
                            </div>
                        </div>
                    </button>
                </div>
                <!-- Card recensisci -->
                <div class="col-3 p-3 card-border">
                    <button class="btn p-0 w-100 border-0" id="mostraRecensisciCards">
                        <div class="card p-0 cardContent">
                            <div class="card-header text-white titleMedisport">
                                <h4 class="card-title text-center">
                                    Recensisci
                                </h4>
                            </div>
                            <figure class="card-img-top text-center m-0">
                                <i class="bi bi-pencil d-block" style="font-size: 7rem; color: #08808E;"></i>
                            </figure>
                            <div class="card-body bg-white text-center py-2">
                                <p class="card-text">Recensisci i nostri medici o la nostra struttura</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mostraCards').addEventListener('click', mostraCards);
    document.getElementById('mostraAnagraficaCards').addEventListener('click', mostraAnagrafica);
    document.getElementById('mostraPrenotazioniCards').addEventListener('click', mostraPrenotazioni);
    document.getElementById('mostraRecensisciCards').addEventListener('click', mostraRecensioni);
}

async function mostraAnagrafica() {
    const response = await fetch('https://localhost:7223/api/pazienti/' + localStorage.getItem('id'), {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    },
    );

    const data = await response.json();
    data.dataNascita = new Date(data.dataNascita).toLocaleDateString('it-IT')
    if (data.sesso == 0) {
        data.sesso = "Maschio"
    }
    else {
        data.sesso = "Femmina"
    }

    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
    <div class="m-4">
        <div class="row g-0" >
            <div class="col-6 p-3 card-border">
                <div class="card" >
                    <div class="card-header text-white titleMedisport"><h5>Anagrafica</h5></div>
                        <div class="card-body" >
                            <table class="table">
                                <tr>
                                    <td class="fw-bold">Nome</td>
                                    <td>${data.nome}</td>
                                </tr>
                                <tr>
                                    <td class="fw-bold">Cognome</td>
                                    <td>${data.cognome}</td>
                                </tr>
                                <tr>
                                    <td class="fw-bold">Codice Fiscale</td>
                                    <td>${data.codiceFiscale}</td>
                                </tr>
                                <tr>
                                    <td class="fw-bold">Data di Nascita</td>
                                    <td>${data.dataNascita}</td>
                                </tr>
                                <tr>
                                    <td class="fw-bold">Sesso</td>
                                    <td>${data.sesso}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

function eseguiLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('ruolo');
    localStorage.removeItem('nome');
    localStorage.removeItem('cognome');
    localStorage.removeItem('id');
    globalThis.location.href = 'index.html';
}

function costruisciMenuSidebar() {
    const ruolo = localStorage.getItem('ruolo');
    const menu = document.getElementById('menuSidebar');
    const nomeAccount = document.getElementById('nomeAccount');

    //inserisce nome e cognome dell'utente loggato
    nomeAccount.innerHTML += `
        ${localStorage.getItem('nome')} ${localStorage.getItem('cognome')}
    `;
    if (ruolo === 'Paziente') {
        menu.innerHTML += `
            <a href="#" class="sidebar-link text-decoration-none p-3 fs-5" id="mostraAnagrafica">
                <i class="bi bi-person me-3"></i>
                <span class="hide-on-collapse">Anagrafica</span>
            </a>
            <a href="#" class="sidebar-link text-decoration-none p-3 fs-5">
                <i class="bi bi-calendar me-3"></i>
                <span class="hide-on-collapse">Prenotazioni</span>
            </a>
            <a href="#" class="sidebar-link text-decoration-none p-3 fs-5">
                <i class="bi bi-pencil me-3"></i>
                <span class="hide-on-collapse">Recensisci</span>
            </a>            
        `;
    } else if (ruolo === 'Medico') {
        menu.innerHTML += `
            <li>
                <a href="#" class="nav-link fw-bold text-white">
                    <i class="bi bi-person me-2"></i>
                    Calendario
                </a>
            </li>
        `;
    }
}

document.getElementById('mostraAnagrafica').addEventListener('click', mostraAnagrafica);
document.getElementById('logoutButton').addEventListener('click', eseguiLogout);