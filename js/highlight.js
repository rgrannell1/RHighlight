
// highlight.r, Ryan Grannell
"use strict";

HIGHLIGHT = ( function () {
	return {
		LEVEL: 0,
		StateMachine: function (states) {
			/* constructor for state machine; takes an object

			*/

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

					if (parens_opened) HIGHLIGHT.LEVEL = HIGHLIGHT.LEVEL + 1;
					if (parens_closed) HIGHLIGHT.LEVEL = HIGHLIGHT.LEVEL - 1;

					r_output_rules = output_rules(HIGHLIGHT.LEVEL); ///
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
					if (token === e) var new_state = active.edges[e];
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

var span_open = function (class) {
	return '<span class="' + class + '">'
}
var span_close = function () {
	return '</span>'
}
var span = function (class, content) {
	return '<span class="' + class + '">' + content + '</span>'
}

var norm_or_paren_rules = function () {
	
	return {
		"'": 'str_single',
		'"': 'str_double',
		'#': 'comment',
		
		'(': 'open_delim',
		'[': 'open_delim',
		'{': 'open_delim',
		
		'}': 'close_delim',
		']': 'close_delim',
		')': 'close_delim',
		
		'*nomatch*': 'normal'
	}
} 

open_delim_output = function (level) {
	return {
		'(': span('lev' + level, '('),
		'[': span('lev' + level, '['),
		'{': span('lev' + level, '{')
	}
}

close_delim_output = function (level) {
	return {
		')': span('lev' + level, ')'),
		']': span('lev' + level, ']'),
		'}': span('lev' + level, '}')
	}
}

r_state_transitions = ( function () {
	// returns an object which contains objects - one for each possible state -
	// which contain an active field (is this the state we're currently on?) and 
	// edges: tokens that trigger a state change.

	return {
		'str_single': {
			'active': false,
			'edges': {
				"'": 'normal',
				'*nomatch*': 'str_single'
			}
		},
		'str_double': {
			'active': false,
			'edges': {
				'"': 'normal',
				'*nomatch*': 'str_double'
			} 
		},
		'normal': {
			'active': true,
			'edges': norm_or_paren_rules()
		},
		
		'open_delim': {
			'active': false,
			'edges': norm_or_paren_rules()
		},
		'close_delim': {
			'active': false,
			'edges': norm_or_paren_rules()
		},
		'comment': {
			'active': false,
			'edges': {
				'\n': 'normal',
				"'": 'roxygen',
				'*nomatch*': 'comment'
			}
		},
		'roxygen': {
			'active': false,
			'edges': {
				'\n': 'normal',
				'*nomatch*': 'roxygen'
			}
		}
	}
} )()

output_rules = function(level) {
	// generates an object describing state-state transitions for 
	// the R grammar highlighter; each edge is associated with some html output.
	// The output is dependent on level,
	// a global variable denoting how many levels nested the state machine
	// parsing this grammar currently is.
 
	// a factored out bit of grammar for output rules;
	// output rules in normal or paren states
	
	var html_output_normal = function (val) {

		return {
			'str_single': {
				"'": span_open("sstring") + "'"
			},
			'str_double': {
				'"': span_open("dstring") + '"'
			},
			'normal': {
				'$': span('dollar', '$'),
				',': span('comma lev' + val, ','),
				'*nomatch*': '*token*'
			},
			'comment': {
				'#': span_open('comment') + '#'
			},
			'open_delim': open_delim_output(val),
			'close_delim': close_delim_output(val)
		}
	}

	return {
		'str_single': {
			'str_single': {
				'"': span("ssdouble", '"'),
				'*nomatch*': '*token*'
			},
			'normal': {
				"'": "'" + span_close() 
			}
		},
		'str_double': {
			'str_double': {
				"'": span("dssingle", "'"),
				'*nomatch*': '*token*'
			},
			'normal': {
				'"': '"' + span_close()
			}
		},
		'normal': html_output_normal(level),
		'open_delim': html_output_normal(level),
		'close_delim': html_output_normal(level),
		'comment': {
			'normal': {
				'\n': '\n' + span_close()
			},
			'comment': {
				'*nomatch*': '*token*'
			},
			'roxygen': {
				"'": "'" + span_close() + span_open('roxygen')
			}
		},
		'roxygen': {
			'normal': {
				'\n': '\n' + span_close()
			},
			'roxygen': {
				'@': span_open('at', '@')
			}
		}
	}
}