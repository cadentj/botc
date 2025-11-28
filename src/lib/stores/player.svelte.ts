import type { CharacterType } from "$lib/types/characters";

export interface AssignedRole {
	name: string;
	type: CharacterType;
	ability: string;
}

let assignedRole = $state<AssignedRole | null>(null);

export function setAssignedRole(role: AssignedRole) {
	assignedRole = role;
}

export function getAssignedRole() {
	return assignedRole;
}

export function clearAssignedRole() {
	assignedRole = null;
}

