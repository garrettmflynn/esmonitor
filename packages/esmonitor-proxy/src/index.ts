import * as handlers from './handlers';
import * as check from '../../common/check'
import { ArrayPath, ListenerRegistry, InspectableOptions } from "./types";
import { setFromPath } from '../../common/pathHelpers';
import { isProxy } from "./globals";
import define from './define';
import { isNode, keySeparator } from '../../common/globals';

export type InspectableProxy = ProxyConstructor & {
    __proxy: ProxyConstructor,
    __esInspectable: Inspectable
}

const canCreate = (parent, key?, val?) => {

    try {
        if (val === undefined) val = parent[key]
    } catch (e) {
        return e
    }

    // Check if we already have a proxy
    const alreadyIs = parent[key] && parent[key][isProxy]
    if (alreadyIs) return false // Already a proxy


    const type = typeof val
    const isObject = type === 'object'
    const isFunction = type == 'function'
    

    // Only listen to objects and functions
    const notObjOrFunc = !val || !(isObject || isFunction )
    if (notObjOrFunc) return false

    if (!isNode && val instanceof globalThis.Element) return false // Avoid HTML elements
    if (val instanceof EventTarget) return false // Avoid HTML elements

    const isESM = isObject && check.esm(val)

    if (isFunction) return true
    else {
        
        const desc = Object.getOwnPropertyDescriptor(parent, key)

        if (desc &&((desc.value && desc.writable) || desc.set)) {
            if (!isESM) return true // Cannot create a Proxy object for ESM
        } else if (!parent.hasOwnProperty(key)) return true
    }

    return false

}

export default class Inspectable {

    path: ArrayPath = []
    parent?: Inspectable
    options: InspectableOptions
    proxy: ProxyConstructor
    listeners: Partial<ListenerRegistry> = {}
    newKeys = new Set()

    target: any
    root: any

    state: {[x:string]: any} = {}

    constructor ( target:any = {}, opts: Partial<InspectableOptions> = {}, name?, parent?) {

        if (!opts.pathFormat) opts.pathFormat = 'relative'
        if (!opts.keySeparator) opts.keySeparator = keySeparator

        // -------------- Only Listen to ES Components --------------

        if (target.__proxy) this.proxy = target.__proxy
        else if (target[isProxy]) this.proxy = target
        else {

            this.target = target
            this.options = opts as InspectableOptions
            this.parent = parent

            if (this.parent) {
                this.root = this.parent.root
                this.path = [...this.parent.path]
                this.state = this.parent.state ?? {} // Share state with the parent
            } else this.root = target

            if (name) this.path.push(name)
            if (this.options.listeners) this.listeners = this.options.listeners

            if (this.options.path) {
                if (this.options.path instanceof Function) this.path = this.options.path(this.path)
                else if (Array.isArray(this.options.path)) this.path = this.options.path
                else console.log('Invalid path', this.options.path)
            }

            // remove symbols from the path
            if (this.path) this.path = this.path.filter(str => typeof str === 'string')


            if (!this.options.keySeparator) this.options.keySeparator = keySeparator

            let type = this.options.type
            if (type != 'object') type = (typeof target === 'function')  ? 'function' : 'object';

            let handler =  handlers[`${type}s`].call(this)
            if (type === 'function') handler = {...handler, ...handlers.objects.call(this)} // Functions have both

            this.proxy = new Proxy(target, handler)

            // Set status on original
            Object.defineProperty(target, '__proxy', { value: this.proxy, enumerable: false })
            Object.defineProperty(target, '__esInspectable', { value: this, enumerable: false })


            // Create Nested Inspectable Proxies
            for (let key in target) define.call(this, key)
        }

        return this.proxy as any // Replace class passed to the user with the proxy

    }

    set = (path, info, update) => {

        this.state[path] = {
            output: update,
            value: info,
        }

        // Set on Proxy Object
        setFromPath(path, update, this.proxy, { create: true });
    }

    check = canCreate

    create = (key, parent, val?, set = false) => {

        const create = this.check(parent, key, val)
        if (val === undefined) val = parent[key] 

        if (create && !(create instanceof Error)) {
            parent[key] = new Inspectable(val, this.options, key, this)
            return parent[key]
        }

        if (set) {
            try {
                this.proxy[key] = val ?? parent[key] // Notify on initialization
            } catch (e) {
                const isESM = check.esm(parent)
                const path = [...this.path, key]
                console.error(`Could not set value (${path.join(this.options.keySeparator)})${isESM ? ' because the parent is an ESM.' : ''}`, isESM ? '' : e)
            }
        }

        return
    }
}