import { BaseWeapon } from "./BaseWeapon";
import {
  Scene,
  FreeCamera,
  Vector3,
  Mesh,
  Color3,
  SceneLoader
} from "@babylonjs/core";
import { ShellEjectionModule, EjectionSide } from "./WeaponModules/ShellEjectionModule";
import { ProjectileModule } from "./WeaponModules/ProjectileModule";
import { RecoilModule } from "./WeaponModules/RecoilModule";
import { MuzzleFlashModule } from "./WeaponModules/MuzzleFlashModule";

export class AssaultRifle extends BaseWeapon {
  private weaponMesh: Mesh | null = null;

  constructor(scene: Scene, camera: FreeCamera) {
    super(scene, camera);

    // Propriétés spécifiques à l'assault rifle
    this.fireRate = 100; // Tir rapide
    this.damage = 15;
    this.spread = 0.03;
    this.automatic = true;
  }

  public async initialize(): Promise<void> {
    // Position d'éjection des douilles pour un fusil d'assaut
    // Comme l'arme est orientée avec une rotation de 180° (Math.PI) autour de l'axe Y,
    // les axes X et Z sont inversés
    // - X: -0.08 (à droite de l'arme, négatif car l'arme est tournée à 180°)
    // - Y: 0.03 (légèrement au-dessus)
    // - Z: 0.1 (au milieu de l'arme, positif car nous avons inversé le signe)
    const ejectionPosition = new Vector3(-0.08, 0.03, 0.1);
    console.log("Position d'éjection du fusil d'assaut:", ejectionPosition);
    
    this.addModule(new ShellEjectionModule(
      this.scene, 
      ejectionPosition, 
      EjectionSide.RIGHT // Éjecter les douilles vers la droite
    ));
    
    // Configuration des projectiles pour le fusil d'assaut
    // - Projectiles plus petits et plus rapides
    // - Couleur orange-jaune pour simuler des balles traçantes
    this.addModule(new ProjectileModule(this.scene, {
      speed: 150, // Très rapide
      lifetime: 1500, // Durée de vie plus courte
      size: 0.03, // Plus petit
      color: new Color3(1, 0.7, 0.3), // Couleur orange-jaune chaude
      lightIntensity: 1.0, // Lumière plus intense
      lightRange: 4, // Portée plus grande
      trailWidth: 0.015, // Traînée plus fine
      trailLifetime: 400, // Traînée plus longue pour mieux voir l'effet
      particleEmitRate: 100, // Moins de particules pour améliorer les performances
      particleSize: { min: 0.01, max: 0.03 } // Particules plus petites
    }));
    
    // Configuration du recul pour l'assault rifle:
    // - Force vers l'arrière: 0.15 (recul modéré)
    // - Force vers le haut: 0.05 (léger mouvement vers le haut)
    // - Force de rotation: 0.08 (rotation modérée du canon vers le haut)
    // - Durée du recul: 60ms (rapide)
    // - Durée du retour: 120ms (retour plus lent)
    // - Type d'easing: 2 (ease-out pour un recul rapide puis ralenti)
    this.addModule(new RecoilModule(0.15, 0.05, 0.08, 60, 120, 2));
    
    // Configuration du flash pour l'assault rifle
    this.addModule(new MuzzleFlashModule(this.scene, {
      lightIntensity: 10,
      lightColor: new Color3(1, 0.7, 0.3),
      lightRadius: 8,
      lightDuration: 70,
      flashSize: 0.4,
      flashDuration: 80
    }));
  }

  protected async createWeaponMesh(): Promise<Mesh> {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "/mesh/weapons/",
      "Assault Rifle.glb",
      this.scene
    );
    
    this.weaponMesh = result.meshes[0] as Mesh;
    
    // S'assurer que tous les meshes du modèle sont liés
    result.meshes.forEach(mesh => {
      if (mesh !== this.weaponMesh) {
        mesh.parent = this.weaponMesh;
      }
    });
    
    return this.weaponMesh;
  }

  protected async setupMeshPositioning(): Promise<void> {
    if (!this.weaponRoot) return;
    
    // Positionnement spécifique à l'Assault Rifle
    this.weaponRoot.position = new Vector3(0.5, -0.4, 1.5);
    this.weaponRoot.rotation = new Vector3(0, Math.PI, 0);
    this.weaponRoot.scaling = new Vector3(0.5, 0.5, 0.5); // Si nécessaire
  }

  protected setupMuzzlePosition(): void {
    // Position relative à l'arme pour le point de départ des projectiles
    // La position est définie dans l'espace local de l'arme
    // Comme l'arme est orientée avec une rotation de 180° (Math.PI) autour de l'axe Y,
    // l'axe Z est inversé, donc une valeur positive de Z va vers l'arrière de l'arme
    
    // Pour un fusil d'assaut:
    // - X: 0 (centré horizontalement)
    // - Y: 0.05 (légèrement au-dessus du centre)
    // - Z: -1.2 (à l'avant du canon, négatif car l'arme est tournée à 180°)
    this.muzzlePosition = new Vector3(0, 0.05, -2);
    
    // Activer le débogage pour visualiser la position du muzzle
    // Décommenter cette ligne pour voir un marqueur rouge à la position du muzzle
    // this.debugMuzzlePosition();
    
    // Activer le débogage pour visualiser la position d'éjection des douilles
    // Décommenter cette ligne pour voir un marqueur vert à la position d'éjection des douilles
    this.debugEjectionPosition();
  }

  // Méthode pour activer le débogage de la position d'éjection des douilles
  public debugEjectionPosition(): void {
    // Trouver le module d'éjection des douilles
    const shellEjectionModule = this.modules.find(
      module => module instanceof ShellEjectionModule
    ) as ShellEjectionModule | undefined;
    
    // Activer le débogage si le module existe
    if (shellEjectionModule) {
      shellEjectionModule.debugEjectionPosition(true);
    }
  }
}
