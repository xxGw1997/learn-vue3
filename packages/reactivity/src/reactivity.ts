import { isObject } from '@vue/shared/src'

import {
    mutableHandlers,
    shallowReactiveHandlers,
    readonlyHandlers,
    shallowReadonlyHandlers
} from './baseHandlers'


export function reactive(target) {
    return createReactivityObject(target, false, mutableHandlers)
}

export function shallowReactive(target) {
    return createReactivityObject(target, false, shallowReactiveHandlers)
}
export function readonly(target) {
    return createReactivityObject(target, true, readonlyHandlers)
}

export function shallowReadonly(target) {
    return createReactivityObject(target, true, shallowReadonlyHandlers)
}


const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()

/**
 * 
 * @param target 被代理的对象
 * @param isReadonly 是否可读
 * @param baseHandler 对应代理对象的处理函数
 * @returns 
 */
export function createReactivityObject(target, isReadonly, baseHandler) {
    //先判断是否是对象,如果不是对象则直接返回出去
    if (!isObject(target)) return target

    //根据是否可读属性再去获取对应的代理对象的map集合
    const proxyMap = isReadonly ? readonlyMap : reactiveMap

    //判断这个对象是否被代理过，如果代理过则直接返回之前代理过的proxy
    const exisitProxy = proxyMap.get(target)
    if (exisitProxy) return exisitProxy

    //对象代理处理，最终将代理的对象返回出去
    const proxy = new Proxy(target, baseHandler)
    proxyMap.set(target, proxy)
    return proxy
}