import Poller from "./Poller"

type onUpdateFunction = (path: string, info: ActiveInfo, ...args: any[]) => void
export type MonitorOptions = {
    pathFormat: 'absolute' | 'relative',
    fallbacks?: pathComponent[],
    polling?: PollingOptions,
    keySeparator: '.' | string,
    onInit?: (path: string, info: ActiveInfo) => any | Promise<any>,
    onUpdate?: onUpdateFunction | {
        callback: onUpdateFunction,
        info: {
            performance?: boolean
        }
    },
}

export type SetFromOptionsType = {
    reference?: any,
    listeners?: ListenerRegistry,
    static?: boolean,
}

export type SetValueOptions = {
    create?: boolean,
    keySeparator?: MonitorOptions['keySeparator']
}

export type pathComponent = string | symbol
export type ArrayPath = (string | symbol)[]
export type PathFormat = pathComponent | (string | symbol)[]

export type PollingOptions = {
    force?: boolean,
    sps?: number
}

export type InternalOptions = {
    poll: boolean,
    seen: any[] // Check for circular references
    shortcut: ReferenceShortcut
}

export type Info = {
    performance?: boolean
}

export type ActiveInfo = {
    id: symbol | string,
    function?: Function,
    arguments?: any[],
    info?: Info,
    performance?: number
}


export type ListenerInfo = {
    id: symbol | string
    last: string,
    infoToOutput: Info,
    callback: (path: string, info:ActiveInfo, output: any[]) => void,
    path: {
        relative: ArrayPath,
        absolute: ArrayPath,
        output: ArrayPath,
        parent: ArrayPath
    }
    sub: symbol,

    current: any,
    parent: any,
    reference: any,
    original: any,
    history: any
}

export type Lookup<keyType, valueType> = {
    [x in string | symbol]: valueType
}


export type SymbolLookupValue = {
    name: string,
    id: symbol | string
}

export type NameLookupValue = {[x: symbol]: symbol}

export type ListenerLookups = {
    symbol: Lookup<symbol, SymbolLookupValue>,
    name: Lookup<string, NameLookupValue>
}


export type ListenerPool = {
    [x: symbol]: {
        [x: string]: {
            [x: symbol]: ListenerInfo
        }
    }
}

export type ListenerRegistry = {
    functions: ListenerPool,
    setters: ListenerPool,
    polling: Poller['listeners'],
    lookup: ListenerLookups
}

export type ReferenceShortcut = {
    ref: any,
    path: ArrayPath
}