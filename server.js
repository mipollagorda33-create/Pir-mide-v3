const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Memoria del servidor para La Pirámide
const rooms = {};

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('joinRoom', ({ username, roomCode }) => {
        socket.join(roomCode);
        
        if (!rooms[roomCode]) {
            rooms[roomCode] = { host: socket.id, players: [], state: 'lobby', phase: 0 };
        }
        
        const isHost = rooms[roomCode].host === socket.id;
        const player = { id: socket.id, name: username, isHost, drinks: 0, hand: [] };
        rooms[roomCode].players.push(player);

        socket.emit('joined', { roomCode, player, isHost });
        io.to(roomCode).emit('updatePlayers', rooms[roomCode].players);
    });

    // Control del Máster: Siguiente Fase
    socket.on('nextPhase', ({ roomCode }) => {
        if (rooms[roomCode] && rooms[roomCode].host === socket.id) {
            rooms[roomCode].phase++;
            io.to(roomCode).emit('phaseChanged', rooms[roomCode].phase);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        // Lógica de AFK/desconexión se ampliará aquí
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando en http://localhost:${PORT}`);
});
