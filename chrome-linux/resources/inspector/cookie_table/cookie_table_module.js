CookieTable.CookiesTable=class extends UI.VBox{constructor(renderInline,saveCallback,refreshCallback,selectedCallback,deleteCallback){super();this._saveCallback=saveCallback;this._refreshCallback=refreshCallback;this._deleteCallback=deleteCallback;const editable=!!saveCallback;const columns=([{id:SDK.Cookie.Attributes.Name,title:ls`Name`,sortable:true,disclosure:editable,sort:DataGrid.DataGrid.Order.Ascending,longText:true,weight:24,editable:editable},{id:SDK.Cookie.Attributes.Value,title:ls`Value`,sortable:true,longText:true,weight:34,editable:editable},{id:SDK.Cookie.Attributes.Domain,title:ls`Domain`,sortable:true,weight:7,editable:editable},{id:SDK.Cookie.Attributes.Path,title:ls`Path`,sortable:true,weight:7,editable:editable},{id:SDK.Cookie.Attributes.Expires,title:ls`Expires / Max-Age`,sortable:true,weight:7,editable:editable},{id:SDK.Cookie.Attributes.Size,title:ls`Size`,sortable:true,align:DataGrid.DataGrid.Align.Right,weight:7},{id:SDK.Cookie.Attributes.HttpOnly,title:ls`HttpOnly`,sortable:true,align:DataGrid.DataGrid.Align.Center,weight:7},{id:SDK.Cookie.Attributes.Secure,title:ls`Secure`,sortable:true,align:DataGrid.DataGrid.Align.Center,weight:7},{id:SDK.Cookie.Attributes.SameSite,title:ls`SameSite`,sortable:true,weight:7}]);if(editable){this._dataGrid=new DataGrid.DataGrid(columns,this._onUpdateCookie.bind(this),this._onDeleteCookie.bind(this),refreshCallback);}else{this._dataGrid=new DataGrid.DataGrid(columns);}
this._dataGrid.setStriped(true);this._dataGrid.setName('cookiesTable');this._dataGrid.addEventListener(DataGrid.DataGrid.Events.SortingChanged,this._rebuildTable,this);if(renderInline)
this._dataGrid.renderInline();if(selectedCallback)
this._dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode,selectedCallback,this);this._lastEditedColumnId=null;this._dataGrid.asWidget().show(this.element);this._data=[];this._cookieDomain='';this._cookieToBlockedReasons=null;}
setCookies(cookies,cookieToBlockedReasons){this.setCookieFolders([{cookies:cookies}],cookieToBlockedReasons);}
setCookieFolders(cookieFolders,cookieToBlockedReasons){this._data=cookieFolders;this._cookieToBlockedReasons=cookieToBlockedReasons||null;this._rebuildTable();}
setCookieDomain(cookieDomain){this._cookieDomain=cookieDomain;}
selectedCookie(){const node=this._dataGrid.selectedNode;return node?node.cookie:null;}
_getSelectionCookies(){const node=this._dataGrid.selectedNode;const nextNeighbor=node&&node.traverseNextNode(true);const previousNeighbor=node&&node.traversePreviousNode(true);return{current:node&&node.cookie,neighbor:(nextNeighbor&&nextNeighbor.cookie)||(previousNeighbor&&previousNeighbor.cookie)};}
willHide(){this._lastEditedColumnId=null;}
_findSelectedCookie(selectionCookies,cookies){if(!cookies)
return null;const current=selectionCookies.current;const foundCurrent=cookies.find(cookie=>this._isSameCookie(cookie,current));if(foundCurrent)
return foundCurrent;const neighbor=selectionCookies.neighbor;const foundNeighbor=cookies.find(cookie=>this._isSameCookie(cookie,neighbor));if(foundNeighbor)
return foundNeighbor;return null;}
_isSameCookie(cookieA,cookieB){return!!cookieB&&cookieB.name()===cookieA.name()&&cookieB.domain()===cookieA.domain()&&cookieB.path()===cookieA.path();}
_rebuildTable(){const selectionCookies=this._getSelectionCookies();const lastEditedColumnId=this._lastEditedColumnId;this._lastEditedColumnId=null;this._dataGrid.rootNode().removeChildren();for(let i=0;i<this._data.length;++i){const item=this._data[i];const selectedCookie=this._findSelectedCookie(selectionCookies,item.cookies);if(item.folderName){const groupData={};groupData[SDK.Cookie.Attributes.Name]=item.folderName;groupData[SDK.Cookie.Attributes.Value]='';groupData[SDK.Cookie.Attributes.Size]=this._totalSize(item.cookies);groupData[SDK.Cookie.Attributes.Domain]='';groupData[SDK.Cookie.Attributes.Path]='';groupData[SDK.Cookie.Attributes.Expires]='';groupData[SDK.Cookie.Attributes.HttpOnly]='';groupData[SDK.Cookie.Attributes.Secure]='';groupData[SDK.Cookie.Attributes.SameSite]='';const groupNode=new DataGrid.DataGridNode(groupData);groupNode.selectable=true;this._dataGrid.rootNode().appendChild(groupNode);groupNode.element().classList.add('row-group');this._populateNode(groupNode,item.cookies,selectedCookie,lastEditedColumnId);groupNode.expand();}else{this._populateNode(this._dataGrid.rootNode(),item.cookies,selectedCookie,lastEditedColumnId);}}
if(selectionCookies.current&&lastEditedColumnId&&!this._dataGrid.selectedNode)
this._addInactiveNode(this._dataGrid.rootNode(),selectionCookies.current,lastEditedColumnId);if(this._saveCallback)
this._dataGrid.addCreationNode(false);}
_populateNode(parentNode,cookies,selectedCookie,lastEditedColumnId){parentNode.removeChildren();if(!cookies)
return;this._sortCookies(cookies);for(let i=0;i<cookies.length;++i){const cookie=cookies[i];const cookieNode=this._createGridNode(cookie);parentNode.appendChild(cookieNode);if(this._isSameCookie(cookie,selectedCookie)){cookieNode.select();if(lastEditedColumnId!==null)
this._dataGrid.startEditingNextEditableColumnOfDataGridNode(cookieNode,lastEditedColumnId);}}}
_addInactiveNode(parentNode,cookie,editedColumnId){const cookieNode=this._createGridNode(cookie);parentNode.appendChild(cookieNode);cookieNode.select();cookieNode.setInactive(true);if(editedColumnId!==null)
this._dataGrid.startEditingNextEditableColumnOfDataGridNode(cookieNode,editedColumnId);}
_totalSize(cookies){let totalSize=0;for(let i=0;cookies&&i<cookies.length;++i)
totalSize+=cookies[i].size();return totalSize;}
_sortCookies(cookies){const sortDirection=this._dataGrid.isSortOrderAscending()?1:-1;function getValue(cookie,property){return typeof cookie[property]==='function'?String(cookie[property]()):String(cookie.name());}
function compareTo(property,cookie1,cookie2){return sortDirection*getValue(cookie1,property).compareTo(getValue(cookie2,property));}
function numberCompare(cookie1,cookie2){return sortDirection*(cookie1.size()-cookie2.size());}
function expiresCompare(cookie1,cookie2){if(cookie1.session()!==cookie2.session())
return sortDirection*(cookie1.session()?1:-1);if(cookie1.session())
return 0;if(cookie1.maxAge()&&cookie2.maxAge())
return sortDirection*(cookie1.maxAge()-cookie2.maxAge());if(cookie1.expires()&&cookie2.expires())
return sortDirection*(cookie1.expires()-cookie2.expires());return sortDirection*(cookie1.expires()?1:-1);}
let comparator;const columnId=this._dataGrid.sortColumnId()||'name';if(columnId==='expires')
comparator=expiresCompare;else if(columnId==='size')
comparator=numberCompare;else
comparator=compareTo.bind(null,columnId);cookies.sort(comparator);}
_createGridNode(cookie){const data={};data[SDK.Cookie.Attributes.Name]=cookie.name();data[SDK.Cookie.Attributes.Value]=cookie.value();if(cookie.type()===SDK.Cookie.Type.Request){data[SDK.Cookie.Attributes.Domain]=cookie.domain()?cookie.domain():ls`N/A`;data[SDK.Cookie.Attributes.Path]=cookie.path()?cookie.path():ls`N/A`;}else{data[SDK.Cookie.Attributes.Domain]=cookie.domain()||'';data[SDK.Cookie.Attributes.Path]=cookie.path()||'';}
if(cookie.maxAge()){data[SDK.Cookie.Attributes.Expires]=Number.secondsToString(parseInt(cookie.maxAge(),10));}else if(cookie.expires()){if(cookie.expires()<0)
data[SDK.Cookie.Attributes.Expires]=CookieTable.CookiesTable._expiresSessionValue;else
data[SDK.Cookie.Attributes.Expires]=new Date(cookie.expires()).toISOString();}else{data[SDK.Cookie.Attributes.Expires]=cookie.type()===SDK.Cookie.Type.Request?ls`N/A`:CookieTable.CookiesTable._expiresSessionValue;}
data[SDK.Cookie.Attributes.Size]=cookie.size();const checkmark='\u2713';data[SDK.Cookie.Attributes.HttpOnly]=(cookie.httpOnly()?checkmark:'');data[SDK.Cookie.Attributes.Secure]=(cookie.secure()?checkmark:'');data[SDK.Cookie.Attributes.SameSite]=cookie.sameSite()||'';const node=new CookieTable.DataGridNode(data,cookie,this._cookieToBlockedReasons?this._cookieToBlockedReasons.get(cookie):null);node.selectable=true;return node;}
_onDeleteCookie(node){if(node.cookie&&this._deleteCallback)
this._deleteCallback(node.cookie,()=>this._refresh());}
_onUpdateCookie(editingNode,columnIdentifier,oldText,newText){this._lastEditedColumnId=columnIdentifier;this._setDefaults(editingNode);if(this._isValidCookieData(editingNode.data))
this._saveNode(editingNode);else
editingNode.setDirty(true);}
_setDefaults(node){if(node.data[SDK.Cookie.Attributes.Name]===null)
node.data[SDK.Cookie.Attributes.Name]='';if(node.data[SDK.Cookie.Attributes.Value]===null)
node.data[SDK.Cookie.Attributes.Value]='';if(node.data[SDK.Cookie.Attributes.Domain]===null)
node.data[SDK.Cookie.Attributes.Domain]=this._cookieDomain;if(node.data[SDK.Cookie.Attributes.Path]===null)
node.data[SDK.Cookie.Attributes.Path]='/';if(node.data[SDK.Cookie.Attributes.Expires]===null)
node.data[SDK.Cookie.Attributes.Expires]=CookieTable.CookiesTable._expiresSessionValue;}
_saveNode(node){const oldCookie=node.cookie;const newCookie=this._createCookieFromData(node.data);node.cookie=newCookie;this._saveCallback(newCookie,oldCookie).then(success=>{if(success)
this._refresh();else
node.setDirty(true);});}
_createCookieFromData(data){const cookie=new SDK.Cookie(data[SDK.Cookie.Attributes.Name],data[SDK.Cookie.Attributes.Value],null);cookie.addAttribute(SDK.Cookie.Attributes.Domain,data[SDK.Cookie.Attributes.Domain]);cookie.addAttribute(SDK.Cookie.Attributes.Path,data[SDK.Cookie.Attributes.Path]);if(data.expires&&data.expires!==CookieTable.CookiesTable._expiresSessionValue)
cookie.addAttribute(SDK.Cookie.Attributes.Expires,(new Date(data[SDK.Cookie.Attributes.Expires])).toUTCString());if(data[SDK.Cookie.Attributes.HttpOnly])
cookie.addAttribute(SDK.Cookie.Attributes.HttpOnly);if(data[SDK.Cookie.Attributes.Secure])
cookie.addAttribute(SDK.Cookie.Attributes.Secure);if(data[SDK.Cookie.Attributes.SameSite])
cookie.addAttribute(SDK.Cookie.Attributes.SameSite,data[SDK.Cookie.Attributes.SameSite]);cookie.setSize(data[SDK.Cookie.Attributes.Name].length+data[SDK.Cookie.Attributes.Value].length);return cookie;}
_isValidCookieData(data){return(data.name||data.value)&&this._isValidDomain(data.domain)&&this._isValidPath(data.path)&&this._isValidDate(data.expires);}
_isValidDomain(domain){if(!domain)
return true;const parsedURL=('http://'+domain).asParsedURL();return!!parsedURL&&parsedURL.domain()===domain;}
_isValidPath(path){const parsedURL=('http://example.com'+path).asParsedURL();return!!parsedURL&&parsedURL.path===path;}
_isValidDate(date){return date===''||date===CookieTable.CookiesTable._expiresSessionValue||!isNaN(Date.parse(date));}
_refresh(){if(this._refreshCallback)
this._refreshCallback();}};CookieTable.DataGridNode=class extends DataGrid.DataGridNode{constructor(data,cookie,blockedReasons){super(data);this.cookie=cookie;this._blockedReasons=blockedReasons;}
createCells(element){super.createCells(element);if(this._blockedReasons&&this._blockedReasons.length)
element.classList.add('flagged-cookie-attribute-row');}
createCell(columnId){const cell=super.createCell(columnId);cell.title=cell.textContent;let blockedReasonString='';if(this._blockedReasons){for(const blockedReason of this._blockedReasons){const attributeMatches=blockedReason.attribute===(columnId);const useNameColumn=!blockedReason.attribute&&columnId===SDK.Cookie.Attributes.Name;if(attributeMatches||useNameColumn){if(blockedReasonString)
blockedReasonString+='\n';blockedReasonString+=blockedReason.uiString;}}}
if(blockedReasonString){const infoElement=UI.Icon.create('smallicon-info','cookie-warning-icon');infoElement.title=blockedReasonString;cell.insertBefore(infoElement,cell.firstChild);cell.classList.add('flagged-cookie-attribute-cell');}
return cell;}};CookieTable.CookiesTable._expiresSessionValue=Common.UIString('Session');CookieTable.BlockedReason;;