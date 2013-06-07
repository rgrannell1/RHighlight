
PRISM = {}
PRISM.level = 0;

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

/* 
	a factored out bit of grammar for output rules;
	output rules in normal or paren states
*/
var output_normal_states = function (val) {

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

/*
	the rules for state -> state transitions
*/

r_rules = {
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

/* 
	generates a json object describing output rules for each 
	(state, state) pair,
	depending of the bracketing level
*/

output_rules = function(level) {

	return {
		'str_single': {
			'str_single': {
				'"': span_open("ssdouble") + '"' + span_close(),
				'*nomatch*': '*token*'
			},
			'normal': {
				"'": "'" + span_close() 
			}
		},
		'str_double': {
			'str_double': {
				"'": span_open("dssingle") + "'" + span_close(),
				'*nomatch*': '*token*'
			},
			'normal': {
				'"': '"' + span_close()
			}
		},
		'normal': output_normal_states(level),
		'open_delim': output_normal_states(level),
		'close_delim': output_normal_states(level),
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
				'@': span_open('at') + '@' + span_close()
			}
		}
	}
}