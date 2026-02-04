// 输入参数处理。
function inputProcess(inputObj) {
    const newObj = {};
    Object.keys(inputObj).forEach(key => {
        // 去掉字符串字段收尾的空格
        if (typeof inputObj[key] === 'string') {
            newObj[key] = inputObj[key].trim();
        } else {
            newObj[key] = inputObj[key];
        }
    });
    return newObj;
}

module.exports = {
    inputProcess
};