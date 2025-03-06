import { Scene, PointLight, Color3, Vector3 } from "@babylonjs/core";

export class LightPool {
  private scene: Scene;
  private lights: PointLight[] = [];
  private maxLights: number;

  constructor(scene: Scene, maxLights: number) {
    this.scene = scene;
    this.maxLights = maxLights;
    this.initializeLights();
  }

  public getLight(): PointLight | null {
    // Chercher une lumière disponible (intensité = 0)
    for (const light of this.lights) {
      if (light.intensity === 0) {
        light.intensity = 15;
        light.range = 25;
        light.diffuse = new Color3(1, 0.7, 0);
        light.specular = new Color3(1, 0.7, 0);
        return light;
      }
    }

    // Si toutes les lumières sont utilisées et qu'on n'a pas atteint la limite
    if (this.lights.length < this.maxLights) {
      console.log("Création d'une nouvelle lumière (pool épuisé)");
      const newLight = new PointLight(
        "dynamicLight" + Date.now(),
        new Vector3(0, 0, 0),
        this.scene
      );
      newLight.diffuse = new Color3(1, 0.7, 0);
      newLight.specular = new Color3(1, 0.7, 0);
      newLight.intensity = 15;
      newLight.range = 25;

      this.lights.push(newLight);
      return newLight;
    }

    return null;
  }

  public releaseLight(light: PointLight): void {
    // Réinitialiser la lumière pour réutilisation
    light.intensity = 0;
    light.parent = null;
  }

  private initializeLights(): void {
    // Pré-créer un pool de lumières désactivées
    for (let i = 0; i < this.maxLights / 2; i++) {
      const light = new PointLight(
        "poolLight" + i,
        new Vector3(0, 0, 0),
        this.scene
      );
      light.intensity = 0; // Désactivée par défaut
      this.lights.push(light);
    }
  }
}
