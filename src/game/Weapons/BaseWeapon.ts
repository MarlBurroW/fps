import { Scene, Vector3, FreeCamera, PointLight, Mesh } from "@babylonjs/core";

export abstract class BaseWeapon {
  protected scene: Scene;
  protected camera: FreeCamera;
  protected weaponRoot: Mesh;
  protected muzzlePosition: Vector3;
  protected muzzleLight: PointLight;

  // Propriétés communes
  public fireRate: number = 100; // ms entre chaque tir
  public damage: number = 10;
  public spread: number = 0.03;
  public recoilAmount: number = 0.1;
  public automatic: boolean = true;

  constructor(scene: Scene, camera: FreeCamera) {
    this.scene = scene;
    this.camera = camera;
    this.weaponRoot = this.createWeaponMesh();
    this.setupWeapon();
  }

  // Méthodes abstraites que les sous-classes doivent implémenter
  protected abstract createWeaponMesh(): Mesh;

  // Méthodes communes
  public getMuzzlePosition(): Vector3 {
    return this.muzzlePosition.clone();
  }

  public flash(): void {
    // Effet de flash de base
    if (this.muzzleLight) {
      this.muzzleLight.intensity = 15;
      setTimeout(() => {
        this.muzzleLight.intensity = 0;
      }, 50);
    }
  }

  public applyRecoil(): void {
    // Recul de base
    if (this.weaponRoot) {
      this.weaponRoot.position.z += this.recoilAmount;
      setTimeout(() => {
        this.weaponRoot.position.z -= this.recoilAmount;
      }, 50);
    }
  }

  public getSpread(): number {
    return this.spread;
  }

  public getDamage(): number {
    return this.damage;
  }

  public isAutomatic(): boolean {
    return this.automatic;
  }

  public getFireRate(): number {
    return this.fireRate;
  }

  protected setupWeapon(): void {
    // Configuration de base commune à toutes les armes
    this.weaponRoot.parent = this.camera;
    this.weaponRoot.position = new Vector3(0.3, -0.3, 1);
  }

  public setVisibility(visible: boolean): void {
    if (this.weaponRoot) {
      this.weaponRoot.isVisible = visible;
    }
  }
}
