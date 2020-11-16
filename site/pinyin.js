'use strict';

// XXX: w → 21; y → 22
const
	initial_sounds = [
		'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's', 'zh', 'ch', 'sh', 'r', 'j', 'q', 'x', 'w', 'y'
	],
	final_sounds = [
		'a', 'o', 'e', 'i', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'ia', 'iao', 'ie', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng', 'ü', 'üe', 'ue', 'üan', 'ün'
	],
	sound_indexes = {
		// initial sounds
		'b': 0, 'p': 1, 'm': 2, 'f': 3, 'd': 4, 't': 5, 'n': 6, 'l': 7, 'g': 8, 'k': 9, 'h': 10, 'z': 11, 'c': 12, 's': 13, 'zh': 14, 'ch': 15, 'sh': 16, 'r': 17, 'j': 18, 'q': 19, 'x': 20, 'w': 21, 'y': 22,
		// final sounds
		'a': 0, 'o': 1, 'e': 2, 'i': 3, 'er': 4, 'ai': 5, 'ei': 6, 'ao': 7, 'ou': 8, 'an': 9, 'en': 10, 'ang': 11, 'eng': 12, 'ong': 13, 'ia': 14, 'iao': 15, 'ie': 16, 'iu': 17, 'ian': 18, 'in': 19, 'iang': 20, 'ing': 21, 'iong': 22, 'u': 23, 'ua': 24, 'uo': 25, 'uai': 26, 'ui': 27, 'uan': 28, 'un': 29, 'uang': 30, 'ueng': 31, 'ü': 32, 'üe': 33, 'ue': 34, 'üan': 35, 'ün': 36
	};


const assemble_pinyin = (() =>
{
	const
		vowels = [ 'a', 'o', 'e', 'i', 'u', 'ü' ],
		mapping =
		{
			'a': [ 'a', 'ā', 'á', 'ǎ', 'à' ],
			'o': [ 'o', 'ō', 'ó', 'ǒ', 'ò' ],
			'e': [ 'e', 'ē', 'é', 'ě', 'è' ],
			'i': [ 'i', 'ī', 'í', 'ǐ', 'ì' ],
			'u': [ 'u', 'ū', 'ú', 'ǔ', 'ù' ],
			'ü': [ 'ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ' ]
		};

	return (syllables, tone) =>
	{
		for (let i = 0; i < 6; ++i)
		{
			const vowel = vowels[i];
			if (syllables.search(vowel) >= 0)
				return syllables.replace(vowel, mapping[vowel][tone || 0]);
		}
	}
})();


const split_pinyin = (pinyin) =>
{
	const final_start = pinyin.search(/[aoeiuü]/);
	return {
		initial: pinyin.substring(0, final_start),
		final: pinyin.substring(final_start)
	};
};
