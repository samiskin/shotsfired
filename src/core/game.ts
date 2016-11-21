import { Player, PlayerState, PlayerMovement } from './player';
import { Bullet, BulletState } from './bullet';
import { EntityState, Entity } from './entity';
import { WallState, MapCatalog, Wall, WallSprite } from './wall';
import { Event } from './event';

export interface InputFrame {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  angle: number;
  fired: boolean;
  duration: number;
  playerId: string;
  timestamp: number; // Used for client-server synchronization
};

export interface GameState {
  world: {
    width: number;
    height: number;
  };
  entities: {
    players: {[id:string]:PlayerState};
    bullets: {[id:string]:BulletState};
    walls: {[id:string]: WallState};
  };
  settings: {
    minPlayers: number;
    maxPlayers: number;
  };
};

const defaultMap = MapCatalog[0].reduce((prev, wallData) => {
  const wallEntity: WallState = Wall.init(wallData);
  (prev as any)[wallEntity.id] = wallEntity;
  return prev;
}, {});

export class Game {
  static settings = { minPlayers: 2, maxPlayers: 4 };
  static init(overrides: any = {}) {
    let defaults: GameState = {
      settings: { minPlayers: Game.settings.minPlayers,
                  maxPlayers: Game.settings.maxPlayers },
      world: { width: 960, height: 720 },
      entities: { players: {}, bullets: {}, walls: defaultMap },
    };
    return Object.assign(defaults, overrides) as GameState;
  }

  // Current issue is that the state that the parts base their
  // information of is changing as they're all running, so behavior
  // might change based on the order of iteration, which is bad.
  // Immutability is the only way to fix this
  static update(game: GameState, delta: number) {

    let {players, bullets} = game.entities;

    let events: Event[] = [];

    Object.keys(game.entities).forEach(entityType => {
      let entities = (game.entities as any)[entityType] as {[s: string]: EntityState};
      Object.keys(entities).forEach(id => {
        if (!entities[id].alive) { delete entities[id]; }
      });
    });

    // Consider putting all entities together
    events = Object.keys(players).reduce((events, playerId) => {
      return events.concat(Player.update(players[playerId], delta, game));
    }, events);

    events = Object.keys(bullets).reduce((events, bulletId) => {
      return events.concat(Bullet.update(bullets[bulletId], delta, game));
    }, events);

    return events;
  }

  static applyInputs(state: GameState, inputs: InputFrame[]) {
    const players = state.entities.players;

    var events: Event[] = [];
    inputs.forEach(input => {
      if (!players[input.playerId]) { return; }
      events = events.concat(Player.applyInput(players[input.playerId], input, state));
    });

    return events;
  }

  static resolveEvents(game: GameState, events: Event[]) {
    let allEntities: {[id:string]: EntityState} = Object.keys(game.entities).reduce((list, key) => {
      Object.assign(list, (game.entities as any)[key]);
      return list;
    }, {});
    let { walls, players }  = game.entities;

    events.forEach(event => {
      let sender = allEntities[event.initiator];
      let receiver = allEntities[event.receptor];
      switch(event.type) {
        case 'COLLISION': // handles static motion
          switch(sender.type) {
            case 'player': Player.collideWith(sender as PlayerState, receiver, game); break;
            case 'bullet': Bullet.collideWith(sender as BulletState, receiver, game); break;
          }
          break;
        case 'SPAWN_BULLET': // spawns the missiles
          switch(sender.type) {
            case 'player':
              let bullet = Bullet.spawnFrom(sender as PlayerState);
              game.entities.bullets[bullet.id] = bullet;
              break;
          }
          break;
        case 'MOVEMENT': // HANDLES dynamic motion. 
          if (sender) {
            let movementData = event.data as PlayerMovement; 
            Player.move(sender as PlayerState, movementData.angle, movementData.xVel, movementData.yVel);
            for (let i = 0; i < Object.keys(walls).length; i++) {
              if (Entity.colliding(sender, walls[Object.keys(walls)[i]])) {
                Player.move(sender as PlayerState, movementData.angle, movementData.xVel*-1, movementData.yVel*-1);
                return;
              }
            }
            for (let i = 0; i < Object.keys(players).length; i++) {
              if (sender.id != Object.keys(players)[i] && Entity.colliding(sender, players[Object.keys(players)[i]])) {
                Player.move(sender as PlayerState, movementData.angle, movementData.xVel*-1, movementData.yVel*-1);
                break;
              }
            }
          }
          break;
      }
    });
  }

  static addPlayer(state: GameState) {
    let player = Player.init();
    let count = 0;
    if (state.entities.players) {
      count = Object.keys(state.entities.players).length;
    }
    if ( (count + 1) % 2 === 0) {
      player.pos.x = 80;  
    }
    else {
      player.pos.x = state.world.width - 80; 
    }
    if (count > 1) {
      player.pos.y = state.world.height - 80; 
    }
    else {
      player.pos.y = 80; 
    }
    state.entities.players[player.id] = player;
    return player;
  }

  static removePlayer(state: GameState, playerId: string) {
    delete state.entities.players[playerId];
  }
}
