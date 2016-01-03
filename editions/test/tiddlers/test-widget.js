/*\
title: test-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests setvars widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Widget module", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

	function createWidgetNode(parseTreeNode,wiki) {
		return new widget.widget(parseTreeNode,{
				wiki: wiki,
				document: $tw.fakeDocument
			});
	}

	function parseText(text,wiki,options) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text,options);
		return parser ? {type: "widget", children: parser.tree} : undefined;
	}

	function renderWidgetNode(widgetNode) {
		$tw.fakeDocument.setSequenceNumber(0);
		var wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
		return wrapper;
	}

	function refreshWidgetNode(widgetNode,wrapper,changes) {
		var changedTiddlers = {};
		if(changes) {
			$tw.utils.each(changes,function(title) {
				changedTiddlers[title] = true;
			});
		}
		widgetNode.refresh(changedTiddlers,wrapper,null);
	}

	var wiki = new $tw.Wiki();
	// Add some tiddlers
	wiki.addTiddlers([{
		title: "foo",
		"text": "bar",
		"baz": "mumble frotz gronk",
		"true": "true",
		"false": ""
	}]);

	it("literals", function() {
		// Construct the widget node
		var text = "<$setvars foo='\\bar\\ \\baz\\'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>barbaz</p>");
	});

	it("attribute to variable", function() {
		// Construct the widget node
		var text = "<$setvars foo='bar' _bar='bar'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>bar</p>");
	});

	it("attributes to variable", function() {
		// Construct the widget node
		var text = "<$setvars foo='bar baz' _bar='bar' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>barbaz</p>");
	});

	it("attributes from variable and text-reference to variable", function() {
		// Construct the widget node
		var text = "<$tiddler tiddler='foo'><$setvars foo='bar baz' _bar={{!!title}} _baz=<<currentTiddler>>><<foo>></$setvars></$tiddler>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>foofoo</p>");
	});

	it("concatenated attributes should fail", function() {
		// Construct the widget node
		var text = "<$setvars foo='barbaz' _bar='bar' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p></p>");
	});

	it("simple OR", function() {
		// Construct the widget node
		var text = "<$setvars foo='bar || baz' _bar='bar' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>bar</p>");
	});

	it("simple OR fallback", function() {
		// Construct the widget node
		var text = "<$setvars foo='bar || baz' _bar='' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>baz</p>");
	});

	it("double OR", function() {
		// Construct the widget node
		var text = "<$setvars foo='bar || baz || mumble' _bar='bar' _baz='baz' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>bar</p>");
	});

	it("double OR fallback", function() {
		// Construct the widget node
		var text = "<$setvars foo='bar || baz || mumble' _bar='' _baz='' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>mumble</p>");
	});

	it("double OR undefeind & fallback", function() {
		// Construct the widget node
		var text = "<$setvars foo='bar || baz || mumble' _bar='' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>mumble</p>");
	});

	it("prefix OR(first) suffix", function() {
		// Construct the widget node
		var text = "<$setvars foo='prefix bar || baz suffix' _prefix='prefix_' _bar='bar' _baz='baz' _suffix='_suffix'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>prefix_bar_suffix</p>");
	});

	it("IF literal true THEN", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(\\true\\ ? bar)' _bar='bar'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>bar</p>");
	});

	it("IF attr true THEN", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz)' _bar='bar' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>baz</p>");
	});

	it("IF only brackets", function() {
		// Construct the widget node
		var text = "<$setvars foo='(\\true\\ ? bar)' _bar='bar'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>bar</p>");
	});

	it("IF attr true THEN a or b", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz || mumble)' _bar='bar' _baz='baz' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>baz</p>");
	});

	it("IF attr true THEN a or b fallback", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz || mumble)' _bar='bar' _baz='' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>mumble</p>");
	});

	it("IF literal false THEN", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(\\\\ ? bar)' _bar='bar'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p></p>");
	});

	it("IF attr false THEN", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz)' _bar='' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p></p>");
	});

	it("IF attr undefined THEN", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz)' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p></p>");
	});

	it("IF attr true THEN ELSE", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz) || mumble' _bar='bar' _baz='baz' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>baz</p>");
	});

	it("IF attr false THEN ELSE", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz) || mumble' _bar='' _baz='baz' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>mumble</p>");
	});

	it("IF attr false THEN ELSE bracketed", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz) || (mumble frotz)' _bar='' _baz='baz' _mumble='mumble' _frotz='frotz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>mumblefrotz</p>");
	});

	it("IF attr false THEN ELSE bracketed OR", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz) || (mumble || frotz)' _bar='' _baz='baz' _mumble='mumble' _frotz='frotz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>mumble</p>");
	});

	it("IF attr false THEN ELSE bracketed OR fallback", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz) || (mumble || frotz)' _bar='' _baz='baz' _mumble='' _frotz='frotz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>frotz</p>");
	});

	it("IF true then ELSE IF", function() {
		// Construct the widget node
		var text = "<$setvars foo='if(bar ? baz) || if(mumble || frotz)' _bar='bar' _baz='baz' _mumble='mumble' _frotz='frotz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>baz</p>");
	});

	it("IF false then ELSE IF", function() {
		// Construct the widget node
		var text = "<$setvars foo='(bar ? baz) || (mumble ? frotz)' _bar='' _baz='baz' _mumble='mumble' _frotz='frotz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>frotz</p>");
	});

	it("IF ==(is equal) then", function() {
		// Construct the widget node
		var text = "<$setvars foo='(bar == bar ? baz)' _bar='bar' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>baz</p>");
	});

	it("IF ==(not equal) then", function() {
		// Construct the widget node
		var text = "<$setvars foo='(bar == baz ? mumble )' _bar='bar' _baz='baz' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p></p>");
	});

	it("IF !=(not equal) then", function() {
		// Construct the widget node
		var text = "<$setvars foo='(bar != baz ? mumble)' _bar='bar' _baz='baz' _mumble='mumble'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>mumble</p>");
	});

	it("IF !=(is equal) then", function() {
		// Construct the widget node
		var text = "<$setvars foo='(bar != bar ? baz )' _bar='bar' _baz='baz'><<foo>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p></p>");
	});

	it("reuse declared var in same instance", function() {
		// Construct the widget node
		var text = "<$setvars _foo='foo' bar='foo' baz='bar'><<baz>></$setvars>"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>foo</p>");
	});

});

})();
