import * as React from 'react';
import 'p2';
import 'pixi';
import * as Phaser from 'phaser';
import { GameState, InputFrame } from '../core/game';

/*
  This class is the "View" class which uses Phaser for input commands and output visuals.
  The game object parameter should not be modified directly at any point in this class
*/
export interface GameCanvasProps {
  game: GameState;
  playerId: number;
  onTick: (input: InputFrame) => void;
}
export class GameCanvas extends React.Component<GameCanvasProps, {}> {
  phaserGame: Phaser.Game;
  prevTime: number;
  enemies: Phaser.Sprite[];
  player: Phaser.Sprite;
  // bullets: Phaser.Group;

  phaserInit() {
    const {game} = this.props;
    const {width, height} = game.world;
    this.phaserGame = new Phaser.Game(width, height, Phaser.AUTO, 'canvasDiv', {
      preload: this.phaserPreload.bind(this),
      create: this.phaserCreate.bind(this),
      update: this.phaserUpdate.bind(this),
      render: this.phaserRender.bind(this),
    });
  }

  phaserPreload() {
    const {phaserGame} = this;
    const {width, height} = this.props.game.world;
    phaserGame.world.setBounds(0, 0, width, height);
    phaserGame.load.image('shooter', '../../res/shooter.png');
    // game.load.image('bullet', '../../res/purple_ball.png');
  }

  phaserCreate() {

    let {phaserGame} = this;
    phaserGame.stage.backgroundColor = '#124184';
    phaserGame.stage.disableVisibilityChange = true; // TODO: Remove for prod

    this.enemies = [];
    for (let i = 0; i < this.props.game.world.maxPlayers; i++) { // move 4 to a constant
      this.enemies[i] = phaserGame.add.sprite(0, 0, 'shooter');
      this.enemies[i].exists = false;
    }

    let player = phaserGame.add.sprite(0, 0, 'shooter');
    phaserGame.camera.follow(player);
    this.player = player;

    this.enemies.concat([player]).forEach(shooter => {
      shooter.scale.setMagnitude(0.3);
      shooter.anchor.setTo(0.5, 0.5);
    });

    this.prevTime = this.phaserGame.time.now;
  }

  phaserUpdate() {
    const {phaserGame, player, prevTime} = this;
    const {game, playerId} = this.props;

    const delta = phaserGame.time.now - prevTime;
    this.prevTime = phaserGame.time.now;

    const isDown = (key: number) => !!phaserGame.input.keyboard.isDown(key);
    const input: InputFrame = {
      left: isDown(Phaser.Keyboard.LEFT),
      right: isDown(Phaser.Keyboard.RIGHT),
      up: isDown(Phaser.Keyboard.UP),
      down: isDown(Phaser.Keyboard.DOWN),
      angle: phaserGame.physics.arcade.angleToPointer(player),
      fired: phaserGame.input.activePointer.isDown,
      duration: delta,
      playerId: playerId,
    };

    // Tell the controller that a frame has occured
    this.props.onTick(input);

    const playerState = game.entities.players[playerId];
    player.x = playerState.pos.x;
    player.y = playerState.pos.y;
    player.rotation = phaserGame.physics.arcade.angleToPointer(player);

    // TODO: Make this cleaner
    let i = 0;
    game.entities.players.filter(p => p.id !== playerId).forEach(player => {
      let enemy = this.enemies[i++];
      enemy.exists = true;
      enemy.x = player.pos.x;
      enemy.y = player.pos.y;
      enemy.rotation = player.orientation;
    });
    for (;i < this.enemies.length; i++) {
      this.enemies[i].exists = false;
    }
  }

  phaserRender() {
  }

  componentDidMount() {
    this.phaserInit();
  }

  // Don't bother rerendering since this is all canvas
  shouldComponentUpdate(nextProps: GameCanvasProps) {
    return false;
  }

  render() {
    return <div id="canvasDiv"></div>;
  }

}