/**
* A Sample Plugin demonstrating how to hook into the Phaser plugin system.
*/
Phaser.Plugin.DijonDebugger = function (game, parent) {

    Phaser.Plugin.call(this, game, parent);

    this.sprite = null;

};

//  Extends the Phaser.Plugin template, setting up values we need
Phaser.Plugin.DijonDebugger.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.DijonDebugger.prototype.constructor = Phaser.Plugin.DijonDebugger;

/**
* Add a Sprite reference to this Plugin.
* All this plugin does is move the Sprite across the screen slowly.
* @type {Phaser.Sprite}
*/
Phaser.Plugin.DijonDebugger.prototype.addSprite = function (sprite) {

    this.sprite = sprite;

};

/**
* This is run when the plugins update during the core game loop.
*/
Phaser.Plugin.DijonDebugger.prototype.update = function () {

    if (this.sprite)
    {
        this.sprite.x += 0.5;
    }

};