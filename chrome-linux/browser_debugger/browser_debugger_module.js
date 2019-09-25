BrowserDebugger.DOMBreakpointsSidebarPane=class extends UI.VBox{constructor(){super(true);this.registerRequiredCSS('browser_debugger/domBreakpointsSidebarPane.css');this._listElement=this.contentElement.createChild('div','breakpoint-list hidden');this._emptyElement=this.contentElement.createChild('div','gray-info-message');this._emptyElement.textContent=Common.UIString('No breakpoints');this._items=new Map();SDK.targetManager.addModelListener(SDK.DOMDebuggerModel,SDK.DOMDebuggerModel.Events.DOMBreakpointAdded,this._breakpointAdded,this);SDK.targetManager.addModelListener(SDK.DOMDebuggerModel,SDK.DOMDebuggerModel.Events.DOMBreakpointToggled,this._breakpointToggled,this);SDK.targetManager.addModelListener(SDK.DOMDebuggerModel,SDK.DOMDebuggerModel.Events.DOMBreakpointsRemoved,this._breakpointsRemoved,this);for(const domDebuggerModel of SDK.targetManager.models(SDK.DOMDebuggerModel)){domDebuggerModel.retrieveDOMBreakpoints();for(const breakpoint of domDebuggerModel.domBreakpoints())
this._addBreakpoint(breakpoint);}
this._highlightedElement=null;this._update();}
_breakpointAdded(event){this._addBreakpoint((event.data));}
_breakpointToggled(event){const breakpoint=(event.data);const item=this._items.get(breakpoint);if(item)
item.checkbox.checked=breakpoint.enabled;}
_breakpointsRemoved(event){const breakpoints=(event.data);for(const breakpoint of breakpoints){const item=this._items.get(breakpoint);if(item){this._items.delete(breakpoint);this._listElement.removeChild(item.element);}}
if(!this._listElement.firstChild){this._emptyElement.classList.remove('hidden');this._listElement.classList.add('hidden');}}
_addBreakpoint(breakpoint){const element=createElementWithClass('div','breakpoint-entry');element.addEventListener('contextmenu',this._contextMenu.bind(this,breakpoint),true);const checkboxLabel=UI.CheckboxLabel.create('',breakpoint.enabled);const checkboxElement=checkboxLabel.checkboxElement;checkboxElement.addEventListener('click',this._checkboxClicked.bind(this,breakpoint),false);element.appendChild(checkboxLabel);const labelElement=createElementWithClass('div','dom-breakpoint');element.appendChild(labelElement);const description=createElement('div');const breakpointTypeLabel=BrowserDebugger.DOMBreakpointsSidebarPane.BreakpointTypeLabels.get(breakpoint.type);description.textContent=breakpointTypeLabel;const linkifiedNode=createElementWithClass('monospace');linkifiedNode.style.display='block';labelElement.appendChild(linkifiedNode);Common.Linkifier.linkify(breakpoint.node).then(linkified=>{linkifiedNode.appendChild(linkified);UI.ARIAUtils.setAccessibleName(checkboxElement,ls`${breakpointTypeLabel}: ${linkified.deepTextContent()}`);});labelElement.appendChild(description);const item={breakpoint:breakpoint,element:element,checkbox:checkboxElement};element._item=item;this._items.set(breakpoint,item);let currentElement=this._listElement.firstChild;while(currentElement){if(currentElement._item&&currentElement._item.breakpoint.type<breakpoint.type)
break;currentElement=currentElement.nextSibling;}
this._listElement.insertBefore(element,currentElement);this._emptyElement.classList.add('hidden');this._listElement.classList.remove('hidden');}
_contextMenu(breakpoint,event){const contextMenu=new UI.ContextMenu(event);contextMenu.defaultSection().appendItem(Common.UIString('Remove breakpoint'),()=>{breakpoint.domDebuggerModel.removeDOMBreakpoint(breakpoint.node,breakpoint.type);});contextMenu.defaultSection().appendItem(Common.UIString('Remove all DOM breakpoints'),()=>{breakpoint.domDebuggerModel.removeAllDOMBreakpoints();});contextMenu.show();}
_checkboxClicked(breakpoint){const item=this._items.get(breakpoint);if(!item)
return;breakpoint.domDebuggerModel.toggleDOMBreakpoint(breakpoint,item.checkbox.checked);}
flavorChanged(object){this._update();}
_update(){const details=UI.context.flavor(SDK.DebuggerPausedDetails);if(!details||!details.auxData||details.reason!==SDK.DebuggerModel.BreakReason.DOM){if(this._highlightedElement){this._highlightedElement.classList.remove('breakpoint-hit');delete this._highlightedElement;}
return;}
const domDebuggerModel=details.debuggerModel.target().model(SDK.DOMDebuggerModel);if(!domDebuggerModel)
return;const data=domDebuggerModel.resolveDOMBreakpointData((details.auxData));if(!data)
return;let element=null;for(const item of this._items.values()){if(item.breakpoint.node===data.node&&item.breakpoint.type===data.type)
element=item.element;}
if(!element)
return;UI.viewManager.showView('sources.domBreakpoints');element.classList.add('breakpoint-hit');this._highlightedElement=element;}};BrowserDebugger.DOMBreakpointsSidebarPane.Item;BrowserDebugger.DOMBreakpointsSidebarPane.BreakpointTypeLabels=new Map([[SDK.DOMDebuggerModel.DOMBreakpoint.Type.SubtreeModified,Common.UIString('Subtree modified')],[SDK.DOMDebuggerModel.DOMBreakpoint.Type.AttributeModified,Common.UIString('Attribute modified')],[SDK.DOMDebuggerModel.DOMBreakpoint.Type.NodeRemoved,Common.UIString('Node removed')],]);BrowserDebugger.DOMBreakpointsSidebarPane.ContextMenuProvider=class{appendApplicableItems(event,contextMenu,object){const node=(object);if(node.pseudoType())
return;const domDebuggerModel=node.domModel().target().model(SDK.DOMDebuggerModel);if(!domDebuggerModel)
return;function toggleBreakpoint(type){if(domDebuggerModel.hasDOMBreakpoint(node,type))
domDebuggerModel.removeDOMBreakpoint(node,type);else
domDebuggerModel.setDOMBreakpoint(node,type);}
const breakpointsMenu=contextMenu.debugSection().appendSubMenuItem(Common.UIString('Break on'));for(const key in SDK.DOMDebuggerModel.DOMBreakpoint.Type){const type=SDK.DOMDebuggerModel.DOMBreakpoint.Type[key];const label=Sources.DebuggerPausedMessage.BreakpointTypeNouns.get(type);breakpointsMenu.defaultSection().appendCheckboxItem(label,toggleBreakpoint.bind(null,type),domDebuggerModel.hasDOMBreakpoint(node,type));}}};;BrowserDebugger.EventListenerBreakpointsSidebarPane=class extends UI.VBox{constructor(){super(true);this._categoriesTreeOutline=new UI.TreeOutlineInShadow();this._categoriesTreeOutline.element.tabIndex=0;this._categoriesTreeOutline.registerRequiredCSS('browser_debugger/eventListenerBreakpoints.css');this.contentElement.appendChild(this._categoriesTreeOutline.element);this._categories=new Map();const categories=SDK.domDebuggerManager.eventListenerBreakpoints().map(breakpoint=>breakpoint.category());categories.sort();for(const category of categories){if(!this._categories.has(category))
this._createCategory(category);}
this._breakpoints=new Map();for(const breakpoint of SDK.domDebuggerManager.eventListenerBreakpoints())
this._createBreakpoint(breakpoint);SDK.targetManager.addModelListener(SDK.DebuggerModel,SDK.DebuggerModel.Events.DebuggerPaused,this._update,this);SDK.targetManager.addModelListener(SDK.DebuggerModel,SDK.DebuggerModel.Events.DebuggerResumed,this._update,this);UI.context.addFlavorChangeListener(SDK.Target,this._update,this);}
_createCategory(name){const labelNode=UI.CheckboxLabel.create(name);labelNode.checkboxElement.addEventListener('click',this._categoryCheckboxClicked.bind(this,name),true);const treeElement=new UI.TreeElement(labelNode);treeElement.selectable=false;this._categoriesTreeOutline.appendChild(treeElement);this._categories.set(name,{element:treeElement,checkbox:labelNode.checkboxElement});}
_createBreakpoint(breakpoint){const labelNode=UI.CheckboxLabel.create(breakpoint.title());labelNode.classList.add('source-code');labelNode.checkboxElement.addEventListener('click',this._breakpointCheckboxClicked.bind(this,breakpoint),true);const treeElement=new UI.TreeElement(labelNode);treeElement.listItemElement.createChild('div','breakpoint-hit-marker');treeElement.selectable=false;this._categories.get(breakpoint.category()).element.appendChild(treeElement);this._breakpoints.set(breakpoint,{element:treeElement,checkbox:labelNode.checkboxElement});}
_update(){const target=UI.context.flavor(SDK.Target);const debuggerModel=target?target.model(SDK.DebuggerModel):null;const details=debuggerModel?debuggerModel.debuggerPausedDetails():null;if(!details||details.reason!==SDK.DebuggerModel.BreakReason.EventListener||!details.auxData){if(this._highlightedElement){this._highlightedElement.classList.remove('breakpoint-hit');delete this._highlightedElement;}
return;}
const breakpoint=SDK.domDebuggerManager.resolveEventListenerBreakpoint((details.auxData));if(!breakpoint)
return;UI.viewManager.showView('sources.eventListenerBreakpoints');this._categories.get(breakpoint.category()).element.expand();this._highlightedElement=this._breakpoints.get(breakpoint).element.listItemElement;this._highlightedElement.classList.add('breakpoint-hit');}
_categoryCheckboxClicked(category){const item=this._categories.get(category);const enabled=item.checkbox.checked;for(const breakpoint of this._breakpoints.keys()){if(breakpoint.category()===category){breakpoint.setEnabled(enabled);this._breakpoints.get(breakpoint).checkbox.checked=enabled;}}}
_breakpointCheckboxClicked(breakpoint){const item=this._breakpoints.get(breakpoint);breakpoint.setEnabled(item.checkbox.checked);let hasEnabled=false;let hasDisabled=false;for(const other of this._breakpoints.keys()){if(other.category()===breakpoint.category()){if(other.enabled())
hasEnabled=true;else
hasDisabled=true;}}
const checkbox=this._categories.get(breakpoint.category()).checkbox;checkbox.checked=hasEnabled;checkbox.indeterminate=hasEnabled&&hasDisabled;}};BrowserDebugger.EventListenerBreakpointsSidebarPane.Item;;BrowserDebugger.ObjectEventListenersSidebarPane=class extends UI.VBox{constructor(){super();this._refreshButton=new UI.ToolbarButton(Common.UIString('Refresh'),'largeicon-refresh');this._refreshButton.addEventListener(UI.ToolbarButton.Events.Click,this._refreshClick,this);this._refreshButton.setEnabled(false);this._eventListenersView=new EventListeners.EventListenersView(this.update.bind(this));this._eventListenersView.show(this.element);}
toolbarItems(){return[this._refreshButton];}
update(){if(this._lastRequestedContext){this._lastRequestedContext.runtimeModel.releaseObjectGroup(BrowserDebugger.ObjectEventListenersSidebarPane._objectGroupName);delete this._lastRequestedContext;}
const executionContext=UI.context.flavor(SDK.ExecutionContext);if(!executionContext){this._eventListenersView.reset();this._eventListenersView.addEmptyHolderIfNeeded();return;}
this._lastRequestedContext=executionContext;Promise.all([this._windowObjectInContext(executionContext)]).then(this._eventListenersView.addObjects.bind(this._eventListenersView));}
wasShown(){super.wasShown();UI.context.addFlavorChangeListener(SDK.ExecutionContext,this.update,this);this._refreshButton.setEnabled(true);this.update();}
willHide(){super.willHide();UI.context.removeFlavorChangeListener(SDK.ExecutionContext,this.update,this);this._refreshButton.setEnabled(false);}
_windowObjectInContext(executionContext){return executionContext.evaluate({expression:'self',objectGroup:BrowserDebugger.ObjectEventListenersSidebarPane._objectGroupName,includeCommandLineAPI:false,silent:true,returnByValue:false,generatePreview:false},false,false).then(result=>result.object&&!result.exceptionDetails?result.object:null);}
_refreshClick(event){event.data.consume();this.update();}};BrowserDebugger.ObjectEventListenersSidebarPane._objectGroupName='object-event-listeners-sidebar-pane';;BrowserDebugger.XHRBreakpointsSidebarPane=class extends UI.VBox{constructor(){super(true);this.registerRequiredCSS('browser_debugger/xhrBreakpointsSidebarPane.css');this._listElement=this.contentElement.createChild('div','breakpoint-list hidden');this._emptyElement=this.contentElement.createChild('div','gray-info-message');this._emptyElement.textContent=Common.UIString('No breakpoints');this._breakpointElements=new Map();this._addButton=new UI.ToolbarButton(Common.UIString('Add breakpoint'),'largeicon-add');this._addButton.addEventListener(UI.ToolbarButton.Events.Click,this._addButtonClicked.bind(this));this._emptyElement.addEventListener('contextmenu',this._emptyElementContextMenu.bind(this),true);this._restoreBreakpoints();this._update();}
toolbarItems(){return[this._addButton];}
_emptyElementContextMenu(event){const contextMenu=new UI.ContextMenu(event);contextMenu.defaultSection().appendItem(Common.UIString('Add breakpoint'),this._addButtonClicked.bind(this));contextMenu.show();}
async _addButtonClicked(){await UI.viewManager.showView('sources.xhrBreakpoints');const inputElementContainer=createElementWithClass('p','breakpoint-condition');inputElementContainer.textContent=Common.UIString('Break when URL contains:');const inputElement=inputElementContainer.createChild('span','breakpoint-condition-input');this._addListElement(inputElementContainer,(this._listElement.firstChild));function finishEditing(accept,e,text){this._removeListElement(inputElementContainer);if(accept){SDK.domDebuggerManager.addXHRBreakpoint(text,true);this._setBreakpoint(text,true);}}
const config=new UI.InplaceEditor.Config(finishEditing.bind(this,true),finishEditing.bind(this,false));UI.InplaceEditor.startEditing(inputElement,config);}
_setBreakpoint(url,enabled){if(this._breakpointElements.has(url)){this._breakpointElements.get(url)._checkboxElement.checked=enabled;return;}
const element=createElementWithClass('div','breakpoint-entry');element._url=url;element.addEventListener('contextmenu',this._contextMenu.bind(this,url),true);const title=url?Common.UIString('URL contains "%s"',url):Common.UIString('Any XHR or fetch');const label=UI.CheckboxLabel.create(title,enabled);element.appendChild(label);label.checkboxElement.addEventListener('click',this._checkboxClicked.bind(this,url),false);element._checkboxElement=label.checkboxElement;label.classList.add('cursor-auto');label.textElement.addEventListener('dblclick',this._labelClicked.bind(this,url),false);let currentElement=(this._listElement.firstChild);while(currentElement){if(currentElement._url&&currentElement._url<element._url)
break;currentElement=(currentElement.nextSibling);}
this._addListElement(element,currentElement);this._breakpointElements.set(url,element);}
_removeBreakpoint(url){const element=this._breakpointElements.get(url);if(!element)
return;this._removeListElement(element);this._breakpointElements.delete(url);}
_addListElement(element,beforeNode){this._listElement.insertBefore(element,beforeNode);this._emptyElement.classList.add('hidden');this._listElement.classList.remove('hidden');}
_removeListElement(element){this._listElement.removeChild(element);if(!this._listElement.firstChild){this._emptyElement.classList.remove('hidden');this._listElement.classList.add('hidden');}}
_contextMenu(url,event){const contextMenu=new UI.ContextMenu(event);function removeBreakpoint(){SDK.domDebuggerManager.removeXHRBreakpoint(url);this._removeBreakpoint(url);}
function removeAllBreakpoints(){for(const url of this._breakpointElements.keys()){SDK.domDebuggerManager.removeXHRBreakpoint(url);this._removeBreakpoint(url);}}
const removeAllTitle=Common.UIString('Remove all breakpoints');contextMenu.defaultSection().appendItem(Common.UIString('Add breakpoint'),this._addButtonClicked.bind(this));contextMenu.defaultSection().appendItem(Common.UIString('Remove breakpoint'),removeBreakpoint.bind(this));contextMenu.defaultSection().appendItem(removeAllTitle,removeAllBreakpoints.bind(this));contextMenu.show();}
_checkboxClicked(url,event){SDK.domDebuggerManager.toggleXHRBreakpoint(url,event.target.checked);}
_labelClicked(url){const element=this._breakpointElements.get(url)||null;const inputElement=createElementWithClass('span','breakpoint-condition');inputElement.textContent=url;this._listElement.insertBefore(inputElement,element);element.classList.add('hidden');function finishEditing(accept,e,text){this._removeListElement(inputElement);if(accept){SDK.domDebuggerManager.removeXHRBreakpoint(url);this._removeBreakpoint(url);const enabled=element?element._checkboxElement.checked:true;SDK.domDebuggerManager.addXHRBreakpoint(text,enabled);this._setBreakpoint(text,enabled);}else{element.classList.remove('hidden');}}
UI.InplaceEditor.startEditing(inputElement,new UI.InplaceEditor.Config(finishEditing.bind(this,true),finishEditing.bind(this,false)));}
flavorChanged(object){this._update();}
_update(){const details=UI.context.flavor(SDK.DebuggerPausedDetails);if(!details||details.reason!==SDK.DebuggerModel.BreakReason.XHR){if(this._highlightedElement){this._highlightedElement.classList.remove('breakpoint-hit');delete this._highlightedElement;}
return;}
const url=details.auxData['breakpointURL'];const element=this._breakpointElements.get(url);if(!element)
return;UI.viewManager.showView('sources.xhrBreakpoints');element.classList.add('breakpoint-hit');this._highlightedElement=element;}
_restoreBreakpoints(){const breakpoints=SDK.domDebuggerManager.xhrBreakpoints();for(const url of breakpoints.keys())
this._setBreakpoint(url,breakpoints.get(url));}};;Runtime.cachedResources["browser_debugger/domBreakpointsSidebarPane.css"]="/*\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.breakpoint-list {\n    padding-bottom: 3px;\n}\n\n.breakpoint-list .dom-breakpoint > div {\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n\n.breakpoint-entry {\n    display: flex;\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    padding: 2px 0;\n}\n\n.breakpoint-list .breakpoint-entry:hover {\n    background-color: #eee;\n}\n\n.breakpoint-hit {\n    background-color: rgb(255, 255, 194);\n    border-right: 3px solid rgb(107, 97, 48);\n}\n\n:host-context(.-theme-with-dark-background) .breakpoint-hit {\n    background-color: hsl(46, 98%, 22%);\n    color: #ccc;\n}\n\n/*# sourceURL=browser_debugger/domBreakpointsSidebarPane.css */";Runtime.cachedResources["browser_debugger/eventListenerBreakpoints.css"]="/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    margin: 0;\n    padding: 2px 4px;\n    min-height: 18px;\n}\n\n.tree-outline {\n    padding: 0;\n}\n\n.tree-outline li {\n    margin-left: 14px;\n    -webkit-user-select: text;\n    cursor: default;\n}\n\n.tree-outline li.parent {\n    margin-left: 1px;\n}\n\n.tree-outline li:not(.parent)::before {\n    display: none;\n}\n\n.breakpoint-hit {\n    background-color: rgb(255, 255, 194);\n}\n\n:host-context(.-theme-with-dark-background) .breakpoint-hit {\n    background-color: hsl(46, 98%, 22%);\n    color: #ccc;\n}\n\n.breakpoint-hit .breakpoint-hit-marker {\n    background-color: rgb(255, 255, 194);\n    border-right: 3px solid rgb(107, 97, 48);\n    height: 18px;\n    left: 0;\n    margin-left: -30px;\n    position: absolute;\n    right: -4px;\n    z-index: -1;\n}\n\n:host-context(.-theme-with-dark-background) .breakpoint-hit .breakpoint-hit-marker {\n    background-color: hsl(46, 98%, 22%);\n}\n\n\n/*# sourceURL=browser_debugger/eventListenerBreakpoints.css */";Runtime.cachedResources["browser_debugger/xhrBreakpointsSidebarPane.css"]="/*\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.breakpoint-list {\n    padding-bottom: 3px;\n}\n\n.breakpoint-list .editing.being-edited {\n    overflow: hidden;\n    white-space: nowrap;\n}\n\n.breakpoint-condition {\n    display: block;\n    margin-top: 4px;\n    margin-bottom: 4px;\n    margin-left: 23px;\n    margin-right: 8px;\n}\n\n.breakpoint-condition-input {\n    display: block;\n    margin-left: 0;\n    margin-right: 0;\n    outline: none !important;\n    border: 1px solid rgb(66%, 66%, 66%);\n}\n\n.breakpoint-entry {\n    white-space: nowrap;\n    padding: 2px 0;\n}\n\n.breakpoint-list .breakpoint-entry:hover {\n    background-color: #eee;\n}\n\n.breakpoint-entry [is=dt-checkbox] {\n    max-width: 100%;\n}\n\n.breakpoint-hit {\n    background-color: rgb(255, 255, 194);\n    border-right: 3px solid rgb(107, 97, 48);\n}\n\n:host-context(.-theme-with-dark-background) .breakpoint-hit {\n    background-color: hsl(46, 98%, 22%);\n    color: #ccc;\n}\n\n/*# sourceURL=browser_debugger/xhrBreakpointsSidebarPane.css */";