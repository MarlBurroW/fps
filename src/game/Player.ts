import {
  Scene,
  FreeCamera,
  Vector3,
  KeyboardEventTypes,
  KeyboardInfo,
  Observer,
} from "@babylonjs/core";
import { WeaponManager } from "./WeaponManager";
import { ProjectileManager } from "./ProjectileManager";
import { TargetManager } from "./TargetManager";

export class Player {
  private scene: Scene;
  private camera: FreeCamera;
  private weaponManager: WeaponManager;
  private projectileManager: ProjectileManager;

  private health: number = 100;
  private score: number = 0;

  // Nouvelles propriétés pour les mouvements
  private walkSpeed: number = 2;
  private runSpeed: number = 3;
  private jumpForce: number = 0.6;

  private isJumping: boolean = false;
  private isCrouching: boolean = false;
  private isRunning: boolean = false;
  private normalHeight: number = 1.8;
  private crouchHeight: number = 1.0;

  private keyboardObserver: Observer<KeyboardInfo>;
  private jumpDuration: number = 600;
  private jumpCurve: (t: number) => number;
  private jumpStartTime: number = 0;

  // Ajouter une propriété pour suivre l'état de la position
  private lastPositionY: number = 0;

  constructor(
    scene: Scene,
    targetManager: TargetManager,
    onTargetHit: (targetIndex: number, hitPosition: Vector3) => void
  ) {
    this.scene = scene;

    // Définir la vitesse initiale
    this.walkSpeed = 2;
    this.runSpeed = 3;

    // Création de la caméra FPS
    this.camera = this.createCamera();

    // Appliquer la vitesse à la caméra
    this.camera.speed = this.walkSpeed;

    // Initialisation du gestionnaire d'armes
    this.weaponManager = new WeaponManager();

    // Initialisation du gestionnaire de projectiles
    this.projectileManager = new ProjectileManager(
      scene,
      this.camera,
      this.weaponManager.getCurrentWeapon(),
      targetManager,
      onTargetHit
    );

    // Configuration des contrôles
    this.setupControls();

    // Définir la courbe de saut (plus naturelle)
    this.jumpCurve = (t) => {
      // Courbe en cloche pour un saut plus naturel
      // t va de 0 à 1, résultat max à t=0.5
      return Math.sin(t * Math.PI) * this.jumpForce;
    };

    // Ajouter la mise à jour du mouvement vertical
    this.scene.registerBeforeRender(() => {
      this.updateVerticalMovement();
    });
  }

  public update(): void {
    this.projectileManager.update();

    // Mise à jour de la vitesse en fonction de l'état (course/marche)
    this.camera.speed = this.isRunning ? this.runSpeed : this.walkSpeed;

    // Afficher la vitesse actuelle pour débogage (à retirer plus tard)
    // console.log("Speed:", this.camera.speed);
  }

  public getCamera(): FreeCamera {
    return this.camera;
  }

  public getScore(): number {
    return this.score;
  }

  public addScore(points: number): void {
    this.score += points;
  }

  public getHealth(): number {
    return this.health;
  }

  public takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  public heal(amount: number): void {
    this.health += amount;
    if (this.health > 100) this.health = 100;
  }

  public getWeaponManager(): WeaponManager {
    return this.weaponManager;
  }

  public getProjectileManager(): ProjectileManager {
    return this.projectileManager;
  }

  public switchWeapon(weaponName: string): boolean {
    return this.weaponManager.switchWeapon(weaponName);
  }

  // Méthode pour gérer le mouvement vertical (saut, gravité)
  private updateVerticalMovement(): void {
    // Si on est en train de sauter, gérer le saut
    if (this.isJumping) {
      // Calculer le temps écoulé depuis le début du saut (0 à 1)
      const currentTime = performance.now();
      const elapsed = (currentTime - this.jumpStartTime) / this.jumpDuration;

      if (elapsed >= 1) {
        // Fin du saut
        this.camera.position.y = this.normalHeight;
        this.isJumping = false;
      } else {
        // Calculer la hauteur en fonction de la courbe de saut
        const height = this.normalHeight + this.jumpCurve(elapsed);
        this.camera.position.y = height;
      }
    }
    // Si on est accroupi, s'assurer que la hauteur reste correcte
    else if (this.isCrouching) {
      // Vérifier si la position Y a changé de manière inattendue
      if (Math.abs(this.camera.position.y - this.crouchHeight) > 0.01) {
        this.camera.position.y = this.crouchHeight;
      }
    }
    // En position normale, s'assurer que la hauteur reste correcte
    else {
      // Vérifier si la position Y a changé de manière inattendue
      if (
        Math.abs(this.camera.position.y - this.normalHeight) > 0.01 &&
        !this.isJumping
      ) {
        this.camera.position.y = this.normalHeight;
      }
    }

    // Sauvegarder la position actuelle pour la prochaine frame
    this.lastPositionY = this.camera.position.y;
  }

  // Méthode pour faire sauter le joueur
  private jump(): void {
    if (!this.isJumping && !this.isCrouching) {
      this.isJumping = true;
      this.jumpStartTime = performance.now();

      // Jouer un son de saut si disponible
      // this.playJumpSound();
    }
  }

  // Méthode pour s'accroupir
  private toggleCrouch(): void {
    this.isCrouching = !this.isCrouching;

    if (this.isCrouching) {
      // S'accroupir
      this.camera.position.y = this.crouchHeight;
      // Réduire la vitesse quand accroupi
      this.walkSpeed = 0.5;

      // Désactiver temporairement la gravité pour éviter les conflits
      this.camera.applyGravity = false;
    } else {
      // Se relever
      this.camera.position.y = this.normalHeight;
      // Restaurer la vitesse normale
      this.walkSpeed = 2;

      // Réactiver la gravité
      this.camera.applyGravity = true;
    }

    // Appliquer immédiatement la nouvelle vitesse
    if (!this.isRunning) {
      this.camera.speed = this.walkSpeed;
    }
  }

  // Méthode pour courir
  private startRunning(): void {
    if (!this.isCrouching) {
      this.isRunning = true;
    }
  }

  private stopRunning(): void {
    this.isRunning = false;
  }

  private createCamera(): FreeCamera {
    // Création de la caméra FPS
    const camera = new FreeCamera(
      "playerCamera",
      new Vector3(0, 1.8, -5),
      this.scene
    );
    camera.setTarget(Vector3.Zero());

    // Configuration des contrôles WASD (comme avant)
    camera.keysUp = [87]; // W
    camera.keysDown = [83]; // S
    camera.keysLeft = [65]; // A
    camera.keysRight = [68]; // D

    // Désactiver l'inertie et l'accélération pour un contrôle direct
    camera.angularSensibility = 500; // Valeur plus élevée = moins sensible
    camera.inertia = 0; // Désactive complètement l'inertie

    // Configuration de la caméra pour un FPS
    camera.applyGravity = false;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(1, 0.9, 1);
    camera.minZ = 0.1;
    camera.speed = this.walkSpeed;

    // Attacher les contrôles de base
    camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);

    // Verrouiller le pointeur pour un contrôle FPS plus naturel
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
      });
    }

    return camera;
  }

  private setupControls(): void {
    // Gestion du tir
    this.scene.onPointerDown = (evt) => {
      if (evt.button === 0) {
        // Clic gauche
        this.projectileManager.startFiring();
      }
    };

    this.scene.onPointerUp = (evt) => {
      if (evt.button === 0) {
        // Clic gauche
        this.projectileManager.stopFiring();
      }
    };

    // Gestion des touches pour les mouvements spéciaux
    this.keyboardObserver = this.scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          switch (kbInfo.event.code) {
            case "Space": // Sauter
              this.jump();
              break;
            case "KeyC": // S'accroupir
              this.toggleCrouch();
              break;
            case "ShiftLeft": // Courir
            case "ShiftRight":
              this.startRunning();
              break;
            case "Digit1":
              this.switchWeapon("assaultRifle");
              break;
            case "Digit2":
              this.switchWeapon("shotgun");
              break;
          }
          break;
        case KeyboardEventTypes.KEYUP:
          switch (kbInfo.event.code) {
            case "ShiftLeft": // Arrêter de courir
            case "ShiftRight":
              this.stopRunning();
              break;
          }
          break;
      }
    });
  }

  // Méthode pour nettoyer les ressources lors de la destruction
  public dispose(): void {
    if (this.keyboardObserver) {
      this.scene.onKeyboardObservable.remove(this.keyboardObserver);
    }
    // Nettoyer d'autres ressources si nécessaire
  }
}
