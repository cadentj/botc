let selectedCharacters = $state<string[]>([]);

export function setSelectedCharacters(characters: string[]) {
	selectedCharacters = characters;
}

export function clearSelectedCharacters() {
	selectedCharacters = [];
}

export function getSelectedCharacters() {
	return selectedCharacters;
}

