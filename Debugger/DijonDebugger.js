var $;
var DijonDebugger = function (game, parent) {
    this.enabled = true;
    Phaser.Plugin.call(this, game, parent);
    this.buildInterface();
};

//  Extends the Phaser.Plugin template, setting up values we need
DijonDebugger.prototype = Object.create(Phaser.Plugin.prototype);
DijonDebugger.prototype.constructor = DijonDebugger;

DijonDebugger.prototype.init = function(){

};

DijonDebugger.prototype.buildInterface = function(){
    this.openWindow();
    this.debugWindow.PhaserGame = this.game;
    this.debugWindow.debugger = this;
    this.addHTML();
    this.loadJQuery();
    if (window.focus) {
        this.debugWindow.focus();
    }
};


DijonDebugger.prototype.openWindow = function(){
    this.debugWindow = window.open('','DijonDebugger','height=600,width=800');
};

DijonDebugger.prototype.addHTML = function(){
    this.debugWindow.document.body.innerHTML = this.getHTML();
};

DijonDebugger.prototype.loadJQuery = function(){
    this.loadScript('//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js', 'onJQueryLoaded');
};

DijonDebugger.prototype.onJQueryLoaded = function(){
    $ = window.$ = window.jQuery;
    this.setJQueryVariables();
    this.refresh();
};

DijonDebugger.prototype.setJQueryVariables = function(){
    this.$doc = $(this.debugWindow.document);
    this.$world = this.$doc.find('#world');
    this.$worldopts = this.$world.find("select");
    this.$stage = this.$doc.find('#stage');
    this.$stageopts = this.$stage.find("select");
    this.$info = this.$doc.find('#info');
    this.$props = this.$doc.find('#props');

    this.$props.on('change', 'input', function(e){self.onPropChange(e);});
    var self = this;
    this.$worldopts.on('change', function(e){self.onSelectObject(e);});
    this.$stageopts.on('change', function(e){self.onSelectObject(e);});
};

DijonDebugger.prototype.getHTML = function(){
    return '<html><head><title>Dijon Debugger</title><style>body{padding:10px; font-family:Arial;} label, input{float:left;} label{width:75px;} input{width:100px; margin-right:20px;} li{float:left; width:100%; padding-bottom:5px} prop_input{float:left; padding-right:10px; width:200px"}</style></head><body><div id="main"><div id="groups"><div id="world"><h2>World</h2><select></select></div><div id="stage"><h2>Stage</h2><select></select></div></div></div><div id="info"><hr style="margin-top:25px"><h2>Info</h2><h3 id="name"></h3><ul id="props" style="list-style-type:none; margin:0; padding:0;"></ul></div></body></html>';
};

/**
* This is run when the plugins update during the core game loop.
*/
DijonDebugger.prototype.update = function () {
    if(this.enabled){
    }
};

DijonDebugger.prototype.refresh = function(){
    this.$worldopts.empty().append('<option value="">Select an item</option>');
    this.$stageopts.empty().append('<option value="">Select an item</option>');
    this.populate(this.$worldopts, this.game.world);
    this.populate(this.$stageopts, this.game.stage);
};

DijonDebugger.prototype.populate = function($opts, group){
    this.dict = {};
    this.debugList = $opts;
    _.each(group.children, this.addOption, this);
};

DijonDebugger.prototype.addOption = function(obj){
    var name = obj.name || (obj.parent.name + '_' + obj.parent.getChildIndex(obj)).toString();
    if (name === '__world') return false;

    this.dict[name] = obj;

    this.debugList.append('<option value="'+name+'" onclick="window.debugger.selectObject()">'+name+'</option>');
};

DijonDebugger.prototype.onSelectObject = function(e){
    var name = $(e.currentTarget).val();
    this.$info.find("h3#name").empty();
    this.$props.empty();
    if (name === ''){
        return false;
    }

    var obj = this.dict[name];
    this.$info.find("h3#name").html(name);
    this.showProps(obj);

    this.selectedObject = obj;
};

DijonDebugger.prototype.showProps = function(obj){
    var i, prop, type, html = '';
    for (i = 0; i < DijonDebugger.PROPS_LIST.length; i ++){
        html = '<li>';
        prop = DijonDebugger.PROPS_LIST[i];

        type = prop.type || 'number';

        if(typeof prop === 'object'){
            if (prop.xy && obj[prop.prop]){
                html += '<div class="prop_input"><label>'+prop.prop+' x:&nbsp;</label><input type="text" value="'+obj[prop.prop].x+'" data-val="'+obj[prop.prop].x+'" data-type="'+type+'" data-prop="'+prop.prop+'.x"></div>';
                html += '<div class="prop_input"><label>'+prop.prop+' y:&nbsp;</label><input type="text" value="'+obj[prop.prop].y+'" data-val="'+obj[prop.prop].y+'" data-type="'+type+'" data-prop="'+prop.prop+'.y"></div>';
                if (prop.editAll){
                    html += '<div class="prop_input"><label>'+prop.prop+':&nbsp;</label><input type="text" value="'+(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '')+'" data-val="'+(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '')+'" data-type="'+type+'" data-prop="'+prop.prop+'"></div>';
                }

            }
        }else{
            html += '<div class="prop_input"><label>'+prop+':&nbsp;</label><input type="text" value="'+obj[prop]+'" data-val="'+obj[prop]+'" data-type="'+type+'" data-prop="'+prop+'"></div>';
        }
        html += '</li>';
        this.$props.append(html);
    }
};

DijonDebugger.prototype.onPropChange = function(e){
    var value   = parseInt($(e.currentTarget).val()),
        currentVal = $(e.currentTarget).data('val'),
        type    = $(e.currentTarget).data('type'),
        propStr = $(e.currentTarget).data('prop'),
        propArr,
        prop;

    var invalid = false;
    switch(type){
        case 'number':
            invalid = isNaN(value);
        break;
    }

    if (invalid){
        return $(e.currentTarget).val(currentVal);
    }

    if (propStr.indexOf ('.') > 0){
        propArr = propStr.split('.');
        this.selectedObject[propArr[0]][propArr[1]] = value;
    }else{
        this.selectedObject[propStr] = value;
    }

    $(e.currentTarget).data('val', value);

};

DijonDebugger.prototype.loadScript = function(url, callback)
{
    var self = this;
    var cb = callback;
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = function(){
        self[cb]();
    };

    script.onload = function(){
        self[cb]();
    };

    // Fire the loading
    head.appendChild(script);
};

DijonDebugger.PROPS_LIST = [
    'x',
    'y',
    'angle',
    {prop:'pivot', xy:true, editAll:false},
    {prop:'scale', xy:true, editAll:true},
    {prop:'anchor', xy:true, editAll:true}
];

module.exports = DijonDebugger;