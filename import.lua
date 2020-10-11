#!/usr/bin/env lua

-- 我;ich;wǒ
-- 谢谢;Danke!

local separator <const> = ';'

local sql_generator <const> = {
	['expressions'] = nil, -- inserts into table ‘ausdruecke’
	['characters'] = nil -- inserts into table ‘zeichen’
}
-- the following block populats the functions declared in ‘sql_generator’
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


local pattern <const> = string.format('[^%s]+', separator)
local characters, expressions = {}, {}
for line in io.lines(arg[1]) do
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

io.stdout:write(sql_generator.characters(characters) .. sql_generator.expressions(expressions))

