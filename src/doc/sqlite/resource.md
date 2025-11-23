### resource 表

| 字段名        | 类型 | 备注                                                                       |
| ------------- | ---- | -------------------------------------------------------------------------- |
| id            | int  | 自增主键                                                                   |
| filename      | text | 资源的文件名                                                               |
| filetype      | text | 资源的文件类型。存的是【文件后缀名】。                                     |
| source        | text | 资源的来源。比如：bilibili、pixiv、x、等。                                 |
| resource_id   | text | 资源的id。比如：bilibili的bvid。                                           |
| index         | int  | 资源的下标。比如：一本漫画下面会有好几张图片，这个时候，就需要用下标区分。 |
| user_id       | text | 资源所属用户的id                                                             |
| resource_name | text | 资源的名称                                                                 |
| ext_info      | text | 资源的额外信息。比如：【用户A的视频】是剪辑的【用户B的视频】。             |
| publish_at    | text | 资源的发布时间                                                             |
| key_point     | text | 我认为资源的重点是什么。用于分类。比如：画面、声音、文字、等。             |
| summary       | text | 我对资源内容的总结。主要是给【Obsidian】那边的笔记联动用的。             |
| status        | int  | 资源的状态。1=本地有。                                                     |
| visit_at      | text | 我最后一次访问资源的时间                                                     |
| visit_times   | int  | 我访问资源的总次数                                                             |
| create_at     | text | 创建时间                                                                   |
| update_at     | text | 修改时间                                                                   |
