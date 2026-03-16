/**
 * 记录调试日志
 * @param data any
 */
function fnLogDebugLog(data) {
    // Error.stack。获取调用栈信息。
    // 第一行是 Error 构造函数，第二行就是这个函数本身，第三行是调用这个函数的函数
    const stack = new Error().stack;
    const callerLine = stack.split('\n')[2].trim();
    console.debug(`【调试日志】。callerLine：【${callerLine}】。data：【${data}】。`);
}

/**
 * 记录错误日志
 * @param err Error
 */
function fnLogErrLog(err) {
    const stack = new Error().stack;
    const callerLine = stack.split('\n')[2].trim();
    console.error(`【错误日志】。callerLine：【${callerLine}】。err：【${err}】。`);
}

/**
 * 记录sql日志
 * @param sql string
 * @param valueList any[]
 */
function fnLogSqlLog(sql, valueList) {
    const stack = new Error().stack;
    const callerLine = stack.split('\n')[2].trim();

    // 移除首尾的空格和所有的换行
    let sqlStr = sql
    sqlStr = sqlStr.trim()
    sqlStr = sqlStr.replace(/\n/g, '');

    // 依次替换占位符
    if (valueList != null && Array.isArray(valueList)) {
        for (let i = 0; i < valueList.length; i++) {
            let value = valueList[i];

            // 字符串，需要加单引号
            if (typeof value === 'string') {
                value = '\'' + value + '\'';
            }
            // 其他类型（数字）直接使用

            // 替换第一个占位符
            sqlStr = sqlStr.replace('?', value);
        }
    }

    console.log(`【SQL 日志】。callerLine：【${callerLine}】。sqlStr：【${sqlStr}】。`);
}

module.exports = {
    fnLogDebugLog,
    fnLogErrLog,
    fnLogSqlLog,
};