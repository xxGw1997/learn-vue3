import { extend, hasChanged, hasOwn, isArray, isIntegerKey, isObject } from '@vue/shared/src'
import { TriggerOpTypes } from 'packages_sourceCode/reactivity/src/operators'
import { track, trigger } from './effect'
import { TrackOpTypes } from './operators'
import { reactive, readonly } from './reactivity'


const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true, false)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)


export const mutableHandlers = {
    get,
    set
}
export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
}

let readonlyObj = {
    set: (target, key) => {
        console.warn(`set on key ${key} failed,${target.toString()} is readonly`)
    }
}

export const readonlyHandlers = extend({
    get: readonlyGet
}, readonlyObj)

export const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet
}, readonlyObj)

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver)

        if (!isReadonly) {
            track(target, TrackOpTypes.GET, key)
        }

        //如果是浅代理则直接返回，并且不需要再进行递归
        if (shallow) {
            return res
        }

        //如果不是浅代理，则再判断是否是对象，
        //如果是对象，再根据是否只读去进行对应的代理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res)
        }

        //返回最终的代理结果
        return res
    }
}

function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const oldValue = target[key]

        const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)

        //执行触发更新
        if (!hadKey) {
            //新增
            trigger(target, TriggerOpTypes.ADD, key, value)
        } else if (hasChanged(value, oldValue)) {
            //修改
            trigger(target, TriggerOpTypes.SET, key, value, oldValue)
        }

        const res = Reflect.set(target, key, value, receiver)

        return res
    }
}