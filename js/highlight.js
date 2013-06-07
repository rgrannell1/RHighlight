
// highlight.r, Ryan Grannell
"use strict";

HIGHLIGHT = ( function () {
	return {
		StateMachine: function (states) {

			this.states = states;

			this.output_token = function (source, target, token) {

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

				var change_bracket_level = function (source, target) {
					// change r output depth based on transition

					var parens_opened = source === 'normal' && target === 'open_delim' || 
						source === 'open_delim' && target === 'open_delim';
					
					var parens_closed = source === 'close_delim' && target === 'normal' ||
						source === 'close_delim' && target === 'close_delim';

					if (parens_opened) HIGHLIGHT.level = HIGHLIGHT.level + 1;
					if (parens_closed) HIGHLIGHT.level = HIGHLIGHT.level - 1;

					r_output_rules = output_rules(HIGHLIGHT.level); ///
				}

				token = token + ""
				
				for (var s in this.states) {
					if (states[s].active) {
						var active = this.states[s];
						var old_state = s;
					}
				}

				var new_state = active.edges['*nomatch*']

				for (var e in active.edges) {
					if (token === e) {
						var new_state = active.edges[e];
					}
				}

				this.states[old_state].active = false;
				this.states[new_state].active = true;
			
				// alters global; HIGHLIGHT.level
				change_bracket_level(old_state, new_state);

				return this.output_token(old_state, new_state, token);

			}	
		}


	}
} )();
