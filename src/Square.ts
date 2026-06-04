import Edge from './Edge';

const SIDES:number = 4;

class Square {
    id: number;
    owner: string;
    edges: Edge[]; 

    constructor(id:number,edges:Edge[]){
        if (edges.length!=SIDES) {
            throw new Error("Edge array must have exactly 4 edges");
        }
        this.id=id;
        this.owner='';
        edges.forEach(edge => {
            edge.relatesTo(this.id);
        });
        this.edges = edges;
    }

    /**
     * Return true if there is, at least, one available face 
     * and false otherwise
     */
    hasAvailableFace() {
        for (let i = 0; i < this.edges.length; i++) {
            const edge:Edge = this.edges[i];
            if (edge.hasOwner()===false) return true;
        }
        return false;
    }

    getNumberOfAvailableFaces() {
        let cont:number = 0;
        for (let i = 0; i < this.edges.length; i++) {
            const edge:Edge = this.edges[i];
            if (edge.hasOwner()===false) cont++;
        }
        return cont;
    }

    /**
     * true if the square has owner or false otherwise
     */
    hasOwner() {
        return this.owner?.length>0? true : false;
    }
}

export default Square;