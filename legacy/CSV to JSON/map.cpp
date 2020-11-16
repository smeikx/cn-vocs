#include <map>
#include <iostream>

using namespace std;

int main ()
{
	map<char const *const, int> m {
		{ "x", 2 },
		{ "asdf", 1 },
		{ "lol", 3 }
	};
	for (auto const [key, value] : m)
		cout << key << ", " << value << '\n';
	return 0;
}
