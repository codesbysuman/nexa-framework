export async function mockNetwork(
    fn,
    {
        delay = 0,
        resolve,
        reject
    } = {}
) {
    
    if (delay > 0) {
        await new Promise(r =>
            setTimeout(r, delay)
        )
    }
    
    if (reject) {
        throw reject()
    }
    
    if (resolve) {
        return resolve()
    }
    
    return fn()
}