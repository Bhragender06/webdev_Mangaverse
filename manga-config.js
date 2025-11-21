// Central manga configuration for titles, covers, counts and PDF path templates
// Use {vol2} for 2-digit volume, {vol3} for 3-digit volume, {chap2}/{chap3} similarly
// Adjust templates if your filenames differ.

window.MANGA_CONFIG = {
	'demon-slayer': {
		title: 'Demon Slayer: Kimetsu no Yaiba',
		cover: 'photos/DS.jpg',
		volumesCount: 23,
		unitLabel: 'Volume',
		// Example existing pattern: Demon Slayer/Demon Slayer [Volume 01].pdf
		pathTemplate: 'Demon Slayer/Demon Slayer [Volume {vol2}].pdf',
	},
	'attack-on-titan': {
		title: 'Attack on Titan',
		cover: 'photos/ATO.jpg',
		volumesCount: 143,
		unitLabel: 'Chapter',
		// Guess a common pattern. If your files are named differently, update this.
		// Tries chapter-based naming like: attack on titan/Attack on Titan [Chapter 001].pdf
		pathTemplate: 'attack on titan/Attack on Titan [Chapter {chap3}].pdf',
	}
};

window.buildPdfPath = function(mangaId, index) {
	const cfg = window.MANGA_CONFIG[mangaId];
	if (!cfg) return '';
	const vol2 = String(index).padStart(2, '0');
	const vol3 = String(index).padStart(3, '0');
	const chap2 = vol2;
	const chap3 = vol3;
	return cfg.pathTemplate
		.replaceAll('{vol2}', vol2)
		.replaceAll('{vol3}', vol3)
		.replaceAll('{chap2}', chap2)
		.replaceAll('{chap3}', chap3);
};


