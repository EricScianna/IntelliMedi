window.addEventListener('scroll', aggiornaSticky);
window.addEventListener('resize', aggiornaSticky);
aggiornaSticky(); // esegui subito al caricamento

document.getElementById('formLogin').addEventListener('submit', function (e) {
    e.preventDefault(); // impedisce il comportamento default del form
    formLogin();
});

async function formLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('https://localhost:7223/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);

        // estrai il ruolo dal token
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        
        const id = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        localStorage.setItem('id', id);
        const nome = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        localStorage.setItem('nome', nome);
        const cognome = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];
        localStorage.setItem('cognome', cognome);
        const username = payload['username'];
        localStorage.setItem('username', username);
        const ruolo = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        localStorage.setItem('ruolo', ruolo);

        globalThis.location.href = 'area-personale.html';
    } else {
        alert('Credenziali non valide');
    }
}

function aggiornaSticky() {
    const header = document.querySelector('header');
    if (window.scrollY > 50 || window.innerWidth < 992) {
        header.classList.add('sticky');
    } else {
        header.classList.remove('sticky');
    }
}