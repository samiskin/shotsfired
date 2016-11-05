import * as cluster from 'cluster';
import { Server }  from 'http';
import { GameServer } from './game-server';
import * as SocketIO from 'socket.io';
import { Game } from '../core/game';

const GAME_START_TIME = 5000;
export class LobbyServer {
  players: SocketIO.Socket[];
  io: SocketIO.Server;
  server: Server;
  gameStartTimer: number; // Timeout id


  constructor(server: Server) {
    this.server = server;
    this.io = SocketIO(this.server);
    this.refreshLobby();
    this.io.on('connection', this.onConnection.bind(this));
  }
  
  onConnection(socket: SocketIO.Socket) {
    this.players.push(socket);
    socket.on('disconnect', () => this.onDisconnection(this.players.length-1));
    console.log("Players in lobby: ", this.players.length);

    this.resetTimer();
    if (this.players.length > Game.settings.maxPlayers) {
      // Assuming we won't go from max-1 players to max+1 players
      console.log("CRITICAL ERROR: too many players");
    } else if (this.players.length == Game.settings.maxPlayers) {
      this.startGame();
    } else if (this.players.length >= Game.settings.minPlayers) {
      this.gameStartTimer = setTimeout(this.startGame.bind(this), GAME_START_TIME);
    }
  }

  onDisconnection(playerNum: number) {
    this.players.splice(playerNum, 1);
    if (this.players.length < Game.settings.minPlayers) {
      if (this.gameStartTimer != -1) {
        clearTimeout(this.gameStartTimer);
      }
    }
  }

  resetTimer() {
      if (this.gameStartTimer != -1) {
        clearTimeout(this.gameStartTimer);
      }
      this.gameStartTimer = -1;
  }

  refreshLobby() {
    this.resetTimer();
    this.players = [];
  }

  startGame() {
      // Start new game
      new GameServer(this.players);
      this.refreshLobby();
  }
}