$(function () {
    var socket = io.connect('http://' + location.host + '/monitor');

    var canvas = document.getElementById('Canvas');
    paper.setup(canvas);

    var fieldSize = 500;
    var viewPoint = new paper.Point(0,0);

    var canvasSize = paper.view.size;

    var beyCircles = new Array();

    function removeAllCircles() {
        beyCircles.forEach(function (beyCircle) {
            beyCircle.remove();
        })
    }

    //フィールド円描画
    var fieldShape = new paper.Path.Circle(viewPoint.add(paper.view.center), fieldSize);
    fieldShape.fillColor = '#ccc';
    console.log(JSON.stringify(fieldShape));

    paper.view.draw();

    //リサイズ時処理
    paper.view.onResize = function (event) {
        canvasSize = paper.view.size;
        fieldShape.position = paper.view.center;
    }

    //情報更新
    socket.on('StageInfo', function (message) {
        console.log(JSON.stringify(message));
        removeAllCircles();
        message.forEach(function (bey) {
            var beyLocate = new paper.Point(bey.point);
            var tempCircle = new paper.Path.Circle(beyLocate.add(paper.view.center), bey.size);
            tempCircle.fillColor = 'red';
            beyCircles.push(tempCircle);
        })
        paper.view.draw();
    });

});