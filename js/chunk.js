const Chunk = function() {
    this.update = timeStep => {

    };

    this.draw = context => {
        context.fillStyle = Chunk.COLOR;

        context.beginPath();
        context.arc(0, 0, 128, 0, Math.PI * 2);
        context.fill();
    };
};

Chunk.COLOR = "#ffffff";