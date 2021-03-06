import { IdGeneratorService } from '../../id-generator/id-generator.service';
import { Xb, Quantity } from '../primitives';
import { Spec } from '../specie/spec';
import { Part } from '../particle/part';
import { map, toString, get, toNumber, forEach } from 'lodash';

export interface SlcfObject {
    id: string,
    uuid: string,
    idAC: number,
    xb: Xb,
    isXb: boolean,
    direction: string,
    value: number,
    quantities: Quantity[],
    vector: boolean
}

export class Slcf {
    private _id: string;
    private _uuid: string;
    private _idAC: number;
    private _xb: Xb;
    private _isXb: boolean;
    private _direction: string;
    private _value: number;
    private _quantities: Quantity[];
    private _vector: boolean;

    constructor(jsonString: string, specs?: Spec[], parts?: Part[]) {

        let base: SlcfObject;
        base = <SlcfObject>JSON.parse(jsonString);

        let idGeneratorService = new IdGeneratorService;

        this.id = base.id || '';
        this.uuid = base.uuid || idGeneratorService.genUUID();
        this.idAC = base.idAC || 0;

        this.direction = toString(get(base, 'direction', 'x'));
        this.value = toNumber(get(base, 'value', 0));

        this.isXb = base.isXb || false;
        this.xb = new Xb(JSON.stringify(base.xb)) || new Xb(JSON.stringify({}));

        this.quantities = base.quantities != undefined && base.quantities.length > 0 ? map(base.quantities, function(o) { return new Quantity(JSON.stringify(o)) } ) : [];

        forEach(this.quantities, function(o) {
            o.specs = o.specs != undefined && o.specs.length > 0 ? map(o.specs, function(e) { return new Spec(JSON.stringify(e)); }) : [];
            o.parts = o.parts != undefined && o.parts.length > 0 ? map(o.parts, function(e) { return new Part(JSON.stringify(e)); }) : [];
        });

        this.vector = base.vector || false;
    }

    /**
     * Getter id
     * @return {string}
     */
	public get id(): string {
		return this._id;
	}

    /**
     * Setter id
     * @param {string} value
     */
	public set id(value: string) {
		this._id = value;
	}

    /**
     * Getter uuid
     * @return {string}
     */
	public get uuid(): string {
		return this._uuid;
	}

    /**
     * Setter uuid
     * @param {string} value
     */
	public set uuid(value: string) {
		this._uuid = value;
	}

    /**
     * Getter idAC
     * @return {number}
     */
	public get idAC(): number {
		return this._idAC;
	}

    /**
     * Setter idAC
     * @param {number} value
     */
	public set idAC(value: number) {
		this._idAC = value;
	}

    /**
     * Getter xb
     * @return {Xb}
     */
	public get xb(): Xb {
		return this._xb;
	}

    /**
     * Setter xb
     * @param {Xb} value
     */
	public set xb(value: Xb) {
		this._xb = value;
	}

    /**
     * Getter isXb
     * @return {boolean}
     */
	public get isXb(): boolean {
		return this._isXb;
	}

    /**
     * Setter isXb
     * @param {boolean} value
     */
	public set isXb(value: boolean) {
		this._isXb = value;
	}

    /**
     * Getter direction
     * @return {string}
     */
	public get direction(): string {
		return this._direction;
	}

    /**
     * Setter direction
     * @param {string} value
     */
	public set direction(value: string) {
		this._direction = value;
	}

    /**
     * Getter value
     * @return {number}
     */
	public get value(): number {
		return this._value;
	}

    /**
     * Setter value
     * @param {number} value
     */
	public set value(value: number) {
		this._value = value;
	}

    /**
     * Getter quantities
     * @return {Quantity[]}
     */
	public get quantities(): Quantity[] {
		return this._quantities;
	}

    /**
     * Setter quantities
     * @param {Quantity[]} value
     */
	public set quantities(value: Quantity[]) {
		this._quantities = value;
	}

    /**
     * Getter vector
     * @return {boolean}
     */
	public get vector(): boolean {
		return this._vector;
	}

    /**
     * Setter vector
     * @param {boolean} value
     */
	public set vector(value: boolean) {
		this._vector = value;
	}

    /** Export to json */
    public toJSON(): object {

        let quantities = this.quantities.length > 0 ? map(this.quantities, (o) => { return o.toJSON() }) : [];

        let slcf = {
            id: this.id,
            uuid: this.uuid,
            idAC: this.idAC,
            xb: this.xb,
            isXb: this.isXb,
            direction: this.direction,
            value: this.value,
            quantities: quantities,
            vector: this.vector
        }
        return slcf;
    }
}