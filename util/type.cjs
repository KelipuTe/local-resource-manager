/**
 * 把对象中的蛇形键名转换为驼峰键名
 * @param obj object 要转换的对象
 * @returns object 转换后的新对象
 */
function fnObjKeySnakeToCamel(obj) {
    const result = {};
    for (const [snakeKey, val] of Object.entries(obj)) {
        const camelKey = snakeKey.replace(/_([a-z])/g, (_, letter) => {
            return letter.toUpperCase();
        });
        result[camelKey] = val;
    }
    return result;
}

/**
 * 把对象中的驼峰键名转换为蛇形键名
 * @param obj object 要转换的对象
 * @returns object 转换后的新对象
 */
function fnObjKeyCamelToSnake(obj) {
    const result = {};
    for (const [camelKey, val] of Object.entries(obj)) {
        const snakeKey = camelKey.replace(/([A-Z])/g, (_, letter) => {
            return `_${letter.toLowerCase()}`;
        });
        result[snakeKey] = val;
    }
    return result;
}

module.exports = {
    fnObjKeySnakeToCamel,
    fnObjKeyCamelToSnake,
}