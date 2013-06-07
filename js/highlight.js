
// highlight.r, Ryan Grannell
"use strict";

HIGHLIGHT = ( function () {
	// the global variable for the entire highlight app

	return {
		LEVEL: 0,
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

				var set_LEVEL = function (source, target) {
					// change r output depth based on transition

					var delimiter_opened = source === 'normal' && target === 'open_delim' || 
						source === 'open_delim' && target === 'open_delim';
					
					var delimiter_closed = source === 'close_delim' && target === 'normal' ||
						source === 'close_delim' && target === 'close_delim';

					if (delimiter_opened) HIGHLIGHT.LEVEL = HIGHLIGHT.LEVEL + 1;
					if (delimiter_closed) HIGHLIGHT.LEVEL = HIGHLIGHT.LEVEL - 1;

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
			
				// alters global; HIGHLIGHT.LEVEL
				set_LEVEL(old_state, new_state);

				return this.output_token(old_state, new_state, token);

			}	
		},
		r_state_transitions: ( function () {
			// returns an object which contains objects - one for each possible state -
			// which contain an active field (is this the state we're currently on?) and 
			// edges: tokens that trigger a state change.

			var normal_and_delim_edges = ( function () {
				// characters that trigger a state transition - and the states they cause
				// the move to - that are used by the normal state and the delimiter states

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
			} )()

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
					'edges': normal_and_delim_edges()
				},
				
				'open_delim': {
					'active': false,
					'edges': normal_and_delim_edges()
				},
				'close_delim': {
					'active': false,
					'edges': normal_and_delim_edges()
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
		} )(),
		output_rules: function(level) {
			// generates an object describing state-state transitions for 
			// the R grammar highlighter; each edge is associated with some html output.
			// The output is dependent on level,
			// a global variable denoting how many levels nested the state machine
			// parsing this grammar currently is.
		 

			var span_open = function (class) {
				return '<span class="' + class + '">'
			}
			var span_close = function () {
				return '</span>'
			}
			var span = function (class, content) {
				return '<span class="' + class + '">' + content + '</span>'
			}

			var open_delim_output = function (level) {

				return {
					'(': span('lev' + level, '('),
					'[': span('lev' + level, '['),
					'{': span('lev' + level, '{')
				}
			}

			var close_delim_output = function (level) {

				return {
					')': span('lev' + level, ')'),
					']': span('lev' + level, ']'),
					'}': span('lev' + level, '}')
				}
			}

			var html_normal_and_delim = function (level) {
				// the html output associated with certain tokens
				// when in normal or delimiter states

				return {
					'str_single': {
						"'": span_open("sstring") + "'"
					},
					'str_double': {
						'"': span_open("dstring") + '"'
					},
					'normal': {
						'$': span('dollar', '$'),
						',': span('comma lev' + level, ','),
						'*nomatch*': '*token*'
					},
					'comment': {
						'#': span_open('comment') + '#'
					},
					'open_delim': open_delim_output(level),
					'close_delim': close_delim_output(level)
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
				'normal': html_normal_and_delim(level),
				'open_delim': html_normal_and_delim(level),
				'close_delim': html_normal_and_delim(level),
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
	}
} )();



