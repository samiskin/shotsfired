// import { EntityState, Entity } from './entity'
import { Game, GameState, InputFrame }  from './game'
// import { EventFactory, Event } from './event'
// import { Player, PlayerState } from './player';
import { Vec, Vector } from './vector';

export interface BulletState {
  damage: number;
  source: string;
  // type: 'bullet';
  pos: Vector;
  vel: Vector;
  accel: Vector;
  // inputVel: Vector; // The velocity due to user input
  orientation: number; // angle in radians
  radius: number; // Collision hitbox
  id: string;
  alive: boolean;
  type: string;

};

let lastId = 0;
const BULLET_SPEED = 300;
export class Bullet {

  static init(overrides: any = {}) {
    return Object.assign({
      damage: 15,
      source: null,
      alive: true,
      type: 'bullet',
      id: ("" + lastId++),
      pos: {x: 640, y: 320}
    }, overrides) as BulletState;
  }

  static update(bullet: BulletState, delta: number, game: GameState) {
    if (bullet.pos.x < 0 - bullet.radius
       || bullet.pos.x > game.world.width + bullet.radius
       || bullet.pos.y < 0 - bullet.radius
       || bullet.pos.y > game.world.height + bullet.radius) {
         bullet.alive = false;
    }
    // return super.update(bullet, delta, game);
  }

  // static collideWith(bullet: BulletState, other: EntityState, state: GameState) {
  //   switch(other.type) {
  //     case 'player':
  //       other = other as PlayerState;
  //       if (other.id !== bullet.source) {
  //         Player.takeDamage(other as PlayerState, bullet.damage);
  //         bullet.alive = false;
  //       }
  //       break;
  //   }
  // }

  // static spawnFrom(entity: EntityState) {
  //   let base = Bullet.init();
  //   base.source = entity.id;
  //   base.pos = {x: entity.pos.x, y: entity.pos.y};
  //   base.vel = Vec.mul(Vec.direction(entity.orientation), BULLET_SPEED);
  //   return base;
  // }
}
