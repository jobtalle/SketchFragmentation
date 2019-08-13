const Fragment = function(points, speed) {
    const angleSpeed = Fragment.ANGLE_SPEED_MIN + (Fragment.ANGLE_SPEED_MAX - Fragment.ANGLE_SPEED_MIN) * Math.random();
    let x = 0;
    let y = 0;
    let ax = 0;
    let ay = 0;
    let vx = 0;
    let vy = 0;
    let angle = 0;
    let radius = 0;

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

            const dist = Math.sqrt(point.x * point.x + point.y * point.y);

            if (dist > radius)
                radius = dist;
        }

        const dist = Math.sqrt(x * x + y * y);

        ax = Fragment.BREAK_ACCELERATION * x / dist;
        ay = Fragment.BREAK_ACCELERATION * y / dist;
        vx = speed * x / dist;
        vy = speed * y / dist;
    };

    this.getX = () => x;
    this.getY = () => y;
    this.getRadius = () => radius;

    this.update = timeStep => {
        vx += ax * timeStep;
        vy += ay * timeStep;
        x += vx * timeStep;
        y += vy * timeStep;
        angle += Math.sqrt(vx * vx + vy * vy) * angleSpeed * timeStep;
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

Fragment.BREAK_ACCELERATION = 3;
Fragment.ANGLE_SPEED_MIN = -0.004;
Fragment.ANGLE_SPEED_MAX = 0.004;
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