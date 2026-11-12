const socket = io();
let misDatos = {};
let isMaster = false;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* =========================================
   MODO 1: LA SETA EXPRESS (Local)
========================================= */
let mazoSeta = [];
let contadorAses = 1;

const reglasSeta = {
    1: "¡AS! Trago Incremental: Te toca beber X trago(s).",
    2: "¡DOS! Tú y los lados: Bebes tú y los dos que tienes al lado.",
    3: "¡TRES! Chicos: Todos los chicos de la mesa beben.",
    4: "¡CUATRO! Chicas: Todas las chicas de la mesa beben.",
    5: "¡CINCO! Yo nunca: Di un «Yo nunca...», quien lo haya hecho bebe.",
    6: "¡SEIS! Categorías: Elige un tema. El primero que falle bebe.",
    7: "¡SIETE! Tocar la nariz: ¡El último que se toque la nariz bebe 2!",
    8: "¡OCHO! Rimadero: Di una palabra. Rima en círculo hasta que alguien falle.",
    9: "¡NUEVE! Compañero: Elige a alguien. Cuando bebas, él bebe.",
    10: "¡CASCADA! Todos empiezan a beber a la vez. No paras hasta que pare el de tu derecha.",
    11: "¡SOTA (Poder del guiño)! Guárdala. Si guiñas a alguien y no te pillan, bebe. Si te pillan, bebes tú.",
    12: "¡CABALLO (Esclavo)! Elige a alguien. Le puedes mandar beber tus tragos hasta el próximo caballo.",
    13: "¡REY (Poner norma)! Inventa una norma global. El que la rompa, bebe.",
    "SETA": "¡TE HA CAÍDO LA SETA! 🍄 BÉBETE EL VASO DEL CENTRO A FONDO BLANCO."
};

function iniciarSeta() {
    showScreen('seta-screen');
    mazoSeta = [];
    contadorAses = 1;
    
    // Crear baraja (4 palos de 13 cartas) + 1 Seta
    for (let palo = 0; palo < 4; palo++) {
        for (let num = 1; num <= 13; num++) {
            mazoSeta.push(num);
        }
    }
    mazoSeta.push("SETA");
    
    // Barajar (Fisher-Yates)
    for (let i = mazoSeta.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazoSeta[i], mazoSeta[j]] = [mazoSeta[j], mazoSeta[i]];
    }
    
    document.getElementById('seta-counter').innerText = `Cartas restantes: ${mazoSeta.length}`;
    prepararSiguienteSeta();
}

function sacarCartaSeta() {
    if (mazoSeta.length === 0) return;
    
    const cartaObj = document.getElementById('seta-deck');
    const chivato = document.getElementById('seta-chivato');
    const title = document.getElementById('seta-card-title');
    const rule = document.getElementById('seta-card-rule');
    const btnNext = document.getElementById('btn-next-seta');

    const carta = mazoSeta.pop();
    
    if (carta === "SETA") {
        cartaObj.innerHTML = `<div class="card-seta-boom">🍄 BOOM</div>`;
        document.body.style.background = "#ff0000";
    } else {
        cartaObj.innerHTML = `<div class="card-front">${carta}</div>`;
    }

    let textoRegla = reglasSeta[carta];
    
    // Lógica del As Incremental
    if (carta === 1) {
        textoRegla = textoRegla.replace("X", contadorAses);
        contadorAses++;
        if (contadorAses > 16) contadorAses = 1;
    }

    title.innerText = carta === "SETA" ? "¡FIN DEL JUEGO!" : `CARTA: ${carta}`;
    rule.innerText = textoRegla;
    
    chivato.classList.remove('hidden');
    btnNext.classList.remove('hidden');
    cartaObj.onclick = null; // Bloquear toque
    document.getElementById('seta-counter').innerText = `Cartas restantes: ${mazoSeta.length}`;
}

function prepararSiguienteSeta() {
    const cartaObj = document.getElementById('seta-deck');
    cartaObj.innerHTML = `<div class="card-back">TAP PARA ROBAR</div>`;
    cartaObj.onclick = sacarCartaSeta;
    document.getElementById('seta-chivato').classList.add('hidden');
    document.getElementById('btn-next-seta').classList.add('hidden');
    document.body.style.background = "#1a1a2e";
}

/* =========================================
   MODO 2: LA PIRÁMIDE (Multijugador)
========================================= */
function joinPiramide() {
    const user = document.getElementById('username').value;
    const room = document.getElementById('roomCode').value.toUpperCase();
    if (user && room) {
        socket.emit('joinRoom', { username: user, roomCode: room });
    }
}

socket.on('joined', ({ roomCode, player, isHost }) => {
    misDatos = player;
    isMaster = isHost;
    document.getElementById('display-room').innerText = roomCode;
    showScreen('piramide-game');
    
    if (isMaster) {
        document.getElementById('master-btn').classList.remove('hidden');
    }
});

socket.on('updatePlayers', (players) => {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    players.forEach(p => {
        list.innerHTML += `<div class="player-tag">${p.name} 🍺 ${p.drinks}</div>`;
    });
});

// Controles Máster
function toggleMasterPanel() {
    document.getElementById('master-panel').classList.toggle('hidden');
}

// Cooldown anti-dedo rápido
function masterNextPhase() {
    const btn = document.getElementById('btn-master-action');
    btn.disabled = true;
    btn.innerText = "⏳ Cargando...";
    
    socket.emit('nextPhase', { roomCode: document.getElementById('roomCode').value.toUpperCase() });
    
    setTimeout(() => {
        btn.disabled = false;
        btn.innerText = "Siguiente Acción";
    }, 1500);
}
