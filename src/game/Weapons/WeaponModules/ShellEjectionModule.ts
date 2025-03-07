import { WeaponModule } from "./WeaponModule";
import { BaseWeapon } from "../BaseWeapon";
import { ShellEffect } from "../../Effects/ShellEffect";
import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, PointLight } from "@babylonjs/core";

// Énumération pour le sens d'éjection des douilles
export enum EjectionSide {
  RIGHT = "right",
  LEFT = "left"
}

export class ShellEjectionModule implements WeaponModule {
  private shellEffect: ShellEffect;
  private weapon: BaseWeapon | null = null;
  private ejectionDelay: number = 0; // Pas de délai supplémentaire car ShellEffect a déjà un délai
  private ejectionPosition: Vector3; // Position relative à l'arme pour l'éjection des douilles
  private ejectionSide: EjectionSide; // Sens d'éjection des douilles
  private debugMarker: any = null;

  constructor(
    scene: Scene, 
    ejectionPosition: Vector3 = new Vector3(-0.1, 0.05, -0.5), // Par défaut, légèrement à droite et au-dessus
    ejectionSide: EjectionSide = EjectionSide.RIGHT,
    ejectionDelay: number = 0
  ) {
    this.shellEffect = new ShellEffect(scene);
    this.ejectionPosition = ejectionPosition;
    this.ejectionSide = ejectionSide;
    this.ejectionDelay = ejectionDelay;
  }

  apply(weapon: BaseWeapon): void {
    this.weapon = weapon;
  }

  onFire(position: Vector3, direction: Vector3): void {
    if (!this.weapon) return;
    
    // Obtenir la racine de l'arme
    const weaponRoot = this.weapon.getWeaponRoot();
    if (!weaponRoot) return;
    
    // Utiliser directement la position locale d'éjection
    // Pas besoin de transformer en position mondiale car nous allons attacher les douilles à l'arme
    
    // Calculer la direction d'éjection en fonction du sens choisi
    const ejectionDirection = this.getEjectionDirection(direction);
    
    // Éjecter la douille avec la position locale et la direction d'éjection
    // Passer également la racine de l'arme pour que les douilles soient attachées à l'arme
    this.shellEffect.eject(this.ejectionPosition, ejectionDirection, weaponRoot);
  }

  // Méthode pour calculer la direction d'éjection en fonction du sens choisi
  private getEjectionDirection(direction: Vector3): Vector3 {
    // Vecteur vers le haut
    const upVector = new Vector3(0, 1, 0);
    
    // Calculer le vecteur à droite ou à gauche en fonction du sens choisi
    let sideVector: Vector3;
    if (this.ejectionSide === EjectionSide.RIGHT) {
      // Vecteur à droite (produit vectoriel du vecteur vers le haut et de la direction)
      sideVector = Vector3.Cross(upVector, direction).normalize();
    } else {
      // Vecteur à gauche (produit vectoriel de la direction et du vecteur vers le haut)
      sideVector = Vector3.Cross(direction, upVector).normalize();
    }
    
    // Combiner les vecteurs pour obtenir la direction d'éjection
    // - Principalement vers le côté choisi
    // - Un peu vers le haut
    // - Un peu vers l'arrière
    return sideVector.scale(1.2)
      .add(upVector.scale(0.8))
      .add(direction.scale(-0.4))
      .normalize();
  }

  // Méthode de débogage pour visualiser la position d'éjection des douilles
  public debugEjectionPosition(visible: boolean = true): void {
    if (!this.weapon) return;
    
    // Supprimer l'ancien marqueur s'il existe
    if (this.debugMarker) {
      this.debugMarker.dispose();
      this.debugMarker = null;
    }
    
    if (!visible) return;
    
    const scene = this.weapon.getScene();
    const weaponRoot = this.weapon.getWeaponRoot();
    
    if (!weaponRoot) return;
    
    // Créer un marqueur sphérique à la position d'éjection locale
    this.debugMarker = MeshBuilder.CreateSphere("ejectionMarker", { diameter: 0.1 }, scene);
    
    // Positionner le marqueur à la position d'éjection locale par rapport à l'arme
    this.debugMarker.position = this.ejectionPosition.clone();
    
    // Attacher le marqueur à l'arme pour qu'il suive ses mouvements
    this.debugMarker.parent = weaponRoot;
    
    // Rendre le marqueur visible avec une couleur verte plus lumineuse
    const material = new StandardMaterial("ejectionMarkerMaterial", scene);
    material.diffuseColor = new Color3(0, 1, 0);
    material.emissiveColor = new Color3(0, 1, 0);
    material.specularColor = new Color3(1, 1, 1);
    material.specularPower = 64;
    this.debugMarker.material = material;
    
    // Ajouter une lumière pour rendre le marqueur plus visible
    const light = new PointLight("ejectionMarkerLight", new Vector3(0, 0, 0), scene);
    light.diffuse = new Color3(0, 1, 0);
    light.intensity = 0.5;
    light.parent = this.debugMarker;
    
    // Afficher la position dans la console pour le débogage
    // console.log("Position d'éjection locale:", this.ejectionPosition);
    // console.log("Position d'éjection mondiale:", this.getEjectionPosition());
  }
}
