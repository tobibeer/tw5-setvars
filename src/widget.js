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
			var len,result,s0,
				// The start index to be retrieved
				start = match[3],
				// The number of items to be retrieved
				length = match[4],
				// An empty value should the list be empty
				empty = match[5],
				// Whether we want to join the output
				join = match[6],
				// Turn start and length into inteers
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
				// Store start, because we're about to change it and need it later
				s0 = s;
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
				// Splice those results accordingly
				result = result.splice(s-1,l);
			}
			// Do we have an empty value and no results?
			if(empty && !result.length) {
				// Output the empty value
				result.push(empty);
			}
			// Did we want filtered or otherwise spliced results?
			return array ?
				// If we did
				(
					join !== undefined ?
					// Join output
					result.join(join) :
					// Or stringify
					$tw.utils.stringifyList(result)
				) :
				// Not really an array => value from first item
				result[0];
		};
	// Initialize objects holding the defined variable configuration
	this.set = {};
	this.use = {};
	// Loop all attributes
	$tw.utils.each(this.attributes,function(val,key) {
		// Is this one used at a variable declaration?
		if(key.charAt(0) === "_") {
			// Store ate use configuration
			self.use[key.substr(1)] = val;
		// Is this a variable declaration?
		} else {
			// Store as variable declaration
			self.set[key] = val;
		}
	});

	// Loop all variables to be set
	$tw.utils.each(self.set,function(vars,name) {
		var i,match,v,value="",was,
			// This one checks if we're evaluating a filter and grabs all the start / end / empty bits
			// The capture groups:
			// 1: starting bracket 6: closing braket for filter
			// 2: the name of the attribute
			// 3: start number
			// 4: number of titles to get
			// 5: empty value
			re = /^(\[)?(\w+)(?:\[(-?\d*|-?n)(?:,(-?\d*|-?n))?\])?(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?(\])?(?:\s|$)/,
			// Copy that string
			vs = vars;
		// So long as we have some of it left
		while(vs){
			// Se if it changed since the last turn
			was = vs;
			// Discard white-space
			match = /^\s/.exec(vs);
			if(match) {
				vs = vs.substr(match[0].length);
			}
			// Check if it's a literal
			match = /^\\([^\\]*)\\/.exec(vs);
			// If it is
			if(match) {
				// Simply add to the output
				value += match[1];
				// Cut off
				vs = vs.substr(match[0].length);
			}
			// Check if we got an attribute definition
			match = re.exec(vs);
			// Got one?
			if(match) {
				// Get the value for the attribute
				v = self.use[match[2]];
				// Is it non-empty?
				if(v) {
					// Do we want a filter?
					if(match[1] && match[7]) {
						// Retrieve the value from a filter
						value += getElements(v,true,match);
					// We don't want a filter?
					} else if(!match[1] && !match[7]) {
						// Retrieve the value from a string
						value += getElements(v,false,match);
					// We have just an opening or a closing bracket?
					} else {
						// Wrong syntax
						value += "setvars: missing bracket";
					}
				}
				// Cut off matched bits
				vs = vs.substr(match[0].length);
			}
			// no match?
			if (vs === was) {
				// Find next empty space
				i = vs.indexOf(" ");
				// Cut off
				vs = i < 0 ? "" : vs.substr(i+1);
			}
		}
		// Write that variable, after all
		self.setVariable(name,value);
	});
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetVarsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Any attributes changed?
	if(Object.keys(changedAttributes).length) {
		// Gotta refresh
		this.refreshSelf();
		return true;
	}
	// Refreshed if children refresh
	return this.refreshChildren(changedTiddlers);
};

exports.setvars = SetVarsWidget;

})();
