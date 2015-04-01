Phaser.Plugin.DijonDebugger = function (game, parent) {
    Phaser.Plugin.call(this, game, parent);
    this.buildInterface();
};

//  Extends the Phaser.Plugin template, setting up values we need
Phaser.Plugin.DijonDebugger.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.DijonDebugger.prototype.constructor = Phaser.Plugin.DijonDebugger;

Phaser.Plugin.DijonDebugger.prototype.init = function(params){
    if (typeof params === 'undefined'){
        this.showFPS = this.startOpen = true;
        return;
    }

    this.showFPS = params.showFPS !== false;
    this.startOpen = params.closed !== true;

    if (this.showFPS){
        this.game.time.advancedTiming = true;
    }
};

Phaser.Plugin.DijonDebugger.prototype.buildInterface = function(){
    this.getPath();
    this.loadScripts();
    this.loadStyles();
};

Phaser.Plugin.DijonDebugger.prototype.getPath = function(){
    this.scripts = document.getElementsByTagName("script");
    this.script = null;

    var i = this.scripts.length-1,
        script = null,
        path = null;

    while (this.script === null){
        script = this.scripts[i];
        path = script.src.replace(/\/script\.js$/, '/');
        if (path.indexOf('DijonDebugger.js') >= 0){
            this.path = path;
            this.script = script;
        }
        i--;
    }
    this.path = this.path.replace('DijonDebugger.js', '');
};

Phaser.Plugin.DijonDebugger.prototype.loadScripts = function(){
    this.loadScript(this.path + 'jquery.min.js', 'onJQueryLoaded');
};

Phaser.Plugin.DijonDebugger.prototype.loadStyles = function(){
    this.loadStyle(this.path + 'bootstrap.min.css');
    this.loadStyle(this.path + 'dijon-debugger.css');

};

Phaser.Plugin.DijonDebugger.prototype.onJQueryLoaded = function(){
    $ = window.$ = window.jQuery;
    this.loadScript(this.path + 'bootstrap.min.js', 'onJSLoaded');
};

Phaser.Plugin.DijonDebugger.prototype.onJSLoaded = function(){
    this.createDebugWindow();
    window.DijonDebugger = this;
    this.addHTML();
};

Phaser.Plugin.DijonDebugger.prototype.createDebugWindow = function(){
    $('body').append('<div id="dijon-debugger"></div>');
    this.$div = $('#dijon-debugger');
};

Phaser.Plugin.DijonDebugger.prototype.addHTML = function(){
    var self = this;
    this.$div.load(this.path + 'dijon-debugger.html', function(){self.initialize()});
    $('body').append('<div id="dijon-debugger-toggle-tab" title="Dijon Debug Panel">D</div>');
};

Phaser.Plugin.DijonDebugger.prototype.initialize = function(){
    this.setJQueryVariables();
    this.addToggle();
    this.refresh();
    if (this.startOpen){
        this.toggleState();
    }

};

Phaser.Plugin.DijonDebugger.prototype.addToggle = function(){
    var self = this;
    this.state = 'out';
    this.$bar.on('click', function(){self.toggleState()});
};

Phaser.Plugin.DijonDebugger.prototype.toggleState = function(){
    this.state = this.state == 'in' ? 'out' : 'in';
    if (this.state == 'out'){
        this.$div.removeClass('in');
        this.$bar.removeClass('in');
    }else{
        this.$div.addClass('in');
        this.$bar.addClass('in');
    }
};

Phaser.Plugin.DijonDebugger.prototype.setJQueryVariables = function(){
    var self = this;

    this.$bar = $('#dijon-debugger #title-bar, #dijon-debugger-toggle-tab');
    this.$world = this.$div.find('#world');
    this.$worldopts = this.$world.find("select");
    this.$stage = this.$div.find('#stage');
    this.$stageopts = this.$stage.find("select");
    this.$info = this.$div.find('#info');
    this.$props = this.$div.find('#props');
    this.$refreshbutton = this.$div.find('#refresh');

    this.$props.on('change keydown', 'input', function(e){self.onPropChange(e);});
    this.$props.on('focus', 'input', function(e){self.onInputFocus(e);});
    this.$props.on('focusout', 'input', function(e){self.onInputFocusOut(e);});

    this.$worldopts.on('change', function(e){self.onSelectObject(e);});
    this.$stageopts.on('change', function(e){self.onSelectObject(e);});

    this.$refreshbutton.on('click', function(){self.refresh();});

    if (this.showFPS){
        this.$fps = $('#dijon-debugger-fps');
    }

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

Phaser.Plugin.DijonDebugger.prototype.update = function () {
    if (!this.$fps) return;
    this.$fps.find('span').html(this.getFPS() + '&nbsp;FPS');
};

Phaser.Plugin.DijonDebugger.prototype.getFPS = function(){
    return this.game.time.fps.toString() || '--';
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
    var parentName = obj.parent instanceof Phaser.Stage ? 'stage' : obj.parent.name;
    var childIndex = obj.parent.getChildIndex(obj);
    var defaultName = (parentName + '_' + childIndex).toString(),
        name;

    if (obj instanceof Phaser.Sprite && obj.key && obj.frame){
        name = obj.key + '/' + obj.frame;
    }else if(obj instanceof Phaser.Image && obj.key && typeof obj.key == 'string'){
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

    this.optsHTML += '<option value="'+name+'" onclick="window.DijonDebugger.selectObject()">'+name+'</option>';

    if (obj instanceof Phaser.Group && obj.children.length > 0){
        this.optsHTML += '<optgroup label="'+name+' children">';
        _.each(obj.children, this.addOption, this);
        this.optsHTML += '</optgroup>';
    }
};

Phaser.Plugin.DijonDebugger.prototype.getClassName = function(obj) {
    var name = 'Phaser.Image';
    if (obj instanceof Phaser.Text){
        name = 'Phaser.Text';
    }else if (obj instanceof Phaser.Sprite){
        name = 'Phaser.Sprite';
    }else if (obj instanceof Phaser.Group){
        name = 'Phaser.Group';
    }else if (obj instanceof Phaser.Graphics){
        name = 'Phaser.Graphics';
    }
    return name;
};

Phaser.Plugin.DijonDebugger.prototype.onSelectObject = function(e){
    var name = $(e.currentTarget).val();
    this.$info.find("h3#name").empty();

    if (name === ''){
        return false;
    }

    var obj = this.dict[name];
    this.$info.find("h3#name").html(name + '&nbsp;&nbsp;(' + this.getClassName(obj) + ')');
    this.$props.empty();

    this.selectedObject = obj;

    this.showProps(obj);
};

Phaser.Plugin.DijonDebugger.prototype.showProps = function(obj){
    var i, section, html = '', propsHTML;
    for (i = 0; i < Phaser.Plugin.DijonDebugger.PROPS_LIST.length; i ++){
        section = Phaser.Plugin.DijonDebugger.PROPS_LIST[i];
        propsHTML = this.addProps(section.props, obj);
        if (propsHTML != ''){
            html += '<div class="row"><div class="col-xs-12"><h4 class="section-title">'+section.title+'</h4></div>';
            html += propsHTML;
            html += '</div>';
        }
    }
    this.$props.append(html);
};

Phaser.Plugin.DijonDebugger.prototype.addProps = function(props, obj){
    var html = '',
        type,
        i,
        prop;

    for (i = 0; i < props.length; i ++){
        prop = props[i];
        type = prop.type || 'number'

        if(typeof prop === 'object'){
            if (prop.xy && typeof obj[prop.prop] !== 'undefined' && typeof obj[prop.prop].x !== 'undefined' && typeof obj[prop.prop].y !== 'undefined'){
                html += '<div class="prop_input col-xs-4"><label>'+prop.prop+' x:&nbsp;</label><input class="form-control" id="'+prop.prop+'_x" type="text" value="'+obj[prop.prop].x+'" data-val="'+obj[prop.prop].x+'" data-type="'+type+'" data-prop="'+prop.prop+'.x"></div>';
                html += '<div class="prop_input col-xs-4"><label>'+prop.prop+' y:&nbsp;</label><input class="form-control" id="'+prop.prop+'_y" type="text" value="'+obj[prop.prop].y+'" data-val="'+obj[prop.prop].y+'" data-type="'+type+'" data-prop="'+prop.prop+'.y"></div>';
                if (prop.editAll){
                    html += '<div class="prop_input col-xs-4"><label>'+prop.prop+':&nbsp;</label><input class="form-control" id="'+prop.prop+'" type="text" value="'+(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '')+'" data-val="'+(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '')+'" data-type="'+type+'" data-prop="'+prop.prop+'" data-multiple="true" data-bound="#'+prop.prop+'_x,#'+prop.prop+'_y"></div>';
                }
                if (prop.center && typeof prop.centerFunc !== 'undefined'){
                    html += '<div class="prop_input col-xs-4 btn-container"><button class="btn btn-default btn-sm" onclick="window.DijonDebugger.'+prop.centerFunc+'()" class="center_button">CENTER</button></div>';
                }
            }
        }else{
            html += '<div class="prop_input col-xs-4"><label>'+prop+':&nbsp;</label><input class="form-control" id="'+prop+'" type="text" value="'+obj[prop]+'" data-val="'+obj[prop]+'" data-type="'+type+'" data-prop="'+prop+'"></div>';
        }
    }

    return html;
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
    var i, j, prop, props, section, type, id, $input;
    for (i = 0; i < Phaser.Plugin.DijonDebugger.PROPS_LIST.length; i ++){
        section = Phaser.Plugin.DijonDebugger.PROPS_LIST[i];
        props = section.props;

        for (j = 0; j < props.length; j ++){
            prop = props[j];
            type = prop.type || 'number';

            if(typeof prop === 'object'){
                if (prop.xy && typeof obj[prop.prop].x !== 'undefined' && typeof obj[prop.prop].y !== 'undefined'){
                    id = prop.prop+'_x';
                    $input = this.$div.find('#'+id);
                    $input.val(obj[prop.prop].x);

                    id = prop.prop+'_y';
                    $input = this.$div.find('#'+id);
                    $input.val(obj[prop.prop].y);

                    if (prop.editAll){
                        id = prop.prop;
                        $input = this.$div.find('#'+id);
                        $input.val(obj[prop.prop].x === obj[prop.prop].y ? obj[prop.prop].x : '');
                    }

                }
            }else{
                id = prop;
                $input = this.$div.find('#'+id);
                $input.val(obj[prop]);
            }
        }
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
            $bInput = this.$div.find(boundInputs[i]);
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

Phaser.Plugin.DijonDebugger.prototype.loadStyle = function(url){
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.media = 'all';
    head.appendChild(link);
};

Phaser.Plugin.DijonDebugger.PROPS_LIST = [
    {title:'Position', props:['x', 'y']},
    {title:'Size', props:['width', 'height']},
    {title:'Rotation / Angle', props:['rotation', 'angle']},
    {title:'Scale', props:[{prop:'scale', xy:true, editAll:true}]},
    {title:'Pivot', props:[{prop:'pivot', xy:true, editAll:false, center:true, centerFunc:'centerPivot'}]},
    {title:'Anchor', props:[{prop:'anchor', xy:true, editAll:false, center:true, centerFunc:'centerAnchor'}]}
];