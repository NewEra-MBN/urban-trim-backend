const pick = <T extends object, Key extends keyof T> (obj: T, keys: Key[]): Pick<T, Key> => {
    return keys.reduce((finalObj, key) => {
        if(Object.hasOwn(obj, key)){
            finalObj[key] = obj[key]
        }
        return finalObj
    },{} as Pick<T, Key>)
}


export default pick