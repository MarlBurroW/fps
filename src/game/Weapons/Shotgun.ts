import { BaseWeapon } from "./BaseWeapon";
import { Scene, FreeCamera, MeshBuilder, Vector3, Mesh } from "@babylonjs/core";
import { ShellEjectionModule } from "./WeaponModules/ShellEjectionModule";

export class Shotgun extends BaseWeapon {
  constructor(scene: Scene, camera: FreeCamera) {
    super(scene, camera);

    // Propriétés spécifiques au shotgun
    this.fireRate = 800; // Tir lent
    this.damage = 50;
    this.spread = 0.1; // Spread important
    this.automatic = false; // Pas de tir automatique
  }

  public async initialize(): Promise<void> {
    // L'initialisation des modules est maintenant gérée dans FPSGame.ts
  }

  protected async setupMeshPositioning(): Promise<void> {
    if (!this.weaponRoot) return;
    
    // Positionnement spécifique au Shotgun
    this.weaponRoot.position = new Vector3(0.5, -0.4, 1.5);
    this.weaponRoot.rotation = new Vector3(0, Math.PI, 0);
  }

  protected async createWeaponMesh(): Promise<Mesh> {
    // Création du mesh spécifique au shotgun
    const gunBody = MeshBuilder.CreateBox(
      "shotgunBody",
      { width: 0.12, height: 0.12, depth: 0.7 },
      this.scene
    );

    return gunBody;
  }

  protected setupMuzzlePosition(): void {
    // Position relative à l'arme pour le point de départ des projectiles
    // La position est définie dans l'espace local de l'arme
    // Comme l'arme est orientée avec une rotation de 180° (Math.PI) autour de l'axe Y,
    // l'axe Z est inversé, donc une valeur positive de Z va vers l'arrière de l'arme
    
    // Pour un fusil à pompe:
    // - X: 0 (centré horizontalement)
    // - Y: 0.05 (légèrement au-dessus du centre)
    // - Z: -0.8 (à l'avant du canon, négatif car l'arme est tournée à 180°)
    this.muzzlePosition = new Vector3(0, 0.05, -0.8);
    
    // Activer le débogage pour visualiser la position d'éjection des douilles
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
