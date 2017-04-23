#!/usr/bin/python
# -*- coding: utf-8 -*-
"""One line explanation of gen.py.

More explanations of gen.py."""

import sys

from jinja2 import Environment, PackageLoader, select_autoescape


def main():
    env = Environment(
        loader=PackageLoader('gen', '.'),
        autoescape=select_autoescape(['html', 'xml'])
    )
    template = env.get_template('template.html')
    sys.stdout.write(template.render().encode('utf-8'))

if __name__ == '__main__':
    main()
