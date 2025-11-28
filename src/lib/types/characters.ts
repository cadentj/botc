export type CharacterType = "townsfolk" | "outsiders" | "minions" | "demons";

export interface Character {
    name: string;
    type: CharacterType;
    ability: string;
    icon: string; // Lucide icon name
    firstNightOrder?: number; // Order to wake on first night (undefined = doesn't wake)
    otherNightOrder?: number; // Order to wake on other nights (undefined = doesn't wake)
}
