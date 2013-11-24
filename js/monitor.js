$(function () {
    var socket = io.connect('http://' + location.host + '/monitor');

    var canvas = document.getElementById('Canvas');
    paper.setup(canvas);

    var fieldSize = 500;
    var viewPoint = new paper.Point(0,0);

    var canvasSize = paper.view.size;

    var beyCircles = new Array();

    var socketFPS = 0;
    var drawFPS = 0;

    var socketFPStext = new paper.PointText(new paper.Point(10, 20));
    var drawFPStext = new paper.PointText(new paper.Point(10, 40));
    socketFPStext.fillColor = 'black';
    drawFPStext.fillColor = 'black';

    var beys = [];

    var SVGURLs = ['/img/bey01.svg', '/img/img01.svg'];
    var SVGcache = {};

    var beyObjects = {};
    
    var emergeEffects = [];

    var project = new paper.Project(canvas);

    var setupTime = (new Date);

    nowLoadingText = new paper.PointText({
        point: paper.view.center,
        content: 'Now Loading...',
        fillColor: 'black',
        fontSize: 24,
        justification: 'center'
    });

    paper.view.draw();

    var getData = function (name) {
        return SVGcache[name] || $.ajax(
            name, {
                success: function (data) {
                    SVGcache[name] = data;
                }
            });
    };

    deferredObjects = [];
    for (var i = 0; i < SVGURLs.length; i++) {
        deferredObjects.push(getData(SVGURLs[i]));
    }

    var setup = function () {
        //フィールド円描画
        var fieldShape = new paper.Path.Circle(viewPoint.add(paper.view.center), fieldSize);
        fieldShape.fillColor = '#ddd';

        paper.view.draw();

        //リサイズ時処理
        paper.view.onResize = function (event) {
            canvasSize = paper.view.size;
            fieldShape.position = paper.view.center;
        }

        //情報更新
        socket.on('StageInfo', function (message) {
            beys = message;
            socketFPS++;
        });

        //描画
        setInterval(function () {
            for (var session in beyObjects) {
                beyObjects[session].called = false; // custom property
            }

            beys.forEach(function (bey) {
                var beyLocate = new paper.Point(bey.point);

                if (beyObjects[bey.session]) {
                    var elapsedTime = ((new Date) - setupTime) / 1000;
                    var destAngle = Math.sin(elapsedTime / 2) * 500 - elapsedTime * 2000;

                    beyObjects[bey.session].position = beyLocate.add(paper.view.center);
                    beyObjects[bey.session].called = true;
                    beyObjects[bey.session].rotate(destAngle - beyObjects[bey.session].angle);
                    beyObjects[bey.session].angle = destAngle;
                    beyObjects[bey.session].speed = bey.speed;
                } else {
                    var beyObject = project.importSVG(SVGcache['/img/bey01.svg']);
                    var baseGroup = beyObject.children['base'];
                    var designGroup = beyObject.children['design'];

                    beyObject.position = beyLocate.add(paper.view.center);
                    beyObject.scale(bey.size / 150);
                    beyObject.angle = 0; // custom property
                    beyObject.dead = false; // custom property
                    beyObject.speed = bey.speed; //custom property

                    Math.seedrandom(bey.session);
                    var mainColor = new paper.Color({ 'hue': Math.random() * 360, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 });
                    if (Math.random() > 0.5) {
                        var accentColor = new paper.Color({ 'hue': mainColor.hue + Math.random() * 100 - 50, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': mainColor.brightness - Math.random() * 0.4 - 0.2 })
                    } else {
                        var accentColor = new paper.Color({ 'hue': mainColor.hue + Math.random() * 30 + 20, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 })
                    }
                    if (Math.random() > 0.5) {
                        baseColor = mainColor;
                        designColor = accentColor;
                    } else {
                        baseColor = accentColor;
                        designColor = mainColor;
                    }

                    if (bey.isCPU == true) {
                        baseColor.saturation = 0;
                        designColor.saturation = 0;
                        baseColor.brightness = Math.max((baseColor.brightness - 0.6) * 2, 0);
                        designColor.brightness = Math.max(designColor.brightness - 0.6, 0);
                    }

                    baseGroup.fillColor = new paper.Color(baseColor);
                    designGroup.fillColor = new paper.Color(designColor);

                    beyObjects[bey.session] = beyObject;
                    beyObjects[bey.session].called = true;
                    
                    var emergeEffect = new paper.Path.Circle(beyObject.position, 30);
                    emergeEffect.strokeColor = 'blue';
                    emergeEffect.strokeWidth = 5;
                    
                    emergeEffects.push(emergeEffect);
                }
            })

            for (var session in beyObjects) {
                if (beyObjects[session].called == false && !beyObjects[session].dead) {
                    beyObjects[session].dead = true;
                    console.log('called');
                }
                if (beyObjects[session].dead) {
                    var elapsedTime = ((new Date) - setupTime) / 1000;
                    var destAngle = Math.sin(elapsedTime / 2) * 500 - elapsedTime * 2000;
                    
                    beyObjects[session].rotate(destAngle - beyObjects[session].angle);
                    beyObjects[session].angle = destAngle;
                    beyObjects[session].position = beyObjects[session].position.add([beyObjects[session].speed[0] / 180, beyObjects[session].speed[1] / 180]);
                    beyObjects[session].scale(0.95);
                    if (beyObjects[session].bounds.width < 1) {
                        beyObjects[session].remove();
                        delete beyObjects[session];
                        console.log('removed');
                    }
                }
            }
            
            emergeEffects.forEach( function (emergeEffect) {
                emergeEffect.strokeColor.alpha -= 0.03;
                emergeEffect.scale(1 + emergeEffect.strokeColor.alpha * 0.1);
                if (emergeEffect.strokeColor.alpha <= 0) {
                    emergeEffect.remove();
                    emergeEffects.splice(emergeEffects.indexOf(emergeEffect), 1);
                }
            });

            paper.view.draw();
            drawFPS++;
        }, 1000 / 60);

        setInterval(function () {
            socketFPStext.content = 'Socket FPS: ' + socketFPS;
            drawFPStext.content = 'Draw FPS: ' + drawFPS;
            socketFPS = 0;
            drawFPS = 0;
        }, 1000);
    }

    $.when.apply(null, deferredObjects).done(setup);
});