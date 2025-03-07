import { 
  Scene, 
  PointLight, 
  Vector3, 
  Color3,
  Mesh, 
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Animation,
  EasingFunction,
  CubicEase
} from "@babylonjs/core";
import { BaseWeapon } from "../BaseWeapon";
import { WeaponModule } from "./WeaponModule";

export interface MuzzleFlashConfig {
  // Intensité de la lumière
  lightIntensity: number;
  // Couleur de la lumière (RGB, valeurs entre 0 et 1)
  lightColor: Color3;
  // Rayon de la lumière
  lightRadius: number;
  // Durée du flash lumineux (ms)
  lightDuration: number;
  // Taille du flash (diamètre)
  flashSize: number;
  // Durée du flash (ms)
  flashDuration: number;
}

export class MuzzleFlashModule implements WeaponModule {
  private weapon: BaseWeapon;
  private scene: Scene;
  private muzzleLight: PointLight;
  private flashMesh: Mesh | null = null;
  private flashMaterial: StandardMaterial | null = null;
  private config: MuzzleFlashConfig;
  private isActive: boolean = false;
  private flareTexture: DynamicTexture;
  
  constructor(
    scene: Scene, 
    config: Partial<MuzzleFlashConfig> = {}
  ) {
    this.scene = scene;
    
    // Configuration par défaut
    this.config = {
      lightIntensity: 15,
      lightColor: new Color3(1, 0.7, 0.3), // Couleur orange-jaune
      lightRadius: 3,
      lightDuration: 50,
      flashSize: 0.3,
      flashDuration: 80,
      ...config
    };
    
    // Créer la lumière
    this.muzzleLight = new PointLight("muzzleFlash", new Vector3(0, 0, 0), scene);
    this.muzzleLight.intensity = 0;
    this.muzzleLight.diffuse = this.config.lightColor;
    this.muzzleLight.range = this.config.lightRadius;
    
    // Créer la texture pour le flash
    this.flareTexture = this.createFlareTexture();
    
    // Créer le mesh de flash
    this.createFlashMesh();
  }
  
  private createFlareTexture(): DynamicTexture {
    // Créer une texture dynamique pour le flare
    const textureSize = 256;
    const texture = new DynamicTexture("flareTexture", textureSize, this.scene, false);
    const ctx = texture.getContext();
    
    // Dessiner un cercle radial avec un dégradé
    const centerX = textureSize / 2;
    const centerY = textureSize / 2;
    const radius = textureSize / 2;
    
    // Créer un dégradé radial
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    // Ajouter des stops de couleur pour le dégradé
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');    // Blanc au centre
    gradient.addColorStop(0.2, 'rgba(255, 220, 100, 0.8)'); // Jaune
    gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.5)');  // Orange
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');           // Transparent à l'extérieur
    
    // Dessiner le cercle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Mettre à jour la texture
    texture.update();
    
    return texture;
  }
  
  private createFlashMesh(): void {
    // Créer un disque pour représenter le flash
    this.flashMesh = MeshBuilder.CreateDisc("flashMesh", { 
      radius: this.config.flashSize / 2,
      tessellation: 16
    }, this.scene);
    
    // Créer un matériau pour le flash
    this.flashMaterial = new StandardMaterial("flashMaterial", this.scene);
    this.flashMaterial.diffuseColor = new Color3(1, 0.7, 0.3); // Couleur orange-jaune
    this.flashMaterial.emissiveColor = new Color3(1, 0.7, 0.3); // Émission de la même couleur
    this.flashMaterial.specularColor = new Color3(1, 1, 1); // Spéculaire blanc
    this.flashMaterial.alpha = 0.9; // Légèrement transparent
    
    // Utiliser la texture du flare
    this.flashMaterial.diffuseTexture = this.flareTexture;
    this.flashMaterial.emissiveTexture = this.flareTexture;
    this.flashMaterial.opacityTexture = this.flareTexture;
    
    // Activer les options de transparence et de lumière
    this.flashMaterial.useAlphaFromDiffuseTexture = true;
    this.flashMaterial.disableLighting = true;
    
    // Appliquer le matériau au mesh
    this.flashMesh.material = this.flashMaterial;
    
    // Cacher le mesh au démarrage
    this.flashMesh.isVisible = false;
    
    // Faire en sorte que le flash soit toujours face à la caméra
    this.flashMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
  }
  
  apply(weapon: BaseWeapon): void {
    this.weapon = weapon;
  }
  
  onFire(position: Vector3, direction: Vector3): void {
    if (this.isActive) return;
    this.isActive = true;
    
    // Obtenir la position du muzzle directement depuis l'arme
    const muzzlePosition = this.weapon.getMuzzlePosition();
    const weaponRoot = this.weapon.getWeaponRoot();
    
    // Positionner la lumière à la position du muzzle
    this.muzzleLight.position = muzzlePosition.clone();
    
    // Positionner le mesh de flash
    if (this.flashMesh) {
      this.flashMesh.position = muzzlePosition.clone();
      
      // Orienter le flash dans la direction du tir
      // Comme le flash est en mode billboard, il sera toujours face à la caméra
      // mais nous pouvons le décaler légèrement dans la direction du tir
      const flashOffset = direction.normalize().scale(0.05);
      this.flashMesh.position.addInPlace(flashOffset);
      
      // Faire apparaître le flash
      this.flashMesh.isVisible = true;
      
      // Animer la taille du flash
      this.animateFlash();
    }
    
    // Activer la lumière
    this.muzzleLight.intensity = this.config.lightIntensity;
    
    // Désactiver après la durée spécifiée
    setTimeout(() => {
      this.muzzleLight.intensity = 0;
      if (this.flashMesh) {
        this.flashMesh.isVisible = false;
      }
      this.isActive = false;
    }, Math.max(this.config.lightDuration, this.config.flashDuration));
  }
  
  private animateFlash(): void {
    if (!this.flashMesh) return;
    
    // Créer une animation pour la taille du flash
    const scaleAnimation = new Animation(
      "flashScale",
      "scaling",
      60, // FPS
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Configurer les keyframes pour l'animation
    const scaleKeys = [
      { frame: 0, value: new Vector3(0.5, 0.5, 0.5) }, // Démarrer petit
      { frame: 5, value: new Vector3(1.5, 1.5, 1.5) }, // Grossir rapidement
      { frame: this.config.flashDuration / (1000/60), value: new Vector3(0.2, 0.2, 0.2) } // Rétrécir progressivement
    ];
    
    // Ajouter les keyframes à l'animation
    scaleAnimation.setKeys(scaleKeys);
    
    // Configurer l'easing pour l'animation
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    scaleAnimation.setEasingFunction(easingFunction);
    
    // Ajouter l'animation au mesh
    this.flashMesh.animations = [scaleAnimation];
    
    // Démarrer l'animation
    this.scene.beginAnimation(
      this.flashMesh,
      0,
      this.config.flashDuration / (1000/60),
      false
    );
  }
  
  // Méthodes pour ajuster la configuration
  public setLightIntensity(intensity: number): void {
    this.config.lightIntensity = intensity;
  }
  
  public setLightColor(color: Color3): void {
    this.config.lightColor = color;
    this.muzzleLight.diffuse = color;
  }
  
  public setFlashSize(size: number): void {
    this.config.flashSize = size;
    if (this.flashMesh) {
      this.flashMesh.scaling = new Vector3(size, size, size);
    }
  }
  
  public dispose(): void {
    this.muzzleLight.dispose();
    this.flareTexture.dispose();
    if (this.flashMesh) {
      this.flashMesh.dispose();
    }
    if (this.flashMaterial) {
      this.flashMaterial.dispose();
    }
  }
} 