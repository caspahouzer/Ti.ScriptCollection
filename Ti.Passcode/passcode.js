function PasscodeControl() {

    var prompMode = false, passcodeToCheck = null, passcodeGiven = '', shakeComplete = true;

    var self = Ti.UI.createWindow({
        fullscreen: true,
        top: 0,
        backgroundColor: '#000',
        opacity: .93,
        height: Ti.UI.FILL,
        width: Ti.UI.FILL
    });

    /**
     * If you really had forgot your passcode
     */
    var deadManSwitch = Ti.UI.createView({
        top: 0,
        left: 0,
        width: 30,
        height: 30
    });
    deadManSwitch.addEventListener('longpress', function () {
        self.close();
    });
    self.add(deadManSwitch);

    /**
     * Viewcontainer
     * @type {Ti.UI.View}
     */
    var mainContainer = Ti.UI.createView({
        layout: 'vertical',
        height: Ti.UI.SIZE,
        width: 310
    });
    if (Ti.Platform.getOsname() === 'iphone') {
        mainContainer.setTop(0);
    }
    self.add(mainContainer);

    var titleLabel = Ti.UI.createLabel({
        top: 30,
        text: L('Insert code'),
        color: '#fff',
        width: Ti.UI.FILL,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
    });
    mainContainer.add(titleLabel);

    /**
     * Passcode dots
     * @type {Ti.UI.View}
     */
    var dotContainer = Ti.UI.createView({
        layout: 'horizontal',
        top: 15,
        height: Ti.UI.SIZE,
        width: Ti.UI.SIZE
    });
    mainContainer.add(dotContainer);

    var dots = [];
    for (var i = 0; i < 4; i++) {
        var dot = Ti.UI.createView({
            width: 12,
            height: 12,
            backgroundColor: 'transparent',
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#fff'
        });
        if (i > 0) {
            dot.setLeft(10);
        }
        dots.push(dot);
        dotContainer.add(dot);
    }

    /**
     * Cancel/Delete Button
     * Will be added as 12th button
     */
    var cancelButton = Ti.UI.createButton({
        id: 'delete',
        right: 0,
        visible: prompMode,
        color: '#fff',
        title: (prompMode) ? L('Cancel') : L('Delete')
    });

    /**
     * Buttons
     */
    var startNum = 1;

    /**
     * 4 rows with 3 buttons
     */
    for (var x = 0; x < 4; x++) {
        var buttonContainer = Ti.UI.createView({
            top: (x == 0) ? 40 : 15,
            left: 30,
            right: 30,
            height: 75,
            width: Ti.UI.FILL
        });
        mainContainer.add(buttonContainer);
        for (var y = 0; y < 3; y++) {
            var button = Ti.UI.createButton({
                id: 'button',
                title: startNum,
                color: '#fff',
                left: (y == 0) ? 0 : null,
                right: (y == 2) ? 0 : null,
                width: 75,
                height: 75,
                borderRadius: 37.5,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: '#fff',
                font: {
                    fontSize: 30,
                    fontFamily: 'HelveticaNeue-Light'
                }
            });

            button.addEventListener('touchstart', function (e) {
                e.source.setBackgroundColor('#fff');
                e.source.setColor('#000');
            });

            button.addEventListener('touchend', function (e) {
                e.source.setBackgroundColor('transparent');
                e.source.setColor('#fff');
            });

            buttonContainer.add(button);
            if (startNum === 10 || startNum === 12) {
                buttonContainer.remove(button);
            }

            if (startNum === 12) {
                buttonContainer.add(cancelButton);
            }

            if (startNum === 11) {
                button.title = '0';
            }

            startNum++;
        }
    }

    /**
     * Click Listener
     */
    mainContainer.addEventListener('singletap', function (e) {
        /**
         * Delete single dot
         * OR
         * Cancel in prompt mode
         */
        if (e.source.id === 'delete') {

            for (var i = 0; i < dots.length; i++) {
                var dot = dots[i];
                if (!dot.char) {
                    passcodeGiven = passcodeGiven.slice(0, -1);
                    var oldDot = dots[i - 1];
                    if (oldDot) {
                        oldDot.char = '';
                        oldDot.setBackgroundColor('transparent');
                    }
                    break;
                }
            }

            if (passcodeGiven === '') {
                if (prompMode === false) {
                    cancelButton.setId('delete');
                    cancelButton.setVisible(false);
                } else {
                    cancelButton.setId('cancel');
                    cancelButton.setTitle(L('Cancel'));
                }
            }
            return;
        }

        if (e.source.id === 'cancel') {
            self.fireEvent('passcode.cancel', {});
            self.close();
        }

        if (e.source.id === 'button') {
            if (shakeComplete === true) {
                var dot = null;

                var passcodeFilled = false;
                for (var i = 0; i < dots.length; i++) {
                    dot = dots[i];
                    if (!dot.char) {
                        dot.char = e.source.getTitle();
                        passcodeGiven += e.source.getTitle();
                        dot.setBackgroundColor('#fff');

                        cancelButton.setVisible(true);
                        cancelButton.setId('delete');
                        cancelButton.setTitle(L('Delete'));
                        break;
                    }

                    if (i === 2) {
                        passcodeFilled = true;
                    }
                }

                if (passcodeGiven === '') {
                    if (prompMode === false) {
                        cancelButton.setVisible(false);
                    } else {
                        cancelButton.setTitle(L('Cancel'));
                    }
                }

                if (passcodeFilled) {
                    if (passcodeToCheck != passcodeGiven && prompMode === false) {
                        shakeComplete = false;
                        passcodeGiven = '';
                        cancelButton.setVisible(false);

                        Ti.Media.vibrate();

                        for (i = 0; i < dots.length; i++) {
                            dot = dots[i];
                            dot.char = '';
                            dot.setBackgroundColor('transparent');
                        }

                        /**
                         * Animate for wrong code
                         * @type {Ti.UI.D2Matrix}
                         */
                        var tr_init = Ti.UI.create2DMatrix();
                        var tr_start = tr_init.translate(7, 0);
                        var tr_anim = tr_init.translate(-14, 0);

                        dotContainer.transform = tr_start;

                        //Animation
                        var animation = Ti.UI.createAnimation();
                        animation.transform = tr_anim;
                        animation.duration = 50;
                        animation.autoreverse = true;
                        animation.repeat = 3;
                        animation.delay = 0;

                        animation.addEventListener('complete', function () {
                            dotContainer.transform = tr_init;
                            shakeComplete = true
                        });

                        //Execute Animation
                        dotContainer.animate(animation);
                        self.fireEvent('passcode.error', {passcode: passcodeGiven});
                        return;
                    }
                    self.fireEvent('passcode.success', {passcode: passcodeGiven});

                    self.close();
                }
            }
        }
    });

    /**
     * listen to the window close event
     */
    self.addEventListener('close', function () {
        self.fireEvent('passcode.close', {passcode: passcodeGiven});
        Ti.App.Properties.setBool('passcode.isShown', false);
    });

    /**
     * show the view
     */
    self.display = function () {
        if (Ti.App.Properties.getBool('passcode.isShown', false) === false) {
            Ti.App.Properties.setBool('passcode.isShown', true);
            self.open();
        }
    };

    /**
     * Set code
     * @param passcode
     */
    self.setPasscode = function (passcode) {
        passcodeToCheck = passcode;
    };

    /**
     * Set cancel possible
     * @param opt
     */
    self.setPromptMode = function (opt) {
        prompMode = opt || false;

        cancelButton.setVisible(prompMode);
        cancelButton.setId((prompMode) ? 'cancel' : 'delete');
        cancelButton.setTitle((prompMode) ? L('Cancel') : L('Delete'));
    };

    /**
     * Set different title
     * @param title
     */
    self.setTitle = function (title) {
        titleLabel.setText(title);
    };

    /**
     * Remove deadManSwitch
     */
    self.removeDeadManSwitch = function () {
        self.remove(deadManSwitch);
    };

    Ti.App.addEventListener('close', function () {
        Ti.App.Properties.setBool('passcode.isShown', false);
    });

    return self;
}
module.exports = PasscodeControl;