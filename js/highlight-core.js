
change_bracket_level = function (source, target) {
	// change r output depth based on transition

	if (source === 'normal' && target === 'open_delim' || 
		source === 'open_delim' && target === 'open_delim') {
		PRISM.level = PRISM.level + 1;
	}
	if (source === 'close_delim' && target === 'normal' ||
		source === 'close_delim' && target === 'close_delim') {
		PRISM.level = PRISM.level - 1;
	}

	var val = PRISM.level;	
	r_output_rules = output_rules(val);

}

StateMachine = function (states) {
	// creates a state machine that eats tokens 
	// one by one and returns html for each token.
	// context-free parser

	this.states = states;
	
	this.output_token = function (source, target, token) {
		// outputs a token based on the transition 
		// being followed 

		var rules = r_output_rules[source][target];
		var output_html = token;

		for (var candidate in rules) {
			
			if (candidate !== '*nomatch*' && candidate === token) {
				
				output_html = rules[candidate];
			}			
		}	
		return output_html;
	}

	this.consume_token = function (token) {
		// return a modified token, depending on 
		// input token and new state

		token = token + ''
		
		for (var s in this.states) {

			if (states[s].active) {
				var active = this.states[s];
				var old_state = s;
			}
		}

		var match_found = false;

		for (var e in active.edges) {
			
			if (token === e) {
				match_found = true;
				var new_state = active.edges[e];
			}
		}

		if (!match_found) {
			var new_state = active.edges['*nomatch*'];
		}

		this.states[old_state].active = false;
		this.states[new_state].active = true;
	
		// alters global; PRISM.level
		change_bracket_level(old_state, new_state);

		return this.output_token(old_state, new_state, token);

	}	
}




