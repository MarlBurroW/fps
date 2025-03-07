import { WeaponModule } from "./WeaponModule";
import { BaseWeapon } from "../BaseWeapon";
import { 
  Scene, 
  Vector3, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  PointLight, 
  TrailMesh, 
  Texture, 
  ParticleSystem, 
  Color4,
  DynamicTexture,
  Mesh,
  Quaternion
} from "@babylonjs/core";

// Interface pour la configuration des projectiles
export interface ProjectileConfig {
  // Vitesse du projectile
  speed: number;
  // Durée de vie du projectile (en ms)
  lifetime: number;
  // Taille du projectile
  size: number;
  // Couleur du projectile (RGB, valeurs entre 0 et 1)
  color: Color3;
  // Intensité de la lumière
  lightIntensity: number;
  // Rayon de la lumière
  lightRange: number;
  // Épaisseur de la traînée
  trailWidth: number;
  // Durée de vie de la traînée (en ms)
  trailLifetime: number;
  // Taux d'émission des particules
  particleEmitRate: number;
  // Taille des particules
  particleSize: { min: number, max: number };
}

export class ProjectileModule implements WeaponModule {
  private scene: Scene;
  private weapon: BaseWeapon;
  private config: ProjectileConfig;
  private activeProjectiles: { 
    projectile: any, 
    light: PointLight, 
    particleSystem: ParticleSystem,
    texture: DynamicTexture,
    observer: any,
    trail: Mesh,
    trailMaterial: StandardMaterial
  }[] = [];

  constructor(
    scene: Scene, 
    config: Partial<ProjectileConfig> = {}
  ) {
    this.scene = scene;
    
    // Configuration par défaut
    this.config = {
      speed: 100,
      lifetime: 2000,
      size: 0.05,
      color: new Color3(1, 0.7, 0.3), // Couleur orange-jaune chaude
      lightIntensity: 0.8,
      lightRange: 3,
      trailWidth: 0.03,
      trailLifetime: 500,
      particleEmitRate: 100,
      particleSize: { min: 0.02, max: 0.05 },
      ...config
    };
  }

  apply(weapon: BaseWeapon): void {
    this.weapon = weapon;
  }

  onFire(position: Vector3, direction: Vector3): void {
    this.createProjectile(position, direction);
  }

  private createProjectile(position: Vector3, direction: Vector3): void {
    // Créer le projectile
    const projectile = MeshBuilder.CreateSphere("projectile", { diameter: this.config.size }, this.scene);
    projectile.position = position.clone();

    // Créer un matériau lumineux pour le projectile
    const projectileMaterial = new StandardMaterial("projectileMaterial", this.scene);
    projectileMaterial.emissiveColor = this.config.color; // Utiliser la couleur configurée
    projectileMaterial.diffuseColor = this.config.color;
    projectileMaterial.specularColor = new Color3(1, 1, 1);
    projectileMaterial.specularPower = 64;
    projectile.material = projectileMaterial;

    // Ajouter une lumière au projectile pour l'effet lumineux
    const light = new PointLight("projectileLight", position.clone(), this.scene);
    light.diffuse = this.config.color;
    light.intensity = this.config.lightIntensity;
    light.range = this.config.lightRange;
    light.parent = projectile; // Attacher la lumière au projectile

    // Créer une texture procédurale pour les particules
    const flareTexture = new DynamicTexture("flareTexture", 256, this.scene, false);
    const flareContext = flareTexture.getContext();
    
    // Dessiner un cercle radial avec un dégradé
    const centerX = 128;
    const centerY = 128;
    const radius = 128;
    
    // Créer un dégradé radial
    const gradient = flareContext.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    // Convertir la couleur de Babylon en format CSS
    const r = Math.floor(this.config.color.r * 255);
    const g = Math.floor(this.config.color.g * 255);
    const b = Math.floor(this.config.color.b * 255);
    
    // Ajouter des stops de couleur pour le dégradé
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');                  // Blanc au centre
    gradient.addColorStop(0.2, `rgba(${r + 50}, ${g + 50}, ${b}, 0.8)`); // Couleur plus claire
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.5)`);           // Couleur configurée
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');                        // Transparent à l'extérieur
    
    // Dessiner le cercle
    flareContext.fillStyle = gradient;
    flareContext.beginPath();
    flareContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    flareContext.fill();
    
    // Mettre à jour la texture
    flareTexture.update();

    // Créer un système de particules pour l'effet de feu/fumée
    const particleSystem = new ParticleSystem("projectileParticles", 100, this.scene);
    particleSystem.particleTexture = flareTexture;
    particleSystem.emitter = projectile;
    particleSystem.minEmitBox = new Vector3(0, 0, 0);
    particleSystem.maxEmitBox = new Vector3(0, 0, 0);
    
    // Utiliser la couleur configurée pour les particules
    const color1 = new Color4(this.config.color.r, this.config.color.g, this.config.color.b, 1.0);
    const color2 = new Color4(
      Math.max(0, this.config.color.r - 0.3),
      Math.max(0, this.config.color.g - 0.3),
      Math.max(0, this.config.color.b - 0.3),
      1.0
    );
    const colorDead = new Color4(
      Math.max(0, this.config.color.r - 0.5),
      Math.max(0, this.config.color.g - 0.5),
      Math.max(0, this.config.color.b - 0.5),
      0.0
    );
    
    particleSystem.color1 = color1;
    particleSystem.color2 = color2;
    particleSystem.colorDead = colorDead;
    particleSystem.minSize = this.config.particleSize.min;
    particleSystem.maxSize = this.config.particleSize.max;
    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.3;
    particleSystem.emitRate = this.config.particleEmitRate;
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
    particleSystem.gravity = new Vector3(0, 0, 0);
    particleSystem.direction1 = new Vector3(-0.5, -0.5, -0.5);
    particleSystem.direction2 = new Vector3(0.5, 0.5, 0.5);
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;
    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1.5;
    particleSystem.updateSpeed = 0.01;
    particleSystem.start();

    // Créer une traînée simplifiée (un seul mesh au lieu de plusieurs segments)
    // Utiliser un cylindre allongé qui sera mis à jour pour suivre le projectile
    const trail = MeshBuilder.CreateCylinder(
      "projectileTrail", 
      { 
        height: 1, 
        diameter: this.config.trailWidth,
        tessellation: 8 
      }, 
      this.scene
    );
    
    // Créer un matériau pour la traînée
    const trailMaterial = new StandardMaterial("trailMaterial", this.scene);
    trailMaterial.emissiveColor = new Color3(0.7, 0.7, 0.7); // Gris clair
    trailMaterial.diffuseColor = new Color3(0.7, 0.7, 0.7);
    trailMaterial.alpha = 0.3; // Très transparent
    trailMaterial.disableLighting = true;
    trail.material = trailMaterial;
    
    // Position initiale de la traînée
    trail.position = position.clone();
    
    // Configurer la physique du projectile
    const normalizedDir = direction.normalize();
    const velocity = normalizedDir.scale(this.config.speed);
    
    // Position précédente pour calculer la traînée
    let previousPosition = position.clone();
    
    // Mettre à jour la position du projectile et la traînée
    const observer = this.scene.onBeforeRenderObservable.add(() => {
      const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
      
      // Sauvegarder la position actuelle
      previousPosition = projectile.position.clone();
      
      // Mettre à jour la position du projectile
      projectile.position.addInPlace(velocity.scale(deltaTime));
      
      // Calculer la direction et la longueur de la traînée
      const trailDir = projectile.position.subtract(previousPosition);
      const length = trailDir.length();
      
      if (length > 0.001) {
        // Positionner la traînée au milieu entre la position précédente et la position actuelle
        const midPoint = previousPosition.add(trailDir.scale(0.5));
        trail.position = midPoint;
        
        // Ajuster la hauteur du cylindre pour correspondre à la distance parcourue
        trail.scaling.y = length * 5; // Multiplier par 5 pour une traînée plus longue
        
        // Orienter le cylindre dans la direction du mouvement
        const rotationAxis = Vector3.Cross(new Vector3(0, 1, 0), trailDir.normalize());
        const rotationAngle = Math.acos(Vector3.Dot(new Vector3(0, 1, 0), trailDir.normalize()) / trailDir.normalize().length());
        
        if (rotationAxis.length() > 0.001) {
          if (!trail.rotationQuaternion) {
            trail.rotationQuaternion = Quaternion.RotationAxis(rotationAxis.normalize(), rotationAngle);
          } else {
            trail.rotationQuaternion = Quaternion.RotationAxis(rotationAxis.normalize(), rotationAngle);
          }
        }
      }
    });

    // Ajouter le projectile à la liste des projectiles actifs
    const projectileData = {
      projectile,
      light,
      particleSystem,
      texture: flareTexture,
      observer,
      trail,
      trailMaterial
    };
    this.activeProjectiles.push(projectileData);

    // Nettoyer le projectile après un certain temps
    setTimeout(() => {
      this.cleanupProjectile(projectileData);
    }, this.config.lifetime);
  }

  private cleanupProjectile(projectileData: any): void {
    // Supprimer l'observateur
    this.scene.onBeforeRenderObservable.remove(projectileData.observer);
    
    // Arrêter le système de particules
    projectileData.particleSystem.stop();
    
    // Attendre un peu pour que les dernières particules disparaissent
    setTimeout(() => {
      // Disposer de toutes les ressources
      projectileData.projectile.dispose();
      projectileData.light.dispose();
      projectileData.particleSystem.dispose();
      projectileData.texture.dispose();
      projectileData.trail.dispose();
      projectileData.trailMaterial.dispose();
      
      // Supprimer le projectile de la liste des projectiles actifs
      const index = this.activeProjectiles.indexOf(projectileData);
      if (index !== -1) {
        this.activeProjectiles.splice(index, 1);
      }
    }, 300);
  }

  // Méthode pour nettoyer tous les projectiles actifs
  public dispose(): void {
    // Nettoyer tous les projectiles actifs
    while (this.activeProjectiles.length > 0) {
      this.cleanupProjectile(this.activeProjectiles[0]);
    }
  }
  
  // Méthodes pour ajuster la configuration
  public setProjectileSpeed(speed: number): void {
    this.config.speed = speed;
  }
  
  public setProjectileLifetime(lifetime: number): void {
    this.config.lifetime = lifetime;
  }
  
  public setProjectileSize(size: number): void {
    this.config.size = size;
  }
  
  public setProjectileColor(color: Color3): void {
    this.config.color = color;
  }
  
  public setLightIntensity(intensity: number): void {
    this.config.lightIntensity = intensity;
  }
  
  public setLightRange(range: number): void {
    this.config.lightRange = range;
  }
} 