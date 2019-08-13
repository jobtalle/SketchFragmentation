const Fragment = function(points) {
    const angleSpeed = Fragment.ANGLE_SPEED_MIN + (Fragment.ANGLE_SPEED_MAX - Fragment.ANGLE_SPEED_MIN) * Math.random();
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let angle = 0;

    const position = () => {
        for (const point of points) {
            x += point.x;
            y += point.y;
        }

        x /= points.length;
        y /= points.length;

        for (const point of points) {
            point.x -= x;
            point.y -= y;
        }

        const dist = Math.sqrt(x * x + y * y);

        vx = Fragment.BREAK_SPEED * x / dist;
        vy = Fragment.BREAK_SPEED * y / dist;
    };

    this.update = timeStep => {
        x += vx * timeStep;
        y += vy * timeStep;
        angle += angleSpeed * timeStep;
    };

    this.draw = context => {
        context.save();
        context.translate(x, y);
        context.rotate(angle);

        Fragment.draw(context, points);

        context.restore();
    };

    position();
};

Fragment.BREAK_SPEED = 24;
Fragment.ANGLE_SPEED_MIN = -0.2;
Fragment.ANGLE_SPEED_MAX = 0.2;
Fragment.COLOR = "rgba(255,255,255,0.25)";
Fragment.draw = (context, points) => {
    context.fillStyle = Fragment.COLOR;

    context.beginPath();

    context.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; ++i)
        context.lineTo(points[i].x, points[i].y);

    context.closePath();
    context.fill();
};