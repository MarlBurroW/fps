import { WeaponModule } from "./WeaponModule";
import { BaseWeapon } from "../BaseWeapon";
import { Vector3, Mesh, Animation, EasingFunction, CubicEase } from "@babylonjs/core";

// Configuration du recul
export interface RecoilConfig {
  // Force du recul vers l'arrière (axe Z)
  backwardForce: number;
  // Force du recul vers le haut (axe Y)
  upwardForce: number;
  // Angle de rotation vers le haut (en radians)
  rotationForce: number;
  // Durée du recul (en ms)
  recoilDuration: number;
  // Durée du retour (en ms)
  returnDuration: number;
  // Type d'easing pour le recul (0 = linéaire, 1 = ease-in, 2 = ease-out, 3 = ease-in-out)
  easingType: number;
}

export class RecoilModule implements WeaponModule {
  private weapon: BaseWeapon;
  private weaponRoot: Mesh | null = null;
  private originalPosition: Vector3 | null = null;
  private originalRotation: Vector3 | null = null;
  private config: RecoilConfig;
  private isAnimating: boolean = false;
  
  // Animations
  private positionAnimation: Animation;
  private rotationAnimation: Animation;

  constructor(
    backwardForce: number = 0.2,
    upwardForce: number = 0.05,
    rotationForce: number = 0.05,
    recoilDuration: number = 80,
    returnDuration: number = 150,
    easingType: number = 2
  ) {
    // Configuration par défaut
    this.config = {
      backwardForce,
      upwardForce,
      rotationForce,
      recoilDuration,
      returnDuration,
      easingType
    };
    
    // Créer les animations
    this.createAnimations();
  }
  
  private createAnimations(): void {
    // Animation de position
    this.positionAnimation = new Animation(
      "recoilPosition",
      "position",
      60, // FPS
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Animation de rotation
    this.rotationAnimation = new Animation(
      "recoilRotation",
      "rotation",
      60, // FPS
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
  }

  apply(weapon: BaseWeapon): void {
    this.weapon = weapon;
  }

  onFire(position: Vector3, direction: Vector3): void {
    // Si une animation est déjà en cours, ne pas en démarrer une nouvelle
    if (this.isAnimating) return;
    
    // Mettre à jour la référence au weaponRoot à chaque tir
    this.weaponRoot = this.weapon.getWeaponRoot();
    
    if (!this.weaponRoot) return;
    
    // Sauvegarder la position et rotation actuelles
    this.originalPosition = this.weaponRoot.position.clone();
    this.originalRotation = this.weaponRoot.rotation.clone();
    
    // Démarrer l'animation de recul
    this.animateRecoil();
  }
  
  private animateRecoil(): void {
    if (!this.weaponRoot || !this.originalPosition || !this.originalRotation) return;
    
    this.isAnimating = true;
    
    // Calculer la position finale du recul
    const recoilPosition = this.originalPosition.clone();
    recoilPosition.z -= this.config.backwardForce; // Recul vers l'arrière (négatif car l'arme est orientée à 180°)
    recoilPosition.y += this.config.upwardForce;   // Léger mouvement vers le haut
    
    // Calculer la rotation finale du recul
    const recoilRotation = this.originalRotation.clone();
    recoilRotation.x += this.config.rotationForce; // Rotation vers le haut
    
    // Configurer les keyframes pour l'animation de position
    const positionKeys = [
      { frame: 0, value: this.originalPosition.clone() },
      { frame: this.config.recoilDuration / (1000/60), value: recoilPosition }
    ];
    
    // Configurer les keyframes pour l'animation de rotation
    const rotationKeys = [
      { frame: 0, value: this.originalRotation.clone() },
      { frame: this.config.recoilDuration / (1000/60), value: recoilRotation }
    ];
    
    // Ajouter les keyframes aux animations
    this.positionAnimation.setKeys(positionKeys);
    this.rotationAnimation.setKeys(rotationKeys);
    
    // Configurer l'easing pour les animations
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(this.config.easingType);
    
    this.positionAnimation.setEasingFunction(easingFunction);
    this.rotationAnimation.setEasingFunction(easingFunction);
    
    // Ajouter les animations au mesh
    this.weaponRoot.animations = [this.positionAnimation, this.rotationAnimation];
    
    // Démarrer les animations
    this.weapon.getScene().beginAnimation(
      this.weaponRoot,
      0,
      this.config.recoilDuration / (1000/60),
      false,
      1.0,
      () => {
        // Animation de recul terminée, démarrer l'animation de retour
        this.animateReturn();
      }
    );
  }
  
  private animateReturn(): void {
    if (!this.weaponRoot || !this.originalPosition || !this.originalRotation) {
      this.isAnimating = false;
      return;
    }
    
    // Configurer les keyframes pour l'animation de retour à la position initiale
    const positionKeys = [
      { frame: 0, value: this.weaponRoot.position.clone() },
      { frame: this.config.returnDuration / (1000/60), value: this.originalPosition.clone() }
    ];
    
    // Configurer les keyframes pour l'animation de retour à la rotation initiale
    const rotationKeys = [
      { frame: 0, value: this.weaponRoot.rotation.clone() },
      { frame: this.config.returnDuration / (1000/60), value: this.originalRotation.clone() }
    ];
    
    // Mettre à jour les animations
    this.positionAnimation.setKeys(positionKeys);
    this.rotationAnimation.setKeys(rotationKeys);
    
    // Configurer l'easing pour les animations de retour (plus doux)
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    
    this.positionAnimation.setEasingFunction(easingFunction);
    this.rotationAnimation.setEasingFunction(easingFunction);
    
    // Démarrer les animations de retour
    this.weapon.getScene().beginAnimation(
      this.weaponRoot,
      0,
      this.config.returnDuration / (1000/60),
      false,
      1.0,
      () => {
        // Animation terminée
        this.isAnimating = false;
      }
    );
  }
  
  // Méthodes pour modifier la configuration du recul
  public setBackwardForce(force: number): void {
    this.config.backwardForce = force;
  }
  
  public setUpwardForce(force: number): void {
    this.config.upwardForce = force;
  }
  
  public setRotationForce(force: number): void {
    this.config.rotationForce = force;
  }
  
  public setRecoilDuration(duration: number): void {
    this.config.recoilDuration = duration;
  }
  
  public setReturnDuration(duration: number): void {
    this.config.returnDuration = duration;
  }
} 