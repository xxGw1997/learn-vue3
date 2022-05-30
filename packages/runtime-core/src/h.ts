import { isArray, isObject } from "@vue/shared";
import { createVNode, isVnode } from "./vnode";

/**
 * @description 对传入的参数判断之后 交给createVNode方法创建虚拟DOM
 * @param type 元素标签
 * @param propsOrChildren 属性或者子元素 
 * @param children 子元素
 * @returns 当前元素的虚拟DOM
 */
export function h(type, propsOrChildren, children) {
    const l = arguments.length; // 儿子节点要么是字符串 要么是数组
    if (l == 2) { // 类型+属性、类型+孩子
        // 是对象并且不是数组的情况下 可能是属性也可能是儿子节点
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            if (isVnode(propsOrChildren)) { // 是vnode 也就是是儿子 因为属性不可能是vnode
                return createVNode(type, null, [propsOrChildren])
            }
            // 走到这里说明是属性
            return createVNode(type, propsOrChildren, null)
        } else { // 如果第二个参数不是对象 那一定不是属性而是孩子
            return createVNode(type, null, propsOrChildren)
        }
    } else { // 3个及3个以上参数
        if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2)
        } else if (l === 3 && isVnode(children)) {
            children = children[children]
        }

        return createVNode(type, propsOrChildren, children)
    }

}

// 两个参数:
// h('div',{style: {color:'red';}}) 第二个参数是属性
// h('div', 'hello world') 第二个参数是儿子

// 三个参数
// h('div', {style:{color: 'red';}}, 'hello world')

// 三个以上参数
