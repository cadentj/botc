import type { Component } from 'svelte';

export type CharacterType = "townsfolk" | "outsiders" | "minions" | "demons";

export type LucideIcon = Component<{ size?: number | string; class?: string }>;

export interface Character {
    name: string;
    type: CharacterType;
    ability: string;
    icon: LucideIcon;
    firstNightOrder?: number; // Order to wake on first night (undefined = doesn't wake)
    otherNightOrder?: number; // Order to wake on other nights (undefined = doesn't wake)
}

export interface HelperToken {
    id: string;
    name: string;
    forCharacter: string; // character name this token belongs to
    alwaysAvailable?: boolean; // if true, token is always shown regardless of selected characters
}
