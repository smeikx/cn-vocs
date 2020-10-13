#!/usr/bin/env lua

--[[
	This script inserts Chinese characters and expressions, including pinyin pronunciation and translation, from a CSV-like file into an SQLite database.

	The first argument has to be the name of the database file.

	The second argument has to be the name of a file that contains lines of the following format:
		<character>;<pinyin>;<translation>
		<charachters>;<translation>
	One file can contain lines of both formats.
]]--

-- XXX global variables/constants are in uppercase

local DATABASE <const>, INPUT_FILE <const> = arg[1], arg[2]


-- the following loop parses the input file
local CHARACTERS <const>, EXPRESSIONS <const> = {}, {}
-- CHARACTERS = { { <char>, <pinyin> }, … }
-- EXPRESSIONS = { { <chars>, <translation> }, … }
do
	local pattern <const> = string.format('[^%s]+', ';')
	for line in io.lines(INPUT_FILE) do
		local columns = {}
		for match in string.gmatch(line, pattern) do
			columns[#columns+1] = match
		end
		if #columns == 3 then
			CHARACTERS[#CHARACTERS+1] = { columns[1], columns[2] }
			EXPRESSIONS[#EXPRESSIONS+1] = { columns[1], columns[3] }
		elseif #columns == 2 then
			EXPRESSIONS[#EXPRESSIONS+1] = columns
		else
			if string.find(line, '%S+') then
				warn('@on')
				warn(string.format('No match in ‘%s’!', line))
			end
		end
	end
end


-- this block formats the extracted data as INSERT statements
local INSERT_SQL <const> = {} -- a list that is meant to be concatenated to a string
do
	-- This function creates an INSERT statement and appends its fragments to ‘INSERT_SQL’.
	-- Its last argument is a function that receives a list of strings and must return a string;
	-- the returned string must have the following format: ‘(<value>, <value>, …),’
	local function create_insert_sql (entries, table_name, column_names, formatting_function)
		INSERT_SQL[#INSERT_SQL+1] = string.format('INSERT INTO %s (%s) VALUES ', table_name, column_names)
		for _,entry in ipairs(entries) do
			INSERT_SQL[#INSERT_SQL+1] = formatting_function(entry)
		end
		-- replace trailing comma with semicolon
		INSERT_SQL[#INSERT_SQL] = string.sub(INSERT_SQL[#INSERT_SQL], 1, -2) .. ';'
	end

	-- create INSERT statement for ‘CHARACTERS’
	do
		-- Syllables are implemented as FOREIGN KEY.
		-- This block queries and caches the IDs of initials and finals from the database in a Lua table.
		-- The cached IDs allow avoiding a SELECT query per inserted character.
		local syllables <const> = {}
		do
			-- in this case ‘*’ is the same as ‘id, laut’
			local query <const> = 'SELECT * FROM anlaute; SELECT * FROM auslaute;'
			local sqlite_syllables <close> = io.popen(string.format('sqlite3 "%s" "%s"', DATABASE, query), 'r')
			assert(sqlite_syllables)

			for record in sqlite_syllables:lines() do
				local id, syllable = string.match(record, '([^|]+)|([^|]+)')
				syllables[syllable] = id
			end
		end

		-- a pattern that matches all vowels with tone mark
		local tone_pattern <const> = '[āēīōūǖáéíóúǘǎěǐǒǔǚàèìòùǜ]+'
		-- find the base vowel to a vowel with a tone mark (ā → a)
		local vowels <const> = {
			['ā'] = 'a', ['á'] = 'a', ['ǎ'] = 'a', ['à'] = 'a',
			['ē'] = 'e', ['é'] = 'e', ['ě'] = 'e', ['è'] = 'e',
			['ī'] = 'i', ['í'] = 'i', ['ǐ'] = 'i', ['ì'] = 'i',
			['ō'] = 'o', ['ó'] = 'o', ['ǒ'] = 'o', ['ò'] = 'o',
			['ū'] = 'u', ['ú'] = 'u', ['ǔ'] = 'u', ['ù'] = 'u',
			['ǖ'] = 'ü', ['ǘ'] = 'ü', ['ǚ'] = 'ü', ['ǜ'] = 'ü'
		}

		-- function to split a syllable into initial, final and tone
		local tones <const> = { '[āēīōūǖ]', '[áéíóúǘ]', '[ǎěǐǒǔǚ]', '[àèìòùǜ]' }
		local function split_pinyin (syllable)
			local initial, final, tone = '', syllable, 0

			-- check, if word only consists of final (→ has no initial)
			if string.find(syllable, '[aeiouüāēīōūǖáéíóúǘǎěǐǒǔǚàèìòùǜ]') ~= 1 then
				initial, final = string.match(syllable, '([bcdghj-nqrstw-z]h?)(.+)')
			end

			for i,pattern in ipairs(tones) do
				if string.find(syllable, pattern) then tone = i end
			end
			return initial, string.gsub(final, tone_pattern, vowels), tone
		end

		create_insert_sql(CHARACTERS, 'zeichen', 'zeichen, anlaut, auslaut, ton',
			function (entry)
				local initial, final, tone = split_pinyin(entry[2])
				initial = initial == '' and 'NULL' or syllables[initial]
				return string.format('("%s",%s,%s,%s),',
					entry[1], initial, syllables[final], tone)
			end)
	end

	-- create INSERT statement for ‘EXPRESSIONS’
	do
		create_insert_sql(EXPRESSIONS, 'ausdruecke', 'ausdruck, bedeutung',
		function (entry)
			return string.format('("%s"),', table.concat(entry, '","'))
		end)
	end
end

-- this block inserts the read data into the provided database
do
	-- XXX Pay attention to quotation marks: The SQL statement contains double quotes!
	assert(os.execute(string.format("sqlite3 '%s' '%s'", DATABASE, table.concat(INSERT_SQL))))
end
