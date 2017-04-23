genpass.html: src/gen.py src/sjcl.js src/template.html
	python src/gen.py > $@
