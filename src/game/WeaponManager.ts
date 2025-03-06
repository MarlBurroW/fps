import { Scene, FreeCamera } from "@babylonjs/core";
import { BaseWeapon } from "./Weapons/BaseWeapon";
import { WeaponModule } from "./Weapons/WeaponModules/WeaponModule";

export class WeaponManager {
  private weapons: Map<string, BaseWeapon> = new Map();
  private currentWeapon: BaseWeapon | null = null;

  constructor() {}

  public registerWeapon(name: string, weapon: BaseWeapon): void {
    this.weapons.set(name, weapon);

    // Si c'est la première arme, la définir comme arme actuelle
    if (!this.currentWeapon) {
      this.currentWeapon = weapon;
    }
  }

  public getWeapon(name: string): BaseWeapon | null {
    return this.weapons.get(name) || null;
  }

  public switchWeapon(name: string): boolean {
    const weapon = this.weapons.get(name);
    if (weapon) {
      if (this.currentWeapon) {
        // Cacher l'arme actuelle
        this.currentWeapon.setVisibility(false);
      }

      // Afficher la nouvelle arme
      weapon.setVisibility(true);
      this.currentWeapon = weapon;
      return true;
    }
    return false;
  }

  public getCurrentWeapon(): BaseWeapon | null {
    return this.currentWeapon;
  }

  public addModuleToWeapon(weaponName: string, module: WeaponModule): boolean {
    const weapon = this.weapons.get(weaponName);
    if (weapon) {
      module.apply(weapon);
      return true;
    }
    return false;
  }
}
