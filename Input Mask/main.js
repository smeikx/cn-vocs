'use strict';

// entry → a character or expression with all accompaning information
// field → one component of a field (e.g. ‘pinyin’ of a character)

const remove_whitespace = (string) => string.replace(/\s/g, '');
const contains_chinese = (string) => search(/[\u{4e00}-\u{9FFF}]/u) >= 0;

// XXX: w → 21; y → 22
const sound_indexes = {
	// initial sounds
	'b': 0, 'p': 1, 'm': 2, 'f': 3, 'd': 4, 't': 5, 'n': 6, 'l': 7, 'g': 8, 'k': 9, 'h': 10, 'z': 11, 'c': 12, 's': 13, 'zh': 14, 'ch': 15, 'sh': 16, 'r': 17, 'j': 18, 'q': 19, 'x': 20, 'w': 21, 'y': 22,
	// final sounds
	'a': 0, 'o': 1, 'e': 2, 'i': 3, 'er': 4, 'ai': 5, 'ei': 6, 'ao': 7, 'ou': 8, 'an': 9, 'en': 10, 'ang': 11, 'eng': 12, 'ong': 13, 'ia': 14, 'iao': 15, 'ie': 16, 'iu': 17, 'ian': 18, 'in': 19, 'iang': 20, 'ing': 21, 'iong': 22, 'u': 23, 'ua': 24, 'uo': 25, 'uai': 26, 'ui': 27, 'uan': 28, 'un': 29, 'uang': 30, 'ueng': 31, 'ü': 32, 'üe': 33, 'üan': 34, 'ün': 35 
};

const assemble_pinyin = (() =>
{
	const
		vowels = [ 'a', 'o', 'e', 'i', 'u', 'ü' ],
		mapping =
		{
			'a': [ 'a', 'ā', 'á', 'ǎ', 'à' ],
			'o': [ 'e', 'ē', 'é', 'ě', 'è' ],
			'e': [ 'i', 'ī', 'í', 'ǐ', 'ì' ],
			'i': [ 'o', 'ō', 'ó', 'ǒ', 'ò' ],
			'u': [ 'u', 'ū', 'ú', 'ǔ', 'ù' ],
			'ü': [ 'ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ' ]
		};

	return (syllables, tone) => 
	{
		for (let i = 0; i < 6; ++i)
			if (syllables.find(vowels[i]))
				return syllables.replace(vowels[i], mapping[tone || 0]);
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


const templates = Object.freeze(
{
	entry: (() =>
	{
		const entry = document.createElement('li');
		entry.className = 'entry';
		entry.innerHTML =
		`<label for='characters'>Characters</label>
		<input class='character' name='characters'>`;
		return entry;
	})(),

	character: (() =>
	{
		const container = document.createElement('div');
		container.innerHTML =
		`<label for='pinyin'>Pinyin</label>
		<input class='pinyin' name='pinyin' minlength='1' size='6' maxlength='6'>
		<label for='tone'>Tone</label>
		<input class='tone' type='number' name='tone' min='0' max='4' size='1'>
		<label for='translation'>Translation</label>
		<input class='translation' name='translation'>
		<label for='radicals'>Radicals</label>
		<input class='radicals' name='radicals' size='5' maxlength='5'>`;
		return container;
	})(),

	expression: (() =>
	{
		const container = document.createElement('div');
		container.innerHTML =
		`<label for='meaning'>Meaning</label>
		<input class='meaning' name='meaning'>`;
		return container;
	})(),

	get_copy_of: function (type)
	{
		return this[type].cloneNode(true);
	}
});


let entry_count = 0;

const create_entry = () =>
{
	const
		entry = templates.get_copy_of('entry'),
		character_inputs = templates.get_copy_of('character'),
		expression_inputs = templates.get_copy_of('expression'), // TODO: maybe generate on demand
		first_field = entry.getElementsByTagName('input')[0];

	let previous_length = 0;
	first_field.addEventListener('input', (event) =>
	{
		const current_length = event.target.value.length;
		if (previous_length <= 1 && current_length > 1)
		{
			// entry describes an expression
			entry.replaceChild(expression_inputs, character_inputs);
			first_field.classList.replace('character', 'expression');
		}
		else if (current_length <= 1 && previous_length > 1)
		{
			// entry describes a single character
			entry.replaceChild(character_inputs, expression_inputs);
			first_field.classList.replace('expression', 'character');
		}
		previous_length = current_length;
	});
	// per default, the entry describes a single character
	entry.appendChild(character_inputs);

	entry.dataset.index =
		character_inputs.dataset.index =
			expression_inputs.dataset.index = entry_count++;

	return entry;
};


const entries = document.getElementById('entries');

	/*
// restore entries from this session
{
	const length = sessionStorage.length;
	if (length > 0)
	{
		let inner_html = '';
		for (let i = 0; i < length; ++i)
			inner_html += sessionStorage[i];
		entries.innerHTML = inner_html;
		entry_count = length;
	}
}
*/


/* assign function to add new input elements */
{
	const record_backup = (event) =>
	{
		const
			target =	event.target,
			entry = target.parentElement;
		sessionStorage[entry.dataset.index+target.className] = target.value;
	};

	document.getElementById('create-new-entry').addEventListener('click', () =>
	{
		const new_entry = entries.appendChild(create_entry());
		sessionStorage[new_entry.dataset.index] = {};
		new_entry.getElementsByTagName('input')[0].focus();
		new_entry.addEventListener('change', record_backup);
	});
}

// assign function to download a JSON file
document.getElementById('create-json').addEventListener('click', () =>
{
	const result = {};
	const expressions = entries.getElementsByClassName('expression');

	/* process character entries */ {
		const
			characters = fields.getElementsByClassName('character'),
			pinyin = fields.getElementsByClassName('pinyin'),
			tones = fields.getElementsByClassName('tone'),
			translations = fields.getElementsByClassName('translation'),
			radicals = fields.getElementsByClassName('radicals'),
			entries = {};

		for (let i = characters.length - 1; i >= 0; --i)
		{
			const {initial, final} = split_pinyin(pinyin[i].value);

			entries[characters[i].value] = [
				sound_indexes[initial],
				sound_indexes[final],
				parseInt(tones[i].value),
				translations[i].value,
				radicals[i].value
			];
		}

		result.characters = entries;
	}
	/* process expression entries */ {
		const
			expressions = fields.getElementsByClassName('expression'),
			meanings = fields.getElementsByClassName('meaning'),
			count = expressions.length,
			entries = new Array(count);

		for (let i = 0; i < count; ++i)
			entries[i] = [ expressions[i].value, meanings[i].value ];

		result.expressions = entries;
	}

	const data = new Blob([JSON.stringify(result)], {type: 'text/plain;charset=utf-8'}),
		url = window.URL.createObjectURL(data),
		anchor = document.createElement('a');

	anchor.href = url;
	anchor.download = 'static.txt';
	anchor.click();

	window.URL.revokeObjectURL(url);
});
