#include <iostream>
#include <utility>

using namespace std;

struct A
{
	int val;
	A (int val): val {val} {}
	A (): val {} {}
};

struct A_Container
{
	A a;
	A_Container (A&& other_a): a {} { swap(a, other_a); }
};

int main ()
{
	A_Container ac { A {42} };
	cout << ac.a.val << endl;
	return 0;
}
