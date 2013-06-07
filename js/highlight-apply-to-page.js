
r_output_rules = output_rules(0);

highlight = function () {
	// gets code from document, applies parser to each token

	var html = '';
	var code = document.getElementById('r').innerText;
	var parser = new StateMachine(r_rules);

	for (var i = 0; i < code.length; i++) {

		html = html + parser.consume_token(
			code.substring(i, i + 1)
		);
	}
	PRISM.level = 0;	

	div = document.getElementById("editor");
	div.innerHTML = html;

}
