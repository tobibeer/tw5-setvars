/*\
title: $:/plugins/tobibeer/setvars/widgets.js
type: application/javascript
module-type: widget

Allows to set multiple variables in one go joining widget attributes:

@preserve
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetVarsWidget = function(parseTreeNode,options) {
	// Call the constructor
	Widget.call(this);
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetVarsWidget.prototype = Object.create(Widget.prototype);

/*
Render this widget into the DOM
*/
SetVarsWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
SetVarsWidget.prototype.execute = function() {
	// Parse variables
	var self = this,
		/*
		Helper function to parse the elements of a variable declaration
		*/
		getElements = function(val,filter,match) {
			var len,result,
				// The start index to be retrieved
				start = match[3],
				// The number of items to be retrieved
				length = match[4],
				// An empty value should the lists be empty
				empty = match[5],
				// Whether we want to join the output
				join = match[6],
				// Turn start and length into integers
				s = parseInt(start),
				l = parseInt(length),
				// Whether or not we want spliced results
				array = filter || start || length;
			// Are we evaluating a filter?
			if(filter) {
				// Get those titles
				result = self.wiki.filterTiddlers(val,self);
			// Not a filter
			} else {
				// Do we have a start or length?
				result = start || length ?
 					// Then parse as if a list and return the items
					$tw.utils.parseStringArray(val) :
					//  Otherwise array of a single value
					[val];
			}
			// How many results do we have?
			len = result.length;
			// If we have any and we wanted items from a list
			if(len && (start || length)) {
				// If we want to start at the end
				if(start === "n") {
					// Initialize start as last
					s = len;
				// If we want to start at the negative end, being the start
				} else if(start === "-n") {
					// Then we begin with the first
					s = 1;
				// If there is no start defined
				} else if(!start) {
					// Start with first
					s = 1;
				}
				// Got a length defined?
				if(length === "n") {
					// Then we take that
					l = len;
				// Length is negative to first?
				} else if(length === "-n") {
					// Length is is the opposite of
					l = -(
						// Negative start?
						s < 0 ?
						// Subtract from total length and add 1
						len + s + 1 :
						// From wherever start is
						s
					 );
				// We don't have a length?
				} else if(!length) {
					// So we just want one item
					l = 1;
				}
				// Compute start as max of either 1 or...
				s = Math.max(1,
					s < 0 ?
					// If we start from behind...
					// Subtract start from length and...
							 // add 1 should length be positive
							 // add 2 should length be negative
					(len + s + (l < 0 ? l + 2 : 1)) :
					// If we start from the beginning
						// add start and length and 1 for the array for negative length
						// or simply take the given number for a positive length
					(l < 0 ? s + l + 1 : s)
				);
				// Calculate length as maximum of 1 or the absolute value of l
				l = Math.max(1,Math.abs(l));
				// Splice results accordingly
				result = result.splice(s-1,l);
			}
			// Do we have no results and is there an empty value?
			if(!result.length && empty) {
				// Output the empty value
				result.push(empty);
			}
			// Did we want filtered or otherwise spliced results?
			return array ?
				// If we did
				(
					join === undefined ?
					// Stringify output
					$tw.utils.stringifyList(result) :
					// Or join
					result.join(join)
				) :
				// Not really an array => get value as first item
				result[0];
		};
	// Not during refresh
	if(!this.refreshing){
		// Initialize refreshing
		this.refreshing = 0;
		// Initialize objects holding the defined variable configuration
		this.$ = {
			vars: {},
			attr: {},
			set: {}
		};
		// Loop all attributes
		$tw.utils.each(this.attributes,function(val,key) {
			// Do we want to refresh vars?
			if(key === "$refresh") {
				// Remember
				self.refreshAll = 1;
			// Is this one used at a variable declaration?
			} else if(key.charAt(0) === "_") {
				// Store at "use" configurations
				self.$.attr[key.substr(1)] = val;
			// Is this a variable declaration?
			} else {
				// Store as "set" declarations
				self.$.vars[key] = val;
			}
		});
	}
	// Only once during refresh
	if(this.refreshing < 2) {
		// Loop all variables to be set
		$tw.utils.each(self.$.vars,function(vars,name) {
			var bIF,bCOMPARE,bTRUE,collect,next,was,
				// The last value we had, was none
				last="",
				// Not skipping anything
				skip=0,skipIF=0,
				// Init  variable value
				value="",
				// Copy vars string
				vs = vars,
				// Any patterns we're going to match as array of configurations being arrays of...
					// 0: the pattern regex
					// 1: if truthy, this pattern is skippable
					// 2: a function evaluating the pattern match
					//	  => returns  the string to be appended to the value
				patterns = [
					// Skip whitespace
					[/^\s+/, 1, function() {
						return false;
					}],
					// A literal
					[/^\\([^\\]*)\\/, 2, function(match) {
						// Take as is
						return match[1];
					}],
					// IF clause as...
					// if( foo || bar ? baz || mumble : frotz || gronk)
					// || => OR => (optional) take the first non-empty condition from left to right
					// ? => end of IF clause condition => met if collector non-empty
					// : => end of THEN branch => (optional) take this output when IF clause condition is met
					// ) => end of ELSE branch => (optional) take this output when IF clause condition is NOT met
					[/^(if\s*\(|\(|\?|\|\||\)|==|!=)/i, 0, function(match) {
						var m = match[1];
						if(m.charAt(m.length-1) === "(") {
							// Set IF clause flag
							bIF = 1;
							// If already skipping
							if(skip){
								// Skip entire IF clause
								skipIF = 1;
							// Otherwise
							} else {
								// Reset flags
								bTRUE = skip = 0;
								// Start collecting
								collect = "";
								// Single opening bracket?
								if(m.length === 1) {
									// Condition is met by default, no further evaluation
									bTRUE = 1;
								}
							}
						} else {
							// Switch matches
							switch (m) {
								// ORing values, works within or outside an IF clause
								case "||":
									// Already got a collected value?
									if(last.length) {
										// Start skipping
										skip = 1;
									}
									break;
								// Done with the IF clause condition
								case "?":
									// Only inside IF clause and not skipping
									if(bIF && !skipIF) {
										// Condition met if non-empty
										bTRUE = collect.length;
										// Skip if condition not met
										skip = !bTRUE;
										// Start collecting
										collect = "";
									}
									break;
								// Done with the IF clause
								case ")":
									// Only inside IF clause
									if(bIF) {
										// When IF clause condition true
										if(bTRUE) {
											// Add collector to value
											value += collect;
										}
										// Reset flags
										bIF = bTRUE = skip = 0;
										// Start collecting anew
										collect = "";
									}
									// In any case, stop skipping IF
									skipIF = 0;
									break;
								// Comparison
								case "==":
								case "!=":
									// Only inside IF clause
									if(bIF) {
										// Remember that we want to compare
										bCOMPARE = m;
									}
									break;
								}
							}
						return false;
					}],
					// Looks for definition to evaluate a value or filter
					// Grabs all the start / end / empty / join options
					// Using these capture groups:
					// 1: starting bracket 6: closing braket for filter
					// 2: the name of the attribute
					// 3: start number
					// 4: number of titles to get
					// 5: empty value
					[/^(\[)?(\w+)(?:\[(-?\d*|-?n)(?:,(-?\d*|-?n))?\])?(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?(\])?/, 2, function(match) {
						// Get the value for the attribute
						var v = self.$.attr[match[2]];
						// If not defined
						if (v === undefined) {
							// Check for computed variable
							v = self.$.set[match[2]];
						}
						// Is it non-empty?
						if(v) {
							// Do we want a filter?
							if(match[1] && match[7]) {
								// Retrieve the value from a filter
								v = getElements(v,true,match);
							// We don't want a filter?
							} else if(!match[1] && !match[7]) {
								// Retrieve the value from a string
								v = getElements(v,false,match);
							// We have just an opening or a closing bracket?
							} else {
								// Wrong syntax
								v = null;
							}
						// Undefined
						} else {
							// Interpret as empty string
							v = "";
						}
						return v;
					}]
				];

			// So long as we have a definition string...
			while(vs.length){
				// Remember what it was before pattern matching
				was = vs;
				// Reset string to append
				var append = "";
				// Loop patterns
				$tw.utils.each(patterns, function(p) {
					// Test pattern against current remainder
					var match = p[0].exec(vs);
					// Got a match?
					if(match) {
						// If we're not skipping
						// Or the pattern must not be skipped...
						if (!skip || !p[1]) {
							// Get the string to append by calling the corresponding function
							append = p[2].call(this,match);
							// Pattern function returned an error
							if(append === null) {
								append = "error: missing bracket in setvars";
							// Otherwise, anything to append?
							} else if(typeof append === "string") {
								// Remember what we were appending
								last = append;
							}
						}
						// Remember whether or not we want to skip the pattern outside an if clause only
						next = p[1] === 2;
						// Remove from string
						vs = vs.substr(match[0].length);
						// Only check until we got a matching pattern, then start over with first pattern
						return false;
					}
				});
				// Anything to append?
				if (append) {
					// If we're in an IF clause
					if(bIF) {
						// When checking for (non-)equality
						if(bCOMPARE) {
							// Set last value to...
							last = (
								// Compare equals and collected value equal to append value OR
								bCOMPARE === "==" && collect === append ||
								// Compare not-equals and collected value not append value
								bCOMPARE === "!=" && collect !== append
							) ?
								// Return literal true
								"true" :
								// Return nothing at all
								"";
							// Set collector to last
							collect = last;
							// Reset comparator
							bCOMPARE = "";
						// Not checking equality
						} else {
							// Add to collected condition
							collect += append;
						}
					// Otherwise, only append if we're not skipping...
					} else if(!skip) {
						// Add to value
						value += append;
					}
				}
				// Outside an IF clause if we had a matching pattern that would yield something
				if(!bIF && next) {
					// Only skip once
					skip = 0;
				}
				// Nothing changed?
				if(was === vs) {
					// Error, this definition string is not working with our pattern matching
					value = "setvars error: invalid syntax";
					// We're done
					vs = "";
				}
			}
			// Remember value
			self.$.set[name] = value;
			// Write that variable, after all
			self.setVariable(name,value);
		});
	}
	// If not recomputing for refresh or final refreshSelf
	if(!this.refreshing || this.refreshing === 2) {
		// Construct the child widgets
		this.makeChildWidgets();
	}
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetVarsWidget.prototype.refresh = function(changedTiddlers) {
	var changed=0,set,
		self = this,
		changedAttributes = this.computeAttributes();
	// Any attributes changed?
	if(Object.keys(changedAttributes).length) {
		// Gotta refresh
		this.refreshSelf();
		return true;
	// Refreshing computations?
	} else if (this.refreshAll) {
		// Store current values
		set = JSON.parse(JSON.stringify(this.$.set));
		// Set flag to only compute
		this.refreshing = 1;
		// Execute
		this.execute();
		// Loop previously set vars
		$tw.utils.each(
			set,
			// Check values for keys
			function(val,key){
				// If different than last value
				if(val !== self.$.set[key]) {
					// Changed indeed
					changed = 1;
					// No need for further testing
					return false;
				}
			}
		);
		// Any changed variables?
		if(changed) {
			// Nest refresh stage
			this.refreshing = 2;
			// Refresh
			this.refreshSelf();
			return true;
		}
		// Reset refresn level
		this.refreshing = 0;
	}
	// Refreshed if children refresh
	return this.refreshChildren(changedTiddlers);
};

exports.setvars = SetVarsWidget;

})();
