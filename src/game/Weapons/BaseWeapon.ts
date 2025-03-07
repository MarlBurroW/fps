import { Scene, Vector3, FreeCamera, PointLight, Mesh, MeshBuilder, Color3, StandardMaterial } from "@babylonjs/core";
import { WeaponModule } from "./WeaponModules/WeaponModule";

export abstract class BaseWeapon {
  protected scene: Scene;
  protected camera: FreeCamera;
  protected weaponRoot: Mesh | null = null;
  protected modules: WeaponModule[] = [];
  protected muzzlePosition: Vector3;

  // Propriétés communes
  public fireRate: number = 100; // ms entre chaque tir
  public damage: number = 10;
  public spread: number = 0.03;
  public recoilAmount: number = 0.1;
  public automatic: boolean = true;

  constructor(scene: Scene, camera: FreeCamera) {
    this.scene = scene;
    this.camera = camera;

    this.setupWeapon().then(() => {
      this.initialize();
    });
  }

  // Méthodes abstraites que les sous-classes doivent implémenter
  protected abstract createWeaponMesh(): Promise<Mesh>;
  protected abstract setupMeshPositioning(): Promise<void>;
  protected abstract initialize(): Promise<void>;
  protected abstract setupMuzzlePosition(): void;
  // Méthodes communes
  public getMuzzlePosition(): Vector3 {
    if (!this.weaponRoot) {
      // Si l'arme n'est pas encore chargée, retourner la position de la caméra
      return this.camera.position.clone();
    }
    
    // Créer un vecteur pour la position du muzzle dans l'espace local de l'arme
    const localMuzzlePosition = this.muzzlePosition.clone();
    
    // Transformer la position locale en position mondiale en utilisant la matrice de l'arme
    const worldMatrix = this.weaponRoot.getWorldMatrix();
    const worldMuzzlePosition = Vector3.TransformCoordinates(localMuzzlePosition, worldMatrix);
    
    return worldMuzzlePosition;
  }

  // Méthode pour attacher un mesh à l'arme à une position spécifique
  public attachMeshToWeapon(mesh: Mesh, localPosition: Vector3): void {
    if (!this.weaponRoot) return;
    
    // Positionner le mesh à la position locale spécifiée
    mesh.position = localPosition.clone();
    
    // Attacher le mesh à l'arme pour qu'il suive ses mouvements
    mesh.parent = this.weaponRoot;
  }

  // Ajouter getter pour le mesh
  public getWeaponRoot(): Mesh | null {
    return this.weaponRoot;
  }

  public fire(direction: Vector3): void {
    const position = this.getMuzzlePosition();
    
    // Notifier tous les modules du tir
    this.modules.forEach(module => {
      if (module.onFire) {
        module.onFire(position, direction);
      }
    });
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

  public getScene(): Scene {
    return this.scene;
  }

  public addModule(module: WeaponModule): void {
    this.modules.push(module);
    module.apply(this);
  }

  public getModules(): WeaponModule[] {
    return this.modules;
  }

  protected async setupWeapon(): Promise<void> {
    this.weaponRoot = await this.createWeaponMesh();
    if (this.weaponRoot) {
      await this.setupMeshPositioning();
      this.setupMuzzlePosition();  // Appeler la méthode ici
      this.weaponRoot.parent = this.camera;
      
      // Rendre l'arme invisible par défaut
      this.setVisibility(false);
    }
  }

  public setVisibility(visible: boolean): void {
    if (!this.weaponRoot) return;
    
    this.weaponRoot.setEnabled(visible);
    this.weaponRoot.getChildMeshes().forEach(mesh => {
      mesh.setEnabled(visible);
    });
  } 

  // Méthode de débogage pour visualiser la position du muzzle
  public debugMuzzlePosition(visible: boolean = true): void {
    // Supprimer l'ancien marqueur s'il existe
    const oldMarker = this.scene.getMeshByName("muzzleMarker");
    if (oldMarker) {
      oldMarker.dispose();
    }
    
    if (!visible) return;
    
    // Créer un petit marqueur sphérique à la position du muzzle
    const muzzlePosition = this.getMuzzlePosition();
    const marker = MeshBuilder.CreateSphere("muzzleMarker", { diameter: 0.05 }, this.scene);
    marker.position = muzzlePosition;
    
    // Rendre le marqueur visible avec une couleur rouge
    const material = new StandardMaterial("muzzleMarkerMaterial", this.scene);
    material.diffuseColor = new Color3(1, 0, 0);
    material.emissiveColor = new Color3(1, 0, 0);
    marker.material = material;
  }
}
