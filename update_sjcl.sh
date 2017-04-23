#!/bin/bash
# A script to rebuild and update sjcl.js from the sjcl repository.

# Do we really have to git submodule sjcl?
cd sjcl

# Build smaller sjcl file by restricting modules.
./configure --without-all --with-pbkdf2 --with-codecBytes
make
cp sjcl.js ../src/
