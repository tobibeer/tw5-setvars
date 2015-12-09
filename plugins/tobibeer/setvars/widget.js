/*\
title: $:/plugins/tobibeer/setvars/widgets.js
type: application/javascript
module-type: widget

Allows to set multiple variables in one go joining widget attributes:

@preserve
\*/
(function(){"use strict";var e=require("$:/core/modules/widgets/widget.js").widget;var t=function(t,s){e.call(this);this.initialise(t,s)};t.prototype=Object.create(e.prototype);t.prototype.render=function(e,t){this.parentDomNode=e;this.computeAttributes();this.execute();this.renderChildren(e,t)};t.prototype.execute=function(){var e=this,t=function(t,s,i){var r,n,l,u=i[3],f=i[4],h=i[5],o=parseInt(u),a=parseInt(f);if(s){n=e.wiki.filterTiddlers(t,e)}else{n=u||f?$tw.utils.parseStringArray(t):[t]}r=n.length;if(r&&(u||f)){if(u==="n"){o=r}else if(u==="-n"){o=1}else if(!u){o=1}if(f==="n"){a=r}else if(f==="-n"){a=-(o<0?r+o+1:o)}else if(!f){a=1}l=o;o=Math.max(1,o<0?r+o+(a<0?a+2:1):a<0?o+a+1:o);a=Math.max(1,Math.abs(a));console.log("SPLICING",n,o-1,a);n=n.splice(o-1,a);console.log("SPLICE-RESULT",n,o-1,a)}if(h&&!n.length){n.push(h)}return $tw.utils.stringifyList(n)};this.set={};this.use={};$tw.utils.each(this.attributes,function(t,s){if(s.charAt(0)==="_"){e.use[s.substr(1)]=t}else{e.set[s]=t}});$tw.utils.each(e.set,function(s,i){var r,n,l,u="",f,h=/^(\[)?(\w+)(?:\[(-?\d*|-?n)(?:,(-?\d*|-?n))?\])?(?:\[([^\]]*)\])?(\])?(?:\s|$)/,o=s;while(o){f=o;n=/^\s/.exec(o);if(n){o=o.substr(n[0].length)}n=/^\\([^\\]*)\\/.exec(o);if(n){u+=n[1];console.log("LITERAL",u,n);o=o.substr(n[0].length)}n=h.exec(o);if(n){l=e.use[n[2]];if(l){if(n[1]&&n[6]){u+=t(l,true,n)}else if(!n[1]&&!n[6]){u+=t(l,false,n)}else{u+="setvars: missing bracket"}}o=o.substr(n[0].length)}if(o===f){r=o.indexOf(" ");o=r<0?"":o.substr(r+1)}}e.setVariable(i,u)});this.makeChildWidgets()};t.prototype.refresh=function(e){var t=this.computeAttributes();if(Object.keys(t).length){this.refreshSelf();return true}return this.refreshChildren(e)};exports.setvars=t})();