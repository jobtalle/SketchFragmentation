const Chunk = function() {
    const Point = function(x, y) {
        this.x = x;
        this.y = y;
    };

    Point.prototype.copy = function() {
        return new Point(this.x, this.y);
    };

    const Beam = function(start, end) {
        const lifeTimeInitial = Beam.LIFE_MIN + (Beam.LIFE_MAX - Beam.LIFE_MIN) * Math.random();
        let lifeTime = lifeTimeInitial;

        this.update = timeStep => {
            if ((lifeTime -= timeStep) < 0)
                return true;

            return false;
        };

        this.draw = context => {
            const f = lifeTime / lifeTimeInitial;
            const intensity = 0.5 - 0.5 * Math.cos(Math.pow(f, Beam.ALPHA_POWER) * Math.PI * 2);
            const gradient = context.createRadialGradient(0, 0, 0, 0, 0, Beam.RADIUS_MIN + (Beam.RADIUS_MAX - Beam.RADIUS_MIN) * (1 - f));

            gradient.addColorStop(0, "rgba(255,255,255," + (Beam.ALPHA * intensity) + ")");
            gradient.addColorStop(1, "rgba(255,255,255,0)");

            context.fillStyle = gradient;
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(Math.cos(start) * Beam.RADIUS_MAX * 2, Math.sin(start) * Beam.RADIUS_MAX * 2);
            context.lineTo(Math.cos(end) * Beam.RADIUS_MAX * 2, Math.sin(end) * Beam.RADIUS_MAX * 2);
            context.closePath();
            context.fill();
        };
    };

    Beam.LIFE_MIN = 2;
    Beam.LIFE_MAX = 5;
    Beam.RADIUS_MIN = 300;
    Beam.RADIUS_MAX = 1500;
    Beam.ALPHA = 0.22;
    Beam.ALPHA_POWER = 2;

    const points = [];
    const beams = [];

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
        const breakLength = Chunk.BREAK_LENGTH_MIN + (Chunk.BREAK_LENGTH_MAX - Chunk.BREAK_LENGTH_MIN) * Math.pow(Math.random(), Chunk.BREAK_LENGTH_POWER);
        let highestSquaredDist = 0;
        let highestIndex = 0;

        for (let i = 0; i < points.length; ++i) {
            const squaredDist = points[i].x * points[i].x + points[i].y * points[i].y;

            if (squaredDist > highestSquaredDist) {
                highestSquaredDist = squaredDist;
                highestIndex = i;
            }
        }

        if (highestSquaredDist < Chunk.BREAK_RADIUS_MIN * Chunk.BREAK_RADIUS_MIN)
            return null;

        let length = 0;
        let indexLowPrevious, indexHighPrevious;
        let dxLowPrevious, dyLowPrevious;
        let dxHighPrevious, dyHighPrevious;
        let dxLow = 0;
        let dyLow = 0;
        let dxHigh = 0;
        let dyHigh = 0;
        let indexLow = highestIndex;
        let indexHigh = highestIndex;
        let indexRadius = 0;

        while (length < breakLength) {
            ++indexRadius;
            indexLowPrevious = indexLow;
            indexHighPrevious = indexHigh;

            dxLowPrevious = dxLow;
            dyLowPrevious = dyLow;
            dxHighPrevious = dxHigh;
            dyHighPrevious = dyHigh;

            if (indexLow-- === 0)
                indexLow = points.length - 1;

            if (++indexHigh === points.length)
                indexHigh = 0;

            dxLow = points[indexLow].x - points[indexLowPrevious].x;
            dyLow = points[indexLow].y - points[indexLowPrevious].y;
            dxHigh = points[indexHigh].x - points[indexHighPrevious].x;
            dyHigh = points[indexHigh].y - points[indexHighPrevious].y;

            const lengthLow = Math.sqrt(dxLow * dxLow + dyLow * dyLow);
            const lengthHigh = Math.sqrt(dxHigh * dxHigh + dyHigh * dyHigh);

            dxLow /= lengthLow;
            dyLow /= lengthLow;
            dxHigh /= lengthHigh;
            dyHigh /= lengthHigh;

            if (indexRadius !== 1) {
                const dotLow = dxLow * dxLowPrevious + dyLow * dyLowPrevious;
                const dotHigh = dxHigh * dxHighPrevious + dyHigh * dyHighPrevious;

                if (dotLow < Chunk.BREAK_DOT_MIN || dotHigh < Chunk.BREAK_DOT_MIN) {
                    --indexRadius;
                    indexLow = indexLowPrevious;
                    indexHigh = indexHighPrevious;

                    break;
                }
            }

            length += lengthLow + lengthHigh;
        }

        return {
            "index": indexLow,
            "count": indexRadius + indexRadius - 1
        };
    };

    this.break = () => {
        const region = pickFragmentationRegion();

        if (!region)
            return null;

        beams.push(new Beam(
            Math.atan2(
                points[region.index].y,
                points[region.index].x),
            Math.atan2(
                points[(region.index + region.count + 1) % points.length].y,
                points[(region.index + region.count + 1) % points.length].x)));

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
            const shiftMultiplier = Math.pow(0.5 - Math.cos((i / riftSegments) * Math.PI * 2) * 0.5, Chunk.BREAK_SHIFT_POWER);
            let shift = (Chunk.BREAK_SHIFT_MIN + (Chunk.BREAK_SHIFT_MAX - Chunk.BREAK_SHIFT_MIN) * Math.random()) * shiftMultiplier;

            if (inset !== 0) {
                const nxSelf = -point.x / distanceCenter;
                const nySelf = -point.y / distanceCenter;

                shift += inset * (1 / ((nxSelf * nxRift) + (nySelf * nyRift)));
            }

            shift = Math.min(shift, distanceCenter - Chunk.RADIUS_MIN);
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

        return new Fragment(breakPoints, Chunk.GROW_SPEED);
    };

    this.update = timeStep => {
        for (const point of points) {
            const dist = Math.sqrt(point.x * point.x + point.y * point.y);

            point.x += timeStep * Chunk.GROW_SPEED * point.x / dist;
            point.y += timeStep * Chunk.GROW_SPEED * point.y / dist;
        }

        for (let i = beams.length; i-- > 0;)
            if (beams[i].update(timeStep))
                beams.splice(i, 1);
    };

    this.draw = context => {
        for (const beam of beams)
            beam.draw(context);

        Fragment.draw(context, points);
    };

    initialize();
};

Chunk.RADIUS_MIN = 120;
Chunk.INITIAL_POINTS = 50;
Chunk.INITIAL_RADIUS_MIN = 210;
Chunk.INITIAL_RADIUS_MAX = 230;
Chunk.BREAK_DOT_MIN = 0.6;
Chunk.BREAK_RADIUS_MIN = Chunk.INITIAL_RADIUS_MAX;
Chunk.BREAK_LENGTH_MIN = 40;
Chunk.BREAK_LENGTH_MAX = 400;
Chunk.BREAK_LENGTH_POWER = 2.5;
Chunk.BREAK_POINTS_MIN = 1;
Chunk.BREAK_POINTS_MAX = 3;
Chunk.BREAK_SHIFT_MIN = 16;
Chunk.BREAK_SHIFT_MAX = 48;
Chunk.BREAK_SHIFT_POWER = 0.5;
Chunk.GROW_SPEED = 5;
Chunk.EDGE_LENGTH = (Math.PI * 2 * (Chunk.INITIAL_RADIUS_MIN + (Chunk.INITIAL_RADIUS_MAX - Chunk.INITIAL_RADIUS_MIN))) / Chunk.INITIAL_POINTS;