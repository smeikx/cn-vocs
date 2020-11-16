'use strict';

// entry → a character, radical or expression with all accompaning information
// field → one component of a field (e.g. ‘pinyin’ of a character)

const remove_whitespace = (string) => string.replace(/\s/g, '');
const contains_chinese = (string) => search(/[\u{4e00}-\u{9FFF}]/u) >= 0;


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


let ENTRY_COUNT = 0; // also serves as ID for every new entry
const ENTRIES = []; // collects all Entry() objects
const ENTRIES_CONTAINER = document.getElementById('entries');


/*
{
	element: , // <li class='entry'>
	fields: , // generated list of all input fields
	type: , // character || expression
	id: , //	for retrieving from ENTRIES and backup
	primary_field: , // the first field
	contextual_fields: , // the fields that change depending on type
};
*/

const Entry = (() =>
{
	const pool = Object.seal(
	{
		character: [],
		expression: [],
		take: function (type)
		{
			return this[type].pop();
		},
		give: function (type, element)
		{
			this[type].push(element);
			return element;
		}
	});

	// Create an object containing all the fields necessary for the specified type.
	const Contextual_Fields = (() =>
	{
		return function (type)
		{
			const container = this.element = document.createElement('div');
			this.fields = {};
			this.type = type;
			let label;

			if (type == 'character')
			{
				label = container.appendChild(document.createElement('label'));
				label.for = 'pinyin';
				label.innerText = 'Pinyin';

				const pinyin = this.fields.pinyin = container.appendChild(document.createElement('input'));
				pinyin.className = pinyin.name = 'pinyin';
				pinyin.size = pinyin.minlength = pinyin.maxlength = 1;


				label = container.appendChild(document.createElement('label'));
				label.for = 'tone';
				label.innerText = 'Tone';

				const tone = this.fields.tone = container.appendChild(document.createElement('input'));
				tone.className = tone.name = 'tone';
				tone.type = 'number';
				tone.min = 0;
				tone.max = 4;
				tone.size = 1;


				label = container.appendChild(document.createElement('label'));
				label.for = 'translation';
				label.innerText = 'Translation';

				const translation = this.fields.translation = container.appendChild(document.createElement('input'));
				translation.className = translation.name = 'translation';


				label = container.appendChild(document.createElement('label'));
				label.for = 'radicals';
				label.innerText = 'Radicals';

				const radicals = this.fields.radicals = container.appendChild(document.createElement('input'));
				radicals.className = radicals.name = 'radicals';
				radicals.size = radicals.maxlength = 5;
			}
			else // type == 'expression'
			{
				label = container.appendChild(document.createElement('label'));
				label.for = 'meaning';
				label.innerText = 'Meaning';

				const meaning = this.fields.meaning = container.appendChild(document.createElement('input'));
				meaning.className = meaning.name = 'meaning';
			}
		}
	})();

	// sets dataset.id of all fields
	const update_ids = function (entry)
	{
		const fields = Object.values(entry.fields);
		for (let i = fields.length; i > 0; fields[--i].dataset.id = entry.id);
	};

	// either takes an object from the pool or creates a new one
	const get_contextual_fields = (type) => pool.take(type) || new Contextual_Fields(type);
	
	// set this.fields to comprise this.primary_field and this.contextual_fields.fields
	const update_fields = (entry) =>
		entry.fields = Object.assign({[entry.type]: entry.primary_field}, entry.contextual_fields.fields);

	// changes the type and replaces all accompanying fields
	const switch_type = function (entry)
	{
		const
			old_type = entry.type,
			old_contextual_fields = pool.give(old_type, entry.contextual_fields);

		// clear values
		const fields = Object.values(old_contextual_fields.fields);
		for (let i = fields.length; i > 0; fields[--i].value = '');

		entry.type =
			entry.primary_field.name =
				sessionStorage[entry.id + 'type'] =
					old_type == 'character' ? 'expression' : 'character';
		entry.primary_field.classList.replace(old_type, entry.type);

		entry.contextual_fields = get_contextual_fields(entry.type);

		update_fields(entry);
		update_ids(entry);

		entry.element.replaceChild(entry.contextual_fields.element, old_contextual_fields.element);
	};

	const update_context = (event) =>
	{
		const
			target = event.target,
			key = target.dataset.id + 'primary_char_count',
			previous_char_count = sessionStorage[key],
			current_char_count = sessionStorage[key] = target.value.length;

		if (previous_char_count > 1 && current_char_count <= 1 ||
			previous_char_count <= 1 && current_char_count > 1)
			switch_type(ENTRIES[target.dataset.id]);
	}

	return function (type = 'character')
	{
		const
			container = this.element = document.createElement('li'),
			primary_field = this.primary_field = container.appendChild(document.createElement('input')),
			contextual_fields = this.contextual_fields = get_contextual_fields(type);

		this.type =
			primary_field.className =
			primary_field.name =
			sessionStorage[this.id + 'type'] = type;

		let current_char_count, previous_char_count = 0;
		primary_field.addEventListener('input', update_context);

		update_fields(this);

		this.id = ENTRY_COUNT++;
		update_ids(this);

		sessionStorage.ENTRY_COUNT = this.id + 1;

		this.element.appendChild(contextual_fields.element);
		ENTRIES.push(this);
	}
})();


// assign function to add new input elements
{
	const save_field = (event) =>
	{
		const
			target = event.target,
			id = target.dataset.id;
		sessionStorage[id + target.name] = target.value;
	};

	ENTRIES_CONTAINER.addEventListener('change', save_field);
}


const create_entry = () =>
{
	const new_entry = new Entry();
	ENTRIES_CONTAINER.appendChild(new_entry.element);
	new_entry.primary_field.focus();
};

document.getElementById('create-new-entry').addEventListener('click', create_entry);


// assign function to download a JSON file
document.getElementById('create-json').addEventListener('click', () =>
{
	const result =
	{
		characters: {},
		expressions: []
	};

	for (let i = ENTRIES.length - 1; i >= 0; --i)
	{
		const
			entry = ENTRIES[i],
			fields = entry.fields;

		if (entry.type == 'character')
		{
			const {initial, final} = split_pinyin(fields.pinyin.value);
			result.characters[fields.character.value] =
			[
				sound_indexes[initial],
				sound_indexes[final],
				fields.tone.valueAsNumber,
				fields.translation.value,
				fields.radicals.value
			];
		}
		else // entry.type == 'expression'
			result.expressions.push(
				[entry.fields.expression.value, entry.fields.meaning.value]);
	}

	const
		data = new Blob([JSON.stringify(result)], {type: 'text/plain;charset=utf-8'}),
		url = window.URL.createObjectURL(data),
		anchor = document.createElement('a');

	anchor.href = url;
	anchor.download = 'Vocabulary.json';
	anchor.click();

	window.URL.revokeObjectURL(url);
});


document.getElementById('clear').addEventListener('click', () =>
{
	sessionStorage.clear();
	ENTRY_COUNT = ENTRIES.length = 0;
	// TODO: Return Elements to Pool, maybe extend Pool for primary_fields
	ENTRIES_CONTAINER.innerHTML = '';
	create_entry();
});


{
	const read_file = async (file) =>
	{
		return new Promise((resolve) =>
		{
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.readAsText(file);
		})
	};

	document.getElementById('upload-json').addEventListener('change', async (event) =>
	{
		const
			files = event.target.files,
			file_reader = new FileReader();

		for (let i = files.length - 1; i >= 0; --i)
		{
			const
				data = JSON.parse(await read_file(files[i])),
				character_data = Object.entries(data.characters),
				expression_data = data.expressions,
				new_entries = [];

			for (let i = character_data.length - 1; i >= 0; --i)
			{
				const
					character = character_data[i][0],
					values = character_data[i][1],
					entry = new Entry('character'),
					fields = entry.fields;
				fields.character.value = character;
				fields.pinyin.value = values[0] ?
					initial_sounds[values[0]] + final_sounds[values[1]] :
					final_sounds[values[1]];
				fields.tone.value = values[2];
				fields.translation.value = values[3];
				fields.radicals.value = values[4];

				new_entries.push(entry);
			}
			for (let i = expression_data.length - 1; i >= 0; --i)
			{
				const
					values = expression_data[i],
					entry = new Entry('expression'),
					fields = entry.fields;
				fields.expression.value = values[0];
				fields.meaning.value = values[1];

				new_entries.push(entry);
			}
			for (let i = new_entries.length - 1; i >= 0; --i)
				ENTRIES_CONTAINER.appendChild(new_entries[i].element);
		}
	});
}

// restore cached values
{
	const cached_entry_count = sessionStorage.ENTRY_COUNT;
	if (cached_entry_count)
	{
		for (let id = 0; id < cached_entry_count; ++id)
		{
			const
				type = sessionStorage[id + 'type'],
				new_entry = new Entry(type);

			const fields = Object.entries(new_entry.fields);
			for (let i = fields.length - 1; i >= 0; --i)
			{
				const [type, field] = fields[i];
				field.value = sessionStorage[id + type] || '';
			}
			ENTRIES_CONTAINER.appendChild(new_entry.element);
		}
	}
	else create_entry();
}