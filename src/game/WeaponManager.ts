import { Scene, FreeCamera } from "@babylonjs/core";
import { BaseWeapon } from "./Weapons/BaseWeapon";
import { WeaponModule } from "./Weapons/WeaponModules/WeaponModule";

export class WeaponManager {
  private weapons: Map<string, BaseWeapon> = new Map();
  private currentWeapon: BaseWeapon | null = null;
  private currentWeaponName: string | null = null;

  constructor() {}

  public async registerWeapon(name: string, weapon: BaseWeapon): Promise<void> {
    // Attendre que l'arme soit complètement chargée
   
    this.weapons.set(name, weapon);
    weapon.setVisibility(false);
  }

  public getWeapon(name: string): BaseWeapon | null {
    return this.weapons.get(name) || null;
  }

  public switchWeapon(name: string): boolean {
    if (name === this.currentWeaponName) return false;

    const newWeapon = this.weapons.get(name);
    if (!newWeapon) return false;

    if (this.currentWeapon) {
      this.currentWeapon.setVisibility(false);
    }

    newWeapon.setVisibility(true);
    this.currentWeapon = newWeapon;
    this.currentWeaponName = name;

    return true;
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
