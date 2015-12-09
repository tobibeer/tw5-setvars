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
		getElements = function(val,filter,match) {
			var len,result,s0,
				start = match[3],
				length = match[4],
				empty = match[5],
				s = parseInt(start),
				l = parseInt(length);
			if(filter) {
				result = self.wiki.filterTiddlers(val,self);
			} else {
				result = start || length ? $tw.utils.parseStringArray(val) : [val];
			}
			len = result.length;
			if(len && (start || length)) {
				if(start === "n") {
					s = len;
				} else if(start === "-n") {
					s = 1;
				} else if(!start) {
					s = 1;
				}
				if(length === "n") {
					l = len;
				} else if(length === "-n") {
					l = -(s < 0 ? len + s + 1 : s);
				} else if(!length) {
					l = 1;
				}
				s0 = s;
				s = Math.max(1,
					s < 0 ?
					(len + s + (l < 0 ? l + 2 : 1)) :
					(l < 0 ? s + l + 1 : s)
				);
				l = Math.max(1,Math.abs(l));
				console.log("SPLICING",result,s-1,l);
				result = result.splice(s-1,l);
				console.log("SPLICE-RESULT",result,s-1,l);
			}
			if(empty && !result.length) {
				result.push(empty);
			}
			return $tw.utils.stringifyList(result);
		};
	this.set = {};
	this.use = {};
	$tw.utils.each(this.attributes,function(val,key) {
		if(key.charAt(0) === "_") {
			self.use[key.substr(1)] = val;
		} else {
			self.set[key] = val;
		}
	});

	$tw.utils.each(self.set,function(vars,name) {
		var i,match,v,value="",was,
			re = /^(\[)?(\w+)(?:\[(-?\d*|-?n)(?:,(-?\d*|-?n))?\])?(?:\[([^\]]*)\])?(\])?(?:\s|$)/,
			vs = vars;
		while(vs){
			was = vs;
			match = /^\s/.exec(vs);
			if(match) {
				vs = vs.substr(match[0].length);
			}
			match = /^\\([^\\]*)\\/.exec(vs);
			if(match) {
				value += match[1];
				console.log("LITERAL",value,match);
				vs = vs.substr(match[0].length);
			}
			match = re.exec(vs);
			if(match) {
				v = self.use[match[2]];
				if(v) {
					if(match[1] && match[6]) {
						value += getElements(v,true,match);
					} else if(!match[1] && !match[6]) {
						value += getElements(v,false,match);
					} else {
						value += "setvars: missing bracket";
					}
				}
				vs = vs.substr(match[0].length);
			}
			// no match?
			if (vs === was) {
				i = vs.indexOf(" ");
				vs = i < 0 ? "" : vs.substr(i+1);
			}
		}
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
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.setvars = SetVarsWidget;

})();
