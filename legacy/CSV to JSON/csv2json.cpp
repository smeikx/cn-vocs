#include <iostream>
#include <fstream>
#include <string>
#include <map>
#include <vector>
#include <utility>

using namespace std;

//char const *const initials[22] { "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "z", "c", "s", "zh", "ch", "sh", "r", "j", "q", "x", "y" };
//char const *const finals[36] { "a", "o", "e", "i", "er", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong", "ia", "iao", "ie", "iu", "ian", "in", "iang", "ing", "iong", "u", "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng", "ü", "üe", "üan", "ün" };

char const *const json_header {
	"{"
	"'initials': [ 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's', 'zh', 'ch', 'sh', 'r', 'j', 'q', 'x', 'y' ],"
	"'finals': [ 'a', 'o', 'e', 'i', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'ia', 'iao', 'ie', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng', 'ü', 'üe', 'üan', 'ün' ],"
};

// This map stores the index of each syllable in the JS array.
map <char const *const, int const> const syllable_indexes
{
	// initial sounds
	{ "b", 0 }, { "p", 1 }, { "m", 2 }, { "f", 3 }, { "d", 4 }, { "t", 5 }, { "n", 6 }, { "l", 7 }, { "g", 8 }, { "k", 9 }, { "h", 10 }, { "z", 11 }, { "c", 12 }, { "s", 13 }, { "zh", 14 }, { "ch", 15 }, { "sh", 16 }, { "r", 17 }, { "j", 18 }, { "q", 19 }, { "x", 20 }, { "y", 21 },
	// final sounds
	{ "a", 0 }, { "o", 1 }, { "e", 2 }, { "i", 3 }, { "er", 4 }, { "ai", 5 }, { "ei", 6 }, { "ao", 7 }, { "ou", 8 }, { "an", 9 }, { "en", 10 }, { "ang", 11 }, { "eng", 12 }, { "ong", 13 }, { "ia", 14 }, { "iao", 15 }, { "ie", 16 }, { "iu", 17 }, { "ian", 18 }, { "in", 19 }, { "iang", 20 }, { "ing", 21 }, { "iong", 22 }, { "u", 23 }, { "ua", 24 }, { "uo", 25 }, { "uai", 26 }, { "ui", 27 }, { "uan", 28 }, { "un", 29 }, { "uang", 30 }, { "ueng", 31 }, { "ü", 32 }, { "üe", 33 }, { "üan", 34 }, { "ün", 35 }
};



// stores the indexes of syllables and the radicals
struct Pinyin
{
	int initial_sound, final_sound, tone;
	Pinyin (string const & pinyin);
	Pinyin ();
};
Pinyin::Pinyin (string const & pinyin) {};
Pinyin::Pinyin () {};


// stores the character, its pinyin and translation
struct Character
{
	char character;
	Pinyin pinyin;
	string translation, radicals;
	Character (char character, Pinyin pinyin, string translation, string radicals);
	Character ();
};
Character::Character (char character, Pinyin pinyin, string translation, string radicals):
	character {character}, pinyin {pinyin}, translation {translation}, radicals {radicals} {}
Character::Character () {}


// stores the expression and its translation
struct Expression
{
	string characters, translation;
	Expression (string characters, string translation);
	Expression ();
};
Expression::Expression (string characters, string translation):
	characters {characters}, translation {translation} {}
Expression::Expression () {}


// a line from the input file
class Entry
{
	string fields[5];
	int field_count {0};
	string entry;

	public:
	Entry (string&& line);
};
Entry::Entry (string&& line):
	entry {line}
{
	// parse line
	size_t last {0}, next {0};
	while ((next = line.find(';', last)) not_eq string::npos)
	{
		fields[field_count++] = line.substr(last, next - last);
		last = next + 1;
	}
	fields[field_count++] = line.substr(last);
}


int main(int argc, char **argv)
{
	vector <Character> characters {};
	vector <Expression> expressions {};
	vector <Entry> entries {};

	// iterate command line arguments (→ file names)
	for (int i {1}; i < argc; ++i)
	{
		// open each file
		ifstream file {argv[i]};
		if (string line; file.is_open())
		{
			// read each line
			while (getline(file, line))
				entries.push_back(Entry {move(line)});
		}
		else cerr << "Can’t open file ‘" << argv[i] << "’!\n";
	};

	for (Entry const& : entries)
	{
		if (field_count >= 4) // Character
		{
			// TODO: lies die ersten vier Felder aus
			if (field_count == 5)
			{
				// TODO: füge Radicals hinzu
			}
		}
		else // Expression
		{
			// TODO: lies expression aus
			//expressions.push_back(Expression {});
		}
	}

	return 0;
}
