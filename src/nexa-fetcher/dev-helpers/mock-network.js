export function mockNetwork({onSuccessData = {}, thresholds = {}}) {
    const { successRate , timeout } = thresholds;
    return new Promise((resolve, reject) => {
        if (Math.random() < (1 - successRate)) {
            reject({ status: "500" })
            return;
        }

        setTimeout(() => {
            resolve(onSuccessData);
            return;
        }, timeout);
    })
}