import {
  Scene,
  Vector3,
  ParticleSystem,
  Texture,
  Color4,
} from "@babylonjs/core";

export class TrailEffect {
  private scene: Scene;
  private particleSystem: ParticleSystem;

  constructor(scene: Scene, emitter: any) {
    this.scene = scene;
    this.particleSystem = this.createParticleSystem(emitter);
  }

  public stop(): void {
    this.particleSystem.stop();
    setTimeout(() => {
      this.particleSystem.dispose();
    }, 300); // Attendre que les particules existantes disparaissent
  }

  private createParticleSystem(emitter: any): ParticleSystem {
    // Créer un système de particules pour la traînée
    const trail = new ParticleSystem("trail", 30, this.scene);

    // Utiliser une texture de flamme/lueur
    trail.particleTexture = new Texture("assets/particle.png", this.scene);

    // Couleurs jaune-orange pour la traînée
    trail.color1 = new Color4(1, 0.8, 0, 1);
    trail.color2 = new Color4(1, 0.5, 0, 1);
    trail.colorDead = new Color4(1, 0.3, 0, 0);

    // Taille des particules
    trail.minSize = 0.05;
    trail.maxSize = 0.15;

    // Durée de vie très courte
    trail.minLifeTime = 0.05;
    trail.maxLifeTime = 0.15;

    // Émission rapide
    trail.emitRate = 120;

    // Désactiver la gravité
    trail.gravity = Vector3.Zero();

    // Attacher au projectile
    trail.emitter = emitter;

    // Position fixe derrière le projectile
    trail.minEmitBox = new Vector3(0, 0, -0.1);
    trail.maxEmitBox = new Vector3(0, 0, -0.1);

    // Pas de vélocité
    trail.minEmitPower = 0;
    trail.maxEmitPower = 0;

    // Faire en sorte que les particules soient toujours face à la caméra
    trail.billboardMode = 7;

    // Démarrer l'émission
    trail.start();

    return trail;
  }
}
