"use strict";

var HIGHLIGHT = ( function () {
	// global object for highlight.js (great name, huh?).
	// released under the GLP-3, copyright Ryan Grannell.

	return {
		StateMachine: function (states, outputs) {

			var fsm_state = {
				level: 0,
				state_transitions: states,
				output_rules: outputs( this.level )
			}

			this.consume_token = function (token) {
				// takes a single token, updates internal state if
				// the token caused a state -> state transition. returns a
				// pretty html string to the user.

				var html_output = function (source, target, token) {
					// takes a source state, target state and a token that
					// triggered the transition. returns a html string that
					// styles the input token

					var state_rules = fsm_state.output_rules[source][target];
					var html_string = token;

					for (var candidate in state_rules) {
						if (candidate !== '*nomatch*' && candidate === token) {
							html_string = state_rules[candidate];
						}			
					}	
					return html_string;
				}

				var change_level_state = function (source, target, level) {
					// change r output depth based on transition

					var delimiter_opened = 
						(source === 'normal' && 
							target === 'open_delim') || 
						(source === 'open_delim' &&
							target === 'open_delim');
					
					var delimiter_closed = 
						(source === 'close_delim' &&
							target === 'normal') ||
						(source === 'close_delim' &&
							target === 'close_delim');

					if (delimiter_opened) {
						level += 1;
					} else if (delimiter_closed) {
						level -= 1;
					}

					fsm_state.level = level;
					fsm_state.output_rules = HIGHLIGHT.output_rules(level);

					return {
						"level": level, 
						"output_rules": HIGHLIGHT.output_rules(level) 
					}
				}

				token = token + "";
				
				for (var st in fsm_state.state_transitions) {
					if (fsm_state.state_transitions[st].active) {
						var active = fsm_state.state_transitions[st];
						var old_state = st;
					}
				}

				var new_state = active.edges['*nomatch*'];

				for (var ed in active.edges) {
					if (token === ed) new_state = active.edges[ed];
				}

				fsm_state.state_transitions[old_state].active = false;
				fsm_state.state_transitions[new_state].active = true;
			
				change_level_state(old_state, new_state, fsm_state.level);

				return html_output(old_state, new_state, token);

			}
		},
		highlight_text: function (text) {
			// given (presumably legal) R code as a single string, 
			// return a string of higlighted R code

			var highlighted_code = '';
			var r_state_machine = new HIGHLIGHT.StateMachine(
				HIGHLIGHT.r_state_transitions,
				HIGHLIGHT.output_rules);

			for (var i = 0; i < text.length; i++) {
			
				var token = text.substring(i, i+1);
				highlighted_code = 
					highlighted_code + r_state_machine.consume_token(token);
			
			}

			return highlighted_code
		},
		highlight_r_code: function () {
			// alter all class = "r" tags in a html document,
			// returning code that can be targeted with css

			$('.r').replaceWith( function (index, content) {
				return '<code class = "r">' + 
					HIGHLIGHT.highlight_text($(this).text()) + 
				'</code>';
			} );

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
					'edges': normal_and_delim_edges
				},
				
				'open_delim': {
					'active': false,
					'edges': normal_and_delim_edges
				},
				'close_delim': {
					'active': false,
					'edges': normal_and_delim_edges
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

			var span_open = function (css_class) {
				return '<span class="' + css_class + '">'
			}
			var span_close = function () {
				return '</span>'
			}
			var span = function (css_class, content) {
				return '<span class="' + css_class + '">' + content + '</span>'
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



