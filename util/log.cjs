function logSqlLog(msg, sql, valueList) {
    // 移除所有的换行
    let logStr = sql.replace(/\n/g, '');

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
            logStr = logStr.replace('?', value);
        }
    }

    console.log('[sql log]:msg=' + msg + ';logStr=' + logStr);
}

module.exports = {
    logSqlLog
};