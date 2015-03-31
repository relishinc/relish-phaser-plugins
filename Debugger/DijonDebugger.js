Phaser.Plugin.DijonDebugger = function (game, parent) {
    Phaser.Plugin.call(this, game, parent);
    this.buildInterface();
};

//  Extends the Phaser.Plugin template, setting up values we need
Phaser.Plugin.DijonDebugger.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.DijonDebugger.prototype.constructor = Phaser.Plugin.DijonDebugger;

Phaser.Plugin.DijonDebugger.prototype.buildInterface = function(){
    this.openWindow();
    this.debugWindow.PhaserGame = this.game;
    this.debugWindow.debugger = this;
    this.addHTML();
    this.loadJQuery();
    if (window.focus) {
        this.debugWindow.focus();
    }
};


Phaser.Plugin.DijonDebugger.prototype.openWindow = function(){
    this.debugWindow = window.open('','Phaser.Plugin.DijonDebugger','height=600,width=800');
};

Phaser.Plugin.DijonDebugger.prototype.addHTML = function(){
    this.debugWindow.document.body.innerHTML = this.getHTML();
};

Phaser.Plugin.DijonDebugger.prototype.loadJQuery = function(){
    this.loadScript('//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js', 'onJQueryLoaded');
};

Phaser.Plugin.DijonDebugger.prototype.onJQueryLoaded = function(){
    $ = window.$ = window.jQuery;
    this.setJQueryVariables();
    this.refresh();
};

Phaser.Plugin.DijonDebugger.prototype.setJQueryVariables = function(){
    var self = this;

    this.$doc = $(this.debugWindow.document);
    this.$world = this.$doc.find('#world');
    this.$worldopts = this.$world.find("select");
    this.$stage = this.$doc.find('#stage');
    this.$stageopts = this.$stage.find("select");
    this.$info = this.$doc.find('#info');
    this.$props = this.$doc.find('#props');
    this.$refreshbutton = this.$doc.find('#refresh');

    this.$props.on('change keydown', 'input', function(e){self.onPropChange(e);});
    this.$props.on('focus', 'input', function(e){self.onInputFocus(e);});
    this.$props.on('focusout', 'input', function(e){self.onInputFocusOut(e);});

    this.$worldopts.on('change', function(e){self.onSelectObject(e);});
    this.$stageopts.on('change', function(e){self.onSelectObject(e);});

    this.$refreshbutton.on('click', function(){self.refresh();});
};

Phaser.Plugin.DijonDebugger.prototype.getIncrement = function(){
    var val = this.currentInput.val().toString(),
        valArr,
        len = 0,
        str;
    if (val.indexOf ('.') < 0){
        return 1;
    }else{
        str = '0.';
        valArr = val.split('.');
        len = val[1].length -1;
        while (len > 0){
            len --;
            str+=0;
        }
        str+= 1;
        return parseFloat(str);
    }
};

Phaser.Plugin.DijonDebugger.prototype.onInputFocusOut = function(){
    this.currentInput = null;
};

Phaser.Plugin.DijonDebugger.prototype.onInputFocus = function(e){
    this.currentInput = $(e.currentTarget);
};

Phaser.Plugin.DijonDebugger.prototype.getHTML = function(){
    return '<html><head><title>Dijon Debugger</title><style>html, body{margin:0; padding:0; width:100%; height:100%;}body{font-family:Arial; position:relative; width:100%; height:100%;} label, input{float:left;} label{width:75px;} input{width:100px; margin-right:20px;} li{float:left; width:100%; padding-bottom:5px} prop_input{float:left; padding-right:10px; width:200px;} #refresh{position:absolute; bottom:40px; right:40px; font-weight:bold; font-size:18px; padding:10px;} #world, #stage{width:50%; position:relative; float:left;} #main{padding:20px; position:relative;} #groups, #info {position: relative; float: left; width: 100%;} #groups{padding-bottom: 25px; border-bottom: 1px solid grey;}"}</style></head><body><div id="main"><div id="groups"><div id="world"><h2>World</h2><select></select></div><div id="stage"><h2>Stage</h2><select></select></div></div><div id="info"><h2>Info</h2><h3 id="name"></h3><ul id="props" style="list-style-type:none; margin:0; padding:0;"></ul></div></div><button id="refresh">REFRESH</button></body></html>';
};

Phaser.Plugin.DijonDebugger.prototype.update = function () {
};

Phaser.Plugin.DijonDebugger.prototype.refresh = function(){
    this.dict = {};
    this.$worldopts.empty().append('<option value="">Select an item</option>');
    this.$stageopts.empty().append('<option value="">Select an item</option>');
    this.populate(this.$worldopts, this.game.world);
    this.populate(this.$stageopts, this.game.stage);
};

Phaser.Plugin.DijonDebugger.prototype.populate = function($opts, group){
    this.optsHTML = '';
    _.each(group.children, this.addOption, this);
    $opts.append(this.optsHTML);
};

Phaser.Plugin.DijonDebugger.prototype.getName = function(obj){
    var defaultName = (obj.parent.name + '_' + obj.parent.getChildIndex(obj)).toString(),
        name;

    if (obj instanceof Phaser.Sprite && obj.key && obj.frame){
        name = obj.key + '/' + obj.frame;
    }else if(obj instanceof Phaser.Image && obj.key){
        name = obj.key;
    }else{
        name = defaultName;
    }
    return name;
};

Phaser.Plugin.DijonDebugger.prototype.addOption = function(obj){
    var name = obj.name || this.getName(obj);
    if (name === '__world') return false;

    this.dict[name] = obj;

    this.optsHTML += '<option value="'+name+'" onclick="window.debugger.selectObject()">'+name+'</option>';

    if (obj instanceof Phaser.Group && obj.children.length > 0){
        this.optsHTML += '<optgroup label="'+name+' children">';
        _.each(obj.children, this.addOption, this);
        this.optsHTML += '</optgroup>';
    }
};

Phaser.Plugin.DijonDebugger.prototype.onSelectObject = function(e){
    var name = $(e.currentTarget).val();
    this.$info.find("h3#name").empty();

    if (name === ''){
        return false;
    }

    var obj = this.dict[name];
    this.$info.find("h3#name").html(name);
    this.$props.empty();

    this.selectedObject = obj;

    this.showProps(obj);
};

Phaser.Plugin.DijonDebugger.prototype.showProps = function(obj){
    var i, prop, type, html = '';
    for (i = 0; i < Phaser.Plugin.DijonDebugger.PROPS_LIST.length; i ++){
        html = '<li>';
        prop = Phaser.Plugin.DijonDebugger.PROPS_LIST[i];

        type = prop.type || 'number';

        if(typeof prop === 'object'){
            if (prop.xy && typeof obj[prop.prop].x !== 'undefined' && typeof obj[prop.prop].y !== 'undefined'){
                html += '<div class="prop_input"><label>'+prop.prop+' x:&nbsp;</label><input id="'+prop.prop+'_x" type="text" value="'+obj[prop.prop].x+'" data-val="'+obj[prop.prop].x+'" data-type="'+type+'" data-prop="'+prop.prop+'.x"></div>';
                html += '<div class="prop_input"><label>'+prop.prop+' y:&nbsp;</label><input id="'+prop.prop+'_y" type="text" value="'+obj[prop.prop].y+'" data-val="'+obj[prop.prop].y+'" data-type="'+type+'" data-prop="'+prop.prop+'.y"></div>';
                if (prop.editAll){
                    html += '<div class="prop_input"><label>'+prop.prop+':&nbsp;</label><input id="'+prop.prop+'" type="text" value="'+(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '')+'" data-val="'+(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '')+'" data-type="'+type+'" data-prop="'+prop.prop+'" data-multiple="true" data-bound="#'+prop.prop+'_x,#'+prop.prop+'_y"></div>';
                }
            }
        }else{
            html += '<div class="prop_input"><label>'+prop+':&nbsp;</label><input id="'+prop+'" type="text" value="'+obj[prop]+'" data-val="'+obj[prop]+'" data-type="'+type+'" data-prop="'+prop+'"></div>';
        }

        if (prop.center && typeof prop.centerFunc !== 'undefined'){
            html += '<div class="prop_input"><button onclick="window.debugger.'+prop.centerFunc+'()" class="center_button">CENTER '+prop.prop.toUpperCase()+'</button></div>';
        }
        html += '</li>';
        this.$props.append(html);
    }
};

Phaser.Plugin.DijonDebugger.prototype.centerAnchor = function(){
    this.selectedObject.anchor.set(0.5);
    this.updateProps(this.selectedObject);
};

Phaser.Plugin.DijonDebugger.prototype.centerPivot = function(){
    var scale = this.selectedObject.scale.x == this.selectedObject.scale.y ? this.selectedObject.scale.x : null;

    if (scale){
        this.selectedObject.scale.set(1);
    }

    this.selectedObject.pivot.set(this.selectedObject.width >> 1, this.selectedObject.height >> 1);

    if (scale){
        this.selectedObject.scale.set(scale);
    }

    this.updateProps(this.selectedObject);
};

Phaser.Plugin.DijonDebugger.prototype.updateProps = function(obj){

    var i, prop, type, id, html, $input;
    for (i = 0; i < Phaser.Plugin.DijonDebugger.PROPS_LIST.length; i ++){
        html = '<li>';
        prop = Phaser.Plugin.DijonDebugger.PROPS_LIST[i];

        type = prop.type || 'number';

        if(typeof prop === 'object'){
            if (prop.xy && typeof obj[prop.prop].x !== 'undefined' && typeof obj[prop.prop].y !== 'undefined'){
                id = prop.prop+'_x';
                $input = this.$doc.find('#'+id);
                $input.val(obj[prop.prop].x);

                id = prop.prop+'_y';
                $input = this.$doc.find('#'+id);
                $input.val(obj[prop.prop].y);

                if (prop.editAll){
                    id = prop.prop;
                    $input = this.$doc.find('#'+id);
                    $input.val(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '');
                }

            }
        }else{
            id = prop;
            $input = this.$doc.find('#'+id);
            $input.val(obj[prop]);
        }
        html += '</li>';
        this.$props.append(html);
    }
};

Phaser.Plugin.DijonDebugger.prototype.onPropChange = function(e){
    var keypress = typeof e.which !== 'undefined';
    if (keypress){
        if (!this.currentInput){
            return false;
        }
        switch (e.which){
            case 38:
                //up
                this.currentInput.val(parseFloat(this.currentInput.val()) + this.getIncrement());
                break;
            case 40:
                //down
                this.currentInput.val(parseFloat(this.currentInput.val()) - this.getIncrement());
            break;
            default:
                return false;
        }
    }

    var $input = keypress ? this.currentInput : $(e.currentTarget);
    var value   = parseFloat($input.val()),
        currentVal = $input.data('val'),
        type    = $input.data('type'),
        propStr = $input.data('prop'),
        multiple = $input.data('multiple') == "true" || $input.data('multiple') === true,
        boundInputStr = $input.data('bound'),
        boundInputs,
        $bInput,
        propArr,
        i = 0;

    var invalid = false;

    if (boundInputStr !== "" && typeof boundInputStr !== 'undefined'){
        if (boundInputStr.indexOf(',') > 0){
            boundInputs = boundInputStr.split(',');
        }else{
            boundInputs = [boundInputStr];
        }
    }

    switch(type){
        case 'number':
            invalid = isNaN(value);
        break;
    }

    if (invalid){
        return $input.val(currentVal);
    }

    if (propStr.indexOf ('.') > 0){
        propArr = propStr.split('.');
        this.selectedObject[propArr[0]][propArr[1]] = value;
    }else if (multiple){
        this.selectedObject[propStr].set(value);
    }else{
        this.selectedObject[propStr] = value;
    }

    if (typeof boundInputs !== 'undefined' && boundInputs.length > 0){
        for(i = 0; i < boundInputs.length; i ++){
            $bInput = this.$doc.find(boundInputs[i]);
            $bInput.val(value);
        }
    }

    $input.data('val', value);

    this.updateProps(this.selectedObject);
};

Phaser.Plugin.DijonDebugger.prototype.loadScript = function(url, callback){
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

Phaser.Plugin.DijonDebugger.PROPS_LIST = [
    'x',
    'y',
    'width',
    'height',
    'angle',
    {prop:'pivot', xy:true, editAll:false, center:true, centerFunc:'centerPivot'},
    {prop:'scale', xy:true, editAll:true},
    {prop:'anchor', xy:true, editAll:false, center:true, centerFunc:'centerAnchor'}
];