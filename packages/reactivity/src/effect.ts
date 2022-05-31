import { isArray, isIntegerKey } from "@vue/shared"
import { TriggerOpTypes } from "./operators"

export function effect(fn, options: any = {}) {
    const effect = createReactiveEffect(fn, options)

    if (!options.lazy) {
        effect()
    }
    return effect
}

let uid = 0
let activeEffect
const effectStack = []
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effectStack.includes(effect)) {
            try {
                activeEffect = effect
                effectStack.push(effect)
                return fn()
            } finally {
                effectStack.pop()
                activeEffect = effectStack[effectStack.length - 1]
            }
        }
    }

    //给每一个effect 添加对应的信息用作标识
    effect.id = uid++
    effect._isEffect = true
    effect.raw = fn
    effect.options = options
    return effect
}

const targetMap = new WeakMap()
export function track(target, type, key) {
    if (activeEffect === undefined) return
    let depsMap = targetMap.get(target)
    if (!depsMap) targetMap.set(target, (depsMap = new Map))
    let dep = depsMap.get(key)
    if (!dep) depsMap.set(key, (dep = new Set))

    if (!dep.has(activeEffect)) dep.add(activeEffect)
}


//找到对应属性的effect并且执行
export function trigger(target, type, key?, value?, oldValue?) {
    const depsMap = targetMap.get(target);
    // 属性没有对应的effect
    if (!depsMap) return;
    const effects = new Set(); // 设置集合
    const add = (effectsToAdd) => {
        if (effectsToAdd) {
            effectsToAdd.forEach((effect) => {
                effects.add(effect);
            });
        }
    };

    if (key === "length" && isArray(target)) {
        // 如果是数组并且修改的是length属性
        // ary.length = 10; 如果修改的是数组的length属性
        // 如果修改的是长度
        // 遍历数组对应的所有effect
        depsMap.forEach((dep, key) => {
            // key: 0,1......
            // 如果有长度的依赖要更新  如果依赖的key小于设置的长度也要更新
            if (key == "length" || key >= value) {
                // 收集要执行的effect
                add(dep);
            }
        });
    } else {
        // 数组或者Object但不是修改length属性
        if (key !== void 0) {
            // 修改key
            add(depsMap.get(key));
        }
        switch (type) {
            case TriggerOpTypes.ADD:
                if (isArray(target) && isIntegerKey(key)) {
                    // 给数组新增属性，直接触发length即可
                    add(depsMap.get("length"));
                }
                break;
            default:
                break;
        }
    }
    effects.forEach((effect: any) => {
        if (effect.options.scheduler) {
            return effect.options.scheduler(effect); // 如果有自己提供的scheduler，则执行scheduler逻辑
        }
        effect();
    });
}