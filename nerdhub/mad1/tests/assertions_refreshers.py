"""Checks for js/data/refreshers.js. Ids Trefreshers-NN."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assertlib import check, out_of, eq, main  # noqa: E402

SHOUT = '''def shout(func):
    def wrapper(name):
        return func(name).upper()
    return wrapper

@shout
def greet(name):
    return "hi " + name

print(greet("ram"))
'''


@check("Trefreshers-01")
def shout_ram():
    eq(out_of(SHOUT), "HI RAM", "output")


@check("Trefreshers-02")
def shout_ab():
    eq(out_of(SHOUT.replace('greet("ram")', 'greet("ab")')), "HI AB", "output")


if __name__ == "__main__":
    main()
