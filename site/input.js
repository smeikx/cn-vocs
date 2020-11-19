'use strict';
import { sounds, assemble_pinyin_from_strings, assemble_pinyin_from_indexes, split_pinyin } from './pinyin.js';

const VOCS = Object.seal(
{
	characters: {},
	expressions: {}
});


// parse localStorage
{
	const json = localStorage['cn-vocs'];
	json && Object.assign(VOCS, JSON.parse(json));
}

// entry → a character, radical or expression with all accompaning information
// field → one component of a field (e.g. ‘pinyin’ of a character)

const remove_whitespace = (string) => string.replace(/\s/g, '');
const contains_chinese = (string) => search(/[\u{4e00}-\u{9FFF}]/u) >= 0;


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

// TODO: Move all currently closured, private methods (the ones taking ‘entry’ as argument) to the prototype;
// use the underscore convention to mark them as private;
// consider using Object.defineProperties().
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

	const update_pinyin_display = Object.freeze(
	{
		character: (entry) =>
		{
			entry.pinyin_display.innerText = assemble_pinyin_from_strings(
				entry.fields.pinyin.value, entry.fields.tone.value);
		},
		expression: (entry) =>
		{
			const
				chars = entry.primary_field.value,
				length = chars.length;

			let result = '';
			for (let i = 0; i < length; ++i)
			{
				if (chars[i] == ' ')
					result += ' ';
				else
				{
					const record = VOCS.characters[chars[i]];
					if (record)
						result += assemble_pinyin_from_indexes(record[0], record[1], record[2]);
					else
						result += '?';
				}
			}
			entry.pinyin_display.innerText = result;
		},
		event: (event) =>
		{
			const entry = ENTRIES[event.target.dataset.id];
			entry.update_pinyin_display(entry);
		}
	});

	// Create an object containing all the fields necessary for the specified type.
	const Contextual_Fields = function (type)
	{
		const container = this.element = document.createElement('div');
		this.fields = {};
		this.type = type;
		let label;

		if (type == 'character')
		{
			label = container.appendChild(document.createElement('label'));
			label.htmlFor = 'radicals';
			label.innerText = 'Radicals';

			const radicals = this.fields.radicals = container.appendChild(document.createElement('input'));
			radicals.className = radicals.name = 'radicals';
			radicals.size = radicals.maxlength = 5;


			const pinyin_container = container.appendChild(document.createElement('div'));
			pinyin_container.className = 'pinyin-container';
			pinyin_container.addEventListener('change', update_pinyin_display.event);


			label = pinyin_container.appendChild(document.createElement('label'));
			label.htmlFor = 'pinyin';
			label.innerText = 'Pinyin';

			const pinyin = this.fields.pinyin = pinyin_container.appendChild(document.createElement('input'));
			pinyin.className = pinyin.name = 'pinyin';
			pinyin.minlength = 1;
			pinyin.size = pinyin.maxlength = 6;


			label = pinyin_container.appendChild(document.createElement('label'));
			label.htmlFor = 'tone';
			label.innerText = 'Tone';

			const tone = this.fields.tone = pinyin_container.appendChild(document.createElement('input'));
			tone.className = tone.name = 'tone';
			tone.type = 'number';
			tone.min = 0;
			tone.max = 4;
			tone.size = 1;


			const pinyin_display = this.pinyin_display = pinyin_container.appendChild(document.createElement('div'));
			pinyin_display.className = 'pinyin-display';


			label = container.appendChild(document.createElement('label'));
			label.htmlFor = 'translation';
			label.innerText = 'Translation';

			const translation = this.fields.translation = container.appendChild(document.createElement('textarea'));
			translation.className = translation.name = 'translation';
		}
		else // type == 'expression'
		{
			const pinyin_display = this.pinyin_display = container.appendChild(document.createElement('div'));
			pinyin_display.className = 'pinyin-display';

			label = container.appendChild(document.createElement('label'));
			label.htmlFor = 'meaning';
			label.innerText = 'Meaning';

			const meaning = this.fields.meaning = container.appendChild(document.createElement('textarea'));
			meaning.className = meaning.name = 'meaning';
		}
	}

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

		if (entry.type == 'expression')
		{
			entry.update_pinyin_display = update_pinyin_display.expression;
			entry.primary_field.addEventListener('input', update_pinyin_display.event);
		}
		else
		{
			entry.update_pinyin_display = update_pinyin_display.character;
			entry.primary_field.removeEventListener('input', update_pinyin_display.event);
		}
		
		update_fields(entry);
		entry.update_pinyin_display(entry);
		update_ids(entry);

		entry.element.replaceChild(entry.contextual_fields.element, old_contextual_fields.element);
	};

	const update_context = (event) =>
	{
		// change the fields according to context (char or expr)
		
		const
			target = event.target,
			key = target.dataset.id + 'primary_char_count',
			previous_char_count = sessionStorage[key],
			current_char_count = sessionStorage[key] = target.value.length,
			entry = ENTRIES[target.dataset.id];
	
		if (previous_char_count > 1 && current_char_count <= 1 ||
			previous_char_count <= 1 && current_char_count > 1)
			switch_type(entry);


		// autocomplete fields if there is already a record of the new vocable

		const record = VOCS[entry.type + 's'][target.value];
		if (record)
		{
			const fields = entry.fields;

			if (entry.type == 'character')
			{
				fields.pinyin.value = sounds.initial[record[0]] + sounds.final[record[1]];
				fields.tone.value = record[2];
				fields.translation.value = record[3];
				fields.radicals.value = record[4];
			}
			else // entry.type == 'expression'
				fields.translation.value = record;
		}
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

		primary_field.addEventListener('input', update_context);
		this.pinyin_display = contextual_fields.pinyin_display;

		update_fields(this);

		if (type == 'character')
			this.update_pinyin_display = update_pinyin_display.character;
		else
		{
			this.update_pinyin_display = update_pinyin_display.expression;
			primary_field.addEventListener('input', update_pinyin_display.event);
		}

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
document.getElementById('save-button').addEventListener('click', () =>
{
	// parse Entries

	const result =
	{
		characters: {},
		expressions: {}
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
				sounds.indexes[initial],
				sounds.indexes[final],
				fields.tone.valueAsNumber,
				fields.translation.value,
				fields.radicals.value
			];
		}
		else // entry.type == 'expression'
			result.expressions[entry.fields.expression.value] = entry.fields.meaning.value;
	}


	// export JSON file

	const
		data = new Blob([JSON.stringify(result)], {type: 'text/plain;charset=utf-8'}),
		url = window.URL.createObjectURL(data),
		anchor = document.createElement('a');

	anchor.href = url;
	anchor.download = 'Vocabulary.json';
	anchor.click();

	window.URL.revokeObjectURL(url);


	// save everything to localStorage

	Object.assign(VOCS, result);
	localStorage['cn-vocs'] = JSON.stringify(VOCS);
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
		const files = event.target.files;
		for (let i = files.length - 1; i >= 0; --i)
		{
			const
				data = JSON.parse(await read_file(files[i])),
				character_data = Object.entries(data.characters),
				expression_data = Object.entries(data.expressions),
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
					sounds.initial[values[0]] + sounds.final[values[1]] :
					sounds.final[values[1]];
				fields.tone.value = values[2];
				fields.translation.value = values[3];
				fields.radicals.value = values[4];

				entry.update_pinyin_display(entry);
				new_entries.push(entry);
			}
			for (let i = expression_data.length - 1; i >= 0; --i)
			{
				const
					entry = new Entry('expression'),
					fields = entry.fields;
				
				fields.expression.value = expression_data[i][0];
				fields.meaning.value = expression_data[i][1][0];

				entry.update_pinyin_display(entry);
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
			new_entry.update_pinyin_display(new_entry);
			ENTRIES_CONTAINER.appendChild(new_entry.element);
		}
	}
	else create_entry();
}
