class Point {
    constructor(positionFinish) {
        this.el = document.createElement('div');

        this.positionFinish = positionFinish;
    }

    getAngleToFinish = () => {
        return Math.atan(
            Math.abs(this.positionFinish.x - this.position.x) /
            Math.abs(this.positionFinish.y - this.position.y)
        );
    }

    getElement = () => {
        return this.el;
    }

    getPositionWithOffset = (offset, rotation) => {
        const rotationInRadian = Math.PI * rotation / 180;
        const angle = this.getAngleToFinish() + rotationInRadian;
        const movingDirectionX = this.positionFinish.x > this.position.x ? 1 : -1;
        const movingDirectionY = this.positionFinish.y > this.position.y ? 1 : -1;
        const x = this.position.x + movingDirectionX * offset * Math.sin(angle);
        const y = this.position.y + movingDirectionY * offset * Math.cos(angle);

        return { x, y };
    }

    getPosition = () => {
        return this.position;
    }

    getTouchLevel = (touchCount) => {
        let touchLevel;

        if (touchCount >= 4) {
            touchLevel = 'xl';
        } else if (touchCount === 3) {
            touchLevel = 'l';
        } else if (touchCount === 2) {
            touchLevel = 'm';
        } else if (touchCount === 1) {
            touchLevel = 's';
        } else if (touchCount === 0) {
            touchLevel = 'null';
        }

        return touchLevel;
    }

    update = (position, touchCount) => {
        const touchLevel = this.getTouchLevel(touchCount);

        this.position = position;

        this.el.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        this.el.className = `point point_touch_level_${touchLevel}`;
    }
}

export default Point;
