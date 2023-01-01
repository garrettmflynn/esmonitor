import * as core from '../../packages/core/index';
import * as esm from './esm.js'

export const messages = { 
    one: 'Hi',
    two: 'Failed!',
    three: 'Succeeded!'
}

export const functions = { 
    one: () =>  messages.one,
    two: () => messages.two,
    three: (() => messages.three) as any,
}

// functions.three.__compose = true

export const one = {
  test: 1, 
  active: false,
  testFunction: functions.one,
  esm
}

export const two = {
  test: 2, 
  active: true, 
  success: false,
  testFunction: functions.two // Function merge
}


export const three = {
  test: 3, 
  active: true, 
  success: true,
  testFunction: functions.three // Function merge
}


let proxy
const state: {[x:string]: any} = {};
const history: {path: string, update: any}[] = [];

const monitor = new core.Monitor()

export const start = (isStatic=true) => {
    proxy = monitor.set( 'object',  one,  { static: isStatic } ) // Set object reference
    monitor.on('object', (path, _, update) => {
      state[path] = update
      history.push({ path, update })
    }) // Track changes 

    return { proxy, history, state }
}



export const operations = [
    () => {
        one.test = two.test
        one.active = two.active
        one.testFunction = two.testFunction;
        (one as any).success = two.success
    },
    () =>{
      proxy.test = three.test
      proxy.active = three.active
      proxy.testFunction = three.testFunction
      proxy.success = three.success
    },
    () => esm.default()
]
