const Chunk = function() {
    const Point = function(x, y) {
        this.x = x;
        this.y = y;
    };

    Point.prototype.copy = function() {
        return new Point(this.x, this.y);
    };

    const points = [];

    const initialize = () => {
        const step = Math.PI * 2 / Chunk.INITIAL_POINTS;
        let r = 0;

        for (let i = 0; i < Chunk.INITIAL_POINTS; ++i) {
            const radius = Chunk.INITIAL_RADIUS_MIN + (Chunk.INITIAL_RADIUS_MAX - Chunk.INITIAL_RADIUS_MIN) * Math.random();

            points.push(new Point(
                Math.cos(r) * radius,
                Math.sin(r) * radius));

            r += step;
        }
    };

    const pickFragmentationRegion = () => {
        const breakIndex = Math.floor(Math.random() * points.length);
        const breakCount = Chunk.BREAK_POINTS_MIN + Math.floor((Chunk.BREAK_POINTS_MAX - Chunk.BREAK_POINTS_MIN + 1) * Math.random());

        return {
            "index": breakIndex,
            "count": breakCount
        };
    };

    this.break = () => {
        const region = pickFragmentationRegion();
        const xStart = points[region.index].x;
        const yStart = points[region.index].y;
        const xEnd = points[(region.index + region.count + 1) % points.length].x;
        const yEnd = points[(region.index + region.count + 1) % points.length].y;
        const xDelta = xEnd - xStart;
        const yDelta = yEnd - yStart;
        const rift = [];
        const riftLength = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
        const riftSegments = Math.ceil(riftLength / Chunk.EDGE_LENGTH);
        const nxRift = -yDelta / riftLength;
        const nyRift = xDelta / riftLength;
        const breakPoints = [points[region.index].copy()];
        let inset = 0;

        for (let i = 0; i <= region.count; ++i) {
            const point = points[(region.index + i + 1) % points.length].copy();
            const distance = (point.x - xStart) * nxRift + (point.y - yStart) * nyRift;

            if (distance > inset)
                inset = distance;

            breakPoints.push(point);
        }

        for (let i = 1; i < riftSegments; ++i) {
            const point = new Point(
                xStart + (i * xDelta) / riftSegments,
                yStart + (i * yDelta) / riftSegments);
            const distanceCenter = Math.sqrt(point.x * point.x + point.y * point.y);
            let shift = Chunk.BREAK_SHIFT_MIN + (Chunk.BREAK_SHIFT_MAX - Chunk.BREAK_SHIFT_MIN) * Math.random();

            if (inset !== 0) {
                const nxSelf = -point.x / distanceCenter;
                const nySelf = -point.y / distanceCenter;

                shift += inset * (1 / ((nxSelf * nxRift) + (nySelf * nyRift)));
            }

            shift = Math.max(shift, distanceCenter - Chunk.INITIAL_RADIUS_MIN);
            point.x -= shift * point.x / distanceCenter;
            point.y -= shift * point.y / distanceCenter;

            rift.push(point);
        }

        const spliceIndices = [];

        for (let i = 0; i < region.count; ++i)
            spliceIndices.push((region.index + i + 1) % points.length);

        spliceIndices.sort((a, b) => b - a);

        for (let i = 0; i < spliceIndices.length; ++i)
            points.splice(spliceIndices[i], 1);

        points.splice(spliceIndices.pop(), 0, ...rift);

        for (let i = rift.length; i-- > 0;)
            breakPoints.push(rift[i].copy());

        return new Fragment(breakPoints);
    };

    this.update = timeStep => {
        for (const point of points) {
            const dist = Math.sqrt(point.x * point.x + point.y * point.y);

            point.x += timeStep * Chunk.GROW_SPEED * point.x / dist;
            point.y += timeStep * Chunk.GROW_SPEED * point.y / dist;
        }
    };

    this.draw = context => {
        Fragment.draw(context, points);
    };

    initialize();
};

Chunk.INITIAL_POINTS = 24;
Chunk.INITIAL_RADIUS_MIN = 128;
Chunk.INITIAL_RADIUS_MAX = 196;
Chunk.BREAK_POINTS_MIN = 1;
Chunk.BREAK_POINTS_MAX = 3;
Chunk.BREAK_SHIFT_MIN = 8;
Chunk.BREAK_SHIFT_MAX = 48;
Chunk.GROW_SPEED = 4;
Chunk.EDGE_LENGTH = (Math.PI * 2 * (Chunk.INITIAL_RADIUS_MIN + (Chunk.INITIAL_RADIUS_MAX - Chunk.INITIAL_RADIUS_MIN))) / Chunk.INITIAL_POINTS;