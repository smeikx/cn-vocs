#!/usr/bin/env lua

--[[
	This script inserts Chinese characters and expressions, including pinyin pronunciation and translation, from a CSV-like file into an SQLite database.

	The first argument has to be the name of the database file.

	The second argument has to be the name of a file that contains lines of the following format:
		<character>;<pinyin>;<translation>
		<charachters>;<translation>
	One file can contain lines of both formats.
]]--

local database <const>, input_file <const> = arg[1], arg[2]
local separator <const> = ';' -- seperator in input file


-- get IDs of initials and finals
local syllables <const> = {}
do
	-- in this case ‘*’ is the same as ‘id, laut’
	local query <const> = 'SELECT * FROM anlaute; SELECT * FROM auslaute;'
	local sqlite_syllables <close> = io.popen(string.format('sqlite3 "%s" "%s"', database, query), 'r')
	assert(sqlite_syllables)

	for record in sqlite_syllables:lines() do
		local id, syllable = string.match(record, '([^|]+)|([^|]+)')
		syllables[syllable] = id
	end
end


local sql_generator <const> = {
	['expressions'] = nil, -- inserts into table ‘ausdruecke’
	['characters'] = nil -- inserts into table ‘zeichen’
}
-- the following block populates the functions declared in ‘sql_generator’
do
	-- helper function to wrap the values to be inserted in parenthesis
	local function format_values (records)
		local values = {}
		for _,record in ipairs(records) do
			values[#values+1] = string.format('(%s)', table.concat(record,', '))
		end
		return table.concat(values, ', ')
	end

	-- intermediate function to generate an SQL command to input values into a table
	local function generate_sql_insert (table_name, column_names, records)
		return string.format('INSERT INTO %s (%s) VALUES %s;',
			table_name,
			column_names, 
			format_values(records))
	end


	sql_generator.expressions = function (records)
		return generate_sql_insert ('ausdruecke', 'ausdruck, bedeutung', records)
	end


	-- function to split a syllable into initial, final and tone
	local tones <const> = { '[āēīōūǖ]', '[áéǐóúǘ]', '[ǎěǐǒǔǚ]', '[àèìòùǜ]' }
	local function analyse_pinyin (syllable)
		local initial, final, tone = '', syllable, 0

		-- check, if word only consists of final (-> has no initial)
		if string.find(syllable, '[aeiouüāēīōūǖáéǐóúǘǎěǐǒǔǚàèìòùǜ]') ~= 1 then
			initial, final = string.match(syllable, '([bcdghj-nqrstw-z]h?)(.+)')
		end

		for i,pattern in ipairs(tones) do
			if string.find(syllable, pattern) then tone = i end
		end
		return initial, final, tone
	end

	sql_generator.characters = function (records)
		local split_records = {}
		for _,record in ipairs(records) do
			split_records[#split_records+1] = table.pack(record[1], analyse_pinyin(record[2]), record[3])
		end
		return generate_sql_insert ('zeichen', 'zeichen, anlaut, auslaut, ton', split_records)
	end
end


-- the following loop parses the input file
local pattern <const> = string.format('[^%s]+', separator)
local characters <const>, expressions <const> = {}, {}
for line in io.lines(input_file) do
	local columns = {}
	for match in string.gmatch(line, pattern) do
		columns[#columns+1] = match
	end
	if #columns == 3 then
		characters[#characters+1] = columns
		expressions[#expressions+1] = { columns[1], columns[3] }
	elseif #columns == 2 then
		expressions[#expressions+1] = columns
	else
		io.stderr:write(string.format('No match in ‘%s’!\n', line))
	end
end


-- this block inserts the read data into the provided database
do
	assert(os.execute(string.format('sqlite3 "%s" "%s"', database, insert_query)))
end
