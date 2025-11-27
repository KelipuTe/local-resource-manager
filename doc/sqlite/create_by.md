### cereate_by 表

| 字段名    | 类型    | 备注                                                                                           |
| --------- | ------- | ---------------------------------------------------------------------------------------------- |
| id        | INTEGER | 自增主键                                                                                       |
| source    | TEXT    | 资源所属用户的来源。比如：bilibili、pixiv、x、等。                                             |
| user_id   | TEXT    | 资源所属用户的id                                                                               |
| username  | TEXT    | 资源所属用户的名称                                                                             |
| ext_info  | TEXT    | 资源所属用户的额外信息。比如：用户改过【用户的名称】。                                         |
| same_as   | TEXT    | 用于标记【不同来源的同一个用户】。存的就是【cereate_by 表】的【id】，如果有多个就用【,】隔开。 |
| create_at | TEXT    | 创建时间                                                                                       |
| update_at | TEXT    | 更新时间                                                                                       |
