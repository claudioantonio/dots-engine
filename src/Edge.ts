import Point from './Point';
import { PlayerId } from './types';

class Edge {
    p1: Point;
    p2: Point;
    relatedSquareId: number[] = [];
    owner: PlayerId = "";

    constructor(p1: Point, p2: Point) {
        this.p1 = p1;
        this.p2 = p2;
    }

    setOwner(owner: PlayerId) {
        if (!this.hasOwner()) {
            this.owner = owner;
        }
    }

    hasOwner() {
        return (this.owner.length > 0) ? true : false;
    }

    equals(other: Edge): boolean {
        // Check if edges are the same (in either direction)
        return (this.p1.equals(other.p1) && this.p2.equals(other.p2)) ||
               (this.p1.equals(other.p2) && this.p2.equals(other.p1));
    }

    relatesTo(squareId: number) {
        this.relatedSquareId.push(squareId);
    }

    getRelatedSquareOtherThan(id: number): number {
        if (this.relatedSquareId[0] === id) {
            return this.relatedSquareId[1];
        } else {
            return this.relatedSquareId[0];
        }
    }
}

export default Edge;