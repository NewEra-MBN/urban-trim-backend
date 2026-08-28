const exclude = <Type, Key extends keyof Type>(obj: Type, keys: Key[]) => {
    for(const key of keys){
        delete obj[key]
    }
    return obj
}

export default exclude;