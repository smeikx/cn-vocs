'use strict';
import { sounds, assemble_pinyin } from './pinyin.js';

const
	CHARACTERS = {},
	EXPRESSIONS = [];


const parse_json = (json) =>
{
	const { characters, expressions } = JSON.parse(json);

	Object.assign(CHARACTERS, characters);

	// append ‘expressions’ to ‘EXPRESSIONS’
	for (let i = expressions.length; i > 0; EXPRESSIONS.push(expressions[--i]));
};


// parse data in localstorage
for (let i = localStorage.length; i > 0; parse_json(localStorage[--i]));


let
	character_entries,
	character_count,
	expression_count,
	entry_count;

const update_globals = () =>
{
	character_entries = Object.entries(CHARACTERS);
	character_count = character_entries.length - 1;
	expression_count = EXPRESSIONS.length - 1;
	entry_count = character_count + expression_count;
};

update_globals();



const elements = Object.freeze(
{
	char_container: document.getElementById('char-container'),
	expr_container: document.getElementById('expr-container'),
	character: document.getElementById('character'),
	pinyin: document.getElementById('pinyin'),
	translation: document.getElementById('translation'),
	radicals: document.getElementById('radicals'),
	expression: document.getElementById('expression'),
	meaning: document.getElementById('meaning')
});


{
	let previous_index;
	document.getElementById('next-button').addEventListener('click', () =>
	{
		let random_entry_index;
		do {
			random_entry_index = Math.floor(Math.random() * (entry_count + 1));
		} while (random_entry_index == previous_index);
		previous_index = random_entry_index;

		if (random_entry_index < character_count)
		{
			const
				entry = character_entries[random_entry_index],
				character = entry[0],
				info = entry[1];

			elements.character.innerText = character;
			elements.pinyin.innerText = assemble_pinyin(
				(info[0] ? sounds.initial[info[0]] : '') + sounds.final[info[1]], info[2]);
			elements.translation.innerText = info[3];
			elements.radicals.innerText = info[4];

			elements.expr_container.classList.add('hidden');
			elements.char_container.classList.remove('hidden');
		}
		else
		{
			const entry = EXPRESSIONS[random_entry_index - character_count];
			elements.expression.innerText = entry[0];
			elements.meaning.innerText = entry[1];

			elements.char_container.classList.add('hidden');
			elements.expr_container.classList.remove('hidden');
		}
	});
}


// assign function to the ‘Load JSON’ button
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

	const json_input = document.getElementById('json-input');

	document.getElementById('load-button').addEventListener('click', async () =>
	{
		const files = json_input.files;

		for (let i = files.length - 1; i >= 0; --i)
		{
			const json = await read_file(files[i]);
			localStorage[localStorage.length] = json;
			parse_json(json);
		}
		update_globals();
	});
}
