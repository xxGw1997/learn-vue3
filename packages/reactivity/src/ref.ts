import { hasChanged, isArray, isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { TrackOpTypes, TriggerOpTypes } from "./operators"
import { reactive } from "./reactivity"

function createRef(rawValue, shallow) {
    return new RefImpl(rawValue, shallow = false)
}

const convert = value => (isObject(value) ? reactive(value) : value)

class RefImpl {
    public _value
    public __v_isRef = true
    constructor(public rawValue, public shallow) {
        this._value = shallow ? rawValue : convert(rawValue)
    }
    get value() {
        track(this, TrackOpTypes.GET, 'value')
        return this._value
    }
    set value(newValue) {
        if (!hasChanged(newValue, this.rawValue)) return
        this.rawValue = newValue
        this._value = this.shallow ? newValue : convert(newValue)
        trigger(this, TriggerOpTypes.SET, 'value', newValue)
    }
}


class ObjectRefImpl {
    public __v_isRef = true
    constructor(public target, public key) { }
    get value() {
        return this.target[this.key]
    }
    set value(newValue) {
        this.target[this.key] = newValue
    }
}


export function ref(value) {
    return createRef(value, false)
}

export function shallowRef(value) {
    return createRef(value, true)
}

export function toRef(object, key) {
    return new ObjectRefImpl(object, key)
}

export function toRefs(object) {
    const res = isArray(object) ? new Array(object.length) : {}
    for (const key in object) {
        res[key] = toRef(object, key)
    }
    return res
}