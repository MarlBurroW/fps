import { WeaponModule } from "./WeaponModule";
import { BaseWeapon } from "../BaseWeapon";
import { Vector3 } from "@babylonjs/core";

export class EnhancedRecoilModule implements WeaponModule {
  private recoilMultiplier: number;
  private weapon: BaseWeapon;

  constructor(recoilMultiplier: number = 1.5) {
    this.recoilMultiplier = recoilMultiplier;
  }

  apply(weapon: BaseWeapon): void {
    this.weapon = weapon;
    // Augmenter le recul de l'arme
    weapon.recoilAmount *= this.recoilMultiplier;
  }
}
