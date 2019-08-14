const TIME_STEP_MAX = 0.1;
const ANGLE_SPEED = 0.1;
const BREAK_INTERVAL = 0.3;
const BIAS_FACTOR = 3;

const wrapper = document.getElementById("wrapper");
const canvas = document.getElementById("renderer");
const chunk = new Chunk();
const fragments = [];
let radius = 0;
let lastDate = new Date();
let angle = 0;
let breakTime = 0;
let fragmentCheckIndex = 0;

const resize = () => {
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;
    radius = Math.sqrt(canvas.width * 0.25 * canvas.width + canvas.height * 0.25 * canvas.height);
};

const update = timeStep => {
    if (timeStep > TIME_STEP_MAX)
        timeStep = TIME_STEP_MAX;

    if ((breakTime -= timeStep) < 0) {
        const fragment = chunk.break(angle * BIAS_FACTOR);

        breakTime = BREAK_INTERVAL;

        if (fragment)
            fragments.push(fragment);
    }

    chunk.update(timeStep);

    if (fragments.length !== 0) {
        for (const fragment of fragments)
            fragment.update(timeStep);

        if (fragmentCheckIndex-- === 0)
            fragmentCheckIndex = 0;

        const fx = fragments[fragmentCheckIndex].getX();
        const fy = fragments[fragmentCheckIndex].getY();
        const fd = Math.sqrt(fx * fx + fy * fy) - fragments[fragmentCheckIndex].getRadius();

        if (fd > radius)
            fragments.splice(fragmentCheckIndex, 1);
    }

    if ((angle += timeStep * ANGLE_SPEED) > Math.PI * 2)
        angle -= Math.PI * 2;

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(canvas.width * 0.5, canvas.height * 0.5);
    context.rotate(angle);

    chunk.draw(context);

    for (const fragment of fragments)
        fragment.draw(context);

    context.restore();
};

const loopFunction = () => {
    const date = new Date();

    update((date - lastDate) * 0.001);
    requestAnimationFrame(loopFunction);

    lastDate = date;
};

window.onresize = resize;

resize();
requestAnimationFrame(loopFunction);