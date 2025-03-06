import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsImpostor,
} from "@babylonjs/core";

export class BloodEffect {
  private scene: Scene;
  private bloodDrops: any[] = [];
  private maxBloodDrops: number = 100;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public create(position: Vector3): void {
    // Nombre de gouttes de sang
    const bloodDropsCount = 15;

    // Créer plusieurs sphères rouges pour simuler des gouttes de sang
    for (let i = 0; i < bloodDropsCount; i++) {
      // Créer une petite sphère
      const bloodDrop = MeshBuilder.CreateSphere(
        "bloodDrop",
        { diameter: 0.05 + Math.random() * 0.1 }, // Taille aléatoire
        this.scene
      );

      // Matériau rouge pour le sang
      const bloodMaterial = new StandardMaterial("bloodMat", this.scene);
      bloodMaterial.diffuseColor = new Color3(0.8, 0, 0);
      bloodMaterial.emissiveColor = new Color3(0.3, 0, 0); // Pour qu'il brille légèrement
      bloodDrop.material = bloodMaterial;

      // Positionner à l'endroit de l'impact
      bloodDrop.position = position.clone();

      // Ajouter une vélocité aléatoire pour l'explosion
      const velocity = new Vector3(
        (Math.random() - 0.5) * 0.5, // X: -0.25 à 0.25
        Math.random() * 0.5, // Y: 0 à 0.5 (vers le haut)
        (Math.random() - 0.5) * 0.5 // Z: -0.25 à 0.25
      );

      // Ajouter de la physique si disponible
      if (this.scene.getPhysicsEngine()) {
        bloodDrop.physicsImpostor = new PhysicsImpostor(
          bloodDrop,
          PhysicsImpostor.SphereImpostor,
          { mass: 0.05, friction: 0.8, restitution: 0.1 },
          this.scene
        );

        bloodDrop.physicsImpostor.applyImpulse(
          velocity,
          bloodDrop.position.clone()
        );
      } else {
        // Animation manuelle si pas de physique
        const gravity = -9.81;
        let yVelocity = velocity.y;

        const animationInterval = setInterval(() => {
          // Appliquer la gravité
          yVelocity += gravity * 0.01;

          // Déplacer la goutte
          bloodDrop.position.x += velocity.x * 0.05;
          bloodDrop.position.y += yVelocity * 0.05;
          bloodDrop.position.z += velocity.z * 0.05;

          // Si la goutte touche le sol, arrêter son mouvement vertical
          if (bloodDrop.position.y < 0.025) {
            bloodDrop.position.y = 0.025;
            yVelocity = 0;
            velocity.x *= 0.9; // Friction
            velocity.z *= 0.9; // Friction

            // Arrêter l'animation quand la goutte est presque immobile
            if (Math.abs(velocity.x) < 0.01 && Math.abs(velocity.z) < 0.01) {
              clearInterval(animationInterval);
            }
          }
        }, 16);
      }

      // Ajouter à la liste
      this.bloodDrops.push(bloodDrop);

      // Limiter le nombre de gouttes
      if (this.bloodDrops.length > this.maxBloodDrops) {
        const oldestDrop = this.bloodDrops.shift();
        if (oldestDrop) {
          oldestDrop.dispose();
        }
      }

      // Supprimer après un certain temps
      setTimeout(() => {
        const index = this.bloodDrops.indexOf(bloodDrop);
        if (index !== -1) {
          this.bloodDrops.splice(index, 1);
          bloodDrop.dispose();
        }
      }, 5000);
    }
  }
}
