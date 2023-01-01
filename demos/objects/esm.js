export let value = 0

export default function () {
    // this.value++ // NOTE: This fails because you cannot set a read-only property
    value++
    return value
}