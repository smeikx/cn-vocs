#include <iostream>
#include <string>
#include <utility>

using namespace std;

int main ()
{
	string strings[3];
	for (string const& s : strings)
		cout << s.length() << '\n';
	return 0;
}
