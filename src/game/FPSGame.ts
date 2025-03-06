import {
  Scene,
  Engine,
  Vector3,
  FreeCamera,
  HemisphericLight,
  DirectionalLight,
} from "@babylonjs/core";

import { ProjectileManager } from "./ProjectileManager";
import { TargetManager } from "./TargetManager";
import { Environment } from "./Environment";
import { LightPool } from "./utils/LightPool";
import { UI } from "../utils/UI";
import { WeaponManager } from "./WeaponManager";
import { AssaultRifle } from "./Weapons/AssaultRifle";
import { Shotgun } from "./Weapons/Shotgun";
import { ShellEjectionModule } from "./Weapons/WeaponModules/ShellEjectionModule";
import { Player } from "./Player";

export class FPSGame {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private player: Player;
  private lightPool: LightPool;
  private ui: UI;
  private environment: Environment;
  private targetManager: TargetManager;
  private weaponManager: WeaponManager;
  private projectileManager: ProjectileManager;

  constructor() {
    console.log("Initialisation du FPS Game");

    // Récupération du canvas
    const canvasElement = document.getElementById("renderCanvas");
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error("Canvas not found or is not a canvas element");
    }
    this.canvas = canvasElement;

    // Initialisation du moteur Babylon.js
    this.engine = new Engine(this.canvas, true);

    // Création de la scène
    this.scene = this.createScene();

    // Initialisation des composants du jeu
    this.lightPool = new LightPool(this.scene, 20);
    this.ui = new UI(this.updateScore.bind(this));
    this.environment = new Environment(this.scene);
    this.targetManager = new TargetManager(this.scene, 10);
    this.player = new Player(
      this.scene,
      this.targetManager,
      this.handleTargetHit.bind(this)
    );
    this.weaponManager = this.player.getWeaponManager();
    this.projectileManager = this.player.getProjectileManager();

    // Créer et enregistrer les armes
    const assaultRifle = new AssaultRifle(this.scene, this.player.getCamera());
    this.weaponManager.registerWeapon("assaultRifle", assaultRifle);

    const shotgun = new Shotgun(this.scene, this.player.getCamera());
    this.weaponManager.registerWeapon("shotgun", shotgun);

    // Ajouter des modules aux armes
    const shellEjectionModule = new ShellEjectionModule(this.scene);
    this.weaponManager.addModuleToWeapon("assaultRifle", shellEjectionModule);
    this.weaponManager.addModuleToWeapon("shotgun", shellEjectionModule);

    // Définir l'arme par défaut
    this.weaponManager.switchWeapon("assaultRifle");

    // Gestion du tir
    this.setupShooting();

    // Lancement de la boucle de rendu
    this.engine.runRenderLoop(() => {
      this.player.update();
      this.scene.render();
    });

    // Gestion du redimensionnement de la fenêtre
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  private createScene(): Scene {
    // Création d'une nouvelle scène
    const scene = new Scene(this.engine);

    // Ne pas essayer d'accéder à la caméra du joueur ici car le joueur n'est pas encore créé
    // Supprimer ou commenter ces lignes
    // this.player.getCamera();
    // this.player.getCamera().keysUp = [87]; // W
    // ...

    // Création d'une lumière hémisphérique principale
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Ajouter une seconde lumière hémisphérique pour éclairer depuis une autre direction
    const secondaryLight = new HemisphericLight(
      "secondaryLight",
      new Vector3(0, -1, 0),
      scene
    );
    secondaryLight.intensity = 0.2;

    // Ajouter une lumière directionnelle pour simuler le soleil
    const sunLight = new DirectionalLight(
      "sunLight",
      new Vector3(-1, -2, -1),
      scene
    );
    sunLight.intensity = 0.4;

    // Activer les lumières
    scene.lightsEnabled = true;

    return scene;
  }

  private setupShooting(): void {
    // Gestion du clic pour tirer
    this.scene.onPointerDown = (evt) => {
      if (evt.button === 0) {
        // Clic gauche
        this.projectileManager.startFiring();
      }
    };

    // Arrêter le tir quand le bouton est relâché
    this.scene.onPointerUp = (evt) => {
      if (evt.button === 0) {
        this.projectileManager.stopFiring();
      }
    };
  }

  private handleTargetHit(targetIndex: number, hitPosition: Vector3): void {
    this.player.addScore(10);
    this.ui.updateScore(this.player.getScore());
  }

  private updateScore(newScore: number): void {
    // This method is now empty as the score is managed by the Player class
  }

  public getWeaponManager(): WeaponManager {
    return this.weaponManager;
  }

  public getProjectileManager(): ProjectileManager {
    return this.projectileManager;
  }
}
