import Point from './Point.js';

const DEFAULT_POINT_QUANTITY = 500;
const POINT_SCATTERING_DISTANCE = 100;
const POINT_VELOCITY = 24;
const POINT_AVAILABLE_ROTATION = [0, 45, -45, 90, -90, 135, -135, 180];
const CELL_SIZE = 20;

class Area {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'area';
        document.body.appendChild(this.el);

        this.isScatteringOnNextUpdate = false;
        this.lastPointId = 0;
        this.lastMovingTime = 0;

        this.cellToPoints = {};
        this.pointToCell = {};
        this.pointsMap = {};

        this.positionFinish = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        this.createPoints();

        this.el.addEventListener('click', this.onAreaClick);

        requestAnimationFrame(this.update);
    }

    createPoints = () => {
        const gridWidth = Math.ceil(window.innerWidth / CELL_SIZE);
        const gridHeight = Math.ceil(window.innerHeight / CELL_SIZE);
        const visibleCells = [];

        for (let i = 0; i < gridWidth; i++) {
            for (let j = 0; j < gridHeight; j++) {
                visibleCells.push([i, j]);
            }
        }

        for (let i = 0; i < DEFAULT_POINT_QUANTITY; i++) {
            const cellIdx = Math.floor(Math.random() * visibleCells.length);
            const cell = visibleCells[cellIdx];
            const x = CELL_SIZE * (cell[0] + 0.5);
            const y = CELL_SIZE * (cell[1] + 0.5);

            visibleCells.splice(cellIdx, 1);
            this.createPoint({ x, y });
        }
    }

    createPoint = (position) => {
        const pointId = this.lastPointId + 1;
        const point = new Point(this.positionFinish);

        this.lastPointId = pointId;
        this.pointsMap[pointId] = point;
        this.el.appendChild(point.getElement());

        this.setPointData(pointId, position);
    }

    getDistanceBetweenPositions = (positionFirst, positionSecond) => {
        return Math.sqrt(
            (positionFirst.x - positionSecond.x) ** 2 + (positionFirst.y - positionSecond.y) ** 2
        );
    }

    getPointNeighbours = (pointId) => {
        const pointCell = this.pointToCell[pointId];
        const heighbours = [];

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const cellId = `${pointCell[0] + i}:${pointCell[1] + j}`;
                const cellPoints = this.cellToPoints[cellId];
                const filterdCellPoints = cellPoints && cellPoints.filter(x => x !== pointId);

                if (filterdCellPoints && filterdCellPoints.length > 0) {
                    heighbours.push(...filterdCellPoints);
                }
            }
        }

        return heighbours;
    }

    getPointTouchCount = (pointPosition, neighbourIdList) => {
        return neighbourIdList.filter(neighbourId => {
            const neighbourPoint = this.pointsMap[neighbourId];
            const neighbourPointPosition = neighbourPoint.getPosition();
            const distance = this.getDistanceBetweenPositions(
                pointPosition, neighbourPointPosition
            );

            return distance <= CELL_SIZE;
        }).length;
    }

    isMovingAllowed = (pointPosition, pointDesiredPosition, neighbourIdList) => {
        return neighbourIdList.every(neighbourId => {
            const neighbourPoint = this.pointsMap[neighbourId];
            const neighbourPointPosition = neighbourPoint.getPosition();
            const currentDistance = this.getDistanceBetweenPositions(
                pointPosition, neighbourPointPosition
            );
            const desiredDistance = this.getDistanceBetweenPositions(
                pointDesiredPosition, neighbourPointPosition
            );

            return currentDistance > CELL_SIZE || desiredDistance > currentDistance;
        });
    }

    onAreaClick = (event) => {
        if (event.ctrlKey || event.metaKey) {
            this.isScatteringOnNextUpdate = true;
        } else {
            this.createPoint({ x: event.clientX, y: event.clientY });
        }
    }

    setPointData = (pointId, pointPosition, pointTouchCount = 0) => {
        const cellPrev = this.pointToCell[pointId];
        const cellPrevId = cellPrev && `${cellPrev[0]}:${cellPrev[1]}`;
        const cellNext = [
            Math.floor(pointPosition.x / CELL_SIZE),
            Math.floor(pointPosition.y / CELL_SIZE)
        ];
        const cellNextId = `${cellNext[0]}:${cellNext[1]}`;

        this.pointsMap[pointId].update(pointPosition, pointTouchCount);

        if (cellPrevId !== cellNextId) {
            if (cellPrev != null) {
                this.cellToPoints[cellPrevId] = this.cellToPoints[cellPrevId].filter(x => x !== pointId);
            }

            if (this.cellToPoints[cellNextId] == null) {
                this.cellToPoints[cellNextId] = [];
            }

            this.cellToPoints[cellNextId].push(pointId);
            this.pointToCell[pointId] = cellNext;
        }
    }

    update = (movingTime) => {
        if (this.isScatteringOnNextUpdate) {
            this.scatterPoints();

            this.isScatteringOnNextUpdate = false;
        } else {
            const elapsedTime = movingTime - this.lastMovingTime;
            const distance = elapsedTime / 1000 * POINT_VELOCITY;

            this.movePoints(distance);

            this.lastMovingTime = movingTime;
        }

        requestAnimationFrame(this.update);
    }

    movePoints = (distance) => {
        for (const [pointIdStr, point] of Object.entries(this.pointsMap)) {
            const pointId = Number(pointIdStr);
            const pointPosition = point.getPosition();
            const pointNeighbours = this.getPointNeighbours(pointId);
            let pointPositionNext = pointPosition;
            let pointTouchCount = this.getPointTouchCount(pointPosition, pointNeighbours);

            for (const rotation of POINT_AVAILABLE_ROTATION) {
                const pointDesiredPosition = point.getPositionWithOffset(distance, rotation);
                const isMovingAllowed = this.isMovingAllowed(
                    pointPosition, pointDesiredPosition, pointNeighbours
                );

                if (isMovingAllowed) {
                    pointTouchCount = this.getPointTouchCount(pointDesiredPosition, pointNeighbours);
                    pointPositionNext = pointDesiredPosition
                    break;
                }
            }

            this.setPointData(pointId, pointPositionNext, pointTouchCount);
        };
    }

    scatterPoints = () => {
        for (const [pointIdStr, point] of Object.entries(this.pointsMap)) {
            const pointId = Number(pointIdStr);
            const position = point.getPositionWithOffset(-POINT_SCATTERING_DISTANCE, 0);

            this.setPointData(pointId, position);
        }
    }
}

export default Area;
