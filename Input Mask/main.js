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

const create_entry = (type = 'character') =>
{
	const
		entry = templates.get_copy_of('entry'),
		character_inputs = templates.get_copy_of('character'),
		expression_inputs = templates.get_copy_of('expression'), // TODO: maybe generate on demand
		first_field = entry.getElementsByTagName('input')[0],
		backup_type_key =
			(sessionStorage.entry_count =
			entry.dataset.index =
			character_inputs.dataset.index =
			expression_inputs.dataset.index = entry_count++) + 'type';

	let previous_length = 0;
	first_field.addEventListener('input', (event) =>
	{
		const current_length = event.target.value.length;
		if (previous_length <= 1 && current_length > 1)
		{
			// entry describes an expression
			entry.replaceChild(expression_inputs, character_inputs);
			first_field.classList.replace('character', 'expression');
			sessionStorage[backup_type_key] = 'expression';
		}
		else if (current_length <= 1 && previous_length > 1)
		{
			// entry describes a single character
			entry.replaceChild(character_inputs, expression_inputs);
			first_field.classList.replace('expression', 'character');
			sessionStorage[backup_type_key] = 'character';
		}
		previous_length = current_length;
	});

	// per default, the entry describes a single character
	entry.appendChild(type == 'character' ? character_inputs : expression_inputs);
	sessionStorage[backup_type_key] = type;
	return entry;
};


const entries = document.getElementById('entries');

// restore entries from this session
{
	const cached_entry_count = sessionStorage.entry_count;
	if (cached_entry_count)
	{

		const create_character_entry = (id) =>
		{
			const
				entry = create_entry(),
				inputs = entry.getElementsByTagName('input');

			inputs[0].value = sessionStorage[id + 'character'];
			inputs[1].value = sessionStorage[id + 'pinyin'];
			inputs[2].value = sessionStorage[id + 'tone'];
			inputs[3].value = sessionStorage[id + 'meaning'];
			inputs[4].value = sessionStorage[id + 'radicals'];

			return entry;
		};

		const create_expression_entry = (id) =>
		{
			const
				entry = create_entry('expression'),
				inputs = entry.getElementsByTagName('input');

			inputs[0].value = sessionStorage[id + 'expression'];
			inputs[1].value = sessionStorage[id + 'translation'];

			return entry;
		};

		for (let entry, i = 0; i <= cached_entry_count; ++i)
		{
			if (sessionStorage[i + 'type'] == 'character')
				entry = create_character_entry(i);
			else
				entry = create_expression_entry(i);
			console.log('sad', entry);
			//entries.appendChild(entry);
		}
	}
}


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
			characters = entries.getElementsByClassName('character'),
			pinyin = entries.getElementsByClassName('pinyin'),
			tones = entries.getElementsByClassName('tone'),
			translations = entries.getElementsByClassName('translation'),
			radicals = entries.getElementsByClassName('radicals'),
			processed_entries = {};

		for (let i = characters.length - 1; i >= 0; --i)
		{
			const {initial, final} = split_pinyin(pinyin[i].value);

			processed_entries[characters[i].value] = [
				sound_indexes[initial],
				sound_indexes[final],
				tones[i].valueAsNumber,
				translations[i].value,
				radicals[i].value
			];
		}

		result.characters = processed_entries;
	}
	/* process expression entries */ {
		const
			expressions = entries.getElementsByClassName('expression'),
			meanings = entries.getElementsByClassName('meaning'),
			count = expressions.length,
			processed_entries = new Array(count);

		for (let i = 0; i < count; ++i)
			processed_entries[i] = [ expressions[i].value, meanings[i].value ];

		result.expressions = processed_entries;
	}

	const data = new Blob([JSON.stringify(result)], {type: 'text/plain;charset=utf-8'}),
		url = window.URL.createObjectURL(data),
		anchor = document.createElement('a');

	anchor.href = url;
	anchor.download = 'static.txt';
	anchor.click();

	window.URL.revokeObjectURL(url);
});


document.getElementById('clear').addEventListener('click', () =>
{
	sessionStorage.clear();
	entry_count = 0;
	entries.innerHTML = '';
	entries.appendChild(create_entry());
});
