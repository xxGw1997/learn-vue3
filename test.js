const isObject = (value) => typeof value == "object" && value !== null;
const isArray = Array.isArray;
const isIntegerKey = (key) => parseInt(key) + "" === key;
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnProperty.call(target, key);
const hasChanged = (oldValue, value) => oldValue !== value;

let uid = 0,
  activeEffect;
const effectStack = [];
function effect(fn, options) {
  const effect = function reactiveEffect() {
    try {
      activeEffect = effect;
      effectStack.push(effect);
      return fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  };
  effect.id = uid++;
  effect._isEffect = true;
  effect.raw = fn;
  effect.options = options;

  return effect;
}

const targetMap = new WeakMap();
function track(target, key) {
  if (activeEffect === undefined) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Set()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  if (!dep.has(activeEffect)) dep.add(activeEffect);
}

function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const effects = new Set();
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => {
        effects.add(effect);
      });
    }
  };
  add(depsMap.get(key));
  effects.forEach((effect) => effect());
}

const baseHandler = {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);

    //搜集依赖 -> 即 将当时使用的当时变量的effect函数保存起来
    track(target, key);

    if (isObject(res)) {
      reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    if (!hadKey) {
      //trigger 新增
      trigger(target, key, value);
    } else if (hasChanged(value, oldValue)) {
      //trigger 修改
      trigger(target, key, value, oldValue);
    }

    const res = Reflect.set(target, key, value, receiver);

    return res;
  },
};

const proxyMap = new WeakMap();

function reactive(target) {
  if (!isObject(target)) return target;

  const exisitProxy = proxyMap.get(target);
  if (exisitProxy) return exisitProxy;

  const proxy = new Proxy(target, baseHandler);
  proxyMap.set(target, proxy);

  return proxy;
}

export { reactive, effect };
