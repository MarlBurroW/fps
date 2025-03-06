import { Scene, Vector3, Color3 } from "@babylonjs/core";

import { SpriteManager, Sprite } from "@babylonjs/core/Sprites";

export class TargetManager {
  private scene: Scene;
  private targets: Sprite[] = [];
  private targetCount: number;

  constructor(scene: Scene, targetCount: number) {
    this.scene = scene;
    this.targetCount = targetCount;
    this.createTargets();
  }

  public checkHit(
    rayStart: Vector3,
    rayEnd: Vector3
  ): { hit: boolean; targetIndex: number; position: Vector3 } {
    // Vérifier si le rayon intersecte une cible
    for (let i = 0; i < this.targets.length; i++) {
      const target = this.targets[i];

      // Vérifier si la cible est active
      if (!target.isVisible) continue;

      // Calculer la distance entre le rayon et le centre de la cible
      const targetPos = target.position;
      const rayDir = rayEnd.subtract(rayStart).normalize();
      const targetToRayStart = targetPos.subtract(rayStart);

      // Projection du vecteur targetToRayStart sur rayDir
      const projection = Vector3.Dot(targetToRayStart, rayDir);

      // Si la projection est négative, le rayon s'éloigne de la cible
      if (projection < 0) continue;

      // Calculer le point le plus proche sur le rayon
      const closestPoint = rayStart.add(rayDir.scale(projection));

      // Calculer la distance entre ce point et le centre de la cible
      const distance = Vector3.Distance(closestPoint, targetPos);

      // Vérifier si le point est entre le début et la fin du rayon
      const distanceFromStart = Vector3.Distance(rayStart, closestPoint);
      const rayLength = Vector3.Distance(rayStart, rayEnd);

      // Si le point n'est pas sur le segment du rayon, continuer
      if (distanceFromStart > rayLength) continue;

      // Si la distance est inférieure au rayon de la cible, il y a collision
      if (distance < 1.0) {
        // Désactiver la cible touchée
        target.isVisible = false;

        // Réactiver la cible après un délai
        setTimeout(() => {
          // Repositionner la cible à un nouvel endroit aléatoire
          const x = Math.random() * 40 - 20;
          const z = Math.random() * 20 + 5;
          target.position = new Vector3(x, 1.8, z);
          target.isVisible = true;
        }, 3000);

        return {
          hit: true,
          targetIndex: i,
          position: closestPoint,
        };
      }
    }

    return { hit: false, targetIndex: -1, position: Vector3.Zero() };
  }

  private createTargets(): void {
    // Tableau des images disponibles
    const targetImages = ["assets/micka.jpeg", "assets/remi.jpeg"];

    // Création de plusieurs cibles
    for (let i = 0; i < this.targetCount; i++) {
      // Choisir aléatoirement une image
      const randomImageIndex = Math.floor(Math.random() * targetImages.length);
      const targetImage = targetImages[randomImageIndex];

      // Créer un gestionnaire de sprites individuel pour chaque cible
      const spriteManager = new SpriteManager(
        "targetManager" + i,
        targetImage,
        1, // Un seul sprite par gestionnaire
        512, // Taille de la texture
        this.scene
      );

      const target = new Sprite("target" + i, spriteManager);
      target.width = 2;
      target.height = 2;

      // S'assurer que le sprite utilise toute l'image
      target.invertU = false;
      target.invertV = false;

      // Positionnement aléatoire des cibles
      const x = Math.random() * 40 - 20;
      const z = Math.random() * 20 + 5;
      const y = 1.8;

      target.position = new Vector3(x, y, z);

      // Ajout de la cible au tableau
      this.targets.push(target);
    }
  }
}
