
(function () {
	"use strict"
} )()

highlight = ( function () {
	/* global object for highlight.js (great name, huh?).
	  released under the GLP-3, copyright Ryan Grannell. */

	return {
		StateMachine: function (states, outputs) {

			var that = {
				depth: 0,
				transitions: states,
				output_rules: outputs( this.depth )				
			}

			that.consume_token = function (token) {
				/* takes a single token, updates internal state if
				 the token caused a state -> state transition. returns a
				 pretty html string to the user. */

				var html_output = function (source, target, token) {
					/* takes a source state, target state and a token that
					 triggered the transition. returns a html string that
					 styles the input token. */

					var state_rules = that.output_rules[source][target]
					var html_string = token

					for (var candidate in state_rules) {
						if (!state_rules.hasOwnProperty(candidate)) {
							continue
						}
						if (candidate !== '*nomatch*' && candidate === token) {
							html_string = state_rules[candidate]
						}			
					}	
					return html_string
				}

				var change_depth_state = function (source, target, depth) {
					// change r output depth based on transition

					var delimiter_opened = 
						(source === 'normal' && 
							target === 'open_delim') || 
						(source === 'open_delim' &&
							target === 'open_delim')
					
					var delimiter_closed = 
						(source === 'close_delim' &&
							target === 'normal') ||
						(source === 'close_delim' &&
							target === 'close_delim')

					if (delimiter_opened) {
						depth += 1
					} else if (delimiter_closed) {
						depth -= 1
					}

					that.depth = depth
					that.output_rules = highlight.output_rules(depth)

					return {
						"depth": depth, 
						"output_rules": highlight.output_rules(depth) 
					}
				}

				token = token + ""
				
				for (var transition in that.transitions) {
					if (!that.transitions.hasOwnProperty(transition)) {
						continue
					}

					if (that.transitions[transition].active) {
						var active = that.transitions[transition]
						var old_state = transition
					}
				}

				var new_state = active.edges['*nomatch*']
				for (var edge in active.edges) {
					if (!active.edges.hasOwnProperty(edge)) {
						continue
					}					
					if (token === edge) {
						new_state = active.edges[edge]
					}
				}

				that.transitions[old_state].active = false
				that.transitions[new_state].active = true
			
				change_depth_state(old_state, new_state, that.depth)

				return html_output(old_state, new_state, token)

			}
			return that
		},
		highlight_text: function (text) {
			/* given (presumably legal) R code as a single string, 
			 return a string of higlighted R code */

			var highlighted_code = ''
			var r_state_machine = highlight.StateMachine(
				highlight.r_transitions,
				highlight.output_rules)

			for (var ith = 0; ith < text.length; ith++) {
			
				var token = text.substring(ith, ith+1)
				highlighted_code = 
					highlighted_code + r_state_machine.consume_token(token)
			
			}

			return highlighted_code
		},
		highlight_r_code: function () {
			/* alter all class = "r" tags in a html document,
			 returning code that can be targeted with css. */

			$('.r').replaceWith( function (index, content) {
				return '<code class = "r">' + 
					highlight.highlight_text($(this).text()) + 
				'</code>'
			} )

		},
		r_transitions: ( function () {
			/* returns an object which contains objects - one for each possible state -
			 which contain an active field (is this the state we're currently on?) and 
			 edges: tokens that trigger a state change. */

			var normal_and_delim_edges = ( function () {
				/* characters that trigger a state transition - and the states they cause
				 the move to - that are used by the normal state and the delimiter states. */

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
		output_rules: function(depth) {
			/* generates an object describing state-state transitions for 
			 the R grammar highlighter each edge is associated with some html output.
			 The output is dependent on depth,
			 a global variable denoting how many depths nested the state machine
			 parsing this grammar currently is. */

			var span_open = function (css_class) {
				return '<span class="' + css_class + '">'
			}
			var span_close = function () {
				return '</span>'
			}
			var span = function (css_class, content) {
				return '<span class="' + css_class + '">' + content + '</span>'
			}

			var open_delim_output = function (depth) {

				return {
					'(': span('lev' + depth, '('),
					'[': span('lev' + depth, '['),
					'{': span('lev' + depth, '{')
				}
			}

			var close_delim_output = function (depth) {

				return {
					')': span('lev' + depth, ')'),
					']': span('lev' + depth, ']'),
					'}': span('lev' + depth, '}')
				}
			}

			var html_code_state = function (depth) {
				/* the html output associated with certain tokens
				 when in normal or delimiter states. */

				return {
					'str_single': {
						"'": span_open("sstring") + "'"
					},
					'str_double': {
						'"': span_open("dstring") + '"'
					},
					'normal': {
						'$': span('dollar', '$'),
						',': span('comma lev' + depth, ','),
						'*nomatch*': '*token*'
					},
					'comment': {
						'#': span_open('comment') + '#'
					},
					'open_delim': open_delim_output(depth),
					'close_delim': close_delim_output(depth)
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
				'normal': html_code_state(depth),
				'open_delim': html_code_state(depth),
				'close_delim': html_code_state(depth),
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
} )()



