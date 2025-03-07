import {
  Scene,
  Engine,
  Vector3,
  Color3,

  HemisphericLight,
  DirectionalLight,
  CannonJSPlugin,
  PhysicsImpostor,
  ArcRotateCamera,
  MeshBuilder,
  Mesh,
  AbstractMesh,
  PointerEventTypes,
  PointerInfo
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import { TargetManager } from "./TargetManager";
import { Environment } from "./Environment";

import { UI } from "../utils/UI";
import { WeaponManager } from "./WeaponManager";
import { AssaultRifle } from "./Weapons/AssaultRifle";
import { Shotgun } from "./Weapons/Shotgun";
import { ShellEjectionModule, EjectionSide } from "./Weapons/WeaponModules/ShellEjectionModule";
import { ProjectileModule } from "./Weapons/WeaponModules/ProjectileModule";
import { Player } from "./Player";

// Importer le moteur physique Cannon.js
import * as CANNON from "cannon";

export class FPSGame {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private player: Player;

  private ui: UI;
  private environment: Environment;
  private targetManager: TargetManager;
  private weaponManager: WeaponManager;

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

    this.ui = new UI(this.updateScore.bind(this));
    this.environment = new Environment(this.scene);
    this.targetManager = new TargetManager(this.scene, 10);
    this.player = new Player(
      this.scene,
      this.targetManager,
      this.handleTargetHit.bind(this)
    );
    this.weaponManager = this.player.getWeaponManager();

    // Créer et enregistrer les armes
    const assaultRifle = new AssaultRifle(this.scene, this.player.getCamera());
    const shotgun = new Shotgun(this.scene, this.player.getCamera());

    // Enregistrer les armes de manière asynchrone
    this.weaponManager.registerWeapon("assaultRifle", assaultRifle);
    this.weaponManager.registerWeapon("shotgun", shotgun);

    // Ajouter les modules directement aux armes
    // Ne pas ajouter de module d'éjection de douilles au fusil d'assaut car il en a déjà un
    
    // Position d'éjection des douilles pour un fusil à pompe
    // Comme l'arme est orientée avec une rotation de 180° (Math.PI) autour de l'axe Y,
    // les axes X et Z sont inversés
    // - X: -0.1 (à droite de l'arme, négatif car l'arme est tournée à 180°)
    // - Y: 0.03 (légèrement au-dessus)
    // - Z: 0.1 (plus près du tireur que le fusil d'assaut, positif car nous avons inversé le signe)
    const shotgunEjectionPosition = new Vector3(-0.1, 0.03, 0.1);
    console.log("Position d'éjection du fusil à pompe:", shotgunEjectionPosition);
    
    const shellEjectionModule = new ShellEjectionModule(
      this.scene, 
      shotgunEjectionPosition,
      EjectionSide.RIGHT // Éjecter les douilles vers la droite
    );
    
    // assaultRifle.addModule(shellEjectionModule); // Commenté pour éviter les doublons
    shotgun.addModule(shellEjectionModule);

    // Configuration des projectiles pour le fusil à pompe
    // - Projectiles plus gros et plus lents
    // - Couleur rouge-orange pour simuler des balles traçantes de fusil à pompe
    shotgun.addModule(new ProjectileModule(this.scene, {
      speed: 120, // Un peu plus lent que le fusil d'assaut
      lifetime: 1200, // Durée de vie plus courte
      size: 0.05, // Plus gros
      color: new Color3(1, 0.5, 0.2), // Couleur rouge-orange plus intense
      lightIntensity: 1.2, // Lumière plus intense
      lightRange: 5, // Portée plus grande
      trailWidth: 0.03, // Traînée plus épaisse
      trailLifetime: 500, // Traînée plus longue
      particleEmitRate: 120, // Moins de particules pour améliorer les performances
      particleSize: { min: 0.02, max: 0.04 } // Particules plus grosses
    }));

    // Définir l'arme par défaut après avoir enregistré toutes les armes et ajouté tous les modules
    // Cela garantit que seule l'arme sélectionnée sera visible
    setTimeout(() => {
      this.weaponManager.switchWeapon("assaultRifle");
    }, 100); // Petit délai pour s'assurer que tout est chargé

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

    // Initialiser le moteur physique
    const gravityVector = new Vector3(0, -9.81, 0);
    const physicsPlugin = new CannonJSPlugin(true, 10, CANNON);
    scene.enablePhysics(gravityVector, physicsPlugin);
    
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
    // Variables pour gérer le tir automatique
    let isFiring = false;
    let autoFireInterval: any = null;

    // Gestion du clic pour tirer
    this.scene.onPointerDown = (evt) => {
      if (evt.button === 0) {
        // Clic gauche
        isFiring = true;
        
        // Tirer immédiatement
        this.shoot();
        
        // Si l'arme est en mode automatique, configurer le tir automatique
        const currentWeapon = this.weaponManager.getCurrentWeapon();
        if (currentWeapon && currentWeapon.isAutomatic()) {
          // Arrêter l'intervalle précédent s'il existe
          if (autoFireInterval) {
            clearInterval(autoFireInterval);
          }
          
          // Démarrer le tir automatique
          autoFireInterval = setInterval(() => {
            if (isFiring) {
              this.shoot();
            } else {
              clearInterval(autoFireInterval);
              autoFireInterval = null;
            }
          }, currentWeapon.getFireRate());
        }
      }
    };

    // Arrêter le tir quand le bouton est relâché
    this.scene.onPointerUp = (evt) => {
      if (evt.button === 0) {
        isFiring = false;
      }
    };
  }

  // Méthode pour tirer
  private shoot(): void {
    const currentWeapon = this.weaponManager.getCurrentWeapon();
    if (!currentWeapon) return;
    
    // Obtenir la direction du tir (depuis la caméra)
    const camera = this.player.getCamera();
    const direction = camera.getDirection(new Vector3(0, 0, 1));
    
    // Ajouter une légère dispersion
    const spread = currentWeapon.getSpread();
    const randomSpread = new Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );
    const finalDirection = direction.add(randomSpread).normalize();
    
    // Déclencher le tir de l'arme
    currentWeapon.fire(finalDirection);
  }

  private handleTargetHit(): void {
    this.player.addScore(10);
    this.ui.updateScore(this.player.getScore());
  }

  private updateScore(): void {
    // This method is now empty as the score is managed by the Player class
  }

  public getWeaponManager(): WeaponManager {
    return this.weaponManager;
  }

}
